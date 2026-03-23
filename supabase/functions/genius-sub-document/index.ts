import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callClaude(
  model: string,
  system: string,
  user: string,
  maxTokens = 2000,
  temperature = 0.1
): Promise<{ text: string; tokens: number }> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens,
      temperature, system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return {
    text: d.content?.[0]?.text ?? "",
    tokens: (d.usage?.input_tokens ?? 0) + (d.usage?.output_tokens ?? 0),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();

  try {
    const body = await req.json();
    const {
      matter_id,
      org_id,
      document_type = "report",
      context = {},
      user_id = null,
    }: {
      matter_id: string | null;
      org_id: string;
      document_type: string;
      context: Record<string, unknown>;
      user_id: string | null;
    } = body;

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Cargar contexto del expediente ────────────────────
    let matterContext = "";
    if (matter_id) {
      const { data: matter } = await db
        .from("matters")
        .select(`
          title, type, status, jurisdiction, reference_number,
          trademark_assets(mark_name, application_number,
            registration_number, classes, goods_services),
          patent_assets(title, application_number, technology_field)
        `)
        .eq("id", matter_id)
        .eq("organization_id", org_id)
        .single();
      if (matter) {
        matterContext = JSON.stringify(matter, null, 2);
      }
    }

    // ── RAG Híbrido: buscar conocimiento relevante ────────
    const queryText = `${document_type} ${context.goal ?? ""} ${
      matter_id ? "expediente PI" : ""
    }`;

    let ragContent = "";
    try {
      const { data: ragResults } = await db.rpc("genius_hybrid_search", {
        p_query_text: queryText,
        p_org_id: org_id,
        p_matter_id: matter_id,
        p_user_id: user_id,
        p_limit: 6,
      });
      if (ragResults?.length) {
        ragContent = ragResults
          .map((r: Record<string, string>) =>
            `[${r.level}] ${r.title}: ${r.content?.slice(0, 300)}`
          )
          .join("\n\n");
      }
    } catch { /* RAG falla → continuar sin él */ }

    // ── Cargar estilo de escritura del usuario ────────────
    let writingStyle = "";
    if (user_id) {
      try {
        const { data: styleData } = await db
          .from("copilot_writing_memory")
          .select("style_profile")
          .eq("user_id", user_id)
          .eq("org_id", org_id)
          .limit(1)
          .single();
        if (styleData?.style_profile) {
          writingStyle = JSON.stringify(styleData.style_profile);
        }
      } catch { /* no writing style → continue */ }
    }

    // ── PASO 1: GENERADOR (Sonnet — calidad/coste) ────────
    const generatorSystem = `Eres DRAFT, redactor legal experto de IP-NEXUS.
Especializas en documentos de propiedad intelectual:
respuestas a OAs, escritos de oposición, contratos de licencia,
cease & desist, informes de cartera, traducciones legales.

REGLAS ABSOLUTAS:
1. Usa terminología legal PI correcta para la jurisdicción
2. Cita artículos y reglamentos específicos cuando corresponda
3. Estructura clara: introducción, cuerpo argumentativo, conclusión
4. Tono profesional y formal
5. NUNCA inventes números de expediente, fechas o datos que no tengas
6. Al final incluye siempre: "⚠️ BORRADOR generado por IA. 
   Requiere revisión por abogado antes de uso oficial."
${writingStyle ? `\nESTILO DEL DESPACHO:\n${writingStyle}` : ""}
${ragContent ? `\nCONOCIMIENTO VERIFICADO:\n${ragContent}` : ""}`;

    const generatorUser = `TIPO DE DOCUMENTO: ${document_type}
EXPEDIENTE: ${matterContext || "No especificado"}
CONTEXTO ADICIONAL: ${JSON.stringify(context)}

Genera el documento completo.`;

    let { text: draft, tokens: genTokens } = await callClaude(
      "claude-sonnet-4-20250514",
      generatorSystem,
      generatorUser,
      2500,
      0.1
    );

    // ── PASO 2: EVALUADOR (Haiku — más económico) ─────────
    const evaluatorSystem = `Eres un evaluador experto en documentos legales de PI.
Evalúa el borrador según estos criterios y responde en JSON puro:
{
  "score": 0.0-1.0,
  "legal_accuracy": 0.0-1.0,
  "structure_quality": 0.0-1.0,
  "jurisdiction_compliance": 0.0-1.0,
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "missing_elements": ["elemento faltante si aplica"],
  "improvement_instructions": "instrucciones específicas para mejorar"
}
Sé crítico. Score < 0.75 si falta jurisprudencia, argumentos débiles
o estructura incorrecta para la jurisdicción.`;

    const evaluatorUser = `TIPO: ${document_type}
EXPEDIENTE: ${matterContext || "No especificado"}
BORRADOR A EVALUAR:
${draft}`;

    let evalScore = 0.8;
    let evalData: Record<string, unknown> = {};
    let evalTokens = 0;

    try {
      const { text: evalText, tokens: et } = await callClaude(
        "claude-haiku-4-5-20251001",
        evaluatorSystem,
        evaluatorUser,
        600,
        0.1
      );
      evalTokens = et;
      evalData = JSON.parse(
        evalText.replace(/```json\n?|```/g, "").trim()
      );
      evalScore = typeof evalData.score === "number"
        ? evalData.score : 0.8;
    } catch { /* evaluación falla → usar el draft inicial */ }

    // ── PASO 3: REGENERAR si score < 0.75 ────────────────
    let iterations = 1;
    let finalTokens = genTokens + evalTokens;

    if (evalScore < 0.75 && evalData.improvement_instructions) {
      iterations = 2;
      try {
        const { text: improvedDraft, tokens: improveTokens } =
          await callClaude(
            "claude-sonnet-4-20250514",
            generatorSystem,
            `${generatorUser}

REVISIÓN REQUERIDA (iteración 2):
El evaluador detectó estas mejoras necesarias:
${evalData.improvement_instructions}

Elementos faltantes: ${
  JSON.stringify(evalData.missing_elements ?? [])
}
Debilidades a corregir: ${
  JSON.stringify(evalData.weaknesses ?? [])
}

Genera una versión mejorada incorporando todo el feedback.`,
            2500,
            0.1
          );
        draft = improvedDraft;
        finalTokens += improveTokens;
      } catch { /* mantener el draft original */ }
    }

    // ── Métricas (fire-and-forget) ────────────────────────
    await db.rpc("upsert_agent_metric", {
      p_org_id: org_id,
      p_agent_type: "document",
      p_success: true,
      p_latency_ms: Date.now() - t0,
      p_tokens: finalTokens,
      p_cost_eur: finalTokens * 0.000008,
    }).then(() => {}).catch(() => {});

    return new Response(
      JSON.stringify({
        document: draft,
        document_type,
        quality_score: evalScore,
        iterations,
        evaluation: evalData,
        tokens_used: finalTokens,
        rag_sources_used: ragContent.length > 0,
        disclaimer:
          "⚠️ BORRADOR generado por IA. " +
          "Requiere revisión por abogado antes de uso oficial.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
        document: null,
        quality_score: 0,
        iterations: 0,
        partial: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
