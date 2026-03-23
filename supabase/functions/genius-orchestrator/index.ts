import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ── Claude call ───────────────────────────────────────────
async function callClaude(
  model: string, system: string, user: string,
  maxTokens = 800, temperature = 0.1
): Promise<{ text: string; tokens: number }> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
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
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.content?.[0]?.text ?? "",
    tokens: data.usage?.input_tokens + data.usage?.output_tokens ?? 0,
  };
}

// ── Sub-agent call (service key, not user token) ──────────
async function callSubAgent(
  fn: string,
  payload: Record<string, unknown>,
  timeoutMs = 28000
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "apikey": SERVICE_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return { error: `${fn} → ${resp.status}`, partial: true };
    return await resp.json();
  } catch (e: unknown) {
    clearTimeout(timer);
    return { error: e instanceof Error ? e.message : "timeout", partial: true };
  }
}

// ── Default plans ─────────────────────────────────────────
function defaultPlan(type: string): Array<Record<string, unknown>> {
  const plans: Record<string, Array<Record<string, unknown>>> = {
    oa_response: [
      { step: 1, agent: "dossier",       task: "Analizar expediente y OA recibida",          can_parallel: false, requires_approval: false },
      { step: 2, agent: "jurisdiction",  task: "Buscar jurisprudencia para responder la OA", can_parallel: false, requires_approval: false },
      { step: 3, agent: "document",      task: "Generar borrador de respuesta a OA",         can_parallel: false, requires_approval: true  },
    ],
    spider_analysis: [
      { step: 1, agent: "dossier",       task: "Cargar expediente afectado",                 can_parallel: true,  requires_approval: false },
      { step: 2, agent: "jurisdiction",  task: "Verificar plazos de oposición",              can_parallel: true,  requires_approval: false },
      { step: 3, agent: "communication", task: "Preparar recomendación de acción",           can_parallel: false, requires_approval: false },
    ],
    morning_briefing: [
      { step: 1, agent: "dossier",       task: "Revisar plazos críticos próximas 72h",       can_parallel: true,  requires_approval: false },
      { step: 2, agent: "jurisdiction",  task: "Identificar alertas Spider sin atender",     can_parallel: true,  requires_approval: false },
      { step: 3, agent: "communication", task: "Elaborar briefing ejecutivo del día",        can_parallel: false, requires_approval: false },
    ],
  };
  return plans[type] ?? [
    { step: 1, agent: "communication", task: "Analizar y responder al objetivo", can_parallel: false, requires_approval: false },
  ];
}

// ── Execute one step ──────────────────────────────────────
async function executeStep(
  step: Record<string, unknown>,
  matterId: string | null,
  orgId: string,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const agent = step.agent as string;
  const task  = step.task  as string;

  if (agent === "jurisdiction") {
    return callSubAgent("genius-sub-jurisdiction",
      { task, org_id: orgId, matter_id: matterId, context }, 25000);
  }
  if (agent === "dossier" && matterId) {
    return callSubAgent("genius-sub-dossier",
      { task, matter_id: matterId, org_id: orgId }, 25000);
  }
  if (agent === "document") {
    const wfType = (context.workflow_type as string) ?? "report";
    return callSubAgent("genius-sub-document", {
      matter_id: matterId,
      org_id: orgId,
      document_type: wfType === "oa_response" ? "oa_response"
        : wfType === "infringement_analysis" ? "cease_desist"
        : "report",
      context: { ...context, goal: task },
      user_id: context.user_id ?? null,
    }, 90000);
  }
  if (agent === "execute") {
    return callSubAgent("genius-execute-action",
      { action_type: task, matter_id: matterId, org_id: orgId }, 20000);
  }
  // communication / fallback → genius-chat
  return callSubAgent("genius-chat",
    { message: task, context_page: "workflow", matter_id: matterId }, 30000);
}

