import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // ── Auth ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get org_id
    const { data: profile } = await db
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profile.organization_id;

    // Parse body
    const body = await req.json();
    const {
      event_type,
      page_url,
      matter_id,
      crm_account_id,
      invoice_id,
      suggestion_id,
      event_data,
      session_id,
    } = body as {
      event_type: string;
      page_url?: string;
      matter_id?: string;
      crm_account_id?: string;
      invoice_id?: string;
      suggestion_id?: string;
      event_data?: Record<string, unknown>;
      session_id?: string;
    };

    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check learning_enabled
    const { data: prefs } = await db
      .from("copilot_user_preferences")
      .select("learning_enabled")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (prefs && prefs.learning_enabled === false) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "learning_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Respond immediately — fire-and-forget inserts below
    // Use EdgeRuntime.waitUntil if available, otherwise just fire promises
    const insertPromise = db
      .from("copilot_context_events")
      .insert({
        organization_id: orgId,
        user_id: userId,
        event_type,
        page_url: page_url || null,
        matter_id: matter_id || null,
        crm_account_id: crm_account_id || null,
        invoice_id: invoice_id || null,
        suggestion_id: suggestion_id || null,
        event_data: event_data || {},
        session_id: session_id || null,
      })
      .then(({ error }) => {
        if (error) console.error("copilot-track insert error:", error.message);
      });

    // Handle suggestion actions
    let suggestionPromise: Promise<void> | null = null;

    if (event_type === "suggestion_acted" && suggestion_id) {
      suggestionPromise = db
        .from("copilot_suggestions")
        .update({
          acted_at: new Date().toISOString(),
          action_taken: (event_data as any)?.action || "primary",
        })
        .eq("id", suggestion_id)
        .then(({ error }) => {
          if (error) console.error("copilot-track suggestion update error:", error.message);
        });
    } else if (event_type === "suggestion_dismissed" && suggestion_id) {
      suggestionPromise = db
        .from("copilot_suggestions")
        .update({
          dismissed_at: new Date().toISOString(),
          action_taken: "dismissed",
        })
        .eq("id", suggestion_id)
        .then(({ error }) => {
          if (error) console.error("copilot-track suggestion dismiss error:", error.message);
        });
    }

    // Use EdgeRuntime.waitUntil if available for true fire-and-forget
    const waitUntil = (globalThis as any).EdgeRuntime?.waitUntil;
    if (waitUntil) {
      waitUntil(insertPromise);
      if (suggestionPromise) waitUntil(suggestionPromise);
    } else {
      // Fallback: don't await, just let them run
      insertPromise.catch(() => {});
      suggestionPromise?.catch(() => {});
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("copilot-track error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
