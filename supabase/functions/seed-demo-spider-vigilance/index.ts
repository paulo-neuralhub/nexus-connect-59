import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

type DemoOrgSlug = "demo-starter" | "demo-professional" | "demo-business" | "demo-enterprise";

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function isoTs(d: Date) {
  return d.toISOString();
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function assertIsSuperadmin(svc: any, userId: string) {
  const { data, error } = await svc
    .from("superadmins")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("forbidden: superadmin required");
}

async function getOrgIdBySlug(svc: any, slug: DemoOrgSlug) {
  const { data, error } = await svc.from("organizations").select("id").eq("slug", slug).single();
  if (error) throw error;
  return data.id as string;
}

async function createRun(svc: any, organizationId: string, createdBy: string, seedVersion: string) {
  const { data, error } = await svc
    .from("demo_seed_runs")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      status: "running",
      seed_version: seedVersion,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function registerEntity(svc: any, runId: string, tableName: string, rowId: string) {
  const { error } = await svc.from("demo_seed_entities").insert({
    run_id: runId,
    table_name: tableName,
    row_id: rowId,
  });
  if (error) throw error;
}

async function completeRun(svc: any, runId: string) {
  const { error } = await svc
    .from("demo_seed_runs")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", runId);
  if (error) throw error;
}

type WatchlistCategory = "trademark_own" | "competitor" | "market";

const jurisdictions = ["ES", "EUIPO", "US"] as const;
const runFrequencies = ["daily", "weekly"] as const;
const similarityTypes = [
  { key: "identical", label: "Idéntica", baseScore: 96 },
  { key: "phonetic", label: "Similar fonética", baseScore: 82 },
  { key: "visual", label: "Similar visual", baseScore: 78 },
  { key: "class_match", label: "Mismas clases", baseScore: 72 },
  { key: "competitor", label: "Competidor directo", baseScore: 88 },
] as const;

function screenshotUrl(seed: string) {
  // Simulated screenshot asset
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/450`;
}

function sourceUrl(seed: string) {
  return `https://gazette.demo.ipnexus.com/result/${encodeURIComponent(seed)}`;
}

function randomNiceClasses(): number[] {
  const pool = [9, 35, 36, 38, 41, 42, 45];
  const count = 1 + Math.floor(Math.random() * 3);
  return shuffle(pool).slice(0, count);
}

function buildWatchTerms(category: WatchlistCategory, idx: number) {
  if (category === "trademark_own") {
    return pick([
      [`NEXUS${idx}`, `IP NEXUS ${idx}`],
      [`IPNEXUS${idx}`, `NEXUS IP ${idx}`],
      [`NEXUSLEGAL${idx}`, `NEXUS LEGAL ${idx}`],
    ]);
  }
  if (category === "competitor") {
    return pick([
      [`MarcaRival${idx}`, `RivalMark ${idx}`],
      [`LexPatent${idx}`, `Lex Patents ${idx}`],
      [`Trademaster${idx}`, `TradeMaster ${idx}`],
    ]);
  }
  // market/keywords
  return pick([
    [`legaltech`, `gestión marcas`, `vigilancia PI`],
    [`brand protection`, `registro de marca`],
    [`oposición`, `plazo oposición`, `boletín`],
  ]);
}

function statusBuckets200() {
  // 50 nuevas (sin revisar)
  // 100 revisadas (no relevante)
  // 30 relevantes
  // 20 acción tomada
  return [
    ...Array.from({ length: 50 }).map(() => "new" as const),
    ...Array.from({ length: 100 }).map(() => "dismissed" as const),
    ...Array.from({ length: 30 }).map(() => "threat" as const),
    ...Array.from({ length: 20 }).map(() => "actioned" as const),
  ];
}

function alertStatusFromResultStatus(resultStatus: "new" | "dismissed" | "threat" | "actioned") {
  if (resultStatus === "new") return "unread";
  if (resultStatus === "dismissed") return "dismissed";
  if (resultStatus === "actioned") return "actioned";
  return "read"; // threat = reviewed/acknowledged but relevant
}

function alertTypeForSimilarity(simKey: string) {
  if (simKey === "identical") return "new_conflict";
  if (simKey === "competitor") return "infringement";
  if (simKey === "class_match") return "high_similarity";
  return "high_similarity";
}

function severityFromScore(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 90) return "critical";
  if (score >= 80) return "high";
  if (score >= 70) return "medium";
  return "low";
}

function priorityFromSeverity(sev: "low" | "medium" | "high" | "critical") {
  if (sev === "critical") return "critical";
  if (sev === "high") return "high";
  if (sev === "medium") return "medium";
  return "low";
}

async function seedSpiderForOrg(params: {
  svc: any;
  organizationId: string;
  runId: string;
  createdBy: string;
  orgSlug: DemoOrgSlug;
}) {
  const { svc, organizationId, runId, createdBy, orgSlug } = params;

  // Require some matters to link results
  const { data: matters, error: matErr } = await svc
    .from("matters")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(500);
  if (matErr) throw matErr;
  const matterIds = (matters ?? []).map((r: any) => String(r.id)).filter(Boolean);
  if (!matterIds.length) throw new Error("No matters found (seed matters first)");

  // Assignees / notify users
  const { data: members, error: memErr } = await svc
    .from("memberships")
    .select("user_id")
    .eq("organization_id", organizationId)
    .limit(50);
  if (memErr) throw memErr;
  const userIds = (members ?? []).map((r: any) => String(r.user_id)).filter(Boolean);
  const notifyUsers = userIds.length ? userIds.slice(0, 5) : [createdBy];

  // Create 20 watchlists
  const watchlists: Array<{ id: string; category: WatchlistCategory }> = [];

  const categories: WatchlistCategory[] = [
    ...Array.from({ length: 10 }).map(() => "trademark_own" as const),
    ...Array.from({ length: 5 }).map(() => "competitor" as const),
    ...Array.from({ length: 5 }).map(() => "market" as const),
  ];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const idx = i + 1;
    const terms = buildWatchTerms(category, idx);
    const rf = pick(runFrequencies);
    const threshold = category === "trademark_own" ? 85 : category === "competitor" ? 80 : 70;
    const namePrefix =
      category === "trademark_own" ? "Marca propia" : category === "competitor" ? "Competidor" : "Mercado";

    const { data: wl, error: wlErr } = await svc
      .from("watchlists")
      .insert({
        organization_id: organizationId,
        owner_type: "tenant",
        name: `${namePrefix} #${idx} — ${(terms[0] ?? "").toString()}`,
        description: `(DEMO) Vigilancia ${namePrefix.toLowerCase()} con criterios de similitud configurados.`,
        type: "trademark",
        watch_terms: terms,
        watch_classes: randomNiceClasses(),
        watch_jurisdictions: [...jurisdictions],
        similarity_threshold: threshold,
        filter_config: {
          demo: true,
          category,
          match_types: similarityTypes.map((t) => t.key),
        },
        notify_email: true,
        notify_in_app: true,
        notify_frequency: rf === "daily" ? "daily" : "weekly",
        notify_users: notifyUsers,
        is_active: true,
        last_run_at: isoTs(daysAgo(1 + Math.floor(Math.random() * 14))),
        next_run_at: isoTs(daysFromNow(rf === "daily" ? 1 : 7)),
        run_frequency: rf,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
        matter_id: pick(matterIds),
      })
      .select("id")
      .single();
    if (wlErr) throw wlErr;
    await registerEntity(svc, runId, "watchlists", wl.id);
    watchlists.push({ id: wl.id, category });
  }

  // Create 200 watch_results + 200 spider_alerts
  const statuses = shuffle(statusBuckets200());

  for (let i = 0; i < statuses.length; i++) {
    const wl = pick(watchlists);
    const resultStatus = statuses[i];
    const foundAt = daysAgo(1 + Math.floor(Math.random() * 120));
    const sim = pick(similarityTypes);
    const scoreJitter = Math.floor(Math.random() * 6) - 3; // -3..+2
    const similarityScore = Math.max(0, Math.min(100, sim.baseScore + scoreJitter));
    const severity = severityFromScore(similarityScore);
    const priority = priorityFromSeverity(severity);
    const classes = randomNiceClasses();

    const seed = `${orgSlug}-${wl.id.slice(0, 8)}-${i + 1}`;
    const title = `Marca detectada: ${pick(["NEXUSA", "NEXUSI", "NEXUS PRO", "IP NEXUS", "NEXXUS"])}`;

    const reviewedAt = resultStatus === "new" ? null : isoTs(daysAgo(Math.floor(Math.random() * 45)));
    const reviewedBy = resultStatus === "new" ? null : pick(notifyUsers);

    const isActioned = resultStatus === "actioned";
    const actionTaken = isActioned
      ? pick(["opposition", "cease_and_desist", "client_notified", "docket_task_created"])
      : null;
    const actionDate = isActioned ? isoTs(daysAgo(Math.floor(Math.random() * 20))) : null;

    const oppositionDeadline = Math.random() < 0.35 ? isoDate(daysFromNow(5 + Math.floor(Math.random() * 60))) : null;

    const { data: wr, error: wrErr } = await svc
      .from("watch_results")
      .insert({
        organization_id: organizationId,
        watchlist_id: wl.id,
        result_type: pick(["trademark_published", "trademark_filing"] as const),
        title,
        description: `(DEMO) Coincidencia ${sim.label}. Categoría vigilancia: ${wl.category}.`,
        source: pick(["ES-OEPM", "EUIPO", "USPTO"] as const),
        source_url: sourceUrl(seed),
        source_id: `DEMO-${seed}`,
        applicant_name: pick(["Demo Legal SL", "Innovate Labs Inc", "Marca Global GmbH", "Servicios Nexus SRL"]),
        applicant_country: pick(["ES", "US", "DE", "FR", "IT"]),
        filing_date: isoDate(daysAgo(30 + Math.floor(Math.random() * 240))),
        publication_date: isoDate(foundAt),
        classes,
        similarity_score: similarityScore,
        similarity_type: sim.key,
        similarity_details: {
          matched_term: pick(buildWatchTerms(wl.category, i + 1)),
          phonetic_score: sim.key === "phonetic" || sim.key === "identical" ? similarityScore : Math.max(40, similarityScore - 15),
          visual_score: sim.key === "visual" || sim.key === "identical" ? similarityScore : Math.max(35, similarityScore - 18),
          conceptual_score: Math.max(30, similarityScore - 22),
          analysis: `(DEMO) Evaluación automática: ${sim.label}.`,
        },
        screenshot_url: screenshotUrl(seed),
        status: resultStatus,
        priority,
        action_taken: actionTaken,
        action_date: actionDate,
        action_by: isActioned ? pick(notifyUsers) : null,
        action_notes: isActioned
          ? `(DEMO) Acción tomada: ${actionTaken}. Próximos pasos registrados en docket.`
          : resultStatus === "dismissed"
            ? "(DEMO) Revisado: no relevante para la cartera."
            : null,
        related_matter_id: pick(matterIds),
        opposition_deadline: oppositionDeadline,
        detected_at: isoTs(foundAt),
        reviewed_at: reviewedAt,
        reviewed_by: reviewedBy,
        raw_data: {
          demo: true,
          match_type: sim.key,
          jurisdiction: pick(jurisdictions),
          watchlist_category: wl.category,
        },
      })
      .select("id")
      .single();
    if (wrErr) throw wrErr;
    await registerEntity(svc, runId, "watch_results", wr.id);

    const alertStatus = alertStatusFromResultStatus(resultStatus);
    const alertType = resultStatus === "actioned" && oppositionDeadline ? "opposition_window" : alertTypeForSimilarity(sim.key);
    const alertTitle =
      resultStatus === "actioned"
        ? "Acción registrada sobre coincidencia"
        : resultStatus === "dismissed"
          ? "Coincidencia revisada"
          : "Nueva coincidencia detectada";

    const { data: al, error: alErr } = await svc
      .from("spider_alerts")
      .insert({
        organization_id: organizationId,
        watchlist_id: wl.id,
        watch_result_id: wr.id,
        matter_id: pick(matterIds),
        alert_type: alertType,
        title: `(DEMO) ${alertTitle}`,
        message:
          resultStatus === "actioned"
            ? `(DEMO) Se registró una acción (${actionTaken}) sobre una coincidencia ${sim.label}.`
            : `(DEMO) Coincidencia ${sim.label} con score ${similarityScore}/100.`,
        severity,
        status: alertStatus,
        action_url: `/app/spider/results/${wr.id}`,
        notified_at: isoTs(foundAt),
        notified_via: ["in_app"],
        read_at: alertStatus === "unread" ? null : isoTs(daysAgo(Math.floor(Math.random() * 20))),
        read_by: alertStatus === "unread" ? null : pick(notifyUsers),
        actioned_at: alertStatus === "actioned" ? isoTs(daysAgo(Math.floor(Math.random() * 15))) : null,
        actioned_by: alertStatus === "actioned" ? pick(notifyUsers) : null,
        data: {
          demo: true,
          similarity_score: similarityScore,
          similarity_type: sim.key,
          screenshot_url: screenshotUrl(seed),
          match_label: sim.label,
          result_status: resultStatus,
          action_taken: actionTaken,
        },
      })
      .select("id")
      .single();
    if (alErr) throw alErr;
    await registerEntity(svc, runId, "spider_alerts", al.id);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) {
      return json(
        { error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    const token = getBearerToken(req);
    if (!token) return json({ error: "Unauthorized" }, { status: 401 });

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr) return json({ error: authErr.message }, { status: 401 });
    const callerId = authData.user?.id;
    if (!callerId) return json({ error: "Unauthorized" }, { status: 401 });

    const svc = createClient(url, serviceKey);
    await assertIsSuperadmin(svc, callerId);

    const targets: DemoOrgSlug[] = ["demo-starter", "demo-professional", "demo-business", "demo-enterprise"];
    const results: Array<{ slug: DemoOrgSlug; run_id: string }> = [];

    for (const slug of targets) {
      const orgId = await getOrgIdBySlug(svc, slug);
      const runId = await createRun(svc, orgId, callerId, "spider-vigilance-v1");
      await seedSpiderForOrg({ svc, organizationId: orgId, runId, createdBy: callerId, orgSlug: slug });
      await completeRun(svc, runId);
      results.push({ slug, run_id: runId });
    }

    return json({ ok: true, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, { status: 500 });
  }
});
