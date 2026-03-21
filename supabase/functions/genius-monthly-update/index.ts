/**
 * genius-monthly-update — KNOWLEDGE-01 Phase 2
 * Superadmin-only. Scans priority jurisdictions for outdated content.
 * Uses advisory lock for concurrency. Max 10 jurisdictions per run.
 * Does NOT auto-update — creates queue items for review.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const MAX_JURISDICTIONS = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

  // --- Auth ---
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
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  // --- Superadmin check ---
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleRow) return json({ error: "Forbidden: super_admin required" }, 403);

  // --- Advisory lock ---
  const { data: lockResult } = await adminClient.rpc("pg_try_advisory_lock" as any, {
    key: 2147483647, // Stable hash for 'genius_monthly_update'
  });

  // pg_try_advisory_lock may not be exposed via RPC, fallback to raw check
  // We use a simpler approach: check a flag in genius_kb_update_queue
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: recentRun } = await adminClient
    .from("genius_kb_update_log")
    .select("id, created_at")
    .eq("action", "monthly_update_started")
    .gt("created_at", sixHoursAgo)
    .limit(1);

  if (recentRun && recentRun.length > 0) {
    return json(
      {
        error: "already_in_progress",
        message: "Monthly update was run within the last 6 hours",
        last_run: recentRun[0].created_at,
      },
      409
    );
  }

  if (!perplexityKey)
    return json({ error: "PERPLEXITY_API_KEY not configured" }, 500);

  // --- Log start ---
  await adminClient.from("genius_kb_update_log").insert({
    jurisdiction_code: "GLOBAL",
    action: "monthly_update_started",
    details: { triggered_by: user.id },
    performed_by: user.id,
  });

  // --- Priority 1: Complete/partial with stale verification (> 6 months) ---
  const sixMonthsAgo = new Date(
    Date.now() - 180 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: staleJurisdictions } = await adminClient
    .from("genius_knowledge_coverage")
    .select("jurisdiction_code, jurisdiction_name, coverage_level, last_verification")
    .in("coverage_level", ["complete", "partial"])
    .or(`last_verification.is.null,last_verification.lt.${sixMonthsAgo}`)
    .order("coverage_score", { ascending: false })
    .limit(MAX_JURISDICTIONS);

  // --- Priority 2: Madrid members without coverage ---
  const remaining = MAX_JURISDICTIONS - (staleJurisdictions?.length || 0);
  let madridUncovered: any[] = [];
  if (remaining > 0) {
    const { data } = await adminClient
      .from("genius_knowledge_coverage")
      .select(
        "jurisdiction_code, jurisdiction_name, coverage_level"
      )
      .eq("coverage_level", "none")
      .limit(remaining);

    // Filter by Madrid members via ipo_offices
    if (data && data.length > 0) {
      const codes = data.map((d: any) => d.jurisdiction_code);
      const { data: madridOffices } = await adminClient
        .from("ipo_offices")
        .select("jurisdiction_code")
        .in("jurisdiction_code", codes)
        .eq("is_madrid_member", true);

      const madridCodes = new Set(
        (madridOffices || []).map((o: any) => o.jurisdiction_code)
      );
      madridUncovered = data.filter((d: any) =>
        madridCodes.has(d.jurisdiction_code)
      );
    }
  }

  // --- Combine priority lists ---
  const allJurisdictions = [
    ...(staleJurisdictions || []),
    ...madridUncovered,
  ].slice(0, MAX_JURISDICTIONS);

  if (allJurisdictions.length === 0) {
    await adminClient.from("genius_kb_update_log").insert({
      jurisdiction_code: "GLOBAL",
      action: "monthly_update_completed",
      details: {
        jurisdictions_checked: 0,
        message: "No jurisdictions need updating",
      },
      performed_by: user.id,
    });

    return json({
      success: true,
      jurisdictions_checked: 0,
      no_changes: 0,
      changes_detected: 0,
      message: "No jurisdictions need updating",
    });
  }

  // --- Process each jurisdiction ---
  const results: {
    jurisdiction_code: string;
    status: "no_changes" | "changes_detected" | "error";
    details?: string;
  }[] = [];

  for (const jur of allJurisdictions) {
    try {
      // Skip if already locked/in-progress
      const { data: locked } = await adminClient
        .from("genius_kb_update_queue")
        .select("id")
        .eq("jurisdiction_code", jur.jurisdiction_code)
        .in("status", ["pending", "in_review", "processing"])
        .gt("lock_expires_at", new Date().toISOString())
        .limit(1);

      if (locked && locked.length > 0) {
        results.push({
          jurisdiction_code: jur.jurisdiction_code,
          status: "no_changes",
          details: "Already in review queue",
        });
        continue;
      }

      // Query Perplexity with sonar (cheaper)
      const resp = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content:
                "You are an IP law expert. Answer with ONLY 'NO_CHANGES' if nothing has changed, or provide a brief JSON summary of changes found.",
            },
            {
              role: "user",
              content: `Have there been any significant trademark law changes in ${jur.jurisdiction_name} (${jur.jurisdiction_code}) in the last 6 months? Check: fee updates, procedure changes, new filing requirements, office action deadline changes, opposition rule changes. If no changes, reply with exactly: NO_CHANGES`,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
          search_recency_filter: "month",
        }),
      });

      const respText = await resp.text();
      if (!resp.ok) {
        console.error(`Perplexity error for ${jur.jurisdiction_code}: ${resp.status}`);
        results.push({
          jurisdiction_code: jur.jurisdiction_code,
          status: "error",
          details: `API error ${resp.status}`,
        });
        continue;
      }

      const parsed = JSON.parse(respText);
      const content = parsed.choices?.[0]?.message?.content || "";
      const citations = parsed.citations || [];

      if (
        content.includes("NO_CHANGES") ||
        content.trim() === "NO_CHANGES"
      ) {
        // No changes — refresh verification timestamp
        await adminClient
          .from("genius_knowledge_coverage")
          .update({ last_verification: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("jurisdiction_code", jur.jurisdiction_code);

        await adminClient
          .from("genius_knowledge_global")
          .update({ last_verified_at: new Date().toISOString() })
          .eq("jurisdiction_code", jur.jurisdiction_code)
          .eq("is_active", true);

        results.push({
          jurisdiction_code: jur.jurisdiction_code,
          status: "no_changes",
        });
      } else {
        // Changes detected — create queue item for review
        const lockExpires = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();

        await adminClient.from("genius_kb_update_queue").insert({
          jurisdiction_code: jur.jurisdiction_code,
          jurisdiction_name: jur.jurisdiction_name,
          operation_type: "monthly_update",
          status: "pending",
          locked_by: user.id,
          locked_at: new Date().toISOString(),
          lock_expires_at: lockExpires,
          proposed_chunks: [
            {
              title: `Monthly Update — ${jur.jurisdiction_name}`,
              content,
              knowledge_type: "procedure",
              source_name: "Perplexity Monthly Scan",
              source_url: citations[0] || null,
              source_reliability: "ai_researched",
              embedding_needed: true,
            },
          ],
          research_result_raw: content,
          perplexity_sources: citations,
          confidence_level: "medium",
          requires_expert_review: true,
          requested_by: user.id,
        });

        results.push({
          jurisdiction_code: jur.jurisdiction_code,
          status: "changes_detected",
          details: content.slice(0, 200),
        });
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error processing ${jur.jurisdiction_code}:`, err);
      results.push({
        jurisdiction_code: jur.jurisdiction_code,
        status: "error",
        details: String(err),
      });
    }
  }

  // --- Summary ---
  const noChanges = results.filter((r) => r.status === "no_changes").length;
  const changesDetected = results.filter(
    (r) => r.status === "changes_detected"
  ).length;
  const errors = results.filter((r) => r.status === "error").length;

  // --- Log completion ---
  await adminClient.from("genius_kb_update_log").insert({
    jurisdiction_code: "GLOBAL",
    action: "monthly_update_completed",
    details: {
      jurisdictions_checked: results.length,
      no_changes: noChanges,
      changes_detected: changesDetected,
      errors,
      results,
    },
    performed_by: user.id,
  });

  // --- Notify superadmin ---
  await adminClient.from("admin_notifications").insert({
    type: "genius_monthly_update",
    severity: changesDetected > 0 ? "warning" : "info",
    title: `Actualización mensual completada`,
    message: `${results.length} jurisdicciones verificadas: ${noChanges} sin cambios, ${changesDetected} con cambios (en cola para revisión), ${errors} errores.`,
    metadata: { results_summary: { noChanges, changesDetected, errors } },
  });

  return json({
    success: true,
    jurisdictions_checked: results.length,
    no_changes: noChanges,
    changes_detected: changesDetected,
    errors,
    results,
  });
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
