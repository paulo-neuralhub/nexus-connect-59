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
    // ── Auth ─────────────────────────────────────────────
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

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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

    // ── Parse body ──────────────────────────────────────
    const body = await req.json();
    const { current_page, matter_id, crm_account_id } = body as {
      current_page: string;
      matter_id?: string;
      crm_account_id?: string;
    };

    // ── PASO 1: Tenant config ───────────────────────────
    const { data: gtc } = await db
      .from("genius_tenant_config")
      .select(
        "copilot_mode, copilot_name, copilot_avatar_url, briefing_enabled, model_basic, model_pro, proactive_enabled, current_month_queries, max_queries_per_month, feature_document_generation, feature_app_actions"
      )
      .eq("organization_id", orgId)
      .single();

    const copilotConfig = gtc || {
      copilot_mode: "basic",
      copilot_name: "CoPilot Nexus",
      copilot_avatar_url: null,
      briefing_enabled: true,
      current_month_queries: 0,
      max_queries_per_month: 0,
      feature_document_generation: false,
      feature_app_actions: false,
      proactive_enabled: false,
    };

    const queriesLimit = copilotConfig.max_queries_per_month || 0;
    const queriesUsed = copilotConfig.current_month_queries || 0;

    // ── PASO 2: User preferences ────────────────────────
    const { data: userPrefs } = await db
      .from("copilot_user_preferences")
      .select("copilot_visible, copilot_position, copilot_size, guide_dismissed_ids, briefing_dismissed_dates, preferred_response_length, show_rag_sources")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .single();

    // ── PASO 3: Today's briefing ────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const { data: briefing } = await db
      .from("genius_daily_briefings")
      .select("id, content_json, total_items, urgent_items, was_read")
      .eq("organization_id", orgId)
      .eq("briefing_date", today)
      .eq("was_read", false)
      .limit(1)
      .maybeSingle();

    // ── PASO 4: Real-time alerts ────────────────────────
    // Fatal deadlines < 72h
    const now = new Date().toISOString();
    const in72h = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const { data: fatalDeadlines } = await db
      .from("matter_deadlines")
      .select("id, title, due_date, is_critical, matter_id")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .gte("due_date", now)
      .lte("due_date", in72h)
      .order("due_date", { ascending: true })
      .limit(5);

    // Enrich with matter info
    const enrichedDeadlines = [];
    if (fatalDeadlines?.length) {
      const matterIds = [...new Set(fatalDeadlines.map((d: any) => d.matter_id))];
      const { data: matters } = await db
        .from("matters")
        .select("id, title, reference")
        .in("id", matterIds);
      const matterMap = new Map((matters || []).map((m: any) => [m.id, m]));

      for (const d of fatalDeadlines) {
        const m = matterMap.get(d.matter_id);
        enrichedDeadlines.push({
          id: d.id,
          title: d.title,
          due_date: d.due_date,
          is_critical: d.is_critical,
          matter_title: m?.title || null,
          reference_number: m?.reference || null,
          hours_remaining: Math.round((new Date(d.due_date).getTime() - Date.now()) / 3600000),
        });
      }
    }

    // Critical spider alerts
    let criticalSpider = 0;
    try {
      const { count } = await db
        .from("spider_alerts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("severity", "critical")
        .eq("status", "new");
      criticalSpider = count || 0;
    } catch { /* table may not exist */ }

    // Overdue invoices
    let overdueInvoices = 0;
    let overdueAmount = 0;
    try {
      const { data: overdueData } = await db
        .from("invoices")
        .select("total")
        .eq("organization_id", orgId)
        .eq("status", "overdue");
      if (overdueData?.length) {
        overdueInvoices = overdueData.length;
        overdueAmount = overdueData.reduce((s: number, i: any) => s + (i.total || 0), 0);
      }
    } catch { /* table may not exist */ }

    // Unread chat
    let unreadChat = 0;
    try {
      const { count } = await db
        .from("staff_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false)
        .eq("source_type", "internal_chat");
      unreadChat = count || 0;
    } catch { /* table may not exist */ }

    // ── PASO 5: Matter context ──────────────────────────
    let matterContext = null;
    if (matter_id) {
      const { data: matter } = await db
        .from("matters")
        .select("title, reference, status, jurisdiction, type, portal_visible")
        .eq("id", matter_id)
        .eq("organization_id", orgId)
        .single();

      if (matter) {
        const { data: nextDl } = await db
          .from("matter_deadlines")
          .select("title, due_date")
          .eq("matter_id", matter_id)
          .eq("status", "pending")
          .order("due_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        matterContext = {
          ...matter,
          next_deadline: nextDl ? `${nextDl.title} — ${nextDl.due_date}` : null,
        };
      }
    }

    // ── PASO 6: Client context ──────────────────────────
    let clientContext = null;
    if (crm_account_id) {
      const { data: account } = await db
        .from("crm_accounts")
        .select("name, account_type")
        .eq("id", crm_account_id)
        .eq("organization_id", orgId)
        .single();

      if (account) {
        const { count: mattersCount } = await db
          .from("matters")
          .select("id", { count: "exact", head: true })
          .eq("client_id", crm_account_id);

        const { data: pendingInv } = await db
          .from("invoices")
          .select("total")
          .eq("crm_account_id", crm_account_id)
          .eq("status", "pending");

        clientContext = {
          name: account.name,
          account_type: account.account_type,
          matters_count: mattersCount || 0,
          pending_amount: pendingInv?.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0,
        };
      }
    }

    // ── PASO 7: Available guides ────────────────────────
    const { data: guides } = await db
      .from("copilot_guide_steps")
      .select("guide_id, step_order, title, copilot_message, target_selector, is_skippable")
      .or(`target_route.eq.${current_page},target_route.is.null`)
      .order("guide_id")
      .order("step_order");

    // Filter out dismissed guides
    const dismissedIds = userPrefs?.guide_dismissed_ids || [];
    const availableGuides = (guides || []).filter(
      (g: any) => !dismissedIds.includes(g.guide_id)
    );

    // ── Response ────────────────────────────────────────
    return new Response(
      JSON.stringify({
        copilot: {
          mode: copilotConfig.copilot_mode || "basic",
          name: copilotConfig.copilot_name || "CoPilot Nexus",
          avatar_url: copilotConfig.copilot_avatar_url || null,
          queries_used: queriesUsed,
          queries_limit: queriesLimit,
          queries_remaining: queriesLimit === -1 ? -1 : Math.max(0, queriesLimit - queriesUsed),
          features: {
            document_generation: copilotConfig.feature_document_generation || false,
            app_actions: copilotConfig.feature_app_actions || false,
            proactive: copilotConfig.proactive_enabled || false,
          },
        },
        user_prefs: userPrefs || {
          copilot_visible: true,
          copilot_position: "bottom-right",
          copilot_size: "bubble",
          show_rag_sources: false,
        },
        briefing: briefing || null,
        alerts: {
          fatal_deadlines: enrichedDeadlines,
          critical_spider: criticalSpider,
          overdue_invoices: overdueInvoices,
          overdue_amount: overdueAmount,
          unread_chat: unreadChat,
        },
        matter_context: matterContext,
        client_context: clientContext,
        available_guides: availableGuides,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("genius-copilot-context error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
