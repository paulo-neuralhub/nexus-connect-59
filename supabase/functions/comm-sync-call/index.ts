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

    // ── Parse body: optional cdr_id for single sync, or batch mode ──
    const body = await req.json().catch(() => ({}));
    const singleCdrId = body.cdr_id;
    const batchLimit = body.batch_limit || 100;

    // ── Get CDRs without comm_messages ──
    let query = adminClient
      .from("telephony_cdrs")
      .select("id, organization_id, provider_call_sid, from_number, to_number, direction, duration_seconds, status, recording_url, recording_stored_path, crm_account_id, crm_contact_id, matter_id, user_id, created_at")
      .eq("organization_id", orgId)
      .in("status", ["completed", "busy", "no-answer", "canceled", "failed"]);

    if (singleCdrId) {
      query = query.eq("id", singleCdrId);
    }

    const { data: cdrs, error: cdrErr } = await query
      .order("created_at", { ascending: false })
      .limit(batchLimit);

    if (cdrErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch CDRs", detail: cdrErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!cdrs || cdrs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No CDRs to sync" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Filter out CDRs already synced ──
    const cdrIds = cdrs.map((c: any) => c.id);
    const { data: existingMsgs } = await adminClient
      .from("comm_messages")
      .select("telephony_cdr_id")
      .eq("organization_id", orgId)
      .in("telephony_cdr_id", cdrIds);

    const alreadySynced = new Set((existingMsgs || []).map((m: any) => m.telephony_cdr_id));
    const toSync = cdrs.filter((c: any) => !alreadySynced.has(c.id));

    let synced = 0;
    const errors: string[] = [];

    for (const cdr of toSync) {
      try {
        // Get or create thread
        const { data: threadId } = await adminClient.rpc("get_or_create_comm_thread", {
          p_org_id: orgId,
          p_channel: "call",
          p_matter_id: cdr.matter_id || null,
          p_account_id: cdr.crm_account_id || null,
          p_contact_id: cdr.crm_contact_id || null,
          p_subject: `Llamada ${cdr.direction === "outbound" ? "a" : "de"} ${cdr.direction === "outbound" ? cdr.to_number : cdr.from_number}`,
          p_created_by: cdr.user_id || userId,
        });

        // Format duration
        const mins = Math.floor((cdr.duration_seconds || 0) / 60);
        const secs = (cdr.duration_seconds || 0) % 60;
        const durationStr = `${mins}:${String(secs).padStart(2, "0")}`;

        // Determine sender
        const isOutbound = cdr.direction === "outbound";
        const senderType = isOutbound ? "user" : "contact";
        const senderName = isOutbound
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"
          : cdr.from_number || "Llamada entrante";

        const bodyText = `📞 Llamada ${isOutbound ? "saliente" : "entrante"} — ${durationStr} — Estado: ${cdr.status}`;

        // Insert comm_message
        const { data: msg } = await adminClient
          .from("comm_messages")
          .insert({
            organization_id: orgId,
            thread_id: threadId,
            sender_type: senderType,
            sender_id: isOutbound ? (cdr.user_id || userId) : null,
            sender_name: senderName,
            sender_phone: isOutbound ? cdr.from_number : cdr.from_number,
            channel: "call",
            content_type: "call_record",
            body: bodyText,
            status: "delivered",
            sent_at: cdr.created_at,
            delivered_at: cdr.created_at,
            provider: "telephony",
            provider_message_id: cdr.provider_call_sid,
            telephony_cdr_id: cdr.id,
            idempotency_key: `call_sync_${cdr.id}`,
          })
          .select("id")
          .single();

        // Update thread
        if (threadId) {
          await adminClient
            .from("comm_threads")
            .update({
              last_message_at: cdr.created_at,
              last_message_preview: bodyText.substring(0, 120),
              last_message_sender: senderName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", threadId);
        }

        // Event
        if (msg) {
          await adminClient.from("comm_events").insert({
            organization_id: orgId,
            message_id: msg.id,
            thread_id: threadId,
            event_type: "sent",
            event_data: {
              source: "telephony_sync",
              cdr_id: cdr.id,
              direction: cdr.direction,
              duration: cdr.duration_seconds,
              status: cdr.status,
              has_recording: !!(cdr.recording_url || cdr.recording_stored_path),
            },
          });
        }

        synced++;
      } catch (e) {
        errors.push(`CDR ${cdr.id}: ${String(e)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        skipped: alreadySynced.size,
        total_cdrs: cdrs.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("comm-sync-call error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
