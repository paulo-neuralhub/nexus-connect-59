import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Jurisdiction detection ──────────────────────────────
const JURISDICTION_PATTERNS: [RegExp, string][] = [
  [/\b(EUIPO|UE|comunitaria|europea|marca\s*comunitaria|EUTM)\b/i, "EM"],
  [/\b(USPTO|americana|estados\s*unidos)\b/i, "US"],
  [/\b(OEPM|España|española|BOPI)\b/i, "ES"],
  [/\b(UKIPO|Reino\s*Unido|UK)\b/i, "GB"],
  [/\b(WIPO|Madrid|internacional|PCT)\b/i, "WO"],
];

function detectJurisdiction(text: string): string | null {
  for (const [re, code] of JURISDICTION_PATTERNS) {
    if (re.test(text)) return code;
  }
  return null;
}

// ── Action detection ────────────────────────────────────
const ACTION_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /\b(crear|abrir|nuevo)\b.*\b(expediente|matter)\b/i, action: "create_matter" },
  { pattern: /\b(añadir|crear|agregar)\b.*\b(plazo|deadline|vencimiento)\b/i, action: "add_deadline" },
  { pattern: /\b(enviar|mandar)\b.*\b(email|correo)\b/i, action: "send_email" },
  { pattern: /\b(crear|abrir)\b.*\b(deal|oportunidad)\b/i, action: "create_crm_deal" },
  { pattern: /\b(activar|iniciar)\b.*\b(vigilancia|spider|watch)\b/i, action: "activate_spider_watch" },
];

function detectProposedAction(
  text: string
): { action: string; data: Record<string, unknown> } | null {
  for (const { pattern, action } of ACTION_PATTERNS) {
    if (pattern.test(text)) {
      return { action, data: { detected_in: text.slice(0, 200) } };
    }
  }
  return null;
}

