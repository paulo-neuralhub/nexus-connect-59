import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

type DemoOrgSlug = "demo-starter" | "demo-professional" | "demo-business" | "demo-enterprise";

type MatterStatus =
  | "draft"
  | "filed"
  | "pending_examination"
  | "published"
  | "opposition_period"
  | "under_opposition"
  | "granted"
  | "registered"
  | "renewed"
  | "rejected"
  | "withdrawn"
  | "expired";

type MatterType = "trademark" | "patent" | "design" | "tradename";

type JurCode = "ES" | "EU" | "US" | "EP" | "PCT" | "MX" | "CN" | "JP";

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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pad(n: number, size = 4) {
  return String(n).padStart(size, "0");
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function avatarLogoUrl(seed: string) {
  const s = encodeURIComponent(seed.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}&backgroundType=gradientLinear`;
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

function buildStatusPlan(): Array<{ status: MatterStatus; count: number }> {
  return [
    { status: "draft", count: 10 },
    { status: "filed", count: 15 },
    { status: "pending_examination", count: 20 },
    { status: "published", count: 15 },
    { status: "opposition_period", count: 5 },
    { status: "under_opposition", count: 3 },
    // Split granted/registered to cover both labels
    { status: "granted", count: 50 },
    { status: "registered", count: 50 },
    { status: "renewed", count: 20 },
    { status: "rejected", count: 5 },
    { status: "withdrawn", count: 3 },
    { status: "expired", count: 5 },
  ];
}

function expand<T extends string>(plan: Array<{ value: T; count: number }>): T[] {
  const out: T[] = [];
  for (const p of plan) out.push(...Array.from({ length: p.count }).map(() => p.value));
  return out;
}

function buildTypePool(total: number): MatterType[] {
  // 60/25/10/5
  const counts = {
    trademark: Math.round(total * 0.6),
    patent: Math.round(total * 0.25),
    design: Math.round(total * 0.1),
    tradename: Math.max(1, total - (Math.round(total * 0.6) + Math.round(total * 0.25) + Math.round(total * 0.1))),
  };
  const pool: MatterType[] = [];
  pool.push(...Array.from({ length: counts.trademark }).map(() => "trademark" as const));
  pool.push(...Array.from({ length: counts.patent }).map(() => "patent" as const));
  pool.push(...Array.from({ length: counts.design }).map(() => "design" as const));
  pool.push(...Array.from({ length: counts.tradename }).map(() => "tradename" as const));
  return shuffle(pool).slice(0, total);
}

function buildJurPool(total: number): JurCode[] {
  // 40/25/15/10/5/5 (others split)
  const es = Math.round(total * 0.4);
  const eu = Math.round(total * 0.25);
  const us = Math.round(total * 0.15);
  const ep = Math.round(total * 0.1);
  const pct = Math.round(total * 0.05);
  const rest = Math.max(0, total - (es + eu + us + ep + pct));

  const others: JurCode[] = [];
  const otherCodes: JurCode[] = ["MX", "CN", "JP"];
  for (let i = 0; i < rest; i++) others.push(otherCodes[i % otherCodes.length]);

  const pool: JurCode[] = [];
  pool.push(...Array.from({ length: es }).map(() => "ES" as const));
  pool.push(...Array.from({ length: eu }).map(() => "EU" as const));
  pool.push(...Array.from({ length: us }).map(() => "US" as const));
  pool.push(...Array.from({ length: ep }).map(() => "EP" as const));
  pool.push(...Array.from({ length: pct }).map(() => "PCT" as const));
  pool.push(...others);
  return shuffle(pool).slice(0, total);
}

function niceClassSet() {
  const sets: number[][] = [
    [9, 35],
    [3, 5, 10],
    [25],
    [29, 30, 32],
    [41, 42, 45],
    [1, 9, 42],
  ];
  return pick(sets);
}

function makePriorityNotes(j: JurCode) {
  const candidates: JurCode[] = shuffle(["US", "EP", "PCT", "MX", "CN", "JP", "EU", "ES"] as JurCode[]);
  const picked = candidates.filter((x) => x !== j).slice(0, pick([1, 2, 3]));
  const lines = picked.map((c) => `• Prioridad reclamada: ${c} — ${isoDate(daysAgo(300 + Math.floor(Math.random() * 900)))}`);
  return lines.length ? `Prioridades:\n${lines.join("\n")}` : "";
}

async function seedCoverageForOrg(params: {
  svc: any;
  organizationId: string;
  runId: string;
  createdBy: string;
  orgSlug: DemoOrgSlug;
}) {
  const { svc, organizationId, runId, createdBy, orgSlug } = params;

  // Pick company names from existing contacts to make owner_name realistic
  const { data: companies, error: compErr } = await svc
    .from("contacts")
    .select("name")
    .eq("organization_id", organizationId)
    .eq("type", "company")
    .limit(200);
  if (compErr) throw compErr;
  const ownerNames: string[] = (companies ?? []).map((c: any) => String(c.name)).filter(Boolean);
  const ownerFallback = `${orgSlug.toUpperCase()} Client`;

  const statusList = buildStatusPlan().flatMap((p) => Array.from({ length: p.count }).map(() => p.status));
  const total = statusList.length;
  const typePool = buildTypePool(total);
  const jurPool = buildJurPool(total);

  const statuses = shuffle(statusList);

  // Create a few families (root + children). We'll assign family_root_id later.
  const familyCount = 18;
  const familyRoots: string[] = [];

  // Build some roots first
  for (let f = 0; f < familyCount; f++) {
    const owner: string = ownerNames.length ? pick(ownerNames) : ownerFallback;
    const jur = pick(jurPool);
    const ref = `${orgSlug}-FAM-${pad(f + 1, 3)}`.toUpperCase();
    const mark = `${owner.split(" ")[0].toUpperCase()} FAMILY ${f + 1}`;

    const filing = daysAgo(900 + Math.floor(Math.random() * 1200));
    const expiry = addYears(filing, 10);
    const nextRen = daysAgo(-180) < expiry ? addYears(filing, 9) : addYears(filing, 9);

    const { data: root, error: rootErr } = await svc
      .from("matters")
      .insert({
        organization_id: organizationId,
        reference: ref,
        title: `Family Root — ${mark}`,
        type: "trademark",
        status: "registered",
        jurisdiction: jur,
        jurisdiction_code: jur,
        filing_date: isoDate(filing),
        registration_date: isoDate(addYears(filing, 1)),
        expiry_date: isoDate(expiry),
        next_renewal_date: isoDate(nextRen),
        mark_name: mark,
        mark_type: "word",
        nice_classes: niceClassSet(),
        owner_name: owner,
        tags: ["demo", "family_root"],
        notes: `Familia DEMO.\n${makePriorityNotes(jur)}`,
        created_by: createdBy,
        mark_image_url: avatarLogoUrl(mark),
        images: [avatarLogoUrl(mark)],
        family_position: { role: "root", family: f + 1 },
      })
      .select("id")
      .single();
    if (rootErr) throw rootErr;
    familyRoots.push(root.id);
    await registerEntity(svc, runId, "matters", root.id);
  }

  for (let i = 0; i < total; i++) {
    const status = statuses[i];
    const type = typePool[i] ?? "trademark";
    const jur = jurPool[i] ?? "ES";

    const owner: string = ownerNames.length ? pick(ownerNames) : ownerFallback;
    const filing = daysAgo(30 + Math.floor(Math.random() * 2400));
    const reg = addYears(filing, 1);
    const expiry = addYears(filing, 10);
    const nextRenewal = addYears(filing, 9);

    const familyRootId = Math.random() < 0.45 ? pick(familyRoots) : null;
    const familyPos = familyRootId
      ? { role: "child", root_ref: familyRootId, note: "Relacionada por prioridad/estrategia." }
      : null;

    const reference = `${orgSlug}-${type.substring(0, 2).toUpperCase()}-${pad(i + 1)}-${jur}`;

    const baseTitle =
      type === "trademark"
        ? `Trademark — ${owner.split(" ")[0].toUpperCase()} ${pad(i + 1, 3)}`
        : type === "patent"
          ? `Patent — ${owner} (${i + 1})`
          : type === "design"
            ? `Design — ${owner} (${i + 1})`
            : `Trade name — ${owner}`;

    const markName =
      type === "trademark" || type === "tradename"
        ? `${owner.split(" ")[0].toUpperCase()} ${pad(i + 1, 3)}`
        : null;
    const logoUrl = markName ? avatarLogoUrl(markName) : null;

    const notesParts = [
      "Expediente DEMO para cubrir estados/tipos/jurisdicciones.",
      makePriorityNotes(jur),
      familyRootId ? `Familia relacionada: root_id=${familyRootId}` : "",
    ].filter((x) => x && x.trim().length);

    const { data: matter, error: mErr } = await svc
      .from("matters")
      .insert({
        organization_id: organizationId,
        reference,
        title: baseTitle,
        type,
        status,
        jurisdiction: jur,
        jurisdiction_code: jur,
        filing_date: isoDate(filing),
        registration_date: ["granted", "registered", "renewed"].includes(status) ? isoDate(reg) : null,
        registration_number:
          ["registered", "renewed"].includes(status) ? `${jur}-${Math.floor(100000 + Math.random() * 900000)}` : null,
        application_number: ["filed", "pending_examination", "published", "opposition_period", "under_opposition"].includes(status)
          ? `${jur}-${Math.floor(1000000 + Math.random() * 9000000)}`
          : null,
        expiry_date: ["registered", "granted", "renewed", "expired"].includes(status) ? isoDate(expiry) : null,
        next_renewal_date: ["registered", "granted", "renewed"].includes(status) ? isoDate(nextRenewal) : null,
        mark_name: markName,
        mark_type: markName ? pick(["word", "figurative", "mixed"]) : null,
        nice_classes: markName ? niceClassSet() : null,
        goods_services: markName ? "(DEMO) Bienes/servicios con múltiples clases Nice." : null,
        owner_name: owner,
        tags: [
          "demo",
          `type:${type}`,
          `status:${status}`,
          `jur:${jur}`,
          familyRootId ? "family" : "",
          markName ? "has_logo" : "",
        ].filter(Boolean),
        notes: notesParts.join("\n\n"),
        created_by: createdBy,
        mark_image_url: logoUrl,
        images: logoUrl ? [logoUrl] : null,
        family_root_id: familyRootId,
        family_position: familyPos,
        auto_renewal: status === "renewed" ? true : null,
        renewal_instructions: status === "renewed" ? "(DEMO) Renovación automática habilitada; confirmar tasas." : null,
        risk_score: Math.floor(Math.random() * 100),
      })
      .select("id")
      .single();
    if (mErr) throw mErr;
    await registerEntity(svc, runId, "matters", matter.id);
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
    const results: Array<{ slug: DemoOrgSlug; run_id: string; matters_created: number }> = [];

    for (const slug of targets) {
      const orgId = await getOrgIdBySlug(svc, slug);
      const runId = await createRun(svc, orgId, callerId, "matters-coverage-v1");
      await seedCoverageForOrg({ svc, organizationId: orgId, runId, createdBy: callerId, orgSlug: slug });
      await completeRun(svc, runId);
      // 201 + family roots
      results.push({ slug, run_id: runId, matters_created: 201 + 18 });
    }

    return json({ ok: true, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, { status: 500 });
  }
});
