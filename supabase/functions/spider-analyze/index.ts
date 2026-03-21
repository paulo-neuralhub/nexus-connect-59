import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Jaro-Winkler (pure implementation, no npm deps) ───
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;
  const matchWindow = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 0);
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  let matches = 0;
  let transpositions = 0;
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - matchWindow);
    const hi = Math.min(i + matchWindow + 1, s2.length);
    for (let j = lo; j < hi; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  const jaro = jaroSimilarity(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * p * (1 - jaro);
}

// ─── Text normalization ───
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ─── Severity from score ───
function scoreSeverity(score: number): string {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 55) return "medium";
  return "low";
}

// ─── Anthropic helper ───
async function callClaude(
  apiKey: string,
  prompt: string,
  maxTokens: number
): Promise<string | null> {
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      console.error("Claude error:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    return data.content?.[0]?.text ?? null;
  } catch (e) {
    console.error("Claude call failed:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // ─── 0. Auth: org_id ALWAYS from JWT ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    // User client for auth
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // Service client for privileged queries
    const svc = createClient(supabaseUrl, serviceKey);

    // Get user's org_id from profiles (NEVER from body)
    const { data: profile } = await svc
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id)
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const orgId: string = profile.organization_id;

    // ─── 1. Verify spider access ───
    const { data: hasAccess } = await svc.rpc("verify_spider_access", {
      p_org_id: orgId,
    });
    if (!hasAccess)
      return new Response(
        JSON.stringify({ error: "Spider module not active" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    // ─── 2. Parse body ───
    const body = await req.json();
    const {
      watch_id,
      watch_name,
      detected_mark_name,
      detected_application_number,
      detected_jurisdiction,
      detected_nice_classes,
      watch_nice_classes,
      check_visual,
      watch_mark_image_url,
      detected_mark_image_url,
    } = body;

    if (!watch_name || !detected_mark_name || !detected_jurisdiction) {
      return new Response(
        JSON.stringify({
          error: "watch_name, detected_mark_name, detected_jurisdiction required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 3. Verify watch ownership if watch_id provided ───
    if (watch_id) {
      const { data: watch } = await svc
        .from("spider_watches")
        .select("id, organization_id")
        .eq("id", watch_id)
        .single();
      if (!watch || watch.organization_id !== orgId)
        return new Response(
          JSON.stringify({ error: "Watch not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // ─── 4. Get tenant config for weights ───
    const { data: tenantConfig } = await svc
      .from("spider_tenant_config")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single();

    // Get watch-level weight overrides
    let watchWeights: Record<string, number | null> = {};
    if (watch_id) {
      const { data: w } = await svc
        .from("spider_watches")
        .select("weight_phonetic, weight_semantic, weight_visual")
        .eq("id", watch_id)
        .single();
      if (w) watchWeights = w;
    }

    // ─── 5. Normalize ───
    const watchNorm = normalize(watch_name);
    const detectedNorm = normalize(detected_mark_name);

    // ─── 6. Check TENANT-SPECIFIC cache ───
    const { data: cached } = await svc
      .from("spider_analysis_cache")
      .select("*")
      .eq("organization_id", orgId) // CRITICAL: tenant isolation
      .eq("watch_name_normalized", watchNorm)
      .eq("detected_name_normalized", detectedNorm)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({
          phonetic_score: cached.phonetic_score,
          semantic_score: cached.semantic_score,
          visual_score: cached.visual_score,
          combined_score: cached.combined_score,
          severity: scoreSeverity(cached.combined_score),
          should_alert:
            cached.combined_score >=
            (tenantConfig?.default_similarity_threshold ?? 70),
          weights_used: cached.weights_used,
          cache_hit: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 7. Phonetic analysis (Jaro-Winkler) ───
    const phoneticScore = Math.round(jaroWinkler(watchNorm, detectedNorm) * 100);

    // ─── 8. Semantic analysis (Claude) ───
    let semanticScore = phoneticScore; // fallback
    if (anthropicKey) {
      const semanticRaw = await callClaude(
        anthropicKey,
        `Similitud semántica entre marcas "${watch_name}" y "${detected_mark_name}". ` +
          `Considera traducciones, conceptos relacionados, connotaciones. ` +
          `JSON sin markdown: {"score":[0-100],"reason":"[max 60 chars]"}`,
        100
      );
      if (semanticRaw) {
        try {
          const cleaned = semanticRaw.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (typeof parsed.score === "number") {
            semanticScore = Math.max(0, Math.min(100, Math.round(parsed.score)));
          }
        } catch {
          console.warn("Semantic parse failed, using phonetic as fallback");
        }
      }
    }

    // ─── 9. Visual analysis (stub — requires vision model) ───
    let visualScore: number | null = null;
    const doVisual =
      check_visual &&
      tenantConfig?.feature_visual &&
      watch_mark_image_url &&
      detected_mark_image_url;

    // Visual analysis placeholder: would use Claude vision in production
    // For now, visual_score stays null → combined uses 2-factor formula

    // ─── 10. Combined score with weights ───
    const hasVisual = visualScore !== null;
    let wp: number, ws: number, wv: number;

    if (hasVisual) {
      wp = watchWeights.weight_phonetic ?? tenantConfig?.weight_phonetic ?? 40;
      wv = watchWeights.weight_visual ?? tenantConfig?.weight_visual ?? 35;
      ws = watchWeights.weight_semantic ?? tenantConfig?.weight_semantic ?? 25;
    } else {
      wp = watchWeights.weight_phonetic ?? tenantConfig?.weight_phonetic ?? 45;
      ws = watchWeights.weight_semantic ?? tenantConfig?.weight_semantic ?? 55;
      wv = 0;
    }

    const totalWeight = wp + ws + wv;
    const combinedScore = hasVisual
      ? Math.round(
          (phoneticScore * wp + semanticScore * ws + (visualScore ?? 0) * wv) /
            totalWeight
        )
      : Math.round((phoneticScore * wp + semanticScore * ws) / totalWeight);

    const severity = scoreSeverity(combinedScore);
    const threshold = tenantConfig?.default_similarity_threshold ?? 70;
    const shouldAlert = combinedScore >= threshold;

    // ─── 11. Opposition deadline ───
    let oppositionDeadline: string | null = null;
    let oppositionDaysRemaining: number | null = null;
    const { data: deadline } = await svc
      .from("spider_opposition_deadlines")
      .select("*")
      .eq("jurisdiction_code", detected_jurisdiction)
      .maybeSingle();

    if (deadline) {
      const today = new Date();
      // Use detected_publication_date or filing_date from body if available
      const refDateStr = body.detected_publication_date || body.detected_filing_date;
      if (refDateStr) {
        const refDate = new Date(refDateStr);
        const deadlineDate = new Date(refDate);
        deadlineDate.setDate(deadlineDate.getDate() + deadline.opposition_days);
        oppositionDeadline = deadlineDate.toISOString().split("T")[0];
        oppositionDaysRemaining = Math.ceil(
          (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // ─── 12. AI analysis (if combined >= 50) ───
    let aiAnalysis: string | null = null;
    let aiRiskLevel: string | null = null;
    let aiRecommendation: string | null = null;
    let aiKeyFactors: string[] | null = null;
    const aiDisclaimer =
      "Análisis orientativo. Consultar especialista en PI.";

    if (combinedScore >= 50 && anthropicKey) {
      const aiRaw = await callClaude(
        anthropicKey,
        `Eres un analista de propiedad intelectual. Analiza el conflicto entre la marca existente "${watch_name}" y la marca detectada "${detected_mark_name}" en la jurisdicción ${detected_jurisdiction}.\n` +
          `Scores: fonético=${phoneticScore}, semántico=${semanticScore}${hasVisual ? `, visual=${visualScore}` : ""}, combinado=${combinedScore}.\n` +
          `Clases Niza marca existente: ${JSON.stringify(watch_nice_classes ?? [])}. Clases detectada: ${JSON.stringify(detected_nice_classes ?? [])}.\n` +
          `Responde en JSON sin markdown:\n` +
          `{"risk_level":"MUY ALTO|ALTO|MEDIO|BAJO","analysis":"[máx 150 chars, descripción del riesgo]","recommendation":"[máx 150 chars, acción sugerida. SIN probabilidad de éxito. SIN garantías legales.]","key_factors":["factor1","factor2","factor3"]}`,
        300
      );
      if (aiRaw) {
        try {
          const cleaned = aiRaw.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          aiRiskLevel = parsed.risk_level ?? null;
          aiAnalysis = parsed.analysis ?? null;
          aiRecommendation = parsed.recommendation
            ? `${parsed.recommendation} — ${aiDisclaimer}`
            : null;
          aiKeyFactors = parsed.key_factors ?? null;
        } catch {
          console.warn("AI analysis parse failed");
        }
      }
    }

    // ─── 13. Save to TENANT-SPECIFIC cache ───
    const weightsUsed = { phonetic: wp, semantic: ws, visual: wv };
    await svc.from("spider_analysis_cache").upsert(
      {
        organization_id: orgId,
        watch_name_normalized: watchNorm,
        detected_name_normalized: detectedNorm,
        phonetic_score: phoneticScore,
        semantic_score: semanticScore,
        visual_score: visualScore,
        combined_score: combinedScore,
        weights_used: weightsUsed,
        cached_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        onConflict: "organization_id,watch_name_normalized,detected_name_normalized",
      }
    );

    // ─── 14. Audit log (activity_log) ───
    await svc.from("activity_log").insert({
      organization_id: orgId,
      entity_type: "spider_analysis",
      action: "completed",
      description: `Análisis: "${watch_name}" vs "${detected_mark_name}" → ${combinedScore}% (${severity})`,
      metadata: {
        watch_name,
        detected_mark_name,
        combined_score: combinedScore,
        severity,
        cache_hit: false,
      },
      created_by: user.id,
    });

    // ─── 15. Response ───
    const result = {
      phonetic_score: phoneticScore,
      visual_score: visualScore,
      semantic_score: semanticScore,
      combined_score: combinedScore,
      severity,
      should_alert: shouldAlert,
      opposition_deadline: oppositionDeadline,
      opposition_days_remaining: oppositionDaysRemaining,
      ai_analysis: aiAnalysis,
      ai_risk_level: aiRiskLevel,
      ai_recommendation: aiRecommendation,
      ai_key_factors: aiKeyFactors,
      ai_disclaimer: combinedScore >= 50 ? aiDisclaimer : null,
      cache_hit: false,
      weights_used: weightsUsed,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("spider-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