// ── Disclaimer constant ─────────────────────────────────
const DISCLAIMER_SUFFIX =
  "\n\n⚠️ *Información orientativa. No constituye asesoramiento legal. Verificar con profesional de PI.*";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

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

    // Service client for DB operations
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get org_id from JWT user profile
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

    // ── Genius config checks ────────────────────────────
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

    // Monthly limit check (auto-reset)
    const resetAt = new Date(config.current_month_reset_at);
    const monthStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
    );
    const currentQueries =
      resetAt < monthStart ? 0 : config.current_month_queries;
    if (
      config.max_queries_per_month !== -1 &&
      currentQueries >= config.max_queries_per_month
    ) {
      return new Response(
        JSON.stringify({ error: "monthly_query_limit_reached" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse body ──────────────────────────────────────
    const body = await req.json();
    const {
      conversation_id,
      message,
      context_matter_id,
      stream = false,
    } = body as {
      conversation_id?: string;
      message: string;
      context_matter_id?: string;
      stream?: boolean;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Conversation (create or reuse) ──────────────────
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convErr } = await db
        .from("genius_conversations")
        .insert({
          organization_id: orgId,
          user_id: userId,
          context_type: context_matter_id ? "matter" : "general",
          context_matter_id: context_matter_id || null,
          title: message.slice(0, 80),
        })
        .select("id")
        .single();
      if (convErr) throw convErr;
      convId = conv.id;
    }

    // ── Step 1: Matter context ──────────────────────────
    let matterContext = "";
    if (context_matter_id) {
      const { data: matter } = await db
        .from("matters")
        .select(
          "id, reference, title, type, status, filing_date, registration_number, expiry_date, nice_classes"
        )
        .eq("id", context_matter_id)
        .eq("organization_id", orgId)
        .single();

      if (matter) {
        const { data: deadlines } = await db
          .from("matter_deadlines")
          .select("title, due_date, is_critical, status")
          .eq("matter_id", matter.id)
          .eq("status", "pending")
          .order("due_date", { ascending: true })
          .limit(10);

        matterContext = `
EXPEDIENTE ACTIVO:
- Referencia: ${matter.reference}
- Título: ${matter.title}
- Tipo: ${matter.type} | Estado: ${matter.status}
- Fecha solicitud: ${matter.filing_date || "N/A"}
- Nº registro: ${matter.registration_number || "Pendiente"}
- Vencimiento: ${matter.expiry_date || "N/A"}
- Clases Nice: ${matter.nice_classes || "N/A"}
${
  deadlines?.length
    ? `- Plazos pendientes:\n${deadlines
        .map(
          (d: any) =>
            `  · ${d.title}: ${d.due_date}${d.is_critical ? " ⚠️ CRÍTICO" : ""}`
        )
        .join("\n")}`
    : ""
}`;
      }
    }

    // ── Step 2: RAG ─────────────────────────────────────
    const jurisdictionDetected = detectJurisdiction(message);
    let ragSources: any[] = [];
    let ragMode = "none";
    let ragContext = "";

    if (openaiKey) {
      // Vector search via embeddings
      try {
        const embResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: message,
          }),
        });
        if (embResp.ok) {
          const embData = await embResp.json();
          const embedding = embData.data?.[0]?.embedding;
          if (embedding) {
            const { data: results } = await db.rpc("genius_semantic_search", {
              p_org_id: orgId,
              p_query_embedding: JSON.stringify(embedding),
              p_jurisdiction: jurisdictionDetected,
              p_doc_category: null,
              p_limit: 8,
            });
            if (results?.length) {
              ragSources = results;
              ragMode = "vector";
              ragContext = results
                .map(
                  (r: any) =>
                    `[${r.source}] ${r.title}${r.article_reference ? ` (${r.article_reference})` : ""}\n${r.content.slice(0, 600)}`
                )
                .join("\n\n---\n\n");
            }
          }
        }
      } catch {
        // Fall through to keyword fallback
      }
    }

    // Keyword fallback if no vector results
    if (!ragContext) {
      const keywords = message
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5)
        .join(" & ");
      if (keywords) {
        const { data: kwResults } = await db
          .from("genius_knowledge_global")
          .select("id, title, content, jurisdiction_code, article_reference")
          .eq("is_active", true)
          .textSearch("content", keywords, { type: "websearch" })
          .limit(5);
        if (kwResults?.length) {
          ragSources = kwResults.map((r: any) => ({
            source: "global",
            id: r.id,
            title: r.title,
            content: r.content,
            jurisdiction_code: r.jurisdiction_code,
            article_reference: r.article_reference,
            similarity: null,
          }));
          ragMode = "keyword_fallback";
          ragContext = kwResults
            .map(
              (r: any) =>
                `[global] ${r.title}${r.article_reference ? ` (${r.article_reference})` : ""}\n${r.content.slice(0, 600)}`
            )
            .join("\n\n---\n\n");
        }
      }
    }

    // ── Step 3: Load conversation history ───────────────
    const { data: historyMessages } = await db
      .from("genius_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    // ── Step 4: Build prompt ────────────────────────────
    const systemPrompt = `Eres IP-GENIUS, el asistente de propiedad intelectual de IP-NEXUS.
Asistes a profesionales de PI con formación y experiencia legal.

REGLAS ABSOLUTAS:
1. Cita artículos exactos al hacer afirmaciones legales (ej: "Art. 7.1.b RMUE")
2. Nunca afirmes sin respaldo en el contexto o en tu conocimiento verificado
3. Los plazos: indica SIEMPRE si son extensibles o absolutos
4. Para decisiones estratégicas → recomienda consulta con abogado especializado
5. Las marcas siempre en VERSALITAS o entre comillas « »
6. Si no tienes información suficiente, indícalo claramente
7. Responde en el idioma del usuario

${matterContext ? `CONTEXTO DEL EXPEDIENTE:\n${matterContext}` : ""}

${ragContext ? `FUENTES RELEVANTES (RAG):\n${ragContext}` : "No se encontraron fuentes RAG específicas para esta consulta."}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(historyMessages || [])
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    // ── Step 5: Call Claude ─────────────────────────────
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert system message for Anthropic API format
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const anthropicBody = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.1,
      system: systemPrompt,
      messages: anthropicMessages,
    };

    if (stream) {
      // ── Streaming mode ──────────────────────────────
      anthropicBody["stream" as keyof typeof anthropicBody] = true as any;

      const llmResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(anthropicBody),
      });

      if (!llmResp.ok) {
        const errText = await llmResp.text();
        console.error("Anthropic error:", llmResp.status, errText);
        return new Response(
          JSON.stringify({ error: "LLM error", detail: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // We need to collect the full response for DB persistence
      // while streaming to client. Use TransformStream.
      let fullAssistantContent = "";

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Process stream in background
      (async () => {
        const reader = llmResp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let nlIdx: number;
            while ((nlIdx = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, nlIdx).trim();
              buffer = buffer.slice(nlIdx + 1);

              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const evt = JSON.parse(jsonStr);
                if (evt.type === "content_block_delta" && evt.delta?.text) {
                  fullAssistantContent += evt.delta.text;
                  // Forward as OpenAI-compatible SSE
                  const ssePayload = JSON.stringify({
                    choices: [{ delta: { content: evt.delta.text } }],
                  });
                  await writer.write(
                    encoder.encode(`data: ${ssePayload}\n\n`)
                  );
                }
              } catch {
                /* skip unparseable */
              }
            }
          }

          // Send disclaimer as final tokens
          const disclaimerPayload = JSON.stringify({
            choices: [{ delta: { content: DISCLAIMER_SUFFIX } }],
          });
          await writer.write(encoder.encode(`data: ${disclaimerPayload}\n\n`));
          fullAssistantContent += DISCLAIMER_SUFFIX;

          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
        } catch (e) {
          console.error("Stream processing error:", e);
          await writer.abort(e);
        }

        // Persist messages after stream completes
        try {
          // Save user message
          await db.from("genius_messages").insert({
            organization_id: orgId,
            conversation_id: convId,
            role: "user",
            content: message,
          });

          // Save assistant message
          await db.from("genius_messages").insert({
            organization_id: orgId,
            conversation_id: convId,
            role: "assistant",
            content: fullAssistantContent,
            model_used: "claude-sonnet-4-20250514",
            rag_sources: ragSources.map((s: any) => ({
              source: s.source,
              id: s.id,
              title: s.title,
              article_reference: s.article_reference,
              similarity: s.similarity,
            })),
          });

          // Detect action proposals in assistant response
          const detectedAction = detectProposedAction(fullAssistantContent);
          if (detectedAction) {
            await db.from("genius_messages").insert({
              organization_id: orgId,
              conversation_id: convId,
              role: "assistant",
              content: `Acción propuesta: ${detectedAction.action}`,
              content_type: "action_proposal",
              proposed_action: detectedAction.action,
              action_data: detectedAction.data,
              action_status: "pending",
            });
          }

          // Update conversation
          await db
            .from("genius_conversations")
            .update({
              message_count: (historyMessages?.length || 0) + 2,
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", convId);

          // Increment counter
          await db.rpc("increment_genius_counter", {
            p_org_id: orgId,
            p_type: "query",
          });
        } catch (dbErr) {
          console.error("DB persistence error after stream:", dbErr);
        }
      })();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ── Non-streaming mode ────────────────────────────
    const llmResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!llmResp.ok) {
      const errText = await llmResp.text();
      console.error("Anthropic error:", llmResp.status, errText);
      return new Response(
        JSON.stringify({ error: "LLM error", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const llmData = await llmResp.json();
    let assistantContent =
      llmData.content?.[0]?.text || "No se pudo generar una respuesta.";
    const tokensInput = llmData.usage?.input_tokens || 0;
    const tokensOutput = llmData.usage?.output_tokens || 0;

    // Append disclaimer
    assistantContent += DISCLAIMER_SUFFIX;

    // ── Step 6: Persist ─────────────────────────────────
    // User message
    await db.from("genius_messages").insert({
      organization_id: orgId,
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Assistant message
    const { data: savedMsg } = await db
      .from("genius_messages")
      .insert({
        organization_id: orgId,
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        model_used: "claude-sonnet-4-20250514",
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        rag_sources: ragSources.map((s: any) => ({
          source: s.source,
          id: s.id,
          title: s.title,
          article_reference: s.article_reference,
          similarity: s.similarity,
        })),
      })
      .select("id")
      .single();

    // Detect action proposals
    const detectedAction = detectProposedAction(assistantContent);
    let actionMessage = null;
    if (detectedAction) {
      const { data: actMsg } = await db
        .from("genius_messages")
        .insert({
          organization_id: orgId,
          conversation_id: convId,
          role: "assistant",
          content: `Acción propuesta: ${detectedAction.action}`,
          content_type: "action_proposal",
          proposed_action: detectedAction.action,
          action_data: detectedAction.data,
          action_status: "pending",
        })
        .select("id, proposed_action, action_data")
        .single();
      actionMessage = actMsg;
    }

    // Update conversation
    await db
      .from("genius_conversations")
      .update({
        message_count: (historyMessages?.length || 0) + 2,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", convId);

    // Increment counter
    await db.rpc("increment_genius_counter", {
      p_org_id: orgId,
      p_type: "query",
    });

    return new Response(
      JSON.stringify({
        conversation_id: convId,
        message: {
          id: savedMsg?.id,
          role: "assistant",
          content: assistantContent,
          model_used: "claude-sonnet-4-20250514",
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          rag_sources: ragSources.map((s: any) => ({
            source: s.source,
            title: s.title,
            article_reference: s.article_reference,
          })),
          rag_mode: ragMode,
          jurisdiction_detected: jurisdictionDetected,
        },
        action_proposal: actionMessage || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("genius-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
