import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const portalUserId = claimsData.claims.sub as string;

    const { session_id, reason } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "missing_session_id" }), { status: 400, headers: corsHeaders });
    }

    // STEP 1: Verify session belongs to user
    const { data: session } = await supabase
      .from("portal_chat_sessions")
      .select("id, organization_id, crm_account_id")
      .eq("id", session_id)
      .eq("portal_user_id", portalUserId)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: corsHeaders });
    }

    const orgId = session.organization_id;

    // STEP 2: Find available agent (heartbeat TTL 2 min)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: agent } = await supabase
      .from("portal_agent_availability")
      .select("id, agent_id")
      .eq("organization_id", orgId)
      .eq("status", "online")
      .lt("current_active_chats", 3) // fallback if max_concurrent not set
      .gt("last_heartbeat_at", twoMinAgo)
      .order("current_active_chats", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (agent) {
      // STEP 3a: Agent found
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", agent.agent_id)
        .single();

      const agentName = agentProfile
        ? `${agentProfile.first_name || ""} ${agentProfile.last_name || ""}`.trim()
        : "Agente";

      await Promise.all([
        supabase
          .from("portal_chat_sessions")
          .update({
            mode: "human",
            assigned_agent_id: agent.agent_id,
            assigned_at: new Date().toISOString(),
            handoff_requested_at: new Date().toISOString(),
            handoff_trigger: reason || "user_request",
            human_joined_at: new Date().toISOString(),
          })
          .eq("id", session_id),
        supabase.rpc("", {}).catch(() => null), // placeholder
        supabase
          .from("portal_agent_availability")
          .update({ current_active_chats: (agent as any).current_active_chats + 1 })
          .eq("id", agent.id),
        supabase.from("portal_chat_messages").insert({
          organization_id: orgId,
          crm_account_id: session.crm_account_id,
          sender_type: "system",
          sender_name: "Sistema",
          content: `Conectando con ${agentName}...`,
        }),
        supabase.from("portal_notifications").insert({
          organization_id: orgId,
          crm_account_id: session.crm_account_id,
          portal_user_id: null,
          type: "chat_handoff",
          title: "Chat requiere atención",
          message: `Un cliente solicita hablar con un agente. Motivo: ${reason || "Solicitud del usuario"}`,
          priority: "urgent",
        }),
      ]);

      return new Response(
        JSON.stringify({ status: "connected", agent_name: agentName }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // STEP 3b: No agent available
      await Promise.all([
        supabase
          .from("portal_chat_sessions")
          .update({
            mode: "waiting_human",
            handoff_requested_at: new Date().toISOString(),
            handoff_trigger: reason || "user_request",
          })
          .eq("id", session_id),
        supabase.from("portal_chat_messages").insert({
          organization_id: orgId,
          crm_account_id: session.crm_account_id,
          sender_type: "system",
          sender_name: "Sistema",
          content: "Todos los agentes están ocupados en este momento. Te atenderemos en breve.",
        }),
        supabase.from("portal_notifications").insert({
          organization_id: orgId,
          crm_account_id: session.crm_account_id,
          type: "chat_waiting",
          title: "Cliente esperando agente",
          message: `Un cliente está esperando atención humana. Motivo: ${reason || "Solicitud del usuario"}`,
          priority: "urgent",
        }),
      ]);

      return new Response(
        JSON.stringify({ status: "waiting", estimated_wait: "En breve" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
