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

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    // Get org from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "no_profile" }), { status: 403, headers: corsHeaders });
    }
    const orgId = profile.organization_id;

    const { crm_account_id, permissions, custom_message } = await req.json();

    // STEP 1: Check portal enabled
    const { data: org } = await supabase
      .from("organizations")
      .select("portal_enabled, portal_max_clients, portal_subdomain, name")
      .eq("id", orgId)
      .single();

    if (!org?.portal_enabled) {
      return new Response(JSON.stringify({ error: "portal_not_enabled" }), { status: 400, headers: corsHeaders });
    }

    // STEP 2: Check client limit
    const { count } = await supabase
      .from("portal_access")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active");

    if ((count ?? 0) >= (org.portal_max_clients ?? 10)) {
      return new Response(JSON.stringify({ error: "client_limit_reached", limit: org.portal_max_clients }), { status: 400, headers: corsHeaders });
    }

    // STEP 3: Get client email
    const { data: account } = await supabase
      .from("crm_accounts")
      .select("id, name, email")
      .eq("id", crm_account_id)
      .eq("organization_id", orgId)
      .single();

    if (!account?.email) {
      return new Response(JSON.stringify({ error: "client_has_no_email" }), { status: 400, headers: corsHeaders });
    }

    // STEP 4: Revoke previous pending invitations
    await supabase
      .from("portal_invitations")
      .update({ status: "revoked" })
      .eq("crm_account_id", crm_account_id)
      .eq("organization_id", orgId)
      .eq("status", "pending");

    // STEP 5: Create invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation, error: invErr } = await supabase
      .from("portal_invitations")
      .insert({
        organization_id: orgId,
        crm_account_id,
        email: account.email,
        status: "pending",
        expires_at: expiresAt,
        initial_permissions: permissions ?? {},
        sent_by: userId,
      })
      .select("id, token, expires_at")
      .single();

    if (invErr) {
      return new Response(JSON.stringify({ error: "invitation_create_failed", detail: invErr.message }), { status: 500, headers: corsHeaders });
    }

    // STEP 6: Update crm_accounts
    await supabase
      .from("crm_accounts")
      .update({
        portal_invited_at: new Date().toISOString(),
        portal_invitation_token: invitation.token,
        portal_invitation_expires_at: expiresAt,
      })
      .eq("id", crm_account_id);

    // STEP 7: Send email (try/catch — mock if fails)
    let emailSent = false;
    try {
      const slug = org.portal_subdomain || orgId;
      const acceptUrl = `/portal/${slug}/accept?token=${invitation.token}`;
      await supabase.functions.invoke("comm-send-email", {
        body: {
          organization_id: orgId,
          to: account.email,
          subject: `${org.name || "Tu despacho"} te ha invitado al portal`,
          body_html: `<p>Hola,</p><p>Has sido invitado al portal de clientes. Haz clic para activar tu cuenta:</p><p><a href="${acceptUrl}">${acceptUrl}</a></p>${custom_message ? `<p>${custom_message}</p>` : ""}`,
        },
      });
      emailSent = true;
    } catch (_) {
      emailSent = false;
    }

    const slug = org.portal_subdomain || orgId;

    return new Response(
      JSON.stringify({
        invitation_id: invitation.id,
        token: invitation.token,
        expires_at: invitation.expires_at,
        email_sent: emailSent,
        accept_url: `/portal/${slug}/accept?token=${invitation.token}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
