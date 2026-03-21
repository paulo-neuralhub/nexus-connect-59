import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    // ── Auth: org_id from JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { data: profile } = await adminClient
      .from("profiles")
      .select("organization_id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profile.organization_id;

    // ── Verify module + WhatsApp active ──
    const { data: config } = await adminClient
      .from("comm_tenant_config")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!config?.is_active) {
      return new Response(JSON.stringify({ error: "comm_module_not_active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ──
    const body = await req.json();
    const {
      thread_id,
      matter_id,
      crm_account_id,
      crm_contact_id,
      to_phone,
      message_type,
      text,
      template_name,
      template_params,
      template_language,
      idempotency_key,
    } = body;

    if (!idempotency_key) {
      return new Response(JSON.stringify({ error: "idempotency_key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!to_phone) {
      return new Response(JSON.stringify({ error: "to_phone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Idempotency check ──
    const { data: existing } = await adminClient
      .from("comm_messages")
      .select("id")
      .eq("organization_id", orgId)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message_id: existing.id, idempotent: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Monthly limit check ──
    const resetNeeded = config.current_month_reset_at
      ? new Date(config.current_month_reset_at) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : true;
    const currentWA = resetNeeded ? 0 : (config.current_month_whatsapp || 0);

    if (currentWA >= (config.max_whatsapp_per_month || 500)) {
      return new Response(
        JSON.stringify({ error: "monthly_whatsapp_limit_reached", current: currentWA, max: config.max_whatsapp_per_month }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 1: Check 24h window ──
    // Window is from LAST CLIENT MESSAGE (sender_type='contact'), NOT agent
    const { data: lastClientMsg } = await adminClient
      .from("comm_messages")
      .select("created_at")
      .eq("organization_id", orgId)
      .eq("channel", "whatsapp")
      .eq("sender_type", "contact")
      .eq("sender_phone", to_phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const windowOpen = lastClientMsg
      ? new Date(lastClientMsg.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      : false;

    const msgType = message_type || "text";

    if (!windowOpen && msgType === "text") {
      return new Response(
        JSON.stringify({
          error: "whatsapp_window_expired",
          message: "La ventana de 24h ha expirado. Solo puedes enviar templates HSM aprobados.",
          window_open: false,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 2: Get or create thread ──
    let resolvedThreadId = thread_id;
    if (!resolvedThreadId) {
      const { data: tid } = await adminClient.rpc("get_or_create_comm_thread", {
        p_org_id: orgId,
        p_channel: "whatsapp",
        p_matter_id: matter_id || null,
        p_account_id: crm_account_id || null,
        p_contact_id: crm_contact_id || null,
        p_subject: `WhatsApp ${to_phone}`,
        p_created_by: userId,
      });
      resolvedThreadId = tid;
    }

    // ── PASO 3: Send via provider ──
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWaFrom = config.whatsapp_phone_number_id || Deno.env.get("TWILIO_WHATSAPP_FROM");

    let providerMessageId: string | null = null;
    let provider = "mock";
    let isMock = true;
    let sendStatus = "sent";
    const sentAt = new Date().toISOString();

    if (twilioSid && twilioAuth && twilioWaFrom) {
      // ── Twilio WhatsApp API ──
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const fromNumber = twilioWaFrom.startsWith("whatsapp:") ? twilioWaFrom : `whatsapp:${twilioWaFrom}`;
        const toNumber = to_phone.startsWith("whatsapp:") ? to_phone : `whatsapp:${to_phone}`;

        const params = new URLSearchParams();
        params.set("From", fromNumber);
        params.set("To", toNumber);

        if (msgType === "template" && template_name) {
          // Twilio Content Templates
          params.set("ContentSid", template_name);
          if (template_params && Array.isArray(template_params)) {
            params.set("ContentVariables", JSON.stringify(
              Object.fromEntries(template_params.map((v: string, i: number) => [String(i + 1), v]))
            ));
          }
        } else {
          params.set("Body", text || "");
        }

        const res = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        const resData = await res.json();

        if (res.ok && resData.sid) {
          provider = "twilio";
          providerMessageId = resData.sid;
          isMock = false;
        } else if (resData.code === 63016) {
          // Window expired error from Twilio
          return new Response(
            JSON.stringify({
              error: "whatsapp_window_expired",
              message: "Twilio: ventana de 24h expirada. Usa un template HSM.",
              provider_error: resData,
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.error("Twilio WhatsApp error:", resData);
        }
      } catch (e) {
        console.error("Twilio exception:", e);
      }
    }

    if (isMock) {
      provider = "mock";
      providerMessageId = `MOCK_${crypto.randomUUID()}`;
    }

    // ── PASO 4: INSERT message ──
    const senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
    const messageBody = msgType === "template" ? `[Template: ${template_name}]` : (text || "");

    const { data: msg } = await adminClient
      .from("comm_messages")
      .insert({
        organization_id: orgId,
        thread_id: resolvedThreadId,
        sender_type: "user",
        sender_id: userId,
        sender_name: senderName,
        sender_phone: twilioWaFrom || "mock",
        channel: "whatsapp",
        content_type: msgType === "template" ? "template" : "text",
        body: messageBody,
        template_name: msgType === "template" ? template_name : null,
        template_language: template_language || "es",
        template_params: template_params ? template_params : null,
        status: sendStatus,
        sent_at: sentAt,
        provider_message_id: providerMessageId,
        provider,
        idempotency_key,
      })
      .select("id")
      .single();

    // ── Update thread ──
    const preview = messageBody.substring(0, 120);
    await adminClient
      .from("comm_threads")
      .update({
        last_message_at: sentAt,
        last_message_preview: preview,
        last_message_sender: senderName,
        updated_at: sentAt,
      })
      .eq("id", resolvedThreadId);

    // ── Increment counter ──
    await adminClient.rpc("increment_comm_counter", {
      p_org_id: orgId,
      p_channel: "whatsapp",
    });

    // ── Event ──
    if (msg) {
      await adminClient.from("comm_events").insert({
        organization_id: orgId,
        message_id: msg.id,
        thread_id: resolvedThreadId,
        event_type: "sent",
        event_data: { provider, mock: isMock, to_phone, message_type: msgType, window_open: windowOpen },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        mock: isMock,
        message_id: msg?.id,
        provider_message_id: providerMessageId,
        provider,
        thread_id: resolvedThreadId,
        window_open: windowOpen,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("comm-send-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
