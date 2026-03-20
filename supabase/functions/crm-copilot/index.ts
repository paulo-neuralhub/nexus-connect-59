import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COPILOT_SYSTEM_PROMPT = `Eres IP-CoPilot, el asistente de inteligencia artificial integrado en el CRM de IP-NEXUS, especializado en gestión de propiedad intelectual para despachos y departamentos legales.

MISIÓN: Analizar el contexto del cliente y generar máximo 3 sugerencias accionables, priorizadas y específicas de PI.

REGLAS ESTRICTAS:
1. USA TERMINOLOGÍA IP REAL:
   ❌ NO: "seguimiento pendiente", "contactar al cliente"
   ✅ SÍ: "respuesta al oficio de examen", "plazo de oposición", "anualidad vencida", "renovación de marca", "validación EP"

2. PRIORIDADES (en este orden):
   🔴 URGENTE: Plazos legales < 30 días sin acción
   🟡 OPORTUNIDAD: Renovaciones próximas sin presupuesto enviado
   🟢 INSIGHT: Análisis del portfolio o comportamiento del cliente
   💡 BORRADOR: Texto listo para usar (email/WhatsApp/carta)

3. SÉ ESPECÍFICO: Menciona nombres reales de marcas, fechas exactas, importes estimados cuando los tengas.

4. FORMATO JSON ESTRICTO (no añadas texto fuera del JSON):
{
  "suggestions": [
    {
      "type": "urgent|opportunity|insight|draft_text",
      "priority": "high|medium|low",
      "title": "máximo 60 caracteres",
      "body": "máximo 200 caracteres, terminología IP",
      "action_label": "texto del botón CTA (máx 30 chars)",
      "action_type": "create_deal|open_matter|draft_email|draft_whatsapp|schedule_call",
      "action_data": {},
      "related_matter_id": null,
      "related_deadline_id": null
    }
  ]
}

EJEMPLOS:
- "Renovación marca 'NEXUS' en EUIPO vence en 23 días. Sin presupuesto enviado. Valor: €850 + tasas."
- "Office Action recibida en USPTO hace 8 días sin respuesta asignada. Plazo de respuesta: 3 meses."
- "Cliente con 8 marcas activas, ninguna bajo vigilancia Spider. Upsell potencial: €99/mes."
- "Sin actividad en 52 días. Última llamada: habló de expansión a Latam. Oportunidad de 4 nuevos registros."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured", suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { context_type, context_id, organization_id, force_regenerate } = await req.json();
    if (!context_type || !context_id || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", suggestions: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache (6h TTL)
    if (!force_regenerate) {
      const { data: cached } = await supabase
        .from("crm_ai_suggestions")
        .select("*")
        .eq("context_type", context_type)
        .eq("context_id", context_id)
        .eq("organization_id", organization_id)
        .eq("is_dismissed", false)
        .gt("expires_at", new Date().toISOString())
        .order("priority", { ascending: true })
        .limit(4);

      if (cached && cached.length > 0) {
        return new Response(
          JSON.stringify({ suggestions: cached, from_cache: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build context for account
    let contextData: Record<string, unknown> = {};

    if (context_type === "account") {
      const [accountRes, activitiesRes, dealsRes, mattersRes, deadlinesRes, callsRes] =
        await Promise.all([
          supabase
            .from("crm_accounts")
            .select("id, name, industry, lifecycle_stage, status, tier, website, notes")
            .eq("id", context_id)
            .single(),
          supabase
            .from("crm_activities")
            .select("id, type, subject, content, created_at, direction, outcome")
            .eq("account_id", context_id)
            .eq("organization_id", organization_id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("crm_deals")
            .select("id, title, amount, currency, status, stage_id, created_at")
            .eq("account_id", context_id)
            .eq("organization_id", organization_id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("matters")
            .select("id, reference_number, title, status, type, subtype, filing_date")
            .eq("organization_id", organization_id)
            .limit(20),
          supabase
            .from("matter_deadlines")
            .select("id, matter_id, title, due_date, status, deadline_type")
            .eq("organization_id", organization_id)
            .gte("due_date", new Date().toISOString())
            .order("due_date", { ascending: true })
            .limit(10),
          supabase
            .from("crm_calls")
            .select("id, duration_seconds, outcome, notes, transcription_summary, started_at")
            .eq("account_id", context_id)
            .eq("organization_id", organization_id)
            .order("started_at", { ascending: false })
            .limit(3),
        ]);

      contextData = {
        account: accountRes.data,
        recent_activities: activitiesRes.data ?? [],
        deals: dealsRes.data ?? [],
        matters: mattersRes.data ?? [],
        upcoming_deadlines: deadlinesRes.data ?? [],
        recent_calls: callsRes.data ?? [],
      };
    } else if (context_type === "deal") {
      const [dealRes, activitiesRes] = await Promise.all([
        supabase
          .from("crm_deals")
          .select("id, title, amount, currency, status, stage_id, account_id, created_at, notes")
          .eq("id", context_id)
          .single(),
        supabase
          .from("crm_activities")
          .select("id, type, subject, content, created_at")
          .eq("deal_id", context_id)
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      contextData = {
        deal: dealRes.data,
        recent_activities: activitiesRes.data ?? [],
      };
    }

    // Build user prompt
    const userPrompt = `Analiza el siguiente contexto de ${context_type} y genera hasta 3 sugerencias accionables en JSON.

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

Fecha actual: ${new Date().toISOString().split("T")[0]}

Genera el JSON con las sugerencias. Si no hay datos suficientes para sugerencias útiles, devuelve {"suggestions": []}.`;

    // Call Anthropic API directly
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        temperature: 0.3,
        system: COPILOT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errText);
      return new Response(
        JSON.stringify({ suggestions: [], error: "AI service unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData?.content?.[0]?.text ?? "{}";

    // Parse JSON from response
    let suggestions: unknown[] = [];
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
      }
    } catch {
      console.error("Failed to parse AI response:", rawText);
      suggestions = [];
    }

    // Clean expired, save new
    await supabase
      .from("crm_ai_suggestions")
      .delete()
      .eq("context_type", context_type)
      .eq("context_id", context_id)
      .eq("organization_id", organization_id);

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    const insertRows = suggestions.map((s: any) => ({
      organization_id,
      context_type,
      context_id,
      suggestion_type: s.type || "insight",
      priority: s.priority || "medium",
      title: (s.title || "").substring(0, 60),
      body: (s.body || "").substring(0, 500),
      action_label: s.action_label || null,
      action_type: s.action_type || null,
      action_data: s.action_data || {},
      related_matter_id: s.related_matter_id || null,
      related_deadline_id: s.related_deadline_id || null,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_dismissed: false,
      is_actioned: false,
    }));

    let savedSuggestions: unknown[] = [];
    if (insertRows.length > 0) {
      const { data: inserted } = await supabase
        .from("crm_ai_suggestions")
        .insert(insertRows)
        .select();
      savedSuggestions = inserted ?? [];
    }

    return new Response(
      JSON.stringify({ suggestions: savedSuggestions, from_cache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("crm-copilot error:", err);
    return new Response(
      JSON.stringify({ suggestions: [], error: String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
