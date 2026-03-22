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
    const staffUserId = claimsData.claims.sub as string;

    // Get org + role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", staffUserId)
      .single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "no_profile" }), { status: 403, headers: corsHeaders });
    }
    const orgId = profile.organization_id;

    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { crm_account_id, purpose } = body;
      if (!crm_account_id) {
        return new Response(JSON.stringify({ error: "missing_crm_account_id" }), { status: 400, headers: corsHeaders });
      }

      // STEP 1: Verify account belongs to tenant
      const { data: account } = await supabase
        .from("crm_accounts")
        .select("id, portal_user_id")
        .eq("id", crm_account_id)
        .eq("organization_id", orgId)
        .single();

      if (!account) {
        return new Response(JSON.stringify({ error: "account_not_found" }), { status: 404, headers: corsHeaders });
      }

      // STEP 2: Check active portal access
      const { data: portalAccess } = await supabase
        .from("portal_access")
        .select("id")
        .eq("crm_account_id", crm_account_id)
        .eq("organization_id", orgId)
        .eq("status", "active")
        .maybeSingle();

      if (!portalAccess) {
        return new Response(JSON.stringify({ error: "client_has_no_active_portal" }), { status: 400, headers: corsHeaders });
      }

      // STEP 3: Create impersonation session
      const { data: session, error: sessErr } = await supabase
        .from("portal_impersonation_sessions")
        .insert({
          organization_id: orgId,
          staff_user_id: staffUserId,
          staff_role: profile.role || "staff",
          target_crm_account_id: crm_account_id,
          target_portal_user_id: account.portal_user_id,
          purpose: purpose || "configuration_review",
          is_active: true,
        })
        .select("id")
        .single();

      if (sessErr) {
        return new Response(JSON.stringify({ error: "session_create_failed", detail: sessErr.message }), { status: 500, headers: corsHeaders });
      }

      // Get slug
      const { data: org } = await supabase
        .from("organizations")
        .select("portal_subdomain")
        .eq("id", orgId)
        .single();
      const slug = org?.portal_subdomain || orgId;

      return new Response(
        JSON.stringify({
          session_id: session.id,
          token: session.id,
          portal_url: `/portal/${slug}/dashboard?impersonate=${session.id}`,
          expires_in: 1800,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "end") {
      const { session_id, pages_visited } = body;
      if (!session_id) {
        return new Response(JSON.stringify({ error: "missing_session_id" }), { status: 400, headers: corsHeaders });
      }

      // Get session to compute duration
      const { data: existing } = await supabase
        .from("portal_impersonation_sessions")
        .select("started_at")
        .eq("id", session_id)
        .eq("staff_user_id", staffUserId)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: corsHeaders });
      }

      const durationSeconds = Math.round(
        (Date.now() - new Date(existing.started_at).getTime()) / 1000
      );

      await supabase
        .from("portal_impersonation_sessions")
        .update({
          ended_at: new Date().toISOString(),
          is_active: false,
          duration_seconds: durationSeconds,
          pages_visited: pages_visited || [],
        })
        .eq("id", session_id)
        .eq("staff_user_id", staffUserId);

      return new Response(
        JSON.stringify({ success: true, duration_seconds: durationSeconds }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
