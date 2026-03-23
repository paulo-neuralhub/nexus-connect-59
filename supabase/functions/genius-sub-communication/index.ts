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
  maxTokens = 1200,
  temperature = 0.3
): Promise<{ text: string; tokens: number }> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature, system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const d = await r.json();
  return {
    text: d.content?.[0]?.text ?? "",
    tokens: (d.usage?.input_tokens ?? 0) + (d.usage?.output_tokens ?? 0),
  };
}

// ── Idioma por jurisdicción ───────────────────────────────
function getJurisdictionLanguage(jurisdiction: string): string {
  const map: Record<string, string> = {
    USPTO: "inglés", EUIPO: "inglés", OEPM: "español",
    WIPO: "inglés", EPO: "inglés", JPO: "inglés con traducción al japonés",
    CNIPA: "inglés con nota para traducción al chino",
    UKIPO: "inglés", INPI_FR: "francés", DPMA: "alemán",
  };
  return map[jurisdiction?.toUpperCase()] ?? "español";
}

// ── Instrucciones de tono por tipo ────────────────────────
function getToneInstructions(commType: string): string {
  const tones: Record<string, string> = {
    client_update: `
Tono: Profesional, claro y tranquilizador.
Estructura: Saludo → Estado actual → Próximos pasos → Cierre.
Evita: Tecnicismos legales excesivos, incertidumbre innecesaria.
Incluye: Fecha estimada de resolución si la hay.`,

    agent_instructions: `
Tono: Técnico, preciso y directo.
Estructura: Objetivo → Instrucciones específicas → Plazos → Documentación requerida.
Evita: Ambigüedades, información superflua.
Incluye: Números de referencia, plazos exactos, formato requerido.`,

    cease_desist_letter: `
Tono: Formal, firme, profesional. Sin amenazas directas.
Estructura: Identificación del derecho → Descripción infracción → 
            Acción requerida → Plazo → Consecuencias → Cierre.
Evita: Lenguaje agresivo, amenazas penales sin fundamento.
Incluye: Referencias legales exactas, plazo de respuesta (7-14 días hábiles).`,

    client_proposal: `
Tono: Profesional, persuasivo, orientado al valor.
Estructura: Contexto → Oportunidad identificada → Servicios propuestos → 
            Beneficios → Siguiente paso.
Evita: Presión de ventas, promesas sin fundamento.
Incluye: ROI estimado si es posible, siguiente acción concreta.`,

    office_response: `
Tono: Formal, técnico, respetuoso.
Estructura: Referencia al escrito recibido → Respuesta punto a punto → Conclusión.
Evita: Argumentos emocionales, informalidades.
Incluye: Número de expediente, fecha del escrito al que se responde.`,

    internal_note: `
Tono: Conciso, técnico, informativo.
Estructura: Fecha → Hecho → Decisión tomada → Próximos pasos.
Evita: Opiniones personales, información no verificada.
Incluye: Quién actuó, qué se decidió, cuándo.`,

    translation: `
Tono: Mantener exactamente el tono del original.
Estructura: Mantener exactamente la estructura del original.
Prioridad: Precisión de terminología legal PI por encima de fluidez literaria.
Incluye: Nota del traductor si hay términos sin equivalente exacto.`,
  };
  return tones[commType] ?? tones.client_update;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();

  try {
    const body = await req.json();
    const {
      task,
      comm_type = "client_update",
      org_id,
      matter_id = null,
      user_id = null,
      recipient_name = null,
      recipient_type = "client",
      source_language = null,
      target_language = null,
      source_text = null,
    }: {
      task: string;
      comm_type?: string;
      org_id: string;
      matter_id?: string | null;
      user_id?: string | null;
      recipient_name?: string | null;
      recipient_type?: string;
      source_language?: string | null;
      target_language?: string | null;
      source_text?: string | null;
    } = body;

    if (!task || !org_id) return new Response(
      JSON.stringify({ error: "task and org_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Cargar contexto del expediente ────────────────────
    let matterCtx = "";
    let jurisdiction = "EUIPO";

    if (matter_id) {
      const { data: matter } = await db
        .from("matters")
        .select("title, type, status, jurisdiction, reference_number, owner_entity")
        .eq("id", matter_id)
        .eq("organization_id", org_id)
        .single();

      if (matter) {
        jurisdiction = matter.jurisdiction ?? "EUIPO";
        matterCtx = `
EXPEDIENTE: ${matter.title}
Referencia: ${matter.reference_number ?? "N/A"}
Estado: ${matter.status}
Jurisdicción: ${matter.jurisdiction}
Titular: ${matter.owner_entity ?? "N/A"}`;
      }
    }

    // ── Cargar nombre e info de la organización ───────────
    let orgCtx = "";
    const { data: org } = await db
      .from("organizations")
      .select("name")
      .eq("id", org_id)
      .single();
    if (org) orgCtx = `Despacho remitente: ${org.name}`;

    // ── Cargar estilo de escritura del usuario ────────────
    let styleCtx = "";
    if (user_id) {
      try {
        const { data: writing } = await db
          .from("copilot_writing_memory")
          .select("style_profile, sample_count")
          .eq("user_id", user_id)
          .single();

        if (writing?.style_profile && writing.sample_count > 0) {
          styleCtx = `\nESTILO DEL REMITENTE (aprendido de ${writing.sample_count} muestras):\n${
            JSON.stringify(writing.style_profile)
          }`;
        }
      } catch { /* sin historial de estilo */ }
    }

    // ── Determinar idioma ─────────────────────────────────
    const lang = target_language
      ?? getJurisdictionLanguage(jurisdiction);

    // ── Tono según tipo de comunicación ──────────────────
    const toneInstructions = getToneInstructions(comm_type);

    // ── Generar la comunicación con Sonnet ────────────────
    const isTranslation = comm_type === "translation" && source_text;

    const systemPrompt = `Eres IRIS, especialista en comunicaciones de propiedad intelectual de IP-NEXUS.
Redactas comunicaciones profesionales perfectamente adaptadas al contexto PI.

TIPO DE COMUNICACIÓN: ${comm_type}
IDIOMA DE SALIDA: ${lang}
${toneInstructions}
${styleCtx}

REGLAS ABSOLUTAS:
1. NO envíes nunca la comunicación — solo genera el borrador
2. NO uses placeholders como [NOMBRE] o [FECHA] — usa los datos reales
3. Si faltan datos críticos, indica claramente qué falta al final
4. Incluye siempre línea de asunto si es un email
5. Cierra siempre con firma profesional del despacho`;

    const userPrompt = isTranslation
      ? `TEXTO A TRADUCIR (${source_language ?? "idioma original"} → ${lang}):\n${source_text}\n\nContexto: ${task}`
      : `TAREA: ${task}
${matterCtx}
${orgCtx}
DESTINATARIO: ${recipient_name ?? "No especificado"} (${recipient_type})
IDIOMA: ${lang}`;

    const { text: draft, tokens } = await callClaude(
      "claude-sonnet-4-20250514",
      systemPrompt,
      userPrompt,
      1500,
      0.3
    );

    // ── Extraer asunto si es email ────────────────────────
    let subject: string | null = null;
    const subjectMatch = draft.match(/^(Asunto|Subject|Objeto):\s*(.+)$/m);
    if (subjectMatch) subject = subjectMatch[2].trim();

    // ── Detectar datos faltantes ──────────────────────────
    const missingData: string[] = [];
    if (draft.includes("[") && draft.includes("]")) {
      const placeholders = draft.match(/\[([^\]]+)\]/g) ?? [];
      missingData.push(...placeholders);
    }

    // ── Métricas ──────────────────────────────────────────
    await db.rpc("upsert_agent_metric", {
      p_org_id: org_id,
      p_agent_type: "communication",
      p_success: true,
      p_latency_ms: Date.now() - t0,
      p_tokens: tokens,
      p_cost_eur: tokens * 0.000003,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({
      draft,
      subject,
      comm_type,
      language: lang,
      missing_data: missingData,
      tokens_used: tokens,
      disclaimer: "📧 BORRADOR — Revisar antes de enviar. No se ha enviado automáticamente.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error",
      draft: "No se pudo generar la comunicación. Intenta de nuevo.",
      comm_type: "unknown",
      partial: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
