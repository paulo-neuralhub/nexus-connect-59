import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, password, full_name } = await req.json();
    if (!token || !password || !full_name) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // STEP 1: Atomically claim invitation (prevents race condition)
    const { data: invitation, error: claimErr } = await supabase.rpc(
      "claim_portal_invitation",
      { p_token: token },
    );

    if (claimErr || !invitation) {
      return new Response(
        JSON.stringify({ error: "invalid_or_expired_token" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // STEP 2: Create or find Supabase Auth user (handles multi-org)
    let newUserId: string;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        portal_org_id: invitation.organization_id,
        crm_account_id: invitation.crm_account_id,
      },
    });

    if (authErr) {
      // User already exists (multi-org case) — look up existing
      if (authErr.message?.includes("already been registered") || authErr.message?.includes("already exists")) {
        const { data: listData } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });
        const existing = listData?.users?.find((u) => u.email === invitation.email);
        if (!existing) {
          return new Response(
            JSON.stringify({ error: "user_lookup_failed" }),
            { status: 400, headers: corsHeaders },
          );
        }
        newUserId = existing.id;
      } else {
        return new Response(
          JSON.stringify({ error: "user_creation_failed", detail: authErr.message }),
          { status: 400, headers: corsHeaders },
        );
      }
    } else {
      newUserId = authData.user.id;
    }

    const perms = invitation.initial_permissions ?? {};

    // STEP 3: Insert portal_access
    await supabase.from("portal_access").insert({
      organization_id: invitation.organization_id,
      crm_account_id: invitation.crm_account_id,
      portal_user_id: newUserId,
      status: "active",
      invited_by: invitation.sent_by,
      activated_at: new Date().toISOString(),
      can_view_matters: perms.can_view_matters ?? true,
      can_view_documents: perms.can_view_documents ?? true,
      can_view_invoices: perms.can_view_invoices ?? true,
      can_view_deadlines: perms.can_view_deadlines ?? true,
      can_message_despacho: perms.can_message_despacho ?? true,
      can_use_chatbot: perms.can_use_chatbot ?? true,
      can_request_services: perms.can_request_services ?? false,
      can_pay_invoices: perms.can_pay_invoices ?? false,
      can_sign_documents: perms.can_sign_documents ?? false,
    });

    // STEP 4: Update crm_accounts
    await supabase
      .from("crm_accounts")
      .update({ portal_enabled: true, portal_user_id: newUserId })
      .eq("id", invitation.crm_account_id);

    // STEP 5: Try comm_thread (silent)
    try {
      await supabase.from("comm_threads").insert({
        organization_id: invitation.organization_id,
        channel: "portal",
        crm_account_id: invitation.crm_account_id,
        subject: "Portal del cliente activado",
      });
    } catch (_) { /* continue */ }

    // STEP 6: Welcome notification (fixed: notification_type, not type)
    await supabase.from("portal_notifications").insert({
      organization_id: invitation.organization_id,
      crm_account_id: invitation.crm_account_id,
      portal_user_id: newUserId,
      notification_type: "welcome",
      title: "¡Bienvenido a tu portal!",
      message: "Tu cuenta ha sido activada. Explora tus expedientes y documentos.",
      priority: "normal",
      is_read: false,
    });

    // STEP 7: Get org slug
    const { data: org } = await supabase
      .from("organizations")
      .select("portal_subdomain")
      .eq("id", invitation.organization_id)
      .single();

    const slug = org?.portal_subdomain || invitation.organization_id;

    return new Response(
      JSON.stringify({
        success: true,
        portal_url: `https://${slug}.ip-nexus.app/dashboard`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
