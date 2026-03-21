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

  // ── GET: Hub verification (Meta webhook setup) ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = url.searchParams.get("hub.verify_token");

    if (mode === "subscribe" && verifyToken) {
      // Find tenant by verify token
      const { data: config } = await adminClient
        .from("comm_tenant_config")
        .select("organization_id")
        .eq("whatsapp_webhook_verify_token", verifyToken)
        .maybeSingle();

      if (config) {
        return new Response(challenge || "", { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    return new Response("OK", { status: 200 });
  }

  // ── POST: Inbound messages ──
  // RETURN 200 IMMEDIATELY — process async
  try {
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("OK", { status: 200 });
    }

    // ── Verify X-Hub-Signature-256 if present ──
    const signature = req.headers.get("X-Hub-Signature-256");
    if (signature) {
      const whatsappSecret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
      if (whatsappSecret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(whatsappSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
        const computed = "sha256=" + Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (computed !== signature) {
          console.warn("Invalid webhook signature");
          return new Response("OK", { status: 200 }); // Silent
        }
      }
    }

    // ── Process Meta/Twilio formats ──
    // Support both Meta Cloud API and Twilio webhook formats

    // --- TWILIO FORMAT ---
    if (payload.SmsMessageSid || payload.MessageSid || payload.SmsSid) {
      await processTwilioInbound(adminClient, payload);
      return new Response("OK", { status: 200 });
    }

    // --- META CLOUD API FORMAT ---
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "messages") continue;
        const value = change.value;
        if (!value?.messages) continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        // Identify tenant by phone_number_id
        const { data: config } = await adminClient
          .from("comm_tenant_config")
          .select("organization_id, is_active")
          .eq("whatsapp_phone_number_id", phoneNumberId)
          .maybeSingle();

        if (!config?.is_active) continue;
        const orgId = config.organization_id;

        for (const message of value.messages) {
          const metaMessageId = message.id;
          const fromPhone = message.from;
          const timestamp = message.timestamp;
          const msgText = message.text?.body || message.caption || "";
          const msgType = message.type || "text";
          const contactName = value.contacts?.[0]?.profile?.name || fromPhone;

          // Idempotency by Meta message ID
          const idempKey = `wa_in_${metaMessageId}`;
          const { data: exists } = await adminClient
            .from("comm_messages")
            .select("id")
            .eq("organization_id", orgId)
            .eq("idempotency_key", idempKey)
            .maybeSingle();

          if (exists) continue; // Already processed

          // Enqueue for processing
          await adminClient.from("comm_message_queue").insert({
            organization_id: orgId,
            operation: "process_inbound",
            payload: {
              source: "whatsapp_meta",
              from_phone: fromPhone,
              from_name: contactName,
              message_id: metaMessageId,
              text: msgText,
              type: msgType,
              timestamp,
              phone_number_id: phoneNumberId,
            },
            idempotency_key: idempKey,
            priority: 3,
          }).throwOnError();

          // Process inline
          await processWhatsAppMessage(adminClient, orgId, {
            fromPhone,
            fromName: contactName,
            text: msgText,
            type: msgType,
            metaMessageId,
            idempKey,
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("comm-whatsapp-inbound error:", err);
    return new Response("OK", { status: 200 }); // Always 200
  }
});

async function processTwilioInbound(adminClient: any, payload: any) {
  const fromPhone = payload.From?.replace("whatsapp:", "") || "";
  const toPhone = payload.To?.replace("whatsapp:", "") || "";
  const msgBody = payload.Body || "";
  const msgSid = payload.MessageSid || payload.SmsMessageSid || "";
  const fromName = payload.ProfileName || fromPhone;

  // Identify tenant by To number
  const { data: config } = await adminClient
    .from("comm_tenant_config")
    .select("organization_id, is_active")
    .eq("whatsapp_phone_number_id", toPhone)
    .maybeSingle();

  if (!config?.is_active) return;
  const orgId = config.organization_id;

  const idempKey = `wa_twilio_${msgSid}`;
  const { data: exists } = await adminClient
    .from("comm_messages")
    .select("id")
    .eq("organization_id", orgId)
    .eq("idempotency_key", idempKey)
    .maybeSingle();

  if (exists) return;

  await processWhatsAppMessage(adminClient, orgId, {
    fromPhone,
    fromName,
    text: msgBody,
    type: "text",
    metaMessageId: msgSid,
    idempKey,
  });
}

async function processWhatsAppMessage(
  adminClient: any,
  orgId: string,
  msg: {
    fromPhone: string;
    fromName: string;
    text: string;
    type: string;
    metaMessageId: string;
    idempKey: string;
  }
) {
  // Resolve identity
  const { data: identity } = await adminClient
    .from("comm_identity_map")
    .select("crm_contact_id, crm_account_id")
    .eq("organization_id", orgId)
    .filter("phone_numbers", "cs", `{${msg.fromPhone}}`)
    .maybeSingle();

  // Get or create thread
  const { data: threadId } = await adminClient.rpc("get_or_create_comm_thread", {
    p_org_id: orgId,
    p_channel: "whatsapp",
    p_account_id: identity?.crm_account_id || null,
    p_contact_id: identity?.crm_contact_id || null,
    p_subject: `WhatsApp ${msg.fromPhone}`,
  });

  // Insert message
  const { data: inserted } = await adminClient
    .from("comm_messages")
    .insert({
      organization_id: orgId,
      thread_id: threadId,
      sender_type: "contact",
      sender_name: msg.fromName,
      sender_phone: msg.fromPhone,
      channel: "whatsapp",
      content_type: msg.type === "text" ? "text" : msg.type,
      body: msg.text,
      status: "delivered",
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      provider: "inbound",
      provider_message_id: msg.metaMessageId,
      idempotency_key: msg.idempKey,
    })
    .select("id")
    .single();

  // Update thread
  if (threadId) {
    const { data: thread } = await adminClient
      .from("comm_threads")
      .select("message_count, unread_count")
      .eq("id", threadId)
      .single();

    await adminClient
      .from("comm_threads")
      .update({
        message_count: (thread?.message_count || 0) + 1,
        unread_count: (thread?.unread_count || 0) + 1,
        last_message_at: new Date().toISOString(),
        last_message_preview: msg.text.substring(0, 120),
        last_message_sender: msg.fromName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);
  }

  // Event
  if (inserted) {
    await adminClient.from("comm_events").insert({
      organization_id: orgId,
      message_id: inserted.id,
      thread_id: threadId,
      event_type: "delivered",
      event_data: { from_phone: msg.fromPhone, type: msg.type },
    });
  }
}
