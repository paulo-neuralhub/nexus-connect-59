import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Validate JWT
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

    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile + org
    const { data: profile } = await db
      .from("profiles")
      .select("id, organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;
    const { message_id, matter_id, decision } = await req.json();

    if (!message_id || !matter_id || !decision) {
      return new Response(JSON.stringify({ error: "message_id, matter_id, decision required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["indexed", "rejected"].includes(decision)) {
      return new Response(JSON.stringify({ error: "decision must be 'indexed' or 'rejected'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 1: Verify message belongs to org
    const { data: msg, error: msgErr } = await db
      .from("internal_messages")
      .select("id, organization_id, content, sender_id, channel_id")
      .eq("id", message_id)
      .eq("organization_id", orgId)
      .single();

    if (msgErr || !msg) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 2: Verify matter belongs to org
    const { data: matter, error: mErr } = await db
      .from("matters")
      .select("id, organization_id, reference, title")
      .eq("id", matter_id)
      .eq("organization_id", orgId)
      .single();

    if (mErr || !matter) {
      return new Response(JSON.stringify({ error: "Matter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 3: Update message
    const updateData: Record<string, unknown> = {
      user_indexing_decision: decision,
    };

    if (decision === "indexed") {
      updateData.indexed_to_matter_id = matter_id;
      updateData.indexed_at = new Date().toISOString();
      updateData.indexed_by = user.id;
    }

    await db.from("internal_messages").update(updateData).eq("id", message_id);

    let timelineEventId: string | null = null;

    // PASO 4: If indexed → create timeline event
    if (decision === "indexed") {
      // Get sender name
      const { data: sender } = await db
        .from("profiles")
        .select("full_name")
        .eq("id", msg.sender_id)
        .single();

      // Get channel name
      const { data: channel } = await db
        .from("internal_channels")
        .select("name")
        .eq("id", msg.channel_id)
        .single();

      const { data: evt, error: evtErr } = await db
        .from("matter_timeline_events")
        .insert({
          organization_id: orgId,
          matter_id,
          event_type: "internal_note",
          title: "Nota interna del equipo",
          description: msg.content.length > 150 ? msg.content.slice(0, 150) + "…" : msg.content,
          source_table: "internal_messages",
          source_id: message_id,
          actor_id: user.id,
          actor_type: "staff",
          is_internal: true,
          is_visible_in_portal: false, // NUNCA visible al cliente
          metadata: {
            sender_name: sender?.full_name || "Desconocido",
            channel_name: channel?.name || "Canal",
            full_content: msg.content,
          },
        })
        .select("id")
        .single();

      if (evtErr) {
        console.error("Timeline event insert error:", evtErr);
      } else {
        timelineEventId = evt?.id || null;
      }
    }

    // PASO 5: If rejected → only the message update above

    return new Response(
      JSON.stringify({
        success: true,
        decision,
        timeline_event_id: timelineEventId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("internal-chat-index error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
