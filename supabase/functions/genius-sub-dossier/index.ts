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
  model: string, system: string, user: string, maxTokens = 1000
): Promise<{ text: string; tokens: number }> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature: 0.1, system,
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();

  try {
    const body = await req.json();
    const {
      task,
      matter_id,
      org_id,
    }: { task: string; matter_id: string; org_id: string } = body;

    if (!task || !matter_id || !org_id) return new Response(
      JSON.stringify({ error: "task, matter_id and org_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Verificar ownership del expediente ────────────────
    const { data: matter, error: mErr } = await db
      .from("matters")
      .select(`
        id, title, type, status, jurisdiction,
        reference_number, owner_entity,
        trademark_assets (
          mark_name, mark_type, status,
          application_number, registration_number,
          filing_date, registration_date, expiration_date,
          classes
        ),
        patent_assets (
          title, status, application_number, patent_number,
          filing_date, grant_date, expiration_date,
          technology_field, claims_count
        )
      `)
      .eq("id", matter_id)
      .eq("organization_id", org_id)
      .single();

    if (mErr || !matter) return new Response(
      JSON.stringify({ error: "Matter not found or access denied", partial: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // ── Cargar datos relacionados (limitados) ─────────────
    const [deadlinesRes, docsRes, timelineRes] = await Promise.allSettled([
      db.from("matter_deadlines")
        .select("title, due_date, status, priority, type")
        .eq("matter_id", matter_id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(5),
      db.from("matter_documents")
        .select("filename, document_type, created_at")
        .eq("matter_id", matter_id)
        .order("created_at", { ascending: false })
        .limit(3),
      db.from("matter_timeline_events")
        .select("event_type, description, event_date")
        .eq("matter_id", matter_id)
        .order("event_date", { ascending: false })
        .limit(5),
    ]);

    const deadlines = deadlinesRes.status === "fulfilled"
      ? deadlinesRes.value.data ?? [] : [];
    const docs = docsRes.status === "fulfilled"
      ? docsRes.value.data ?? [] : [];
    const timeline = timelineRes.status === "fulfilled"
      ? timelineRes.value.data ?? [] : [];

    // ── Adaptar system prompt según tipo de matter ────────
    const matterType = matter.type as string;
    const typeContext = matterType === "trademark"
      ? "marca registrada — analiza clases, similitudes, plazos de renovación y oposición"
      : matterType === "patent"
      ? "patente — analiza reivindicaciones, plazos de mantenimiento y freedom-to-operate"
      : "diseño industrial — analiza novedad, plazos y protección territorial";

    // ── Analizar con Sonnet ───────────────────────────────
    const { text, tokens } = await callClaude(
      "claude-sonnet-4-20250514",
      `Eres ARCHIE, analista experto en expedientes de PI de IP-NEXUS.
Este expediente es de tipo: ${typeContext}.
Analiza en profundidad y responde en JSON puro:
{
  "summary": "resumen ejecutivo del estado actual en 2-3 frases",
  "status_analysis": "análisis del estado legal actual",
  "urgency": "immediate|soon|normal",
  "risks": [
    {"description": "riesgo identificado", "severity": "high|medium|low", "action": "acción recomendada"}
  ],
  "opportunities": [
    {"description": "oportunidad identificada", "action": "acción recomendada"}
  ],
  "recommended_action": "acción más importante a tomar ahora",
  "next_deadline": {"title": "nombre del plazo", "date": "fecha ISO o null", "days_remaining": 0},
  "confidence": 0.0
}`,
      `TAREA: ${task}

EXPEDIENTE:
${JSON.stringify({
  id: matter.id,
  title: matter.title,
  type: matter.type,
  status: matter.status,
  jurisdiction: matter.jurisdiction,
  reference: matter.reference_number,
  trademark: matter.trademark_assets,
  patent: matter.patent_assets,
}, null, 2)}

PLAZOS PENDIENTES: ${JSON.stringify(deadlines, null, 2)}
DOCUMENTOS RECIENTES: ${JSON.stringify(docs, null, 2)}
HISTORIAL RECIENTE: ${JSON.stringify(timeline, null, 2)}`
    );

    // Parse response
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
    } catch {
      result = {
        summary: text.slice(0, 200),
        status_analysis: "Ver respuesta completa",
        urgency: "normal",
        risks: [],
        opportunities: [],
        recommended_action: text,
        next_deadline: null,
        confidence: 0.5,
      };
    }

    result.matter_id = matter_id;
    result.matter_title = matter.title;
    result.matter_type = matter.type;
    result.tokens_used = tokens;

    // Métricas (fire-and-forget)
    await db.rpc("upsert_agent_metric", {
      p_org_id: org_id, p_agent_type: "dossier",
      p_success: true, p_latency_ms: Date.now() - t0,
      p_tokens: tokens, p_cost_eur: tokens * 0.000003,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
        summary: "No se pudo analizar el expediente.",
        urgency: "normal",
        risks: [],
        opportunities: [],
        recommended_action: "Revisar el expediente manualmente.",
        confidence: 0.0,
        partial: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
