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

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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

    // ── Verify module active ──
    const { data: config } = await adminClient
      .from("comm_tenant_config")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!config?.is_active) {
      return new Response(
        JSON.stringify({ error: "comm_module_not_active" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse body ──
    const body = await req.json();
    const {
      thread_id,
      matter_id,
      crm_account_id,
      crm_contact_id,
      to,
      cc,
      bcc,
      subject,
      body_html,
      body_text,
      template_id,
      template_vars,
      reply_to_message_id,
      is_legally_critical,
      idempotency_key,
    } = body;

    if (!idempotency_key) {
      return new Response(JSON.stringify({ error: "idempotency_key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: "'to' array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PASO 1: Idempotency check ──
    const { data: existing } = await adminClient
      .from("comm_messages")
      .select("id, provider_message_id")
      .eq("organization_id", orgId)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message_id: existing.id, idempotent: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 2: Monthly limit check ──
    const resetNeeded = config.current_month_reset_at
      ? new Date(config.current_month_reset_at) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : true;
    const currentEmails = resetNeeded ? 0 : (config.current_month_emails || 0);

    if (currentEmails >= (config.max_email_per_month || 1000)) {
      return new Response(
        JSON.stringify({ error: "monthly_email_limit_reached", current: currentEmails, max: config.max_email_per_month }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 3: Resolve template if provided ──
    let finalHtml = body_html || "";
    let finalSubject = subject || "";

    if (template_id) {
      const { data: tmpl } = await adminClient
        .from("comm_templates")
        .select("*")
        .eq("id", template_id)
        .eq("organization_id", orgId)
        .single();

      if (tmpl) {
        let tBody = tmpl.body_html || tmpl.body_text || "";
        let tSubject = tmpl.subject || "";
        if (template_vars && typeof template_vars === "object") {
          for (const [k, v] of Object.entries(template_vars)) {
            const re = new RegExp(`\\{\\{${k}\\}\\}`, "g");
            tBody = tBody.replace(re, String(v));
            tSubject = tSubject.replace(re, String(v));
          }
        }
        finalHtml = tBody;
        finalSubject = tSubject || finalSubject;
      }
    }

    // ── PASO 4: Append tenant signature ──
    if (config.email_signature_html) {
      finalHtml += `<br/><br/>${config.email_signature_html}`;
    }

    // ── PASO 5: Content hash for legally critical ──
    let contentHash: string | null = null;
    if (is_legally_critical) {
      const encoder = new TextEncoder();
      const data = encoder.encode(finalHtml);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      contentHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // ── PASO 6: Get or create thread ──
    let resolvedThreadId = thread_id;
    if (!resolvedThreadId) {
      const { data: tid } = await adminClient.rpc("get_or_create_comm_thread", {
        p_org_id: orgId,
        p_channel: "email",
        p_matter_id: matter_id || null,
        p_account_id: crm_account_id || null,
        p_contact_id: crm_contact_id || null,
        p_subject: finalSubject || null,
        p_created_by: userId,
        p_email_thread_id: reply_to_message_id || null,
      });
      resolvedThreadId = tid;
    }

    // ── PASO 7: Determine provider and send ──
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY");

    let providerMessageId: string | null = null;
    let provider = "mock";
    let isMock = true;
    let sendStatus = "sent";
    const sentAt = new Date().toISOString();

    const fromName = config.email_from_name || "IP-NEXUS";
    const fromEmail = config.email_from_address || "noreply@ipnexus.com";
    const replyTo = config.email_reply_to || fromEmail;

    if (resendKey) {
      // ── Resend provider ──
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject: finalSubject,
            html: finalHtml,
            text: body_text || undefined,
            reply_to: replyTo,
            headers: reply_to_message_id
              ? { "In-Reply-To": reply_to_message_id }
              : undefined,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.id) {
          provider = "resend";
          providerMessageId = resData.id;
          isMock = false;
        } else {
          console.error("Resend error:", resData);
          // fallback to SendGrid
        }
      } catch (e) {
        console.error("Resend exception:", e);
      }
    }

    if (isMock && sendgridKey) {
      // ── SendGrid fallback ──
      try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: to.map((e: string) => ({ email: e })) }],
            from: { email: fromEmail, name: fromName },
            subject: finalSubject,
            content: [
              { type: "text/html", value: finalHtml },
              ...(body_text ? [{ type: "text/plain", value: body_text }] : []),
            ],
          }),
        });
        if (res.ok || res.status === 202) {
          provider = "sendgrid";
          providerMessageId = res.headers.get("X-Message-Id") || `sg_${crypto.randomUUID()}`;
          isMock = false;
        } else {
          const errText = await res.text();
          console.error("SendGrid error:", errText);
        }
      } catch (e) {
        console.error("SendGrid exception:", e);
      }
    }

    if (isMock) {
      // ── Mock mode ──
      provider = "mock";
      providerMessageId = `MOCK_${crypto.randomUUID()}`;
      sendStatus = "sent";
    }

    // ── PASO 8: Generate email Message-ID ──
    const emailMessageId = `<${crypto.randomUUID()}@${config.sending_domain || "ipnexus.com"}>`;

    // ── PASO 9: INSERT comm_messages ──
    const senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";

    const { data: msg, error: msgErr } = await adminClient
      .from("comm_messages")
      .insert({
        organization_id: orgId,
        thread_id: resolvedThreadId,
        sender_type: "user",
        sender_id: userId,
        sender_name: senderName,
        sender_email: fromEmail,
        channel: "email",
        content_type: finalHtml ? "html" : "text",
        body: body_text || finalHtml,
        body_html: finalHtml,
        content_hash: contentHash,
        is_legally_critical: is_legally_critical || false,
        status: sendStatus,
        sent_at: sentAt,
        provider_message_id: providerMessageId,
        provider,
        email_message_id: emailMessageId,
        email_in_reply_to: reply_to_message_id || null,
        idempotency_key: idempotency_key,
      })
      .select("id")
      .single();

    if (msgErr) {
      console.error("Insert error:", msgErr);
      return new Response(JSON.stringify({ error: "Failed to save message", detail: msgErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PASO 10: Update thread ──
    const preview = (body_text || finalHtml || "").replace(/<[^>]*>/g, "").substring(0, 120);
    await adminClient
      .from("comm_threads")
      .update({
        last_message_at: sentAt,
        last_message_preview: preview,
        last_message_sender: senderName,
        message_count: (config.message_count || 0) + 1, // approximate, trigger would be better
        updated_at: sentAt,
      })
      .eq("id", resolvedThreadId);

    // ── PASO 11: Increment counter ──
    await adminClient.rpc("increment_comm_counter", {
      p_org_id: orgId,
      p_channel: "email",
    });

    // ── PASO 12: Insert event ──
    await adminClient.from("comm_events").insert({
      organization_id: orgId,
      message_id: msg.id,
      thread_id: resolvedThreadId,
      event_type: "sent",
      event_data: { provider, mock: isMock, to, cc, bcc },
    });

    return new Response(
      JSON.stringify({
        success: true,
        mock: isMock,
        message_id: msg.id,
        provider_message_id: providerMessageId,
        provider,
        thread_id: resolvedThreadId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("comm-send-email error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
