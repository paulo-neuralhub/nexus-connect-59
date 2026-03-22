import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BriefingItem {
  type: string;
  priority: "fatal" | "high" | "medium" | "low";
  title: string;
  description: string;
  matter_id?: string;
  action_url: string;
  days_remaining?: number;
  icon: string;
}

// ── Helper: generate briefing for a single org ──────────
async function generateBriefingForOrg(
  db: any,
  orgId: string,
  anthropicKey: string | undefined,
  force: boolean,
  localDate: string, // YYYY-MM-DD in org's timezone
  requestingUserId?: string | null // for personalization
): Promise<{ briefing_id?: string; total_items: number; urgent_items: number; summary: string; was_cached: boolean }> {
  // Check existing briefing using the org's local date
  const { data: existing } = await db
    .from("genius_daily_briefings")
    .select("id, content_json, total_items, urgent_items")
    .eq("organization_id", orgId)
    .eq("briefing_date", localDate)
    .is("user_id", null)
    .maybeSingle();

  if (existing && !force) {
    return {
      briefing_id: existing.id,
      total_items: existing.total_items,
      urgent_items: existing.urgent_items,
      summary: (existing.content_json as any)?.summary || "",
      was_cached: true,
    };
  }

  // Check briefing_enabled
  const { data: gtc } = await db
    .from("genius_tenant_config")
    .select("briefing_enabled, proactive_enabled, model_basic")
    .eq("organization_id", orgId)
    .single();

  if (gtc && !gtc.briefing_enabled) {
    return { total_items: 0, urgent_items: 0, summary: "briefing_disabled", was_cached: false };
  }

  // Gather data
  const items: BriefingItem[] = [];
  const startTime = Date.now();

  const now = new Date().toISOString();
  const in72h = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

  // A. Fatal deadlines (< 72h)
  const { data: fatalDl } = await db
    .from("matter_deadlines")
    .select("title, due_date, is_critical, matter_id")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .gte("due_date", now)
    .lte("due_date", in72h)
    .order("due_date", { ascending: true })
    .limit(10);

  if (fatalDl?.length) {
    const matterIds = [...new Set(fatalDl.map((d: any) => d.matter_id))];
    const { data: matters } = await db
      .from("matters")
      .select("id, title, reference, jurisdiction")
      .in("id", matterIds);
    const mMap = new Map((matters || []).map((m: any) => [m.id, m]));

    for (const d of fatalDl) {
      const m = mMap.get(d.matter_id);
      const hoursLeft = Math.round((new Date(d.due_date).getTime() - Date.now()) / 3600000);
      items.push({
        type: "deadline",
        priority: hoursLeft < 24 ? "fatal" : "high",
        title: `Plazo ${hoursLeft < 24 ? "fatal" : "urgente"}: ${d.title}`,
        description: `${m?.title || ""} (${m?.reference || ""}) — Vence en ${hoursLeft}h.${d.is_critical ? " Sin respuesta → expediente cerrado." : ""}`,
        matter_id: d.matter_id,
        action_url: `/app/matters/${d.matter_id}`,
        days_remaining: Math.round(hoursLeft / 24 * 100) / 100,
        icon: hoursLeft < 24 ? "🚨" : "⏰",
      });
    }
  }

  // B. Upcoming deadlines (3-7 days)
  const in3d = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  const in7d = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { data: upcomingDl } = await db
    .from("matter_deadlines")
    .select("title, due_date, matter_id")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .gte("due_date", in3d)
    .lte("due_date", in7d)
    .order("due_date", { ascending: true })
    .limit(5);

  if (upcomingDl?.length) {
    const matterIds = [...new Set(upcomingDl.map((d: any) => d.matter_id))];
    const { data: matters } = await db.from("matters").select("id, title, reference").in("id", matterIds);
    const mMap = new Map((matters || []).map((m: any) => [m.id, m]));

    for (const d of upcomingDl) {
      const m = mMap.get(d.matter_id);
      const daysLeft = Math.round((new Date(d.due_date).getTime() - Date.now()) / 86400000);
      items.push({
        type: "deadline",
        priority: "medium",
        title: `Plazo próximo: ${d.title}`,
        description: `${m?.title || ""} (${m?.reference || ""}) — Vence en ${daysLeft} días.`,
        matter_id: d.matter_id,
        action_url: `/app/matters/${d.matter_id}`,
        days_remaining: daysLeft,
        icon: "📅",
      });
    }
  }

  // C. Critical spider alerts
  try {
    const { data: spiderAlerts } = await db
      .from("spider_alerts")
      .select("title, description, severity, created_at")
      .eq("organization_id", orgId)
      .eq("status", "new")
      .in("severity", ["critical", "high"])
      .order("severity", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5);

    if (spiderAlerts?.length) {
      for (const a of spiderAlerts) {
        items.push({
          type: "spider",
          priority: a.severity === "critical" ? "high" : "medium",
          title: `Alerta Spider: ${a.title}`,
          description: a.description || "Marca similar detectada",
          action_url: "/app/spider",
          icon: "⚠️",
        });
      }
    }
  } catch { /* spider_alerts may not exist */ }

  // D. Overdue invoices
  try {
    const { data: overdueInv } = await db
      .from("invoices")
      .select("full_number, total, due_date, crm_account_id")
      .eq("organization_id", orgId)
      .eq("status", "overdue")
      .order("due_date", { ascending: true })
      .limit(5);

    if (overdueInv?.length) {
      const accountIds = [...new Set(overdueInv.map((i: any) => i.crm_account_id).filter(Boolean))];
      let accMap = new Map();
      if (accountIds.length) {
        const { data: accounts } = await db.from("crm_accounts").select("id, name").in("id", accountIds);
        accMap = new Map((accounts || []).map((a: any) => [a.id, a.name]));
      }

      for (const inv of overdueInv) {
        items.push({
          type: "invoice",
          priority: "medium",
          title: `Factura vencida: ${inv.full_number || "Sin número"}`,
          description: `${accMap.get(inv.crm_account_id) || "Cliente"} — ${inv.total}€ vencida desde ${inv.due_date}`,
          action_url: "/app/finance/invoices",
          icon: "💰",
        });
      }
    }
  } catch { /* invoices may not exist */ }

  // E. Overdue tasks
  try {
    const { data: overdueTasks } = await db
      .from("tasks")
      .select("title, due_date, assigned_to")
      .eq("organization_id", orgId)
      .neq("status", "completed")
      .lt("due_date", now)
      .limit(5);

    if (overdueTasks?.length) {
      for (const t of overdueTasks) {
        items.push({
          type: "task",
          priority: "medium",
          title: `Tarea vencida: ${t.title}`,
          description: `Vencida desde ${t.due_date}`,
          action_url: "/app/tasks",
          icon: "📌",
        });
      }
    }
  } catch { /* tasks may not exist */ }

  // F. Urgent internal chat
  try {
    const { count } = await db
      .from("staff_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("notification_type", "chat_action_required")
      .eq("is_read", false);

    if (count && count > 0) {
      items.push({
        type: "chat",
        priority: "medium",
        title: `${count} mensajes internos requieren acción`,
        description: "Hay mensajes del equipo que necesitan tu respuesta.",
        action_url: "/app/communications",
        icon: "💬",
      });
    }
  } catch { /* staff_notifications may not exist */ }

  // Build content
  const urgentItems = items.filter((i) => i.priority === "fatal" || i.priority === "high").length;
  const totalItems = items.length;

  // ── Personalize briefing order based on user patterns ──
  // Try to get the requesting user's priority pattern (if userId is provided in the call context)
  let prioritizesFirst = "deadline"; // default
  let summaryStyle = "operativo y accionable"; // default

  // Generate AI summary
  let summary: string;
  const modelForBriefing = gtc?.model_basic || "claude-haiku-4-5-20251001";

  if (totalItems === 0) {
    summary = "Sin alertas urgentes hoy. ✅ Tu cartera está al día.";
  } else if (anthropicKey && urgentItems > 0) {
    try {
      // Reorder items based on user's priority pattern
      const priorityWeights: Record<string, number> = {
        fatal: 100, high: 80, medium: 50, low: 20,
      };

      items.sort((a, b) => {
        // If item type matches what user checks first, boost it
        if (a.type === prioritizesFirst && b.type !== prioritizesFirst) return -1;
        if (b.type === prioritizesFirst && a.type !== prioritizesFirst) return 1;
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      });

      const itemsSummaryText = items
        .slice(0, 10)
        .map((i) => `[${i.priority}] ${i.title}: ${i.description}`)
        .join("\n");

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelForBriefing,
          max_tokens: 200,
          temperature: 0.3,
          system: `Genera un resumen ${summaryStyle} de 2-3 líneas para el briefing matutino de un despacho de PI. El usuario suele revisar primero: ${prioritizesFirst}. Prioriza eso en el briefing. Sé directo. Responde en español.`,
          messages: [
            {
              role: "user",
              content: `Genera un resumen de este briefing con ${totalItems} items (${urgentItems} urgentes):\n\n${itemsSummaryText}`,
            },
          ],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        summary = data.content?.[0]?.text || `Briefing disponible: ${totalItems} items, ${urgentItems} urgentes.`;
      } else {
        summary = `Hoy tienes ${totalItems} items pendientes, ${urgentItems} urgentes. Revisa los plazos críticos primero.`;
      }
    } catch {
      summary = `Briefing disponible: ${totalItems} items, ${urgentItems} urgentes.`;
    }
  } else {
    summary = `Briefing disponible: ${totalItems} items${urgentItems > 0 ? `, ${urgentItems} urgentes` : ""}. Revisa los detalles a continuación.`;
  }

  const generationSeconds = Math.round((Date.now() - startTime) / 10) / 100;

  const contentJson = {
    summary,
    generated_at: new Date().toISOString(),
    items,
  };

  // Persist
  if (existing && force) {
    await db.from("genius_daily_briefings").delete().eq("id", existing.id);
  }

  const { data: briefing, error: insertErr } = await db
    .from("genius_daily_briefings")
    .insert({
      organization_id: orgId,
      user_id: null,
      briefing_date: localDate,
      content_json: contentJson,
      total_items: totalItems,
      urgent_items: urgentItems,
      model_used: anthropicKey && urgentItems > 0 ? modelForBriefing : null,
      generation_seconds: generationSeconds,
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { total_items: totalItems, urgent_items: urgentItems, summary, was_cached: true };
    }
    throw insertErr;
  }

  // Notify admins
  if (urgentItems > 0) {
    try {
      const { data: admins } = await db
        .from("profiles")
        .select("id")
        .eq("organization_id", orgId)
        .in("role", ["admin", "superadmin"]);

      if (admins?.length) {
        const dedupKey = `briefing_${orgId}_${localDate}`;
        const notifications = admins.map((admin: any) => ({
          organization_id: orgId,
          recipient_id: admin.id,
          notification_type: "copilot_briefing",
          priority: "high",
          title: "📋 Tu briefing del día está listo",
          body: summary,
          action_url: "/app/dashboard",
          dedup_key: dedupKey,
          source_type: "copilot",
        }));

        await db.from("staff_notifications").upsert(notifications, {
          onConflict: "dedup_key",
          ignoreDuplicates: true,
        });
      }
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr);
    }
  }

  return {
    briefing_id: briefing?.id,
    total_items: totalItems,
    urgent_items: urgentItems,
    summary,
    was_cached: false,
  };
}

