/**
 * genius-research-jurisdiction — KNOWLEDGE-01 Phase 2
 * Superadmin-only. Researches a jurisdiction via Perplexity.
 * Two-step: first returns cost estimate, then executes on confirmed_cost=true.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

  // --- Auth: extract user from JWT ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer "))
    return json({ error: "Unauthorized" }, 401);

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user)
    return json({ error: "Unauthorized" }, 401);

  // --- Superadmin check ---
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleRow) return json({ error: "Forbidden: super_admin required" }, 403);

  // --- Parse body ---
  const body = await req.json();
  const { jurisdiction_code, research_depth = "basic", confirmed_cost } = body;

  if (!jurisdiction_code)
    return json({ error: "jurisdiction_code required" }, 400);

  const depth = research_depth === "full" ? "full" : "basic";

  // --- Cost estimation ---
  const estimatedCostEur = depth === "full" ? 5.0 : 0.5;
  const queriesCount = depth === "full" ? 3 : 1;
  const model = depth === "full" ? "sonar-pro" : "sonar";

  if (!confirmed_cost) {
    return json({
      action: "cost_estimate",
      jurisdiction_code,
      research_depth: depth,
      estimated_cost_eur: estimatedCostEur,
      queries_count: queriesCount,
      model,
      message: `Investigación ${depth} para ${jurisdiction_code}: ~€${estimatedCostEur.toFixed(2)} (${queriesCount} queries ${model}). Envía confirmed_cost: true para ejecutar.`,
    });
  }

  // --- Concurrency lock check ---
  const { data: existingLock } = await adminClient
    .from("genius_kb_update_queue")
    .select("id, status, lock_expires_at")
    .eq("jurisdiction_code", jurisdiction_code)
    .in("status", ["pending", "in_review", "processing"])
    .gt("lock_expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingLock)
    return json(
      {
        error: "already_in_progress",
        queue_id: existingLock.id,
        status: existingLock.status,
      },
      409
    );

  // --- Check Perplexity key ---
  if (!perplexityKey)
    return json({ error: "PERPLEXITY_API_KEY not configured" }, 500);

  // --- Get current office data for context ---
  const { data: office } = await adminClient
    .from("ipo_offices")
    .select(
      "id, name_en, jurisdiction_code, region, flag_emoji, opposition_period_days, rep_requirement_type, accepted_filing_languages, use_requirement_years"
    )
    .eq("jurisdiction_code", jurisdiction_code)
    .maybeSingle();

  const officeName = office?.name_en || jurisdiction_code;

  // --- Build research queries ---
  const queries: Array<{ role: string; prompt: string }> = [];

  if (depth === "basic") {
    queries.push({
      role: "basic",
      prompt: `Provide VERIFIED trademark law procedures for ${officeName} (${jurisdiction_code}).
Include: (1) Office action response deadlines and structure,
(2) Opposition deadlines and legal basis with specific articles,
(3) Required filing languages,
(4) Local representative requirements for foreign applicants,
(5) Key legislation articles with numbers.
Cite only official sources. Mark uncertain information with [UNCERTAIN].
Return as structured JSON with keys: deadlines, opposition, languages, representation, legislation, fees_url, guidelines_url.`,
    });
  } else {
    queries.push(
      {
        role: "oa_procedures",
        prompt: `For ${officeName} (${jurisdiction_code}) trademark office:
Provide DETAILED office action response procedures including:
- Response deadlines (days) and whether extendable
- Structure of a proper OA response (sections, required elements)
- Key legislation articles cited in OA responses
- Common grounds for refusal and how to respond to each
Return as JSON with keys: response_deadline_days, is_extendable, max_extension_days, response_structure, refusal_grounds, legislation_articles. Cite official sources only.`,
      },
      {
        role: "opposition",
        prompt: `For ${officeName} (${jurisdiction_code}) trademark office:
Provide DETAILED opposition procedures including:
- Opposition period (days from publication)
- Who can file opposition and grounds
- Required documentation and forms
- Legal basis (specific articles)
- Key jurisprudence/case law if available
Return as JSON with keys: opposition_days, count_from, legal_basis, grounds, required_docs, jurisprudence. Cite official sources only.`,
      },
      {
        role: "fees_and_rep",
        prompt: `For ${officeName} (${jurisdiction_code}) trademark office:
Provide VERIFIED information on:
- Current official fee schedule URL
- Filing fee for 1 class (local currency and EUR equivalent)
- Representative requirements for foreign applicants (specific legal basis)
- Power of attorney requirements
- Available online forms URLs (opposition, renewal, assignment)
Return as JSON with keys: fee_schedule_url, filing_fee_1class, currency, rep_requirement, rep_legal_basis, poa_required, poa_notarization, form_urls. Cite official sources only.`,
      }
    );
  }

  // --- Execute research ---
  const results: Array<{
    role: string;
    content: string;
    citations: string[];
    tokens: number;
  }> = [];
  let totalTokens = 0;

  try {
    for (const q of queries) {
      const resp = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an IP (Intellectual Property) expert researcher. Return ONLY valid JSON. No markdown, no code blocks. Cite official government sources whenever possible.",
            },
            { role: "user", content: q.prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      const respText = await resp.text();
      if (!resp.ok) {
        console.error(`Perplexity error ${resp.status}: ${respText.slice(0, 300)}`);
        throw new Error(`Perplexity API ${resp.status}`);
      }

      const parsed = JSON.parse(respText);
      const content = parsed.choices?.[0]?.message?.content || "";
      const citations = parsed.citations || [];
      const tokens = parsed.usage?.total_tokens || 0;
      totalTokens += tokens;

      results.push({ role: q.role, content, citations, tokens });
    }
  } catch (err) {
    console.error("Research failed:", err);
    return json({ error: "Research failed", details: String(err) }, 500);
  }

  // --- Structure proposed chunks ---
  const proposedChunks: any[] = [];
  const proposedOfficeUpdates: Record<string, any> = {};
  const allCitations: string[] = [];

  for (const r of results) {
    allCitations.push(...r.citations);

    // Try to parse JSON from the response
    let parsed: any = {};
    try {
      // Strip markdown code blocks if present
      const cleaned = r.content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If not valid JSON, store as raw text chunk
      proposedChunks.push({
        title: `Research: ${officeName} — ${r.role}`,
        content: r.content,
        knowledge_type: "procedure",
        document_category: null,
        article_reference: null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
      continue;
    }

    // Extract structured chunks based on role
    if (parsed.response_deadline_days || parsed.deadlines) {
      const deadlineDays =
        parsed.response_deadline_days || parsed.deadlines?.response_days;
      if (deadlineDays) {
        proposedOfficeUpdates.opposition_period_days =
          parsed.opposition_days || parsed.deadlines?.opposition_days;
      }

      proposedChunks.push({
        title: `Deadlines — ${officeName}`,
        content: JSON.stringify(parsed.deadlines || parsed, null, 2),
        knowledge_type: "deadline",
        document_category: "office_action",
        article_reference: parsed.legislation_articles?.[0] || null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.opposition_days || parsed.opposition) {
      const opp = parsed.opposition || parsed;
      if (opp.opposition_days)
        proposedOfficeUpdates.opposition_period_days = opp.opposition_days;
      if (opp.count_from)
        proposedOfficeUpdates.opposition_count_from = opp.count_from;
      if (opp.legal_basis)
        proposedOfficeUpdates.opposition_legal_basis = opp.legal_basis;

      proposedChunks.push({
        title: `Opposition Procedures — ${officeName}`,
        content: JSON.stringify(opp, null, 2),
        knowledge_type: "procedure",
        document_category: "opposition",
        article_reference: opp.legal_basis || null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.response_structure) {
      proposedChunks.push({
        title: `OA Response Template — ${officeName}`,
        content: JSON.stringify(parsed.response_structure, null, 2),
        knowledge_type: "template_structure",
        document_category: "office_action",
        article_reference: parsed.legislation_articles?.[0] || null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.legislation || parsed.legislation_articles) {
      const articles = parsed.legislation_articles || parsed.legislation;
      proposedChunks.push({
        title: `Legislation — ${officeName}`,
        content:
          typeof articles === "string"
            ? articles
            : JSON.stringify(articles, null, 2),
        knowledge_type: "legislation",
        document_category: null,
        article_reference: Array.isArray(articles) ? articles[0] : null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.fee_schedule_url) {
      proposedOfficeUpdates.fee_schedule_url = parsed.fee_schedule_url;

      proposedChunks.push({
        title: `Fee Structure — ${officeName}`,
        content: JSON.stringify(
          {
            filing_fee_1class: parsed.filing_fee_1class,
            currency: parsed.currency,
            fee_schedule_url: parsed.fee_schedule_url,
          },
          null,
          2
        ),
        knowledge_type: "fee_structure",
        document_category: null,
        article_reference: null,
        source_name: "Perplexity AI Research",
        source_url: parsed.fee_schedule_url,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.rep_requirement || parsed.representation) {
      const rep = parsed.rep_requirement || parsed.representation;
      if (typeof rep === "string")
        proposedOfficeUpdates.rep_requirement_notes = rep;
      if (parsed.rep_legal_basis)
        proposedOfficeUpdates.rep_requirement_notes = `${rep} (${parsed.rep_legal_basis})`;
      if (parsed.poa_required !== undefined)
        proposedOfficeUpdates.power_of_attorney_required = parsed.poa_required;
      if (parsed.poa_notarization !== undefined)
        proposedOfficeUpdates.poa_notarization_required =
          parsed.poa_notarization;
    }

    if (parsed.jurisprudence) {
      proposedChunks.push({
        title: `Jurisprudence — ${officeName}`,
        content:
          typeof parsed.jurisprudence === "string"
            ? parsed.jurisprudence
            : JSON.stringify(parsed.jurisprudence, null, 2),
        knowledge_type: "jurisprudence",
        document_category: null,
        article_reference: null,
        source_name: "Perplexity AI Research",
        source_url: r.citations[0] || null,
        source_reliability: "ai_researched",
        embedding_needed: true,
      });
    }

    if (parsed.form_urls || parsed.guidelines_url || parsed.fees_url) {
      if (parsed.guidelines_url)
        proposedOfficeUpdates.exam_criteria_url = parsed.guidelines_url;
      if (parsed.form_urls?.opposition)
        proposedOfficeUpdates.opposition_form_url = parsed.form_urls.opposition;
      if (parsed.form_urls?.renewal)
        proposedOfficeUpdates.renewal_form_url = parsed.form_urls.renewal;
      if (parsed.form_urls?.assignment)
        proposedOfficeUpdates.assignment_form_url =
          parsed.form_urls.assignment;
    }

    if (parsed.languages) {
      if (Array.isArray(parsed.languages))
        proposedOfficeUpdates.accepted_filing_languages = parsed.languages;
    }
  }

  // --- Determine confidence ---
  const officialSourceCount = allCitations.filter(
    (c) =>
      c.includes(".gov") ||
      c.includes(".europa.eu") ||
      c.includes("wipo.int") ||
      c.includes("jpo.go.jp")
  ).length;
  const confidence =
    officialSourceCount >= 2
      ? "high"
      : officialSourceCount >= 1
        ? "medium"
        : "low";

  // --- Calculate actual cost ---
  const costPerToken = model === "sonar-pro" ? 0.000005 : 0.000001;
  const estimatedCostActual = totalTokens * costPerToken;

  // --- INSERT into genius_kb_update_queue ---
  const lockExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: queueItem, error: queueErr } = await adminClient
    .from("genius_kb_update_queue")
    .insert({
      jurisdiction_code,
      jurisdiction_name: officeName,
      operation_type: "ai_research",
      status: "in_review",
      locked_by: user.id,
      locked_at: new Date().toISOString(),
      lock_expires_at: lockExpires,
      proposed_chunks: proposedChunks,
      proposed_office_updates: proposedOfficeUpdates,
      research_prompt: queries.map((q) => q.prompt).join("\n---\n"),
      research_result_raw: results.map((r) => r.content).join("\n---\n"),
      perplexity_sources: allCitations,
      confidence_level: confidence,
      requires_expert_review: true,
      estimated_cost_eur: estimatedCostActual,
      requested_by: user.id,
    })
    .select("id")
    .single();

  if (queueErr) {
    console.error("Queue insert error:", queueErr);
    return json({ error: "Failed to save research", details: queueErr.message }, 500);
  }

  // --- Log ---
  await adminClient.from("genius_kb_update_log").insert({
    queue_id: queueItem.id,
    jurisdiction_code,
    action: "research_started",
    details: {
      depth,
      model,
      total_tokens: totalTokens,
      cost_eur: estimatedCostActual,
      chunks_proposed: proposedChunks.length,
      confidence,
      citations_count: allCitations.length,
    },
    performed_by: user.id,
  });

  // --- Notify superadmin ---
  await adminClient.from("admin_notifications").insert({
    type: "genius_research",
    severity: "info",
    title: `Investigación lista: ${officeName}`,
    message: `Nueva investigación ${depth} para ${officeName} (${jurisdiction_code}) lista para revisión. ${proposedChunks.length} chunks propuestos. Confianza: ${confidence}.`,
    metadata: { queue_id: queueItem.id, jurisdiction_code },
  });

  return json({
    queue_id: queueItem.id,
    jurisdiction_code,
    chunks_proposed: proposedChunks.length,
    office_updates_proposed: Object.keys(proposedOfficeUpdates).length,
    confidence,
    cost_eur: estimatedCostActual,
    total_tokens: totalTokens,
    citations: allCitations.length,
    requires_review: true,
  });
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
