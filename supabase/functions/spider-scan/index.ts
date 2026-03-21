import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Text normalization (same as spider-analyze) ───
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ─── Sleep helper ───
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── TMView API search ───
interface TMViewResult {
  applicationNumber: string | null;
  markName: string;
  applicant: string | null;
  applicantCountry: string | null;
  filingDate: string | null;
  publicationDate: string | null;
  niceClasses: number[];
  goodsServices: string | null;
  status: string | null;
  imageUrl: string | null;
  jurisdiction: string;
  sourceUrl: string | null;
}

async function searchTMView(
  watchName: string,
  offices: string[],
  dateFrom?: string,
  dateTo?: string,
  retries = 3
): Promise<{ results: TMViewResult[]; succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];
  const allResults: TMViewResult[] = [];

  for (const office of offices) {
    let attempt = 0;
    let done = false;
    while (attempt < retries && !done) {
      attempt++;
      try {
        const params: Record<string, string> = {
          basicSearch: watchName,
          offices: office,
          trademarkStatus: "Filed,Published,Registered",
        };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const qs = new URLSearchParams(params).toString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const resp = await fetch(
          `https://www.tmdn.org/tmview/api/trademark/search?${qs}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (resp.status === 429) {
          // Rate limited — exponential backoff
          const waitMs = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(`TMView rate limited for ${office}, waiting ${waitMs}ms`);
          await sleep(waitMs);
          continue;
        }

        if (!resp.ok) {
          console.error(`TMView ${office} error: ${resp.status}`);
          if (attempt >= retries) failed.push(office);
          continue;
        }

        const data = await resp.json();
        const trademarks = data?.trademarks ?? data?.results ?? [];

        if (Array.isArray(trademarks)) {
          for (const tm of trademarks) {
            allResults.push({
              applicationNumber:
                tm.applicationNumber ?? tm.ST13 ?? tm.applicationId ?? null,
              markName:
                tm.markName ??
                tm.wordElement ??
                tm.tmName ??
                tm.name ??
                "Unknown",
              applicant:
                tm.applicantName ?? tm.holderName ?? tm.applicant ?? null,
              applicantCountry:
                tm.applicantCountryCode ?? tm.holderCountry ?? null,
              filingDate: tm.filingDate ?? tm.applicationDate ?? null,
              publicationDate: tm.publicationDate ?? null,
              niceClasses: Array.isArray(tm.niceClasses)
                ? tm.niceClasses.map(Number)
                : Array.isArray(tm.niceClassNumbers)
                ? tm.niceClassNumbers.map(Number)
                : [],
              goodsServices:
                tm.goodsAndServices ?? tm.goodsServicesDescription ?? null,
              status: tm.status ?? tm.markStatus ?? null,
              imageUrl: tm.markImageURI ?? tm.imageUrl ?? null,
              jurisdiction: office,
              sourceUrl: tm.detailUrl ?? null,
            });
          }
        }
        succeeded.push(office);
        done = true;

        // Rate limit: small delay between offices
        if (offices.indexOf(office) < offices.length - 1) {
          await sleep(2000);
        }
      } catch (e) {
        console.error(`TMView ${office} attempt ${attempt} failed:`, e);
        if (attempt >= retries) failed.push(office);
        else {
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }
  }

  return { results: allResults, succeeded, failed };
}

// ─── EUIPO eSearch (for EM jurisdiction) ───
async function searchEUIPO(
  watchName: string
): Promise<TMViewResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(
      `https://euipo.europa.eu/eSearch/api/trademark/search?text=${encodeURIComponent(watchName)}&status=Filed,Published,Registered`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`EUIPO eSearch error: ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const items = data?.results ?? data?.trademarks ?? [];
    return Array.isArray(items)
      ? items.map((tm: Record<string, unknown>) => ({
          applicationNumber:
            (tm.applicationNumber as string) ?? (tm.ST13 as string) ?? null,
          markName:
            (tm.markName as string) ??
            (tm.wordElement as string) ??
            "Unknown",
          applicant: (tm.applicantName as string) ?? null,
          applicantCountry: (tm.applicantCountryCode as string) ?? null,
          filingDate: (tm.filingDate as string) ?? null,
          publicationDate: (tm.publicationDate as string) ?? null,
          niceClasses: Array.isArray(tm.niceClasses)
            ? (tm.niceClasses as number[]).map(Number)
            : [],
          goodsServices: (tm.goodsAndServices as string) ?? null,
          status: (tm.status as string) ?? null,
          imageUrl: (tm.markImageURI as string) ?? null,
          jurisdiction: "EM",
          sourceUrl: (tm.detailUrl as string) ?? null,
        }))
      : [];
  } catch (e) {
    console.error("EUIPO eSearch failed:", e);
    return [];
  }
}

// ─── Perplexity fallback (low reliability) ───
async function searchPerplexity(
  watchName: string,
  jurisdiction: string,
  apiKey: string
): Promise<TMViewResult[]> {
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content:
              `Search for recently filed or published trademarks similar to "${watchName}" in jurisdiction ${jurisdiction}. ` +
              `Return JSON array (max 10): [{"markName":"...", "applicationNumber":"...", "applicant":"...", "filingDate":"YYYY-MM-DD", "niceClasses":[numbers]}]. ` +
              `Only return the JSON array, no markdown, no extra text.`,
          },
        ],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!resp.ok) {
      console.warn(`Perplexity error: ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.map((tm: Record<string, unknown>) => ({
          applicationNumber: (tm.applicationNumber as string) ?? null,
          markName: (tm.markName as string) ?? "Unknown",
          applicant: (tm.applicant as string) ?? null,
          applicantCountry: null,
          filingDate: (tm.filingDate as string) ?? null,
          publicationDate: (tm.publicationDate as string) ?? null,
          niceClasses: Array.isArray(tm.niceClasses)
            ? (tm.niceClasses as number[]).map(Number)
            : [],
          goodsServices: null,
          status: null,
          imageUrl: null,
          jurisdiction,
          sourceUrl: null,
        }));
      }
    } catch {
      console.warn("Perplexity parse failed for", jurisdiction);
    }

    return [];
  } catch (e) {
    console.error("Perplexity search failed:", e);
    return [];
  }
}

// ─── MAIN ───
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // ─── 0. Auth: org_id from JWT ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const svc = createClient(supabaseUrl, serviceKey);

    // Get user's org_id (NEVER from body)
    const { data: profile } = await svc
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id)
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const orgId: string = profile.organization_id;

    // ─── 1. Verify spider access ───
    const { data: hasAccess } = await svc.rpc("verify_spider_access", {
      p_org_id: orgId,
    });
    if (!hasAccess)
      return new Response(
        JSON.stringify({ error: "Spider module not active" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    // ─── 2. Parse body ───
    const body = await req.json();
    const {
      watch_id,
      scan_type = "manual",
      date_from,
      date_to,
    }: {
      watch_id?: string;
      scan_type?: string;
      date_from?: string;
      date_to?: string;
    } = body;

    // ─── 3. Get tenant config ───
    const { data: tenantConfig } = await svc
      .from("spider_tenant_config")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single();

    if (!tenantConfig)
      return new Response(
        JSON.stringify({ error: "Spider not configured for tenant" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    // ─── 4. Check monthly scan limit ───
    // Count scans this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: scansThisMonth } = await svc
      .from("spider_scan_runs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("started_at", monthStart.toISOString());

    if (
      tenantConfig.max_scans_per_month > 0 &&
      (scansThisMonth ?? 0) >= tenantConfig.max_scans_per_month
    ) {
      return new Response(
        JSON.stringify({
          error: "monthly_scan_limit_reached",
          message: `Límite mensual de escaneos alcanzado (${tenantConfig.max_scans_per_month})`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 5. Get watches to scan (ALWAYS filtered by org_id) ───
    let watchQuery = svc
      .from("spider_watches")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (watch_id) {
      watchQuery = watchQuery.eq("id", watch_id);
    } else {
      // Only watches due for scanning
      watchQuery = watchQuery.lte("next_scan_at", new Date().toISOString());
    }

    const { data: watches, error: watchesError } = await watchQuery;

    if (watchesError || !watches?.length) {
      return new Response(
        JSON.stringify({
          message: "No watches due for scanning",
          watches_found: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 6. Process each watch ───
    const scanResults: Record<string, unknown>[] = [];

    for (const watch of watches) {
      // Check alert limit before processing
      if (
        tenantConfig.max_alerts_per_month > 0 &&
        (tenantConfig.alerts_this_month ?? 0) >=
          tenantConfig.max_alerts_per_month
      ) {
        console.warn(`Tenant ${orgId} alert limit reached, stopping`);
        break;
      }

      // Create scan run
      const { data: scanRun } = await svc
        .from("spider_scan_runs")
        .insert({
          organization_id: orgId,
          watch_id: watch.id,
          scan_type,
          jurisdictions_attempted: watch.jurisdictions ?? [],
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!scanRun) {
        console.error("Failed to create scan run for watch", watch.id);
        continue;
      }

      const runId = scanRun.id;
      let alertsCreated = 0;
      let alertsUpdated = 0;
      let alertsSkippedCache = 0;
      let comparisons = 0;
      let marksScanned = 0;
      const sourcesUsed: string[] = [];
      const jurisdictionsSucceeded: string[] = [];
      const jurisdictionsFailed: string[] = [];
      const errorsByJurisdiction: Record<string, string> = {};

      try {
        const jurisdictions: string[] = watch.jurisdictions ?? [];

        // ─── Source 1: TMView (principal) ───
        const tmviewResult = await searchTMView(
          watch.watch_name,
          jurisdictions,
          date_from,
          date_to
        );

        if (tmviewResult.results.length > 0) sourcesUsed.push("TMVIEW");
        jurisdictionsSucceeded.push(...tmviewResult.succeeded);
        jurisdictionsFailed.push(...tmviewResult.failed);

        for (const j of tmviewResult.failed) {
          errorsByJurisdiction[j] = "TMView search failed";
        }

        let allResults: (TMViewResult & { sourceCode: string; reliability: string })[] =
          tmviewResult.results.map((r) => ({
            ...r,
            sourceCode: "TMVIEW",
            reliability: "high",
          }));

        // ─── Source 2: EUIPO eSearch (only if EM in jurisdictions) ───
        if (jurisdictions.includes("EM")) {
          const euipoResults = await searchEUIPO(watch.watch_name);
          if (euipoResults.length > 0) {
            sourcesUsed.push("EUIPO");
            // Merge, dedupe by applicationNumber
            const existingAppNums = new Set(
              allResults
                .filter((r) => r.applicationNumber)
                .map((r) => r.applicationNumber)
            );
            for (const r of euipoResults) {
              if (r.applicationNumber && existingAppNums.has(r.applicationNumber))
                continue;
              allResults.push({ ...r, sourceCode: "EUIPO", reliability: "high" });
            }
          }
        }

        // ─── Source 3: Perplexity fallback (ONLY for failed jurisdictions) ───
        if (tmviewResult.failed.length > 0 && perplexityKey) {
          for (const failedJur of tmviewResult.failed) {
            const pxResults = await searchPerplexity(
              watch.watch_name,
              failedJur,
              perplexityKey
            );
            if (pxResults.length > 0) {
              if (!sourcesUsed.includes("AI_SEARCH"))
                sourcesUsed.push("AI_SEARCH");
              for (const r of pxResults) {
                allResults.push({
                  ...r,
                  sourceCode: "AI_SEARCH",
                  reliability: "low",
                });
              }
              // Remove from failed since we got fallback data
              const idx = jurisdictionsFailed.indexOf(failedJur);
              if (idx >= 0) jurisdictionsFailed.splice(idx, 1);
              jurisdictionsSucceeded.push(failedJur);
              errorsByJurisdiction[failedJur] =
                "TMView failed, Perplexity fallback used (low reliability)";
            }
          }
        }

        marksScanned = allResults.length;

        // ─── Process each detected mark ───
        for (const detected of allResults) {
          comparisons++;

          const detectedNorm = normalize(detected.markName);
          const watchNorm = normalize(watch.watch_name);

          // Skip if same as watched mark
          if (detectedNorm === watchNorm) continue;

          // ─── Anti-duplicate check (organization_id FIRST) ───
          let isDuplicate = false;

          if (detected.applicationNumber) {
            // Check 1: by application number
            const { data: existing } = await svc
              .from("spider_alerts")
              .select("id, opposition_days_remaining")
              .eq("organization_id", orgId)
              .eq("watch_id", watch.id)
              .eq("detected_application_number", detected.applicationNumber)
              .neq("status", "false_positive")
              .maybeSingle();

            if (existing) {
              isDuplicate = true;
              alertsUpdated++;
            }
          } else {
            // Check 2: by normalized name (30-day window)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: existing } = await svc
              .from("spider_alerts")
              .select("id")
              .eq("organization_id", orgId)
              .eq("watch_id", watch.id)
              .eq("detected_mark_name_normalized", detectedNorm)
              .eq("detected_jurisdiction", detected.jurisdiction)
              .gt("detected_at", thirtyDaysAgo.toISOString())
              .maybeSingle();

            if (existing) {
              isDuplicate = true;
              alertsSkippedCache++;
            }
          }

          if (isDuplicate) continue;

          // ─── Call spider-analyze (server-to-server with service role) ───
          let analysisResult: Record<string, unknown> | null = null;
          try {
            const analyzeResp = await fetch(
              `${supabaseUrl}/functions/v1/spider-analyze`,
              {
                method: "POST",
                headers: {
                  Authorization: authHeader,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  watch_id: watch.id,
                  watch_name: watch.watch_name,
                  detected_mark_name: detected.markName,
                  detected_application_number: detected.applicationNumber,
                  detected_jurisdiction: detected.jurisdiction,
                  detected_nice_classes: detected.niceClasses,
                  watch_nice_classes: watch.nice_classes,
                  detected_publication_date: detected.publicationDate,
                  detected_filing_date: detected.filingDate,
                  check_visual: watch.check_visual ?? false,
                  watch_mark_image_url: watch.mark_image_url,
                  detected_mark_image_url: detected.imageUrl,
                }),
              }
            );

            if (analyzeResp.ok) {
              analysisResult = await analyzeResp.json();
            } else {
              console.error(
                `spider-analyze failed for ${detected.markName}: ${analyzeResp.status}`
              );
              // Continue processing without analysis — use basic phonetic
            }
          } catch (e) {
            console.error("spider-analyze call error:", e);
          }

          // Get combined score
          const combinedScore =
            (analysisResult?.combined_score as number) ?? 0;
          const threshold = watch.similarity_threshold ??
            tenantConfig.default_similarity_threshold ?? 70;

          // Skip if below threshold
          if (combinedScore < threshold) continue;

          // ─── Create alert ───
          const severity = (analysisResult?.severity as string) ?? "low";
          const { data: newAlert } = await svc
            .from("spider_alerts")
            .insert({
              organization_id: orgId,
              watch_id: watch.id,
              matter_id: watch.matter_id,
              detected_mark_name: detected.markName,
              detected_mark_name_normalized: detectedNorm,
              detected_application_number: detected.applicationNumber,
              detected_filing_date: detected.filingDate,
              detected_publication_date: detected.publicationDate,
              detected_applicant: detected.applicant,
              detected_applicant_country: detected.applicantCountry,
              detected_jurisdiction: detected.jurisdiction,
              detected_nice_classes: detected.niceClasses,
              detected_goods_services: detected.goodsServices,
              detected_mark_image_url: detected.imageUrl,
              detected_mark_status: detected.status ?? "pending",
              source_code: detected.sourceCode,
              source_url: detected.sourceUrl,
              source_reliability: detected.reliability,
              phonetic_score: analysisResult?.phonetic_score ?? null,
              visual_score: analysisResult?.visual_score ?? null,
              semantic_score: analysisResult?.semantic_score ?? null,
              combined_score: combinedScore,
              weight_phonetic_used:
                (analysisResult?.weights_used as Record<string, number>)
                  ?.phonetic ?? null,
              weight_semantic_used:
                (analysisResult?.weights_used as Record<string, number>)
                  ?.semantic ?? null,
              weight_visual_used:
                (analysisResult?.weights_used as Record<string, number>)
                  ?.visual ?? null,
              severity,
              opposition_deadline:
                (analysisResult?.opposition_deadline as string) ?? null,
              opposition_days_remaining:
                (analysisResult?.opposition_days_remaining as number) ?? null,
              ai_analysis: (analysisResult?.ai_analysis as string) ?? null,
              ai_risk_level: (analysisResult?.ai_risk_level as string) ?? null,
              ai_recommendation:
                (analysisResult?.ai_recommendation as string) ?? null,
              ai_key_factors:
                (analysisResult?.ai_key_factors as string[]) ?? null,
              ai_disclaimer: (analysisResult?.ai_disclaimer as string) ?? null,
              status: "new",
            })
            .select("id")
            .single();

          if (newAlert) {
            alertsCreated++;

            // Insert immutable history
            await svc.from("spider_alert_history").insert({
              organization_id: orgId,
              alert_id: newAlert.id,
              event_type: "created",
              new_status: "new",
              performed_by: user.id,
              notes: `Auto-detected by ${scan_type} scan`,
              metadata: {
                source_code: detected.sourceCode,
                combined_score: combinedScore,
                severity,
              },
            });

            // Notification for tenant users only
            const { data: tenantUsers } = await svc
              .from("profiles")
              .select("id")
              .eq("organization_id", orgId);

            if (tenantUsers?.length) {
              const notifications = tenantUsers.map((u) => ({
                user_id: u.id,
                organization_id: orgId,
                type: "spider_alert",
                title: `🕷️ Nueva alerta: ${detected.markName}`,
                message: `Se detectó "${detected.markName}" similar a "${watch.watch_name}" (${combinedScore}% - ${severity})`,
                severity:
                  severity === "critical" || severity === "high"
                    ? "high"
                    : "medium",
                metadata: {
                  alert_id: newAlert.id,
                  watch_id: watch.id,
                  combined_score: combinedScore,
                },
              }));

              await svc.from("notifications").insert(notifications);
            }

            // Update tenant alert counter
            await svc
              .from("spider_tenant_config")
              .update({
                alerts_this_month:
                  (tenantConfig.alerts_this_month ?? 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("organization_id", orgId);
          }
        }

        // ─── Complete scan run ───
        const completedAt = new Date();
        const startedAt = new Date(scanRun.id ? Date.now() : Date.now());
        await svc
          .from("spider_scan_runs")
          .update({
            status:
              jurisdictionsFailed.length === 0
                ? "completed"
                : jurisdictionsFailed.length ===
                  (watch.jurisdictions ?? []).length
                ? "failed"
                : "partial",
            jurisdictions_succeeded: jurisdictionsSucceeded,
            jurisdictions_failed: jurisdictionsFailed,
            sources_used: sourcesUsed,
            marks_scanned: marksScanned,
            comparisons_made: comparisons,
            alerts_created: alertsCreated,
            alerts_updated: alertsUpdated,
            alerts_skipped_cache: alertsSkippedCache,
            completed_at: completedAt.toISOString(),
            errors_by_jurisdiction: errorsByJurisdiction,
          })
          .eq("id", runId)
          .eq("organization_id", orgId);

        // Update watch timestamps
        const nextScanMap: Record<string, number> = {
          hourly: 60 * 60 * 1000,
          daily: 24 * 60 * 60 * 1000,
          weekly: 7 * 24 * 60 * 60 * 1000,
          monthly: 30 * 24 * 60 * 60 * 1000,
        };
        const freq = watch.scan_frequency ?? "daily";
        const nextScan = new Date(
          Date.now() + (nextScanMap[freq] ?? nextScanMap.daily)
        );

        await svc
          .from("spider_watches")
          .update({
            last_scanned_at: new Date().toISOString(),
            next_scan_at: nextScan.toISOString(),
            total_alerts_generated:
              (watch.total_alerts_generated ?? 0) + alertsCreated,
            active_alerts_count:
              (watch.active_alerts_count ?? 0) + alertsCreated,
            updated_at: new Date().toISOString(),
          })
          .eq("id", watch.id)
          .eq("organization_id", orgId);

        // Audit log
        await svc.from("activity_log").insert({
          organization_id: orgId,
          entity_type: "spider_scan",
          entity_id: runId,
          action: "completed",
          description: `Scan ${scan_type}: ${watch.watch_name} → ${marksScanned} marks, ${alertsCreated} alerts`,
          metadata: {
            watch_id: watch.id,
            scan_type,
            marks_scanned: marksScanned,
            alerts_created: alertsCreated,
            jurisdictions_succeeded: jurisdictionsSucceeded,
            jurisdictions_failed: jurisdictionsFailed,
          },
          created_by: user.id,
        });

        scanResults.push({
          watch_id: watch.id,
          watch_name: watch.watch_name,
          run_id: runId,
          status:
            jurisdictionsFailed.length === 0
              ? "completed"
              : jurisdictionsFailed.length ===
                (watch.jurisdictions ?? []).length
              ? "failed"
              : "partial",
          marks_scanned: marksScanned,
          comparisons,
          alerts_created: alertsCreated,
          alerts_updated: alertsUpdated,
          alerts_skipped: alertsSkippedCache,
          jurisdictions_succeeded: jurisdictionsSucceeded,
          jurisdictions_failed: jurisdictionsFailed,
          sources_used: sourcesUsed,
        });
      } catch (watchError) {
        console.error(`Error processing watch ${watch.id}:`, watchError);

        // Mark run as failed
        await svc
          .from("spider_scan_runs")
          .update({
            status: "failed",
            error_message:
              watchError instanceof Error
                ? watchError.message
                : "Unknown error",
            completed_at: new Date().toISOString(),
          })
          .eq("id", runId)
          .eq("organization_id", orgId);

        scanResults.push({
          watch_id: watch.id,
          watch_name: watch.watch_name,
          run_id: runId,
          status: "failed",
          error:
            watchError instanceof Error
              ? watchError.message
              : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        organization_id: orgId,
        scan_type,
        watches_processed: watches.length,
        results: scanResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("spider-scan error:", e);
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
