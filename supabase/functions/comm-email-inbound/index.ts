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

  // PUBLIC endpoint — receives inbound from Resend/SendGrid webhooks
  // Return 200 immediately, process async via queue

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();

    // ── Extract email fields ──
    // Support both Resend and SendGrid inbound parse formats
    const fromEmail = body.from || body.envelope?.from || body.sender_email || "";
    const toAddresses: string[] = Array.isArray(body.to)
      ? body.to
      : typeof body.to === "string"
      ? [body.to]
      : body.envelope?.to || [];
    const subject = body.subject || "(sin asunto)";
    const htmlBody = body.html || body.body_html || "";
    const textBody = body.text || body.body_text || "";
    const inReplyTo = body.headers?.["In-Reply-To"] || body.in_reply_to || null;
    const references = body.headers?.["References"] || body.references || null;
    const messageId = body.headers?.["Message-ID"] || body.message_id || null;
    const fromName = body.from_name || fromEmail.split("@")[0] || "Unknown";

    // ── Identify tenant by destination address ──
    // Pattern: {slug}@in.ipnexus.com or tenant's configured email
    let orgId: string | null = null;

    for (const toAddr of toAddresses) {
      const emailLower = (typeof toAddr === "string" ? toAddr : toAddr?.email || "").toLowerCase();

      // Try matching by tenant's configured email
      const { data: configMatch } = await adminClient
        .from("comm_tenant_config")
        .select("organization_id")
        .eq("email_from_address", emailLower)
        .maybeSingle();

      if (configMatch) {
        orgId = configMatch.organization_id;
        break;
      }

      // Try matching by organization slug from email prefix
      const slugMatch = emailLower.match(/^([^@]+)@/);
      if (slugMatch) {
        const { data: orgMatch } = await adminClient
          .from("organizations")
          .select("id")
          .eq("slug", slugMatch[1])
          .maybeSingle();
        if (orgMatch) {
          orgId = orgMatch.id;
          break;
        }
      }
    }

    if (!orgId) {
      // Silent 200 — don't reveal tenant existence
      console.log("Inbound email: no tenant matched for", toAddresses);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify module active ──
    const { data: config } = await adminClient
      .from("comm_tenant_config")
      .select("is_active")
      .eq("organization_id", orgId)
      .single();

    if (!config?.is_active) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Enqueue for async processing ──
    const idempotencyKey = messageId || `inbound_${crypto.randomUUID()}`;

    await adminClient.from("comm_message_queue").insert({
      organization_id: orgId,
      operation: "process_inbound",
      payload: {
        from_email: fromEmail,
        from_name: fromName,
        to: toAddresses,
        subject,
        body_html: htmlBody,
        body_text: textBody,
        in_reply_to: inReplyTo,
        references,
        message_id: messageId,
      },
      idempotency_key: idempotencyKey,
      priority: 3, // higher priority for inbound
    }).throwOnError();

    // ── Also process inline for immediate visibility ──
    // (queue processor would handle retries, but we do inline too)

    // Resolve sender identity
    const { data: identity } = await adminClient
      .from("comm_identity_map")
      .select("crm_contact_id, crm_account_id")
      .eq("organization_id", orgId)
      .filter("email_addresses", "cs", `{${fromEmail.toLowerCase()}}`)
      .maybeSingle();

    // Auto-index to matter
    let matterId: string | null = null;
    let accountId: string | null = identity?.crm_account_id || null;
    let contactId: string | null = identity?.crm_contact_id || null;
    let indexingConfidence = "none";

    // Strategy 1: Reference number in subject
    const refMatch = subject.match(/\[([A-Z]+-\d{4}-\d+)\]/);
    if (refMatch) {
      const { data: matterMatch } = await adminClient
        .from("matters")
        .select("id")
        .eq("organization_id", orgId)
        .eq("reference_number", refMatch[1])
        .maybeSingle();
      if (matterMatch) {
        matterId = matterMatch.id;
        indexingConfidence = "high";
      }
    }

    // Strategy 2: Identity map has account → get recent matter
    if (!matterId && accountId) {
      const { data: recentMatter } = await adminClient
        .from("matters")
        .select("id")
        .eq("organization_id", orgId)
        .eq("client_id", accountId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentMatter) {
        matterId = recentMatter.id;
        indexingConfidence = "low";
      }
    }

    // Get or create thread
    const { data: threadId } = await adminClient.rpc("get_or_create_comm_thread", {
      p_org_id: orgId,
      p_channel: "email",
      p_matter_id: matterId,
      p_account_id: accountId,
      p_contact_id: contactId,
      p_subject: subject,
      p_email_thread_id: inReplyTo || messageId,
    });

    // Update thread indexing confidence
    if (threadId) {
      await adminClient
        .from("comm_threads")
        .update({
          auto_indexed: matterId !== null,
          indexing_confidence: indexingConfidence,
        })
        .eq("id", threadId);
    }

    // Insert message
    const preview = (textBody || htmlBody.replace(/<[^>]*>/g, "")).substring(0, 120);

    const { data: msg } = await adminClient
      .from("comm_messages")
      .insert({
        organization_id: orgId,
        thread_id: threadId,
        sender_type: "contact",
        sender_name: fromName,
        sender_email: fromEmail,
        channel: "email",
        content_type: htmlBody ? "html" : "text",
        body: textBody || htmlBody,
        body_html: htmlBody || null,
        status: "delivered",
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        provider: "inbound",
        email_message_id: messageId,
        email_in_reply_to: inReplyTo,
        email_references: references ? (Array.isArray(references) ? references : references.split(/\s+/)) : null,
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    // Update thread counters
    if (threadId) {
      // Use raw SQL-like approach via RPC or direct update
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
          last_message_preview: preview,
          last_message_sender: fromName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);
    }

    // Update queue status
    await adminClient
      .from("comm_message_queue")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("organization_id", orgId)
      .eq("idempotency_key", idempotencyKey);

    // Insert event
    if (msg) {
      await adminClient.from("comm_events").insert({
        organization_id: orgId,
        message_id: msg.id,
        thread_id: threadId,
        event_type: "delivered",
        event_data: { from: fromEmail, subject, indexing_confidence: indexingConfidence },
      });
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("comm-email-inbound error:", err);
    // Always return 200 to prevent webhook retries
    return new Response(JSON.stringify({ received: true, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
