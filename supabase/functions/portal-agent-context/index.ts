import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: extract org_id from JWT
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

    const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const body = req.method === "POST" ? await req.json() : {};
    const activeClientAccountId = body.active_client_account_id || null;

    // STEP 1: Verify agent portal access
    const { data: portalAccess } = await supabaseAdmin
      .from("portal_access")
      .select("id, organization_id, crm_account_id, status")
      .eq("portal_user_id", userId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!portalAccess) {
      return new Response(JSON.stringify({ error: "not_agent_portal" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = portalAccess.organization_id;
    const crmAccountId = portalAccess.crm_account_id;

    // Verify account is agent type
    const { data: account } = await supabaseAdmin
      .from("crm_accounts")
      .select("id, name, portal_type, is_agent, agent_portal_branding")
      .eq("id", crmAccountId)
      .single();

    if (!account || account.portal_type !== "agent") {
      return new Response(JSON.stringify({ error: "not_agent_portal" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get org info
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, primary_color, logo_url")
      .eq("id", orgId)
      .single();

    // STEP 2: Load agent's clients
    const { data: relationships } = await supabaseAdmin
      .from("account_relationships")
      .select("id, client_account_id, relationship_type, billing_party, agent_client_reference")
      .eq("agent_account_id", crmAccountId)
      .eq("organization_id", orgId)
      .eq("is_active", true);

    const clientIds = (relationships || []).map((r: any) => r.client_account_id);
    
    // Get client account details
    let clientAccounts: any[] = [];
    if (clientIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("crm_accounts")
        .select("id, name, email, account_type")
        .in("id", clientIds);
      clientAccounts = data || [];
    }

    // Try to get analytics data (may not exist yet if view hasn't been refreshed)
    let analyticsData: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from("agent_portfolio_analytics")
        .select("*")
        .eq("agent_account_id", crmAccountId)
        .eq("organization_id", orgId);
      analyticsData = data || [];
    } catch { /* view may not have data yet */ }

    // Merge clients with relationships and analytics
    const clients = (relationships || []).map((rel: any) => {
      const ca = clientAccounts.find((c: any) => c.id === rel.client_account_id) || {};
      const analytics = analyticsData.find((a: any) => a.client_account_id === rel.client_account_id);
      return {
        relationship_id: rel.id,
        client_account_id: rel.client_account_id,
        relationship_type: rel.relationship_type,
        billing_party: rel.billing_party,
        agent_client_reference: rel.agent_client_reference,
        name: ca.name || "Unknown",
        email: ca.email || null,
        account_type: ca.account_type || null,
        total_matters: analytics?.total_matters || 0,
        active_matters: analytics?.active_matters || 0,
        deadlines_next_30d: analytics?.deadlines_next_30d || 0,
        overdue_deadlines: analytics?.overdue_deadlines || 0,
        pending_invoices_eur: analytics?.pending_invoices_eur || 0,
        last_matter_update: analytics?.last_matter_update || null,
      };
    });

    // STEP 3: Global KPIs
    const globalKpis = {
      total_active_matters: clients.reduce((s: number, c: any) => s + (c.active_matters || 0), 0),
      total_deadlines_30d: clients.reduce((s: number, c: any) => s + (c.deadlines_next_30d || 0), 0),
      total_overdue: clients.reduce((s: number, c: any) => s + (c.overdue_deadlines || 0), 0),
      total_pending_invoices: clients.reduce((s: number, c: any) => s + (c.pending_invoices_eur || 0), 0),
      pending_instructions: 0,
    };

    // STEP 4: Pending instructions count
    try {
      const { count } = await supabaseAdmin
        .from("portal_client_instructions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "received")
        .in("crm_account_id", clientIds.length > 0 ? clientIds : ["00000000-0000-0000-0000-000000000000"]);
      globalKpis.pending_instructions = count || 0;
    } catch { /* table may have limited columns */ }

    // STEP 5: Active client matters
    let activeClient: any = null;
    if (activeClientAccountId) {
      // Verify relationship exists
      const hasRelationship = clients.some((c: any) => c.client_account_id === activeClientAccountId);
      if (hasRelationship) {
        const clientInfo = clients.find((c: any) => c.client_account_id === activeClientAccountId);
        const { data: matters } = await supabaseAdmin
          .from("matters")
          .select("id, reference, title, type, status, jurisdiction, filing_date, expiry_date, mark_name, updated_at, family_id")
          .eq("organization_id", orgId)
          .eq("owner_account_id", activeClientAccountId)
          .eq("intermediate_agent_id", crmAccountId)
          .order("updated_at", { ascending: false })
          .limit(50);

        // Get family names
        const familyIds = [...new Set((matters || []).filter((m: any) => m.family_id).map((m: any) => m.family_id))];
        let families: any[] = [];
        if (familyIds.length > 0) {
          const { data } = await supabaseAdmin
            .from("matter_families")
            .select("id, family_name")
            .in("id", familyIds);
          families = data || [];
        }

        const mattersWithFamily = (matters || []).map((m: any) => ({
          ...m,
          family_name: families.find((f: any) => f.id === m.family_id)?.family_name || null,
        }));

        activeClient = {
          account_id: activeClientAccountId,
          name: clientInfo?.name || "Unknown",
          matters: mattersWithFamily,
        };
      }
    }

    // STEP 6: Upsert agent_portal_sessions
    await supabaseAdmin
      .from("agent_portal_sessions")
      .upsert({
        organization_id: orgId,
        agent_account_id: crmAccountId,
        portal_user_id: userId,
        active_client_account_id: activeClientAccountId,
        last_activity_at: new Date().toISOString(),
      }, { onConflict: "portal_user_id" });

    return new Response(JSON.stringify({
      agent: {
        crm_account_id: crmAccountId,
        agent_name: account.name,
        org_name: org?.name || null,
        branding: account.agent_portal_branding || {},
      },
      clients,
      global_kpis: globalKpis,
      active_client: activeClient,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("portal-agent-context error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
