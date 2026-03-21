import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map document_type → { category, jurisdiction }
const DOC_TYPE_MAP: Record<string, { category: string; jurisdiction: string }> = {
  oa_response_euipo_absolute: { category: "office_action", jurisdiction: "EM" },
  oa_response_euipo_relative: { category: "office_action", jurisdiction: "EM" },
  oa_response_uspto_confusion: { category: "office_action", jurisdiction: "US" },
  oa_response_uspto_descriptiveness: { category: "office_action", jurisdiction: "US" },
  oa_response_oepm: { category: "office_action", jurisdiction: "ES" },
  oa_response_ukipo: { category: "office_action", jurisdiction: "GB" },
  opposition_euipo: { category: "opposition", jurisdiction: "EM" },
  opposition_uspto: { category: "opposition", jurisdiction: "US" },
  opposition_oepm: { category: "opposition", jurisdiction: "ES" },
  license_trademark: { category: "contract", jurisdiction: "" },
  assignment_trademark: { category: "contract", jurisdiction: "" },
  cease_desist: { category: "contract", jurisdiction: "" },
  search_report: { category: "report", jurisdiction: "" },
  portfolio_report: { category: "report", jurisdiction: "" },
  due_diligence_report: { category: "report", jurisdiction: "" },
};

// Language defaults by jurisdiction
const JURISDICTION_LANGUAGE: Record<string, string> = {
  US: "en",
  GB: "en",
  ES: "es",
  EM: "es", // default, but can be overridden
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  try {
    // ── Auth ─────────────────────────────────────────
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

    // ── Genius config checks ────────────────────────
    const { data: config } = await db
      .from("genius_tenant_config")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!config?.is_active) {
      return new Response(JSON.stringify({ error: "genius_not_active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!config.disclaimer_accepted) {
      return new Response(JSON.stringify({ error: "disclaimer_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!config.feature_document_generation) {
      return new Response(JSON.stringify({ error: "feature_disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monthly limit
    const resetAt = new Date(config.current_month_reset_at);
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const currentDocs = resetAt < monthStart ? 0 : config.current_month_documents;
    if (config.max_documents_per_month !== -1 && currentDocs >= config.max_documents_per_month) {
      return new Response(JSON.stringify({ error: "monthly_document_limit_reached" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ──────────────────────────────────
    const body = await req.json();
    const {
      document_type,
      matter_id,
      jurisdiction_code,
      language,
      office_action_text,
      specific_instructions,
      conversation_id,
    } = body as {
      document_type: string;
      matter_id?: string;
      jurisdiction_code?: string;
      language?: string;
      office_action_text?: string;
      specific_instructions?: string;
      conversation_id?: string;
    };

    if (!document_type) {
      return new Response(JSON.stringify({ error: "document_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docMeta = DOC_TYPE_MAP[document_type];
    const effectiveJurisdiction = jurisdiction_code || docMeta?.jurisdiction || null;
    const effectiveLanguage =
      language ||
      (effectiveJurisdiction ? JURISDICTION_LANGUAGE[effectiveJurisdiction] : null) ||
      config.preferred_language ||
      "es";

    // Force language constraints
    if (effectiveJurisdiction === "US" && effectiveLanguage !== "en") {
      return new Response(
        JSON.stringify({
          error: "USPTO documents must be in English",
          required_language: "en",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (effectiveJurisdiction === "ES" && effectiveLanguage !== "es") {
      return new Response(
        JSON.stringify({
          error: "OEPM documents must be in Spanish",
          required_language: "es",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Matter context ──────────────────────
    let matterData: any = null;
    let matterContext = "";
    if (matter_id) {
      const { data: matter } = await db
        .from("matters")
        .select(
          "id, reference, title, type, status, filing_date, registration_number, expiry_date, nice_classes"
        )
        .eq("id", matter_id)
        .eq("organization_id", orgId)
        .single();
      matterData = matter;

      if (matter) {
        // Get account info
        const { data: matterFull } = await db
          .from("matters")
          .select("applicant_name")
          .eq("id", matter_id)
          .single();

        matterContext = `
DATOS DEL EXPEDIENTE:
- Referencia: ${matter.reference}
- Denominación: ${matter.title}
- Tipo: ${matter.type}
- Estado: ${matter.status}
- Nº solicitud/registro: ${matter.registration_number || "Pendiente"}
- Fecha solicitud: ${matter.filing_date || "N/A"}
- Clases Nice: ${matter.nice_classes || "N/A"}
- Titular: ${(matterFull as any)?.applicant_name || "N/A"}`;
      }
    }

    // ── Step 2: RAG – search for template + articles ─
    let ragContext = "";
    let ragSources: any[] = [];

    // Try vector search first
    if (openaiKey) {
      try {
        const queryText = `${document_type} ${effectiveJurisdiction || ""} ${docMeta?.category || ""}`;
        const embResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "text-embedding-3-small", input: queryText }),
        });
        if (embResp.ok) {
          const embData = await embResp.json();
          const embedding = embData.data?.[0]?.embedding;
          if (embedding) {
            const { data: results } = await db.rpc("genius_semantic_search", {
              p_org_id: orgId,
              p_query_embedding: JSON.stringify(embedding),
              p_jurisdiction: effectiveJurisdiction,
              p_doc_category: docMeta?.category || null,
              p_limit: 10,
            });
            if (results?.length) {
              ragSources = results;
              ragContext = results
                .map(
                  (r: any) =>
                    `[${r.source}] ${r.title}${r.article_reference ? ` (${r.article_reference})` : ""}\n${r.content}`
                )
                .join("\n\n---\n\n");
            }
          }
        }
      } catch { /* fallback */ }
    }

    // Keyword fallback
    if (!ragContext) {
      const { data: kwResults } = await db
        .from("genius_knowledge_global")
        .select("id, title, content, jurisdiction_code, article_reference")
        .eq("is_active", true)
        .or(
          `document_category.eq.${docMeta?.category || ""},knowledge_type.eq.template_structure`
        )
        .limit(10);

      if (kwResults?.length) {
        // Filter by jurisdiction if applicable
        const filtered = effectiveJurisdiction
          ? kwResults.filter(
              (r: any) =>
                !r.jurisdiction_code || r.jurisdiction_code === effectiveJurisdiction
            )
          : kwResults;
        ragSources = filtered;
        ragContext = filtered
          .map(
            (r: any) =>
              `[global] ${r.title}${r.article_reference ? ` (${r.article_reference})` : ""}\n${r.content}`
          )
          .join("\n\n---\n\n");
      }
    }

    // ── Step 3: Build generation prompt ─────────────
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const styleRules: Record<string, string> = {
      EM: `- Marcas en VERSALITAS
- Artículos exactos del RMUE en cada argumento
- Tono formal, impersonal, indicativo (NUNCA condicional)
- Plazo: 2 meses extensibles +2 meses`,
      US: `- Marks in ALL CAPS
- Cite specific TMEP sections and statutory provisions
- Formal, assertive tone (no conditional language)
- Deadline: 3 months (extendable to 6 months with fee)`,
      ES: `- Marcas en VERSALITAS
- Artículos exactos de la Ley 17/2001
- Tono formal, impersonal
- ⚠️ PLAZO: 1 MES ABSOLUTO — SIN PRÓRROGA`,
      GB: `- Marks in ALL CAPS
- Cite Trade Marks Act 1994 sections
- Formal, polite English tone
- Deadline: 2 months`,
    };

    const systemPrompt = `Eres IP-GENIUS, redactor experto de documentos de propiedad intelectual.
Genera SOLO el documento solicitado, sin comentarios externos ni explicaciones.

TIPO DE DOCUMENTO: ${document_type}
JURISDICCIÓN: ${effectiveJurisdiction || "General"}
IDIOMA: ${effectiveLanguage}

${matterContext}

${office_action_text ? `TEXTO DEL OFICIO A RESPONDER:\n${office_action_text}` : ""}

${specific_instructions ? `INSTRUCCIONES DEL ABOGADO:\n${specific_instructions}` : ""}

ESTRUCTURA Y ARTÍCULOS DE REFERENCIA (RAG):
${ragContext || "No se encontraron templates específicos."}

REGLAS DE ESTILO:
${styleRules[effectiveJurisdiction || ""] || "- Tono formal y profesional\n- Estructura numerada clara"}
- Estructura numerada clara
- Reservar espacio para firma del representante
- Al final: espacio para lugar, fecha y firma

Solo genera el documento. Sin preámbulos ni comentarios.`;

    const llmResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.05,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Genera el documento de tipo "${document_type}" para la jurisdicción ${effectiveJurisdiction || "general"} en idioma ${effectiveLanguage}.`,
          },
        ],
      }),
    });

    if (!llmResp.ok) {
      const errText = await llmResp.text();
      console.error("Anthropic error:", llmResp.status, errText);
      return new Response(JSON.stringify({ error: "LLM error", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmData = await llmResp.json();
    const generatedContent = llmData.content?.[0]?.text || "";
    const tokensInput = llmData.usage?.input_tokens || 0;
    const tokensOutput = llmData.usage?.output_tokens || 0;

    // ── Step 4: Save document ───────────────────────
    const docTitle = `${document_type.replace(/_/g, " ").toUpperCase()} — ${
      matterData?.title || "Sin expediente"
    }`;

    const { data: savedDoc, error: docErr } = await db
      .from("genius_generated_docs")
      .insert({
        organization_id: orgId,
        conversation_id: conversation_id || null,
        matter_id: matter_id || null,
        document_type,
        jurisdiction_code: effectiveJurisdiction,
        language: effectiveLanguage,
        title: docTitle,
        content_markdown: generatedContent,
        status: "draft",
        model_used: "claude-sonnet-4-20250514",
        rag_sources_used: ragSources.map((s: any) => ({
          source: s.source || "global",
          id: s.id,
          title: s.title,
          article_reference: s.article_reference,
        })),
        created_by: userId,
      })
      .select("id, title, status, document_type, jurisdiction_code, language")
      .single();

    if (docErr) throw docErr;

    // Increment counter
    await db.rpc("increment_genius_counter", {
      p_org_id: orgId,
      p_type: "document",
    });

    return new Response(
      JSON.stringify({
        document: savedDoc,
        content: generatedContent,
        tokens: { input: tokensInput, output: tokensOutput },
        rag_sources: ragSources.map((s: any) => ({
          title: s.title,
          article_reference: s.article_reference,
        })),
        disclaimer:
          "⚠️ Documento generado por IA. Borrador que requiere revisión profesional antes de su uso.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("genius-generate-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