// ── Main ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "No auth" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify user
    const userClient = createClient(SUPABASE_URL, ANON_KEY,
      { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: profile } = await db.from("profiles")
      .select("organization_id").eq("id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    const orgId = profile.organization_id as string;
    const body  = await req.json();
    const {
      goal, workflow_type,
      matter_id = null, client_id = null,
      context = {},
      workflow_id: existingWorkflowId = null,
      resume = false,
    } = body;

    if (!goal || !workflow_type) return new Response(
      JSON.stringify({ error: "goal and workflow_type required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let wfId: string;
    let traceId: string;

    if (resume && existingWorkflowId) {
      // Retomar workflow existente desde el paso siguiente
      const { data: existing } = await db
        .from("genius_workflow_runs")
        .select("id, trace_id, plan_json, current_step")
        .eq("id", existingWorkflowId)
        .eq("organization_id", orgId)
        .single();

      if (!existing) throw new Error("Workflow not found for resume");
      wfId = existing.id as string;
      traceId = existing.trace_id as string;
    } else {
      // Crear nuevo workflow run
      const { data: run, error: runErr } = await db
        .from("genius_workflow_runs")
        .insert({
          organization_id: orgId, user_id: user.id,
          workflow_type, goal_text: goal,
          matter_id, client_id, status: "planning",
        })
        .select("id, trace_id").single();
      if (runErr || !run) throw new Error("Failed to create workflow run");
      wfId = run.id as string;
      traceId = run.trace_id as string;
    }

    // ── Return 202 immediately ────────────────────────────
    // Background execution via EdgeRuntime.waitUntil if available
    const background = async () => {
      try {
        // Load relevant memory
        const { data: mems } = await db
          .from("genius_conversation_memory")
          .select("content, memory_type")
          .eq("user_id", user.id)
          .gte("relevance_score", 0.6)
          .order("relevance_score", { ascending: false })
          .limit(4);
        const memCtx = mems?.map((m: Record<string,string>) =>
          `[${m.memory_type}] ${m.content}`).join("\n") ?? "";

        // Build plan with Haiku (fast + cheap)
        // Si es resume, cargar el plan existente y saltar pasos completados
        let steps: Array<Record<string, unknown>> = defaultPlan(workflow_type);
        let startFromStep = 0;

        if (resume && existingWorkflowId) {
          const { data: existingWf } = await db
            .from("genius_workflow_runs")
            .select("plan_json, current_step")
            .eq("id", wfId).single();
          if (existingWf?.plan_json && Array.isArray(existingWf.plan_json)) {
            steps = existingWf.plan_json as Array<Record<string, unknown>>;
            startFromStep = Number(existingWf.current_step ?? 0);
            // Marcar pasos anteriores como done si no lo están
            steps = steps.map(s =>
              Number(s.step) <= startFromStep
                ? { ...s, status: "done" }
                : s
            );
          }
        }
        try {
          const { text, tokens } = await callClaude(
            "claude-haiku-4-5-20251001",
            `Eres el orquestador de IP-NEXUS (PI management).
Crea un plan en JSON puro, sin texto adicional:
{"steps":[{"step":1,"agent":"jurisdiction|dossier|document|communication|execute","task":"descripción concisa","can_parallel":true,"requires_approval":false}]}
Máximo 4 pasos. can_parallel=true si el paso no depende del anterior.
requires_approval=true SOLO para enviar emails externos o presentar documentos oficiales.
${memCtx ? `\nMEMORIA:\n${memCtx}` : ""}`,
            `OBJETIVO: ${goal}\nTIPO: ${workflow_type}\nMATTER: ${matter_id ?? "n/a"}`
          );
          const parsed = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
          if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            steps = parsed.steps;
          }
          // Track orchestrator metric (fire-and-forget)
          await db.rpc("upsert_agent_metric", {
            p_org_id: orgId, p_agent_type: "orchestrator",
            p_success: true, p_latency_ms: Date.now() - t0,
            p_tokens: tokens, p_cost_eur: tokens * 0.0000003,
          }).then(()=>{}).catch(()=>{});
        } catch { /* use default plan */ }

        // Save plan
        await db.from("genius_workflow_runs").update({
          status: "running", plan_json: steps,
          total_steps: steps.length,
        }).eq("id", wfId);

        // Execute steps
        const results: Record<string, unknown> = {};

        let i = startFromStep;
        while (i < steps.length) {
          const step = steps[i];

          // Approval checkpoint
          if (step.requires_approval) {
            await db.from("genius_workflow_runs").update({
              status: "approval_needed",
              current_step: Number(step.step),
              approval_payload: {
                step: step.step, agent: step.agent, task: step.task,
                description: step.agent === 'document' ? 'Draft va a generar un documento legal para este expediente. Esta acción puede generar contenido que necesitarás revisar antes de usar oficialmente.'
                  : step.agent === 'execute' ? 'Nexus va a ejecutar una acción sobre este expediente. Esta acción puede generar contenido que necesitarás revisar antes de usar oficialmente.'
                  : step.agent === 'communication' ? 'Iris va a redactar una comunicación para este expediente. Esta acción puede generar contenido que necesitarás revisar antes de usar oficialmente.'
                  : `${step.agent} va a completar: ${step.task}. Esta acción puede generar contenido que necesitarás revisar antes de usar oficialmente.`,
                matter_id: matter_id,
                is_reversible: false,
                requires_review: true,
              },
            }).eq("id", wfId);
            return; // Wait for user approval
          }

          // Group parallel steps
          const group: Array<Record<string, unknown>> = [step];
          let j = i + 1;
          while (j < steps.length && steps[j].can_parallel) {
            group.push(steps[j]);
            j++;
          }

          await db.from("genius_workflow_runs")
            .update({ current_step: Number(step.step), status: "running" })
            .eq("id", wfId);

          // Execute group in parallel
          const settled = await Promise.allSettled(
            group.map(s => executeStep(s, matter_id, orgId, { ...context, ...results, workflow_type, user_id: user.id }))
          );

          settled.forEach((r, idx) => {
            const agent = group[idx].agent as string;
            results[agent] = r.status === "fulfilled" ? r.value : { error: "failed" };
            // Update step status in plan
            steps = steps.map(s =>
              s.step === group[idx].step
                ? { ...s, status: r.status === "fulfilled" && !(r.value as Record<string,unknown>).error ? "done" : "failed",
                    result: r.status === "fulfilled" ? r.value : { error: "failed" } }
                : s
            ) as Array<Record<string, unknown>>;
          });

          i = j;
        }

        // Synthesis
        let synthesis: Record<string, unknown> = {
          summary: `Workflow ${workflow_type} completado.`,
          key_outputs: Object.keys(results),
          next_actions: [],
          confidence: 0.75,
        };
        try {
          const { text } = await callClaude(
            "claude-sonnet-4-20250514",
            `Sintetiza los resultados en JSON puro:
{"summary":"2-3 frases ejecutivas","key_outputs":["output1"],"next_actions":["acción1"],"confidence":0.0-1.0}`,
            `OBJETIVO: ${goal}\nRESULTADOS:\n${JSON.stringify(results, null, 2)}`
          );
          synthesis = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
        } catch { /* keep default */ }

        // Save memory (fire-and-forget)
        await db.from("genius_conversation_memory").insert({
          organization_id: orgId, user_id: user.id, matter_id,
          memory_type: "long_term",
          content: `${workflow_type}: ${synthesis.summary ?? goal}`,
          relevance_score: 0.85,
        }).then(()=>{}).catch(()=>{});

        // Complete
        await db.from("genius_workflow_runs").update({
          status: "completed",
          current_step: steps.length,
          plan_json: steps,
          results_json: { ...results, synthesis },
          completed_at: new Date().toISOString(),
        }).eq("id", wfId);

      } catch (bgErr: unknown) {
        await db.from("genius_workflow_runs").update({
          status: "failed",
          error_message: bgErr instanceof Error ? bgErr.message : "Unknown error",
        }).eq("id", wfId).then(()=>{}).catch(()=>{});
      }
    };

    // Use EdgeRuntime.waitUntil if available, else fire-and-forget
    try {
      (EdgeRuntime as unknown as { waitUntil: (p: Promise<void>) => void })
        .waitUntil(background());
    } catch {
      background(); // fallback
    }

    return new Response(
      JSON.stringify({ workflow_id: wfId, trace_id: traceId, status: "planning" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
