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

    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const db = createClient(supabaseUrl, supabaseServiceKey);

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

    // ── Parse body ──────────────────────────────────────
    const body = await req.json();
    const {
      copilot_visible,
      copilot_position,
      copilot_size,
      guide_dismissed_id,
      briefing_dismissed_date,
      preferred_response_length,
      show_rag_sources,
    } = body as {
      copilot_visible?: boolean;
      copilot_position?: string;
      copilot_size?: string;
      guide_dismissed_id?: string;
      briefing_dismissed_date?: string;
      preferred_response_length?: string;
      show_rag_sources?: boolean;
    };

    // Build the upsert data
    const upsertData: Record<string, unknown> = {
      organization_id: orgId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    const updatedFields: string[] = [];

    if (copilot_visible !== undefined) {
      upsertData.copilot_visible = copilot_visible;
      updatedFields.push("copilot_visible");
    }
    if (copilot_position !== undefined) {
      upsertData.copilot_position = copilot_position;
      updatedFields.push("copilot_position");
    }
    if (copilot_size !== undefined) {
      upsertData.copilot_size = copilot_size;
      updatedFields.push("copilot_size");
    }
    if (preferred_response_length !== undefined) {
      upsertData.preferred_response_length = preferred_response_length;
      updatedFields.push("preferred_response_length");
    }
    if (show_rag_sources !== undefined) {
      upsertData.show_rag_sources = show_rag_sources;
      updatedFields.push("show_rag_sources");
    }

    // First, do basic upsert
    const { error: upsertErr } = await db
      .from("copilot_user_preferences")
      .upsert(upsertData, { onConflict: "organization_id,user_id" });

    if (upsertErr) throw upsertErr;

    // Handle array appends separately
    if (guide_dismissed_id) {
      // Append to guide_dismissed_ids array
      const { data: current } = await db
        .from("copilot_user_preferences")
        .select("guide_dismissed_ids")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .single();

      const currentIds = (current?.guide_dismissed_ids as string[]) || [];
      if (!currentIds.includes(guide_dismissed_id)) {
        const { error } = await db
          .from("copilot_user_preferences")
          .update({
            guide_dismissed_ids: [...currentIds, guide_dismissed_id],
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("organization_id", orgId);
        if (error) throw error;
      }
      updatedFields.push("guide_dismissed_ids");
    }

    if (briefing_dismissed_date) {
      const { data: current } = await db
        .from("copilot_user_preferences")
        .select("briefing_dismissed_dates")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .single();

      const currentDates = (current?.briefing_dismissed_dates as string[]) || [];
      if (!currentDates.includes(briefing_dismissed_date)) {
        const { error } = await db
          .from("copilot_user_preferences")
          .update({
            briefing_dismissed_dates: [...currentDates, briefing_dismissed_date],
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("organization_id", orgId);
        if (error) throw error;
      }
      updatedFields.push("briefing_dismissed_dates");
    }

    return new Response(
      JSON.stringify({ success: true, updated_fields: updatedFields }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("genius-user-prefs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
