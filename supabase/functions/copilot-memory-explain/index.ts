import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Fallback: generate plain-language explanations without LLM ──
function generateFallbackExplanations(
  patterns: any[],
  writingStyles: any[]
): string[] {
  const explanations: string[] = [];

  for (const p of patterns) {
    switch (p.pattern_type) {
      case "work_schedule": {
        const hours = p.pattern_data?.peak_hours;
        if (hours?.length) {
          explanations.push(
            `Sueles estar más activo/a a las ${hours.map((h: number) => `${h}:00`).join(", ")}.`
          );
        }
        break;
      }
      case "priority_behavior": {
        const first = p.pattern_data?.checks_first;
        if (first) {
          const labels: Record<string, string> = {
            deadline_viewed: "los plazos",
            matter_opened: "los expedientes",
            spider_alert_viewed: "las alertas Spider",
            invoice_viewed: "las facturas",
            page_view: "el dashboard",
          };
          explanations.push(
            `Cuando inicias sesión, lo primero que revisas suelen ser ${labels[first] || first}.`
          );
        }
        break;
      }
      case "communication_preference":
        explanations.push("He observado tus preferencias de comunicación con clientes.");
        break;
      case "decision_tendency":
        explanations.push("He registrado tus tendencias en decisiones legales recientes.");
        break;
      case "tool_preference":
        explanations.push("Conozco qué herramientas de la plataforma usas más frecuentemente.");
        break;
      case "response_speed":
        explanations.push("He medido tu velocidad de respuesta habitual a diferentes tipos de tareas.");
        break;
    }
  }

  for (const ws of writingStyles) {
    const tone = ws.style_profile?.tone;
    const lang = ws.style_profile?.language;
    if (tone != null) {
      const toneLabel = tone >= 7 ? "formal" : tone >= 4 ? "neutro" : "informal";
      explanations.push(
        `En ${ws.context_type === "client_email" ? "emails a clientes" : ws.context_type}, tu tono es ${toneLabel} (${tone}/10)${lang ? ` y escribes en ${lang === "es" ? "español" : lang}` : ""}.`
      );
    }
  }

  return explanations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

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

    const { data: profileData } = await db
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profileData?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profileData.organization_id;

    // PASO 1: User patterns
    const { data: userPatterns } = await db
      .from("copilot_user_patterns")
      .select("pattern_type, pattern_data, confidence_score, sample_size")
      .eq("user_id", userId)
      .eq("organization_id", orgId);

    // PASO 2: Writing memory
    const { data: writingStyles } = await db
      .from("copilot_writing_memory")
      .select("context_type, style_profile, sample_count")
      .eq("user_id", userId)
      .eq("organization_id", orgId);

    // PASO 3: Recent decisions
    const { data: recentDecisions } = await db
      .from("copilot_decision_log")
      .select("decision_type, created_at, matter_type, jurisdiction_code")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    // PASO 4: Usage stats
    const { data: allEvents } = await db
      .from("copilot_context_events")
      .select("event_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1000);

    const totalEvents = allEvents?.length || 0;
    const suggestionsActed = allEvents?.filter((e: any) => e.event_type === "suggestion_acted").length || 0;
    const suggestionsDismissed = allEvents?.filter((e: any) => e.event_type === "suggestion_dismissed").length || 0;
    const learningSince = allEvents?.[0]?.created_at || null;
    const totalSuggestionInteractions = suggestionsActed + suggestionsDismissed;
    const suggestionsActedPct = totalSuggestionInteractions > 0
      ? Math.round((suggestionsActed / totalSuggestionInteractions) * 100)
      : 0;

    // PASO 5: Generate plain-language explanations
    let patternsInPlainLanguage: string[];

    if (anthropicKey && (userPatterns?.length || writingStyles?.length)) {
      try {
        const dataForLLM = {
          patterns: userPatterns || [],
          writing_styles: writingStyles || [],
        };

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            temperature: 0.3,
            system: `Convierte estos datos técnicos de patrones de uso en frases amigables y comprensibles para el usuario. 
Máximo 6 frases. Habla en primera persona del plural ("Sabemos que...", "Hemos observado que...").
Responde SOLO como un JSON array de strings. Ejemplo: ["Sabemos que prefieres...", "Hemos observado que..."]`,
            messages: [
              { role: "user", content: JSON.stringify(dataForLLM) },
            ],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.content?.[0]?.text || "";
          try {
            patternsInPlainLanguage = JSON.parse(text);
          } catch {
            patternsInPlainLanguage = generateFallbackExplanations(
              userPatterns || [],
              writingStyles || []
            );
          }
        } else {
          patternsInPlainLanguage = generateFallbackExplanations(
            userPatterns || [],
            writingStyles || []
          );
        }
      } catch {
        patternsInPlainLanguage = generateFallbackExplanations(
          userPatterns || [],
          writingStyles || []
        );
      }
    } else {
      patternsInPlainLanguage = generateFallbackExplanations(
        userPatterns || [],
        writingStyles || []
      );
    }

    return new Response(
      JSON.stringify({
        learning_since: learningSince,
        total_events_captured: totalEvents,
        suggestions_acted_pct: suggestionsActedPct,
        patterns_in_plain_language: patternsInPlainLanguage,
        writing_styles: (writingStyles || []).map((ws: any) => ({
          context_type: ws.context_type,
          summary: ws.style_profile
            ? `Tono: ${ws.style_profile.tone}/10, Longitud: ${ws.style_profile.avg_length}, Idioma: ${ws.style_profile.language || "es"}`
            : "Sin datos suficientes",
        })),
        recent_decisions: (recentDecisions || []).map((d: any) => ({
          type: d.decision_type,
          date: d.created_at,
          jurisdiction: d.jurisdiction_code,
        })),
        can_delete: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("copilot-memory-explain error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
