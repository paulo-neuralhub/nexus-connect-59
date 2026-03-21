// ============================================================
// IP-NEXUS — telephony-webhook
// Public endpoint receiving events from Telnyx / Twilio / Plivo
// verify_jwt = false (public webhook)
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Return 200 immediately for webhook reliability — process async
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || "telnyx";
  const action = url.searchParams.get("action");

  // For TwiML answer URL, return voice XML immediately
  if (action === "twiml") {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${url.searchParams.get("from") || ""}">
    <Number>${url.searchParams.get("to") || ""}</Number>
  </Dial>
</Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }

  // For Plivo answer URL
  if (action === "answer") {
    return new Response(
      `<Response><Dial><Number>${url.searchParams.get("to") || ""}</Number></Dial></Response>`,
      { status: 200, headers: { "Content-Type": "application/xml" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    let body: Record<string, unknown>;

    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    } else {
      body = await req.json().catch(() => ({}));
    }

    console.log(`[telephony-webhook] Provider: ${provider}, Body keys:`, Object.keys(body));

    // ── Route to provider-specific handler ──
    if (provider === "telnyx") {
      await handleTelnyxEvent(adminClient, body);
    } else if (provider === "twilio") {
      await handleTwilioEvent(adminClient, body);
    } else if (provider === "plivo") {
      await handlePlivoEvent(adminClient, body);
    } else {
      console.warn(`[telephony-webhook] Unknown provider: ${provider}`);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error("[telephony-webhook] Error processing webhook:", err);
    // Still return 200 to prevent CPaaS retries
    return jsonResponse({ received: true, error: "processing_failed" });
  }
});

// ============================================================
// TELNYX EVENT HANDLER
// ============================================================
async function handleTelnyxEvent(
  db: ReturnType<typeof createClient>,
  rawBody: Record<string, unknown>
) {
  // Telnyx sends nested: { data: { event_type, payload: { ... } } }
  const data = (rawBody.data as Record<string, unknown>) || rawBody;
  const eventType = (data.event_type as string) || "";
  const payload = (data.payload as Record<string, unknown>) || data;

  const callSid =
    (payload.call_control_id as string) ||
    (payload.call_session_id as string) ||
    "";

  if (!callSid) {
    console.warn("[telnyx] No call_control_id in event:", eventType);
    return;
  }

  console.log(`[telnyx] Event: ${eventType}, CallSid: ${callSid}`);

  if (eventType === "call.initiated" || eventType === "call.dial.started") {
    await updateCdrStatus(db, callSid, "initiated", "telnyx");
  } else if (eventType === "call.answered") {
    await updateCdrStatus(db, callSid, "in-progress", "telnyx", { answered_at: new Date().toISOString() });
  } else if (eventType === "call.hangup" || eventType === "call.machine.detection.ended") {
    const durationSecs = Number(payload.duration_secs || payload.call_duration_secs || 0);
    await handleCallCompleted(db, callSid, "telnyx", durationSecs, payload);
  } else if (eventType === "call.recording.saved") {
    const recordingUrl = payload.recording_urls as Record<string, string>;
    const mp3Url = recordingUrl?.mp3 || (payload.public_recording_urls as Record<string, string>)?.mp3;
    if (mp3Url) {
      await db
        .from("telephony_cdrs")
        .update({
          recording_url: mp3Url,
          recording_duration_seconds: Number(payload.duration_secs || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("provider_call_sid", callSid);
    }
  }
}

// ============================================================
// TWILIO EVENT HANDLER
// ============================================================
async function handleTwilioEvent(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>
) {
  const callSid = (body.CallSid as string) || "";
  const callStatus = (body.CallStatus as string) || "";

  if (!callSid) {
    console.warn("[twilio] No CallSid in webhook");
    return;
  }

  console.log(`[twilio] Status: ${callStatus}, CallSid: ${callSid}`);

  const statusMap: Record<string, string> = {
    queued: "initiated",
    initiated: "initiated",
    ringing: "ringing",
    "in-progress": "in-progress",
    completed: "completed",
    failed: "failed",
    busy: "busy",
    "no-answer": "no-answer",
    canceled: "canceled",
  };

  const mappedStatus = statusMap[callStatus] || callStatus;

  if (callStatus === "in-progress") {
    await updateCdrStatus(db, callSid, mappedStatus, "twilio", {
      answered_at: new Date().toISOString(),
    });
  } else if (callStatus === "completed") {
    const durationSecs = Number(body.CallDuration || body.Duration || 0);
    await handleCallCompleted(db, callSid, "twilio", durationSecs, body);
  } else if (["failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
    await updateCdrStatus(db, callSid, mappedStatus, "twilio", {
      ended_at: new Date().toISOString(),
    });
    await createCallActivity(db, callSid, mappedStatus);
  } else {
    await updateCdrStatus(db, callSid, mappedStatus, "twilio");
  }

  // Handle recording URL if present
  const recordingUrl = body.RecordingUrl as string;
  if (recordingUrl) {
    await db
      .from("telephony_cdrs")
      .update({
        recording_url: recordingUrl + ".mp3",
        recording_duration_seconds: Number(body.RecordingDuration || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("provider_call_sid", callSid);
  }
}

// ============================================================
// PLIVO EVENT HANDLER
// ============================================================
async function handlePlivoEvent(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>
) {
  const callSid = (body.CallUUID as string) || (body.RequestUUID as string) || "";
  const callStatus = (body.CallStatus as string) || (body.Status as string) || "";

  if (!callSid) {
    console.warn("[plivo] No CallUUID in webhook");
    return;
  }

  console.log(`[plivo] Status: ${callStatus}, CallSid: ${callSid}`);

  const statusMap: Record<string, string> = {
    ring: "ringing",
    answer: "in-progress",
    hangup: "completed",
    cancel: "canceled",
    busy: "busy",
    timeout: "no-answer",
    failed: "failed",
  };

  const mappedStatus = statusMap[callStatus] || callStatus;

  if (callStatus === "answer") {
    await updateCdrStatus(db, callSid, "in-progress", "plivo", {
      answered_at: new Date().toISOString(),
    });
  } else if (callStatus === "hangup") {
    const durationSecs = Number(body.Duration || body.BillDuration || 0);
    await handleCallCompleted(db, callSid, "plivo", durationSecs, body);
  } else if (["cancel", "busy", "timeout", "failed"].includes(callStatus)) {
    await updateCdrStatus(db, callSid, mappedStatus, "plivo", {
      ended_at: new Date().toISOString(),
    });
    await createCallActivity(db, callSid, mappedStatus);
  } else {
    await updateCdrStatus(db, callSid, mappedStatus, "plivo");
  }
}

// ============================================================
// SHARED HELPERS
// ============================================================

async function updateCdrStatus(
  db: ReturnType<typeof createClient>,
  callSid: string,
  status: string,
  _providerCode: string,
  extraFields: Record<string, unknown> = {}
) {
  const { error } = await db
    .from("telephony_cdrs")
    .update({ status, ...extraFields, updated_at: new Date().toISOString() })
    .eq("provider_call_sid", callSid);

  if (error) {
    console.error(`[webhook] Failed to update CDR ${callSid}:`, error);
  }
}

async function handleCallCompleted(
  db: ReturnType<typeof createClient>,
  callSid: string,
  providerCode: string,
  durationSeconds: number,
  _rawPayload: Record<string, unknown>
) {
  const billableMinutes = Math.ceil(durationSeconds / 60);

  // Update CDR
  const { data: cdr, error: cdrErr } = await db
    .from("telephony_cdrs")
    .update({
      status: "completed",
      duration_seconds: durationSeconds,
      billable_minutes: billableMinutes,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("provider_call_sid", callSid)
    .select("*")
    .maybeSingle();

  if (cdrErr || !cdr) {
    console.error(`[webhook] CDR update failed for ${callSid}:`, cdrErr);
    return;
  }

  // ── Charge the call using the SQL function ──
  if (durationSeconds > 0 && cdr.organization_id) {
    // Find the matching rate prefix from metadata or destination
    const metadata = (cdr.provider_metadata as Record<string, unknown>) || {};
    const ratePrefix = (metadata.rate_prefix as string) || extractSimplePrefix(cdr.to_number);

    const { data: chargeResult, error: chargeErr } = await db.rpc("charge_call", {
      p_org_id: cdr.organization_id,
      p_call_sid: callSid,
      p_duration_seconds: durationSeconds,
      p_destination_prefix: ratePrefix,
      p_number_type: "landline",
    });

    if (chargeErr) {
      console.error(`[webhook] charge_call failed for ${callSid}:`, chargeErr);
    } else {
      console.log(`[webhook] Call charged:`, chargeResult);

      // Update CDR with billed amounts
      const result = chargeResult as Record<string, unknown>;
      if (result?.success) {
        await db
          .from("telephony_cdrs")
          .update({
            billed_amount: result.charged as number,
            provider_cost: result.provider_cost as number,
          })
          .eq("provider_call_sid", callSid);
      }
    }
  }

  // ── Create CRM activity for the call ──
  await createCallActivity(db, callSid, "completed", cdr);
}

function extractSimplePrefix(number: string): string {
  if (!number || !number.startsWith("+")) return "+";
  // Try common prefixes
  for (const len of [4, 3, 2]) {
    return number.substring(0, 1 + len);
  }
  return "+";
}

async function createCallActivity(
  db: ReturnType<typeof createClient>,
  callSid: string,
  status: string,
  cdr?: Record<string, unknown>
) {
  // Fetch CDR if not passed
  if (!cdr) {
    const { data } = await db
      .from("telephony_cdrs")
      .select("*")
      .eq("provider_call_sid", callSid)
      .maybeSingle();
    cdr = data ?? undefined;
  }

  if (!cdr || !cdr.organization_id) return;

  // Only create activity if linked to a CRM account
  if (!cdr.crm_account_id) return;

  const durationMins = Math.ceil((cdr.duration_seconds as number || 0) / 60);
  const statusLabel =
    status === "completed"
      ? "Completada"
      : status === "busy"
        ? "Ocupado"
        : status === "no-answer"
          ? "Sin respuesta"
          : status === "failed"
            ? "Fallida"
            : status === "canceled"
              ? "Cancelada"
              : status;

  const description =
    status === "completed"
      ? `Llamada ${cdr.direction} completada — ${durationMins} min — ${cdr.to_number}`
      : `Llamada ${cdr.direction} — ${statusLabel} — ${cdr.to_number}`;

  try {
    const { error } = await db.from("crm_activities").insert({
      organization_id: cdr.organization_id,
      account_id: cdr.crm_account_id,
      contact_id: cdr.crm_contact_id || null,
      deal_id: cdr.crm_deal_id || null,
      type: "call",
      subject: `📞 Llamada ${cdr.direction === "outbound" ? "saliente" : "entrante"} — ${statusLabel}`,
      description,
      outcome: statusLabel,
      user_id: cdr.user_id || null,
      metadata: {
        call_sid: callSid,
        cdr_id: cdr.id,
        duration_seconds: cdr.duration_seconds,
        from_number: cdr.from_number,
        to_number: cdr.to_number,
        provider: cdr.provider_code,
        recording_url: cdr.recording_url || null,
      },
    });

    if (error) {
      console.error("[webhook] Failed to create CRM activity:", error);
    }
  } catch (err) {
    console.error("[webhook] Activity creation error:", err);
  }
}
