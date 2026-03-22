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

    // Auth — accepts service_role or staff JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = claimsData.claims.sub as string;

    // Derive org_id from profile (staff) or fallback from body for service_role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", callerId)
      .maybeSingle();

    const body = await req.json();
    const {
      crm_account_id,
      notification_type,
      title,
      message,
      matter_id,
      invoice_id,
      priority,
      dedup_key,
      organization_id: bodyOrgId,
    } = body;

    const orgId = profile?.organization_id || bodyOrgId;
    if (!orgId || !crm_account_id || !title || !message) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: corsHeaders });
    }

    // STEP 1: Dedup check
    if (dedup_key) {
      const { data: existing } = await supabase
        .from("portal_notifications")
        .select("id")
        .eq("dedup_key", dedup_key)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ notification_id: existing.id, channels_attempted: [], deduplicated: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // STEP 2: Get portal_user_id + preferences
    const { data: account } = await supabase
      .from("crm_accounts")
      .select("portal_user_id, portal_notification_email, portal_notification_whatsapp, portal_notification_push, email")
      .eq("id", crm_account_id)
      .eq("organization_id", orgId)
      .single();

    // STEP 3: Insert notification
    const { data: notif, error: notifErr } = await supabase
      .from("portal_notifications")
      .insert({
        organization_id: orgId,
        crm_account_id,
        portal_user_id: account?.portal_user_id || null,
        type: notification_type || "general",
        title,
        message,
        matter_id: matter_id || null,
        invoice_id: invoice_id || null,
        priority: priority || "normal",
        dedup_key: dedup_key || null,
        is_read: false,
      })
      .select("id")
      .single();

    if (notifErr) {
      return new Response(JSON.stringify({ error: "notification_failed", detail: notifErr.message }), { status: 500, headers: corsHeaders });
    }

    // STEP 4: Send channels
    const channelsAttempted: string[] = [];

    // Email
    if (account?.portal_notification_email !== false && account?.email) {
      try {
        await supabase.functions.invoke("comm-send-email", {
          body: {
            organization_id: orgId,
            to: account.email,
            subject: title,
            body_html: `<p>${message}</p>`,
          },
        });
        channelsAttempted.push("email");
        await supabase.from("portal_notifications").update({ sent_email: true }).eq("id", notif.id);
      } catch (_) { /* continue */ }
    }

    // Push
    if (account?.portal_notification_push) {
      try {
        // Web push placeholder
        channelsAttempted.push("push");
        await supabase.from("portal_notifications").update({ sent_push: true }).eq("id", notif.id);
      } catch (_) { /* continue */ }
    }

    // WhatsApp (only for urgent)
    if (account?.portal_notification_whatsapp && (priority === "urgent" || priority === "high")) {
      try {
        await supabase.functions.invoke("comm-send-whatsapp", {
          body: {
            organization_id: orgId,
            crm_account_id,
            message: `${title}: ${message}`,
          },
        });
        channelsAttempted.push("whatsapp");
        await supabase.from("portal_notifications").update({ sent_whatsapp: true }).eq("id", notif.id);
      } catch (_) { /* continue */ }
    }

    return new Response(
      JSON.stringify({ notification_id: notif.id, channels_attempted: channelsAttempted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
