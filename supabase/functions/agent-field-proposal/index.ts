import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FIELDS = ["agent_matter_reference", "status"] as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

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

    const body = await req.json();
    const { matter_id, field_name, proposed_value, change_reason } = body;

    // STEP 1: Validate field_name BEFORE anything else
    if (!field_name || !ALLOWED_FIELDS.includes(field_name as AllowedField)) {
      return new Response(JSON.stringify({
        error: "field_not_permitted",
        allowed_fields: [...ALLOWED_FIELDS],
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!matter_id || proposed_value === undefined) {
      return new Response(JSON.stringify({ error: "matter_id and proposed_value are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get agent's portal access
    const { data: portalAccess } = await supabaseAdmin
      .from("portal_access")
      .select("id, organization_id, crm_account_id, status")
      .eq("portal_user_id", userId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!portalAccess) {
      return new Response(JSON.stringify({ error: "No portal access" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = portalAccess.organization_id;
    const crmAccountId = portalAccess.crm_account_id;

    // Verify portal_type = agent
    const { data: account } = await supabaseAdmin
      .from("crm_accounts")
      .select("portal_type")
      .eq("id", crmAccountId)
      .single();

    if (!account || account.portal_type !== "agent") {
      return new Response(JSON.stringify({ error: "not_agent_portal" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 2: Verify relationship with matter
    const { data: relCheck } = await supabaseAdmin
      .from("account_relationships")
      .select("id")
      .eq("agent_account_id", crmAccountId)
      .eq("organization_id", orgId)
      .eq("is_active", true);

    // Also check that matter's intermediate_agent_id matches
    const { data: matterCheck } = await supabaseAdmin
      .from("matters")
      .select("id, title, intermediate_agent_id")
      .eq("id", matter_id)
      .eq("organization_id", orgId)
      .eq("intermediate_agent_id", crmAccountId)
      .single();

    if (!matterCheck || !relCheck?.length) {
      return new Response(JSON.stringify({ error: "no_relationship_with_matter" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 3: Check field permissions
    const { data: permissions } = await supabaseAdmin
      .from("matter_field_permissions")
      .select("can_write, requires_approval")
      .eq("account_id", crmAccountId)
      .eq("field_name", field_name)
      .eq("organization_id", orgId)
      .or(`matter_id.eq.${matter_id},matter_id.is.null`)
      .order("matter_id", { ascending: false, nullsFirst: false })
      .limit(1);

    const perm = permissions?.[0];
    if (!perm || !perm.can_write) {
      return new Response(JSON.stringify({ error: "field_write_not_permitted" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 4: Get current value (explicit IF/ELSE, no dynamic query)
    let currentValue: any = null;
    if (field_name === "agent_matter_reference") {
      const { data } = await supabaseAdmin
        .from("matters")
        .select("agent_matter_reference")
        .eq("id", matter_id)
        .single();
      currentValue = data?.agent_matter_reference ?? null;
    } else if (field_name === "status") {
      const { data } = await supabaseAdmin
        .from("matters")
        .select("status")
        .eq("id", matter_id)
        .single();
      currentValue = data?.status ?? null;
    }

    // STEP 5: Apply or propose
    let proposalStatus: string;
    let proposalId: string | null = null;

    if (!perm.requires_approval) {
      // 5a: Apply directly (explicit IF/ELSE, no dynamic query)
      if (field_name === "agent_matter_reference") {
        await supabaseAdmin
          .from("matters")
          .update({ agent_matter_reference: proposed_value })
          .eq("id", matter_id);
      } else if (field_name === "status") {
        await supabaseAdmin
          .from("matters")
          .update({ status: proposed_value })
          .eq("id", matter_id);
      }

      // Record the change
      const { data: proposal } = await supabaseAdmin
        .from("matter_field_change_proposals")
        .insert({
          organization_id: orgId,
          matter_id,
          proposed_by_account_id: crmAccountId,
          proposed_by_user_id: userId,
          field_name,
          current_value: JSON.stringify(currentValue),
          proposed_value: JSON.stringify(proposed_value),
          change_reason: change_reason || null,
          status: "auto_applied",
          applied_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      proposalStatus = "auto_applied";
      proposalId = proposal?.id || null;
    } else {
      // 5b: Create proposal for approval
      const { data: proposal } = await supabaseAdmin
        .from("matter_field_change_proposals")
        .insert({
          organization_id: orgId,
          matter_id,
          proposed_by_account_id: crmAccountId,
          proposed_by_user_id: userId,
          field_name,
          current_value: JSON.stringify(currentValue),
          proposed_value: JSON.stringify(proposed_value),
          change_reason: change_reason || null,
          status: "pending",
        })
        .select("id")
        .single();

      proposalStatus = "pending_approval";
      proposalId = proposal?.id || null;

      // Notify the firm
      await supabaseAdmin.from("portal_notifications").insert({
        organization_id: orgId,
        notification_type: "field_change_proposed",
        priority: "normal",
        title: "Propuesta de cambio del agente",
        message: `Agente propone cambiar ${field_name} en expediente ${matterCheck.title}`,
        metadata: { proposal_id: proposalId, matter_id, field_name },
      });
    }

    return new Response(JSON.stringify({
      proposal_id: proposalId,
      status: proposalStatus,
      field_name,
      proposed_value,
      message: proposalStatus === "auto_applied"
        ? "Cambio aplicado correctamente"
        : "Propuesta enviada al despacho para aprobación",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("agent-field-proposal error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