// ── Helper: get org's local date string ─────────────────
function getOrgLocalDate(timezone: string): string {
  try {
    const orgNow = new Date().toLocaleString("en-US", { timeZone: timezone });
    const orgDate = new Date(orgNow);
    const y = orgDate.getFullYear();
    const m = String(orgDate.getMonth() + 1).padStart(2, "0");
    const d = String(orgDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    // Fallback to UTC
    return new Date().toISOString().split("T")[0];
  }
}

function getOrgLocalHour(timezone: string): number {
  try {
    const orgNow = new Date().toLocaleString("en-US", { timeZone: timezone });
    return new Date(orgNow).getHours();
  } catch {
    return new Date().getUTCHours();
  }
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
    const { force = false, run_for_all_orgs = false } = body as {
      organization_id?: string;
      force?: boolean;
      run_for_all_orgs?: boolean;
    };

    const db = createClient(supabaseUrl, supabaseServiceKey);

    // ── MODE A: Cron — run_for_all_orgs ─────────────────
    if (run_for_all_orgs) {
      // Get all active orgs with briefing config
      const { data: orgs, error: orgsErr } = await db
        .from("genius_tenant_config")
        .select("organization_id, briefing_enabled, briefing_hour, timezone, last_briefing_date")
        .eq("is_active", true)
        .eq("briefing_enabled", true);

      if (orgsErr) throw orgsErr;

      const results: any[] = [];

      for (const org of orgs || []) {
        try {
          const tz = org.timezone || "Europe/Madrid";
          const orgHour = getOrgLocalHour(tz);
          const orgToday = getOrgLocalDate(tz);
          const briefingHour = org.briefing_hour ?? 8;

          // Only process if it's the configured hour
          if (orgHour !== briefingHour) {
            results.push({ org_id: org.organization_id, status: "skipped", reason: "not_briefing_hour" });
            continue;
          }

          // Skip if already generated today (org's local date)
          if (org.last_briefing_date === orgToday) {
            results.push({ org_id: org.organization_id, status: "skipped", reason: "already_generated" });
            continue;
          }

          const briefingResult = await generateBriefingForOrg(db, org.organization_id, anthropicKey, false, orgToday);

          // Update last_briefing_date
          await db
            .from("genius_tenant_config")
            .update({
              last_briefing_date: orgToday,
              last_briefing_at: new Date().toISOString(),
            })
            .eq("organization_id", org.organization_id);

          results.push({
            org_id: org.organization_id,
            status: "generated",
            urgent_items: briefingResult.urgent_items,
          });
        } catch (err: any) {
          results.push({
            org_id: org.organization_id,
            status: "error",
            error: err?.message || "Unknown",
          });
          continue;
        }
      }

      return new Response(
        JSON.stringify({
          processed: results.length,
          generated: results.filter((r) => r.status === "generated").length,
          skipped: results.filter((r) => r.status === "skipped").length,
          failed: results.filter((r) => r.status === "error").length,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE B: Single org — JWT or service_role ────────
    const authHeader = req.headers.get("Authorization");
    let orgId: string | null = null;
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user?.id) {
        userId = user.id;
        const { data: profile } = await db
          .from("profiles")
          .select("organization_id")
          .eq("id", userId)
          .single();
        orgId = profile?.organization_id || null;
      }
    }

    if (!orgId && body.organization_id) {
      const token = authHeader?.replace("Bearer ", "");
      if (token === supabaseServiceKey) {
        orgId = body.organization_id;
      }
    }

    if (!orgId) {
      return new Response(JSON.stringify({ error: "Unauthorized or missing organization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org timezone
    const { data: orgConfig } = await db
      .from("genius_tenant_config")
      .select("timezone")
      .eq("organization_id", orgId)
      .single();

    const tz = orgConfig?.timezone || "Europe/Madrid";
    const localDate = getOrgLocalDate(tz);

    const result = await generateBriefingForOrg(db, orgId, anthropicKey, force, localDate);

    // Update last_briefing_date
    if (!result.was_cached) {
      await db
        .from("genius_tenant_config")
        .update({
          last_briefing_date: localDate,
          last_briefing_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId);
    }

    return new Response(
      JSON.stringify({
        briefing_id: result.briefing_id,
        briefing_date: localDate,
        total_items: result.total_items,
        urgent_items: result.urgent_items,
        summary: result.summary,
        was_cached: result.was_cached,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("genius-briefing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
