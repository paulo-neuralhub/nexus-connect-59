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
  model: string, system: string, user: string, maxTokens = 800
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
      org_id,
      matter_id = null,
      context = {},
    }: {
      task: string;
      org_id: string;
      matter_id?: string | null;
      context?: Record<string, unknown>;
    } = body;

    if (!task || !org_id) return new Response(
      JSON.stringify({ error: "task and org_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── RAG: buscar en genius_knowledge_global ────────────
    // Intentar búsqueda semántica — fallback a full-text si falla
    let ragContent = "";
    let ragSources: Array<{ title: string; source: string }> = [];

    try {
      // Intentar RPC semántica si existe
      const { data: semantic } = await db.rpc("genius_semantic_search", {
        query_text: task,
        p_org_id: org_id,
        p_limit: 4,
      });
      if (semantic?.length) {
        ragContent = semantic.map((r: Record<string, string>) => r.content).join("\n\n");
        ragSources = semantic.map((r: Record<string, string>) => ({
          title: r.title, source: r.source_name,
        }));
      }
    } catch {
      // Fallback: full-text search
      const { data: ft } = await db
        .from("genius_knowledge_global")
        .select("content, title, source_name, jurisdiction_code")
        .textSearch("content", task.split(" ").slice(0, 5).join(" | "))
        .eq("is_active", true)
        .limit(4);

      if (ft?.length) {
        ragContent = ft.map((r: Record<string, string>) => r.content).join("\n\n");
        ragSources = ft.map((r: Record<string, string>) => ({
          title: r.title, source: r.source_name,
        }));
      }
    }

    // También buscar en knowledge del tenant
    try {
      const { data: tenantKnowledge } = await db
        .from("genius_knowledge_tenant")
        .select("content, title")
        .eq("organization_id", org_id)
        .textSearch("content", task.split(" ").slice(0, 4).join(" | "))
        .limit(2);
      if (tenantKnowledge?.length) {
        ragContent += "\n\n" + tenantKnowledge
          .map((r: Record<string, string>) => r.content).join("\n\n");
      }
    } catch { /* no tenant knowledge */ }

    // ── Generar respuesta con Sonnet ──────────────────────
    const hasContext = ragContent.trim().length > 50;

    const { text, tokens } = await callClaude(
      "claude-sonnet-4-20250514",
      `Eres LEX, experto en propiedad intelectual de IP-NEXUS.
Tienes conocimiento profundo de procedimientos, plazos y tasas
en las principales oficinas PI del mundo.
Responde ÚNICAMENTE en JSON válido:
{
  "answer": "respuesta clara y accionable",
  "confidence": 0.0,
  "jurisdiction": "código de jurisdicción detectado o GENERAL",
  "key_dates": [{"type": "plazo|renovación|presentación", "value": "fecha o período", "description": "descripción"}],
  "fees": [{"type": "tipo de tasa", "amount": "importe", "currency": "EUR|USD|etc"}],
  "warnings": ["advertencia importante si aplica"],
  "disclaimer": "Información orientativa. Verificar con la oficina oficial antes de actuar."
}
${!hasContext ? "NOTA: No hay información verificada disponible para esta consulta. Indica confidence bajo." : ""}`,
      `TAREA: ${task}
CONTEXTO ADICIONAL: ${JSON.stringify(context)}
${hasContext ? `\nINFORMACIÓN VERIFICADA:\n${ragContent}` : "\nSin información verificada disponible."}`
    );

    // Parse response
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
    } catch {
      result = {
        answer: text,
        confidence: 0.5,
        jurisdiction: "GENERAL",
        key_dates: [],
        fees: [],
        warnings: ["Respuesta no estructurada — verificar manualmente"],
        disclaimer: "Información orientativa.",
      };
    }

    // Añadir fuentes RAG
    result.sources = ragSources;
    result.tokens_used = tokens;

    // Métricas (fire-and-forget)
    await db.rpc("upsert_agent_metric", {
      p_org_id: org_id, p_agent_type: "jurisdiction",
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
        answer: "No se pudo obtener información jurisdiccional. Consulte directamente con la oficina PI.",
        confidence: 0.0,
        partial: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    // Retorna 200 con error — el orquestador puede continuar
  }
});
