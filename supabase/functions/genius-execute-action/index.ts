import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // ── Auth ─────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const db = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await db
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();
    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profile.organization_id;

    // ── Config checks ───────────────────────────────
    const { data: config } = await db
      .from("genius_tenant_config")
      .select("is_active, disclaimer_accepted, feature_app_actions, max_actions_per_month, current_month_actions, current_month_reset_at")
      .eq("organization_id", orgId)
      .single();

    if (!config?.is_active) {
      return new Response(JSON.stringify({ error: "genius_not_active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!config.disclaimer_accepted) {
      return new Response(JSON.stringify({ error: "disclaimer_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!config.feature_app_actions) {
      return new Response(JSON.stringify({ error: "feature_disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monthly limit
    const resetAt = new Date(config.current_month_reset_at);
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const currentActions = resetAt < monthStart ? 0 : config.current_month_actions;
    if (config.max_actions_per_month !== -1 && currentActions >= config.max_actions_per_month) {
      return new Response(JSON.stringify({ error: "monthly_action_limit_reached" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ──────────────────────────────────
    const body = await req.json();
    const { message_id, confirmed } = body as {
      message_id: string;
      confirmed: boolean;
    };

    if (!message_id) {
      return new Response(JSON.stringify({ error: "message_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CRITICAL: confirmed must be explicitly true
    if (confirmed !== true) {
      return new Response(
        JSON.stringify({ error: "Action must be explicitly confirmed (confirmed: true)" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verify message belongs to tenant ─────────────
    const { data: actionMsg, error: msgErr } = await db
      .from("genius_messages")
      .select("id, organization_id, conversation_id, proposed_action, action_data, action_status, content_type")
      .eq("id", message_id)
      .single();

    if (msgErr || !actionMsg) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CRITICAL: tenant isolation
    if (actionMsg.organization_id !== orgId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (actionMsg.content_type !== "action_proposal") {
      return new Response(JSON.stringify({ error: "Message is not an action proposal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CRITICAL: prevent double execution
    if (actionMsg.action_status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "Action already processed",
          current_status: actionMsg.action_status,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Execute action ──────────────────────────────
    const action = actionMsg.proposed_action;
    const actionData = (actionMsg.action_data as Record<string, unknown>) || {};
    let result: Record<string, unknown> = {};

    switch (action) {
      case "create_matter": {
        const { data: matter, error } = await db
          .from("matters")
          .insert({
            organization_id: orgId,
            title: (actionData.title as string) || "Nuevo expediente (Genius)",
            type: (actionData.type as string) || "trademark",
            status: "draft",
            created_by: userId,
          })
          .select("id, reference, title")
          .single();
        if (error) throw error;
        result = { action: "create_matter", matter };
        break;
      }

      case "add_deadline": {
        const { data: deadline, error } = await db
          .from("matter_deadlines")
          .insert({
            matter_id: actionData.matter_id as string,
            organization_id: orgId,
            title: (actionData.title as string) || "Plazo (Genius)",
            due_date: (actionData.due_date as string) || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
            is_critical: (actionData.is_critical as boolean) || false,
            status: "pending",
            created_by: userId,
          })
          .select("id, title, due_date")
          .single();
        if (error) throw error;
        result = { action: "add_deadline", deadline };
        break;
      }

      case "send_email": {
        // Delegate to comm-send-email edge function
        const { data: emailResult, error } = await db.functions.invoke("comm-send-email", {
          body: {
            to: actionData.to as string,
            subject: actionData.subject as string,
            body_html: actionData.body as string,
            matter_id: actionData.matter_id as string,
          },
        });
        result = { action: "send_email", result: emailResult, error: error?.message };
        break;
      }

      case "create_crm_deal": {
        const { data: deal, error } = await db
          .from("deals")
          .insert({
            organization_id: orgId,
            name: (actionData.name as string) || "Deal (Genius)",
            stage: "lead",
            created_by: userId,
          })
          .select("id, name")
          .single();
        if (error) throw error;
        result = { action: "create_crm_deal", deal };
        break;
      }

      case "activate_spider_watch": {
        const { data: watch, error } = await db
          .from("spider_watches")
          .insert({
            organization_id: orgId,
            watch_name: (actionData.watch_name as string) || "Vigilancia (Genius)",
            watch_type: "identical_similar",
            status: "active",
            created_by: userId,
          })
          .select("id, watch_name")
          .single();
        if (error) throw error;
        result = { action: "activate_spider_watch", watch };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ── Update action status ────────────────────────
    await db
      .from("genius_messages")
      .update({
        action_status: "executed",
        action_executed_at: new Date().toISOString(),
      })
      .eq("id", message_id);

    // ── Log execution as system message ─────────────
    await db.from("genius_messages").insert({
      organization_id: orgId,
      conversation_id: actionMsg.conversation_id,
      role: "system",
      content: `✅ Acción ejecutada: ${action}\nResultado: ${JSON.stringify(result)}`,
      content_type: "text",
    });

    // Increment counter
    await db.rpc("increment_genius_counter", {
      p_org_id: orgId,
      p_type: "action",
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("genius-execute-action error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
