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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    const body = await req.json();
    const { force = false } = body as { organization_id?: string; force?: boolean };

    // ── Auth: JWT or service_role ────────────────────────
    const authHeader = req.headers.get("Authorization");
    let orgId: string | null = null;
    let userId: string | null = null;

    const db = createClient(supabaseUrl, supabaseServiceKey);

    if (authHeader?.startsWith("Bearer ")) {
      // Try JWT auth
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

    // If no JWT, check for service_role call with org_id in body
    if (!orgId && body.organization_id) {
      // Verify the request is from service_role by checking if the auth header
      // matches the service role key (internal calls)
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

    // ── PASO 2: Check existing briefing ─────────────────
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await db
      .from("genius_daily_briefings")
      .select("id, content_json, total_items, urgent_items")
      .eq("organization_id", orgId)
      .eq("briefing_date", today)
      .is("user_id", null)
      .maybeSingle();

    if (existing && !force) {
      return new Response(
        JSON.stringify({
          briefing_id: existing.id,
          briefing_date: today,
          total_items: existing.total_items,
          urgent_items: existing.urgent_items,
          summary: (existing.content_json as any)?.summary || "",
          was_cached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 3: Check briefing_enabled ──────────────────
    const { data: gtc } = await db
      .from("genius_tenant_config")
      .select("briefing_enabled, proactive_enabled, model_basic")
      .eq("organization_id", orgId)
      .single();

    if (gtc && !gtc.briefing_enabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "briefing_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PASO 4: Gather data ─────────────────────────────
    const items: BriefingItem[] = [];
    const startTime = Date.now();

    // A. Fatal deadlines (< 72h)
    const now = new Date().toISOString();
    const in72h = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
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

    // ── PASO 5: Build content_json ──────────────────────
    const urgentItems = items.filter((i) => i.priority === "fatal" || i.priority === "high").length;
    const totalItems = items.length;

    // ── PASO 6: Generate AI summary ─────────────────────
    let summary: string;
    const modelForBriefing = gtc?.model_basic || "claude-haiku-4-5-20251001";

    if (totalItems === 0) {
      summary = "Sin alertas urgentes hoy. ✅ Tu cartera está al día.";
    } else if (anthropicKey && urgentItems > 0) {
      try {
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
            system: "Genera un resumen ejecutivo de 2-3 líneas para el briefing matutino de un despacho de PI. Sé directo y prioriza lo más urgente. Responde en español.",
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

    // ── PASO 7: Persist ─────────────────────────────────
    // If force and existing, delete old one first
    if (existing && force) {
      await db
        .from("genius_daily_briefings")
        .delete()
        .eq("id", existing.id);
    }

    const { data: briefing, error: insertErr } = await db
      .from("genius_daily_briefings")
      .insert({
        organization_id: orgId,
        user_id: null,
        briefing_date: today,
        content_json: contentJson,
        total_items: totalItems,
        urgent_items: urgentItems,
        model_used: anthropicKey && urgentItems > 0 ? modelForBriefing : null,
        generation_seconds: generationSeconds,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Briefing insert error:", insertErr);
      // If unique constraint violation, return existing
      if (insertErr.code === "23505") {
        const { data: existingAgain } = await db
          .from("genius_daily_briefings")
          .select("id, total_items, urgent_items")
          .eq("organization_id", orgId)
          .eq("briefing_date", today)
          .is("user_id", null)
          .single();

        return new Response(
          JSON.stringify({
            briefing_id: existingAgain?.id,
            briefing_date: today,
            total_items: existingAgain?.total_items || totalItems,
            urgent_items: existingAgain?.urgent_items || urgentItems,
            summary,
            was_cached: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertErr;
    }

    // ── PASO 8: Notify admins ───────────────────────────
    if (urgentItems > 0) {
      try {
        const { data: admins } = await db
          .from("profiles")
          .select("id")
          .eq("organization_id", orgId)
          .in("role", ["admin", "superadmin"]);

        if (admins?.length) {
          const dedupKey = `briefing_${orgId}_${today}`;
          const notifications = admins.map((admin: any) => ({
            organization_id: orgId,
            recipient_id: admin.id,
            notification_type: "copilot_briefing",
            priority: urgentItems > 0 ? "high" : "normal",
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

    return new Response(
      JSON.stringify({
        briefing_id: briefing?.id,
        briefing_date: today,
        total_items: totalItems,
        urgent_items: urgentItems,
        summary,
        was_cached: false,
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
