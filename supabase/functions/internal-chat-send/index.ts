import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-app-context, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth validation
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for DB ops
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile + org
    const { data: profile } = await db
      .from("profiles")
      .select("id, organization_id, full_name, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;

    const {
      channel_id,
      content,
      content_type = "text",
      attachments = [],
      referenced_matter_id,
      referenced_invoice_id,
      referenced_deadline_id,
    } = await req.json();

    if (!channel_id || !content) {
      return new Response(JSON.stringify({ error: "channel_id and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 1: Verify channel belongs to org
    const { data: channel, error: chErr } = await db
      .from("internal_channels")
      .select("id, organization_id, name")
      .eq("id", channel_id)
      .eq("organization_id", orgId)
      .single();

    if (chErr || !channel) {
      return new Response(JSON.stringify({ error: "Channel not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 3: Parse app_context from header
    let appContext: Record<string, unknown> = {};
    const appContextHeader = req.headers.get("X-App-Context");
    if (appContextHeader) {
      try {
        appContext = JSON.parse(appContextHeader);
      } catch { /* ignore */ }
    }

    // PASO 4: Detect mentions (@nombre)
    const mentionRegex = /@(\w[\w\s]{1,30})/g;
    const mentionMatches = content.match(mentionRegex) || [];
    const mentionUserIds: string[] = [];

    if (mentionMatches.length > 0) {
      const names = mentionMatches.map((m: string) => m.slice(1).trim().toLowerCase());
      const { data: mentionedProfiles } = await db
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", orgId)
        .in("full_name", names); // simplified — case-insensitive search would be better

      // Also try ilike for partial matches
      for (const name of names) {
        const { data: found } = await db
          .from("profiles")
          .select("id")
          .eq("organization_id", orgId)
          .ilike("full_name", `%${name}%`)
          .limit(1);
        if (found?.[0] && !mentionUserIds.includes(found[0].id)) {
          mentionUserIds.push(found[0].id);
        }
      }

      if (mentionedProfiles) {
        for (const p of mentionedProfiles) {
          if (!mentionUserIds.includes(p.id)) mentionUserIds.push(p.id);
        }
      }
    }

    // PASO 5: INSERT message
    const { data: msg, error: msgErr } = await db
      .from("internal_messages")
      .insert({
        organization_id: orgId,
        channel_id,
        sender_id: user.id,
        sender_role_snapshot: profile.role || "member",
        content,
        content_type,
        attachments,
        mentions: mentionUserIds,
        referenced_matter_id: referenced_matter_id || null,
        referenced_invoice_id: referenced_invoice_id || null,
        referenced_deadline_id: referenced_deadline_id || null,
        ai_classification: "pending_classification",
        user_indexing_decision: "not_applicable",
        app_context: appContext,
      })
      .select("id, created_at")
      .single();

    if (msgErr) {
      console.error("Insert message error:", msgErr);
      return new Response(JSON.stringify({ error: "Failed to send message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 6: Update channel stats
    await db
      .from("internal_channels")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (channel as any).message_count ? (channel as any).message_count + 1 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", channel_id);

    // Use RPC-style increment instead
    await db.rpc("increment_channel_message_count" as any, { p_channel_id: channel_id }).catch(() => {
      // Fallback — function may not exist yet, raw update already done above
    });

    // PASO 7: Notifications for mentions
    for (const mentionedId of mentionUserIds) {
      if (mentionedId === user.id) continue; // don't notify self
      await db.from("staff_notifications").insert({
        organization_id: orgId,
        user_id: mentionedId,
        type: "mention",
        title: `${profile.full_name || "Alguien"} te mencionó`,
        body: content.length > 100 ? content.slice(0, 100) + "…" : content,
        icon: "MessageSquare",
        link: `/app/communications/internal?channel=${channel_id}`,
        priority: "high",
        source_type: "internal_messages",
        source_id: msg.id,
      });
    }

    // PASO 8: Async call to classifier (only if >10 words)
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 10) {
      // Fire-and-forget
      fetch(`${supabaseUrl}/functions/v1/internal-chat-classifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ message_id: msg.id }),
      }).catch((e) => console.error("Classifier call failed (non-blocking):", e));
    }

    // PASO 9: Mark sender as read
    await db.from("internal_message_reads").insert({
      organization_id: orgId,
      message_id: msg.id,
      user_id: user.id,
    }).catch(() => { /* ignore duplicate */ });

    return new Response(
      JSON.stringify({ message_id: msg.id, created_at: msg.created_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("internal-chat-send error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
