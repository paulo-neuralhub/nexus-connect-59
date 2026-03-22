import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helper: upsert a user pattern ───────────────────────
async function upsertUserPattern(
  db: any,
  orgId: string,
  userId: string,
  patternType: string,
  patternData: Record<string, unknown>,
  confidence: number,
  sampleSize: number
) {
  const { error } = await db
    .from("copilot_user_patterns")
    .upsert(
      {
        organization_id: orgId,
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: Math.min(Math.max(confidence, 0), 1),
        sample_size: sampleSize,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id,pattern_type" }
    );
  if (error) console.error(`upsert pattern ${patternType} for ${userId}:`, error.message);
  return !error;
}

// ── Helper: upsert an org pattern ───────────────────────
async function upsertOrgPattern(
  db: any,
  orgId: string,
  patternType: string,
  patternData: Record<string, unknown>,
  confidence: number,
  sampleSize: number
) {
  const { error } = await db
    .from("copilot_org_patterns")
    .upsert(
      {
        organization_id: orgId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: Math.min(Math.max(confidence, 0), 1),
        sample_size: sampleSize,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,pattern_type" }
    );
  if (error) console.error(`upsert org pattern ${patternType}:`, error.message);
  return !error;
}

// ── Main learning logic for one org ─────────────────────
async function learnForOrg(
  db: any,
  orgId: string,
  anthropicKey: string | undefined
): Promise<{
  users_updated: number;
  patterns_updated: number;
  writing_memories_updated: number;
  org_patterns_updated: number;
}> {
  const stats = {
    users_updated: 0,
    patterns_updated: 0,
    writing_memories_updated: 0,
    org_patterns_updated: 0,
  };

  // PASO 1: Get active users from last 24h events
  const { data: activeUsers } = await db
    .from("copilot_context_events")
    .select("user_id")
    .eq("organization_id", orgId)
    .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .limit(500);

  const uniqueUserIds = [...new Set((activeUsers || []).map((u: any) => u.user_id))];

  for (const userId of uniqueUserIds) {
    try {
      // PASO 2: work_schedule — peak hours (last 30 days)
      const { data: hourData } = await db.rpc("", {}).catch(() => ({ data: null }));
      // Since we can't do GROUP BY via PostgREST, query raw events and compute in JS
      const { data: recentEvents } = await db
        .from("copilot_context_events")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (recentEvents?.length >= 10) {
        const hourCounts: Record<number, number> = {};
        const dayCounts: Record<number, number> = {};
        for (const evt of recentEvents) {
          const d = new Date(evt.created_at);
          const h = d.getUTCHours();
          const day = d.getUTCDay();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }

        const peakHours = Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([h]) => parseInt(h));

        const peakDays = Object.entries(dayCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([d]) => parseInt(d));

        const confidence = Math.min(recentEvents.length / 100, 1);
        if (await upsertUserPattern(db, orgId, userId, "work_schedule", {
          peak_hours: peakHours,
          peak_days: peakDays,
          total_events_30d: recentEvents.length,
        }, confidence, recentEvents.length)) {
          stats.patterns_updated++;
        }
      }

      // PASO 3: priority_behavior — first action per session
      const { data: sessionEvents } = await db
        .from("copilot_context_events")
        .select("event_type, session_id, created_at")
        .eq("user_id", userId)
        .not("session_id", "is", null)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);

      if (sessionEvents?.length >= 10) {
        // Group by session, take first event of each
        const sessionFirsts: Record<string, string> = {};
        for (const evt of sessionEvents) {
          if (!sessionFirsts[evt.session_id]) {
            sessionFirsts[evt.session_id] = evt.event_type;
          }
        }

        const firstActionCounts: Record<string, number> = {};
        for (const eventType of Object.values(sessionFirsts)) {
          firstActionCounts[eventType] = (firstActionCounts[eventType] || 0) + 1;
        }

        const topActions = Object.entries(firstActionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        const totalSessions = Object.keys(sessionFirsts).length;
        const confidence = Math.min(totalSessions / 30, 1);

        if (await upsertUserPattern(db, orgId, userId, "priority_behavior", {
          checks_first: topActions[0]?.[0] || "page_view",
          top_first_actions: topActions.map(([type, count]) => ({ type, count })),
          total_sessions: totalSessions,
        }, confidence, totalSessions)) {
          stats.patterns_updated++;
        }
      }

      // PASO 4: writing_style via LLM (if API key available)
      if (anthropicKey) {
        try {
          const { data: emails } = await db
            .from("comm_messages")
            .select("content")
            .eq("sender_id", userId)
            .eq("channel", "email")
            .gte("created_at", new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString())
            .order("created_at", { ascending: false })
            .limit(30);

          if (emails?.length >= 5) {
            const emailTexts = emails
              .map((e: any) => e.content)
              .filter(Boolean)
              .slice(0, 20)
              .join("\n---\n");

            const resp = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": anthropicKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 400,
                temperature: 0,
                system: `Analiza estos emails y extrae el perfil de escritura.
Responde SOLO en JSON válido:
{ "tone": 0-10, "avg_length": "short"|"medium"|"long",
  "openings": ["top 3 frases de apertura"],
  "closings": ["top 3 frases de cierre"],
  "vocabulary": ["10 palabras técnicas características"],
  "uses_bullets": boolean, "avg_paragraph_words": number,
  "language": "es"|"en"|"pt"|"fr" }`,
                messages: [{ role: "user", content: emailTexts }],
              }),
            });

            if (resp.ok) {
              const data = await resp.json();
              const text = data.content?.[0]?.text || "";
              try {
                const styleProfile = JSON.parse(text);
                const { error: wmErr } = await db
                  .from("copilot_writing_memory")
                  .upsert(
                    {
                      organization_id: orgId,
                      user_id: userId,
                      context_type: "client_email",
                      style_profile: styleProfile,
                      sample_count: emails.length,
                      last_analyzed_at: new Date().toISOString(),
                    },
                    { onConflict: "organization_id,user_id,context_type" }
                  );
                if (!wmErr) stats.writing_memories_updated++;
              } catch {
                console.error("Failed to parse writing style JSON for user:", userId);
              }
            }
          }
        } catch (e) {
          console.error("Writing style analysis error for user:", userId, e);
        }
      } else {
        // MOCK MODE: insert default writing memory with low confidence
        const { data: existingWm } = await db
          .from("copilot_writing_memory")
          .select("id")
          .eq("user_id", userId)
          .eq("organization_id", orgId)
          .eq("context_type", "client_email")
          .maybeSingle();

        if (!existingWm) {
          const { error: wmErr } = await db
            .from("copilot_writing_memory")
            .upsert(
              {
                organization_id: orgId,
                user_id: userId,
                context_type: "client_email",
                style_profile: {
                  tone: 7,
                  avg_length: "medium",
                  openings: ["Estimado/a"],
                  closings: ["Quedamos a su disposición"],
                  vocabulary: [],
                  uses_bullets: false,
                  avg_paragraph_words: 40,
                  language: "es",
                  _mock: true,
                },
                sample_count: 0,
                last_analyzed_at: new Date().toISOString(),
              },
              { onConflict: "organization_id,user_id,context_type" }
            );
          if (!wmErr) stats.writing_memories_updated++;
        }
      }

      stats.users_updated++;
    } catch (userErr) {
      console.error(`Learning error for user ${userId}:`, userErr);
      // Continue with next user
    }
  }

  // PASO 5: Org-level patterns

  // Opposition threshold
  try {
    const { data: decisions } = await db
      .from("copilot_decision_log")
      .select("decision_type, similarity_score")
      .eq("organization_id", orgId)
      .in("decision_type", ["oppose", "not_oppose"])
      .gte("created_at", new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString())
      .limit(200);

    if (decisions?.length >= 5) {
      const opposeScores = decisions
        .filter((d: any) => d.decision_type === "oppose" && d.similarity_score != null)
        .map((d: any) => d.similarity_score);
      const notOpposeScores = decisions
        .filter((d: any) => d.decision_type === "not_oppose" && d.similarity_score != null)
        .map((d: any) => d.similarity_score);

      const avgOppose = opposeScores.length
        ? opposeScores.reduce((a: number, b: number) => a + b, 0) / opposeScores.length
        : null;
      const avgNotOppose = notOpposeScores.length
        ? notOpposeScores.reduce((a: number, b: number) => a + b, 0) / notOpposeScores.length
        : null;

      const confidence = Math.min(decisions.length / 20, 1);

      if (await upsertOrgPattern(db, orgId, "opposition_threshold", {
        avg_similarity_oppose: avgOppose ? Math.round(avgOppose * 100) / 100 : null,
        avg_similarity_not_oppose: avgNotOppose ? Math.round(avgNotOppose * 100) / 100 : null,
        oppose_count: opposeScores.length,
        not_oppose_count: notOpposeScores.length,
        total_decisions: decisions.length,
        opposition_rate: opposeScores.length / decisions.length,
      }, confidence, decisions.length)) {
        stats.org_patterns_updated++;
      }
    }
  } catch (e) {
    console.error("Opposition threshold analysis error:", e);
  }

  // Renewal timing
  try {
    const { data: renewals } = await db
      .from("matter_deadlines")
      .select("deadline_date, completed_at")
      .eq("organization_id", orgId)
      .eq("type", "renewal")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("created_at", new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString())
      .limit(100);

    if (renewals?.length >= 3) {
      const daysEarly = renewals
        .map((r: any) => {
          const deadline = new Date(r.deadline_date).getTime();
          const completed = new Date(r.completed_at).getTime();
          return Math.round((deadline - completed) / 86400000);
        })
        .filter((d: number) => d >= 0);

      if (daysEarly.length >= 3) {
        const avgDaysEarly = Math.round(
          daysEarly.reduce((a: number, b: number) => a + b, 0) / daysEarly.length
        );
        const confidence = Math.min(daysEarly.length / 15, 1);

        if (await upsertOrgPattern(db, orgId, "renewal_timing", {
          avg_days_early: avgDaysEarly,
          min_days_early: Math.min(...daysEarly),
          max_days_early: Math.max(...daysEarly),
          sample_count: daysEarly.length,
        }, confidence, daysEarly.length)) {
          stats.org_patterns_updated++;
        }
      }
    }
  } catch (e) {
    console.error("Renewal timing analysis error:", e);
  }

  // PASO 6: Expire old suggestions
  try {
    await db
      .from("copilot_suggestions")
      .update({ action_taken: "expired" })
      .eq("organization_id", orgId)
      .lt("expires_at", new Date().toISOString())
      .is("acted_at", null)
      .is("dismissed_at", null);
  } catch (e) {
    console.error("Suggestion expiration error:", e);
  }

  return stats;
}

