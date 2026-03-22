import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const orgId = profile.organization_id;

    const body = await req.json();
    const {
      instruction_type,
      title,
      description,
      target_type = "matters",
      target_ids: inputTargetIds = [],
      target_family_id,
      deadline_date,
      is_urgent = false,
    } = body;

    if (!instruction_type || !title || !description) {
      return new Response(JSON.stringify({ error: "instruction_type, title, description are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let targetIds: string[] = [...inputTargetIds];

    // STEP 1: Validate targets belong to tenant
    if (target_type === "family" && target_family_id) {
      const { data: familyMatters } = await supabaseAdmin
        .from("matters")
        .select("id")
        .eq("family_id", target_family_id)
        .eq("organization_id", orgId);
      targetIds = (familyMatters || []).map((m: any) => m.id);
    }

    if (target_type === "matters" || target_type === "family") {
      if (targetIds.length === 0) {
        return new Response(JSON.stringify({ error: "No valid targets found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { count } = await supabaseAdmin
        .from("matters")
        .select("id", { count: "exact", head: true })
        .in("id", targetIds)
        .eq("organization_id", orgId);

      if ((count || 0) !== targetIds.length) {
        return new Response(JSON.stringify({ error: "Some targets do not belong to this organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // STEP 2: Create bulk_instructions
    const { data: bulkInstruction, error: biError } = await supabaseAdmin
      .from("bulk_instructions")
      .insert({
        organization_id: orgId,
        sent_by: userId,
        instruction_type,
        title,
        description,
        target_type,
        target_ids: targetIds,
        target_family_id: target_family_id || null,
        status: "draft",
        total_targets: targetIds.length,
        deadline_date: deadline_date || null,
        is_urgent,
      })
      .select("id")
      .single();

    if (biError || !bulkInstruction) {
      throw new Error(biError?.message || "Failed to create bulk instruction");
    }

    // STEP 3: Get matters with their agents
    const { data: matters } = await supabaseAdmin
      .from("matters")
      .select("id, title, jurisdiction, intermediate_agent_id")
      .in("id", targetIds);

    const agentMattersMap = new Map<string, { agent_id: string; matters: any[] }>();
    let instructionsCreated = 0;

    for (const matter of (matters || [])) {
      // Insert bulk_instruction_items
      await supabaseAdmin.from("bulk_instruction_items").insert({
        bulk_instruction_id: bulkInstruction.id,
        organization_id: orgId,
        matter_id: matter.id,
        jurisdiction_code: matter.jurisdiction || null,
        assigned_agent_account_id: matter.intermediate_agent_id || null,
        specific_instruction: `${description} — ${matter.title}`,
        status: "pending",
      });

      // If matter has an intermediate agent, create portal instruction
      if (matter.intermediate_agent_id) {
        await supabaseAdmin.from("portal_client_instructions").insert({
          organization_id: orgId,
          crm_account_id: matter.intermediate_agent_id,
          matter_id: matter.id,
          instruction_type,
          instruction_text: description,
          status: "received",
          submitted_by: userId,
          priority: is_urgent ? "urgent" : "high",
        });
        instructionsCreated++;

        // Group by agent
        const agentId = matter.intermediate_agent_id;
        if (!agentMattersMap.has(agentId)) {
          agentMattersMap.set(agentId, { agent_id: agentId, matters: [] });
        }
        agentMattersMap.get(agentId)!.matters.push(matter);
      }
    }

    // STEP 4: Notify each unique agent
    const agentsNotified: any[] = [];
    for (const [agentId, agentData] of agentMattersMap) {
      // Get agent name
      const { data: agentAccount } = await supabaseAdmin
        .from("crm_accounts")
        .select("name")
        .eq("id", agentId)
        .single();

      // Get portal_user_id for this agent
      const { data: portalAccess } = await supabaseAdmin
        .from("portal_access")
        .select("portal_user_id")
        .eq("crm_account_id", agentId)
        .eq("status", "active")
        .limit(1);

      if (portalAccess?.length) {
        await supabaseAdmin.from("portal_notifications").insert({
          organization_id: orgId,
          portal_user_id: portalAccess[0].portal_user_id,
          crm_account_id: agentId,
          notification_type: "new_bulk_instruction",
          priority: is_urgent ? "urgent" : "high",
          title: is_urgent ? `[URGENTE] Nueva instrucción: ${title}` : `Nueva instrucción: ${title}`,
          message: `${agentData.matters.length} expedientes afectados`,
          metadata: { bulk_instruction_id: bulkInstruction.id },
        });
      }

      agentsNotified.push({
        agent_id: agentId,
        agent_name: agentAccount?.name || "Unknown",
        matters_count: agentData.matters.length,
      });
    }

    // STEP 5: Update bulk instruction status
    await supabaseAdmin
      .from("bulk_instructions")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", bulkInstruction.id);

    return new Response(JSON.stringify({
      bulk_instruction_id: bulkInstruction.id,
      items_created: targetIds.length,
      agents_notified: agentsNotified,
      instructions_created: instructionsCreated,
      status: "sent",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("bulk-instruction-send error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