// ── Main handler ────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    const body = await req.json();
    const { run_for_all_orgs = false, organization_id } = body as {
      run_for_all_orgs?: boolean;
      organization_id?: string;
    };

    const db = createClient(supabaseUrl, supabaseServiceKey);

    let orgIds: string[] = [];

    if (run_for_all_orgs) {
      const { data: orgs } = await db
        .from("genius_tenant_config")
        .select("organization_id")
        .eq("is_active", true);
      orgIds = (orgs || []).map((o: any) => o.organization_id);
    } else if (organization_id) {
      orgIds = [organization_id];
    } else {
      return new Response(
        JSON.stringify({ error: "run_for_all_orgs or organization_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totals = {
      orgs_processed: 0,
      users_updated: 0,
      patterns_updated: 0,
      writing_memories_updated: 0,
      org_patterns_updated: 0,
    };

    for (const oid of orgIds) {
      try {
        const result = await learnForOrg(db, oid, anthropicKey);
        totals.orgs_processed++;
        totals.users_updated += result.users_updated;
        totals.patterns_updated += result.patterns_updated;
        totals.writing_memories_updated += result.writing_memories_updated;
        totals.org_patterns_updated += result.org_patterns_updated;
      } catch (err) {
        console.error(`copilot-learn error for org ${oid}:`, err);
        totals.orgs_processed++; // Count but continue
      }
    }

    return new Response(JSON.stringify(totals), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("copilot-learn error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
