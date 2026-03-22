import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const db = createClient(supabaseUrl, supabaseServiceKey);

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

    // Parse body
    const body = await req.json();
    const { page_url, matter_id, crm_account_id } = body as {
      page_url?: string;
      matter_id?: string;
      crm_account_id?: string;
    };

    // PASO 1: Check user preferences
    const { data: prefs } = await db
      .from("copilot_user_preferences")
      .select("suggestions_enabled, suggestion_confidence_threshold")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (prefs?.suggestions_enabled === false) {
      return new Response(
        JSON.stringify({ has_suggestion: false, reason: "suggestions_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threshold = prefs?.suggestion_confidence_threshold ?? 0.70;

    // PASO 2: Check existing active suggestion
    const { data: existingSuggestion } = await db
      .from("copilot_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .is("acted_at", null)
      .is("dismissed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("confidence_score", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSuggestion && existingSuggestion.confidence_score >= threshold) {
      // Mark as shown
      await db
        .from("copilot_suggestions")
        .update({ shown_at: new Date().toISOString() })
        .eq("id", existingSuggestion.id)
        .is("shown_at", null);

      return new Response(
        JSON.stringify({ has_suggestion: true, suggestion: existingSuggestion }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PASO 3: Generate new suggestion based on context
    let suggestion: {
      suggestion_type: string;
      title: string;
      body: string;
      action_primary_label?: string;
      action_primary_url?: string;
      action_secondary_label?: string;
      action_secondary_url?: string;
      confidence_score: number;
      trigger_source: string;
      matter_id?: string;
      crm_account_id?: string;
    } | null = null;

    // ── Matter context ──────────────────────────────────
    if (matter_id) {
      // A. Check deadlines
      const { data: deadlines } = await db
        .from("matter_deadlines")
        .select("title, due_date, is_critical")
        .eq("matter_id", matter_id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(1);

      if (deadlines?.length) {
        const dl = deadlines[0];
        const daysRemaining = Math.round(
          (new Date(dl.due_date).getTime() - Date.now()) / 86400000
        );

        if (daysRemaining <= 30 && daysRemaining >= 0) {
          const confidence = daysRemaining <= 7 ? 0.95 : 0.80;
          suggestion = {
            suggestion_type: "deadline_warning",
            title: `⏰ Plazo en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}`,
            body: `El expediente tiene un plazo próximo: ${dl.title}${dl.is_critical ? " (CRÍTICO)" : ""}. Vence el ${new Date(dl.due_date).toLocaleDateString("es-ES")}.`,
            action_primary_label: "Ver plazos",
            action_primary_url: `/app/matters/${matter_id}?tab=deadlines`,
            confidence_score: confidence,
            trigger_source: "deadline_check",
            matter_id,
          };
        }
      }

      // B. Check Spider alerts (if no deadline suggestion)
      if (!suggestion) {
        try {
          const { data: alerts, count } = await db
            .from("spider_alerts")
            .select("id", { count: "exact", head: true })
            .eq("matter_id", matter_id)
            .eq("status", "new")
            .in("severity", ["critical", "high"]);

          if (count && count > 0) {
            suggestion = {
              suggestion_type: "spider_action",
              title: `🔍 ${count} alerta${count > 1 ? "s" : ""} sin revisar`,
              body: `Hay ${count} alerta${count > 1 ? "s" : ""} Spider de alta prioridad pendiente${count > 1 ? "s" : ""} de revisión.`,
              action_primary_label: "Revisar alertas",
              action_primary_url: `/app/spider?matter=${matter_id}`,
              confidence_score: 0.90,
              trigger_source: "spider_alert",
              matter_id,
            };
          }
        } catch { /* spider_alerts may not exist */ }
      }

      // C. Check org opposition threshold pattern
      if (!suggestion) {
        const { data: oppPattern } = await db
          .from("copilot_org_patterns")
          .select("pattern_data, confidence_score")
          .eq("organization_id", orgId)
          .eq("pattern_type", "opposition_threshold")
          .maybeSingle();

        if (oppPattern && oppPattern.confidence_score >= 0.60) {
          // Only suggest if there's a spider alert with similarity data
          try {
            const { data: similarAlerts } = await db
              .from("spider_alerts")
              .select("similarity_score, title")
              .eq("matter_id", matter_id)
              .eq("status", "new")
              .not("similarity_score", "is", null)
              .order("similarity_score", { ascending: false })
              .limit(1);

            if (similarAlerts?.length) {
              const alert = similarAlerts[0];
              const orgThreshold = oppPattern.pattern_data?.avg_similarity_oppose ?? 0.70;
              if (alert.similarity_score >= orgThreshold) {
                suggestion = {
                  suggestion_type: "opposition_recommend",
                  title: "⚖️ Posible oposición recomendada",
                  body: `Detectada marca similar "${alert.title}" con similitud ${Math.round(alert.similarity_score * 100)}%. Tu despacho suele oponerse a partir del ${Math.round(orgThreshold * 100)}%.`,
                  action_primary_label: "Revisar alerta",
                  action_primary_url: `/app/spider?matter=${matter_id}`,
                  action_secondary_label: "Ignorar",
                  confidence_score: 0.85,
                  trigger_source: "pattern_match",
                  matter_id,
                };
              }
            }
          } catch { /* spider may not exist */ }
        }
      }
    }

    // ── CRM account context ─────────────────────────────
    if (!suggestion && crm_account_id) {
      // A. Overdue invoices
      try {
        const { data: overdueInv } = await db
          .from("invoices")
          .select("id, full_number, total")
          .eq("crm_account_id", crm_account_id)
          .eq("status", "overdue")
          .limit(5);

        if (overdueInv?.length) {
          const totalAmount = overdueInv.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
          suggestion = {
            suggestion_type: "billing_reminder",
            title: `💰 ${overdueInv.length} factura${overdueInv.length > 1 ? "s" : ""} vencida${overdueInv.length > 1 ? "s" : ""}`,
            body: `Este cliente tiene ${overdueInv.length} factura${overdueInv.length > 1 ? "s" : ""} vencida${overdueInv.length > 1 ? "s" : ""} por un total de ${totalAmount.toFixed(2)}€.`,
            action_primary_label: "Ver facturas",
            action_primary_url: `/app/finance/invoices?account=${crm_account_id}`,
            action_secondary_label: "Enviar recordatorio",
            confidence_score: 0.85,
            trigger_source: "invoice_check",
            crm_account_id,
          };
        }
      } catch { /* invoices may not exist */ }

      // B. Client followup (no contact > 30 days)
      if (!suggestion) {
        try {
          const { data: lastContact } = await db
            .from("crm_activities")
            .select("activity_date")
            .eq("account_id", crm_account_id)
            .order("activity_date", { ascending: false })
            .limit(1);

          if (lastContact?.length) {
            const daysSinceContact = Math.round(
              (Date.now() - new Date(lastContact[0].activity_date).getTime()) / 86400000
            );
            if (daysSinceContact > 30) {
              suggestion = {
                suggestion_type: "client_followup",
                title: `📞 ${daysSinceContact} días sin contacto`,
                body: `No has contactado con este cliente en ${daysSinceContact} días. Podría ser buen momento para un seguimiento.`,
                action_primary_label: "Registrar actividad",
                action_primary_url: `/app/crm/accounts/${crm_account_id}?tab=activities`,
                confidence_score: 0.70,
                trigger_source: "page_context",
                crm_account_id,
              };
            }
          } else {
            // No activity at all
            suggestion = {
              suggestion_type: "client_followup",
              title: "📞 Sin actividad registrada",
              body: "Este cliente no tiene actividades registradas. Considera registrar tu último contacto.",
              action_primary_label: "Registrar actividad",
              action_primary_url: `/app/crm/accounts/${crm_account_id}?tab=activities`,
              confidence_score: 0.65,
              trigger_source: "page_context",
              crm_account_id,
            };
          }
        } catch { /* crm_activities may not exist */ }
      }
    }

    // PASO 4: Insert and return if confident enough
    if (suggestion && suggestion.confidence_score >= threshold) {
      const { data: inserted, error: insertErr } = await db
        .from("copilot_suggestions")
        .insert({
          organization_id: orgId,
          user_id: userId,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          body: suggestion.body,
          action_primary_label: suggestion.action_primary_label || null,
          action_primary_url: suggestion.action_primary_url || null,
          action_secondary_label: suggestion.action_secondary_label || null,
          action_secondary_url: suggestion.action_secondary_url || null,
          matter_id: suggestion.matter_id || null,
          crm_account_id: suggestion.crm_account_id || null,
          trigger_source: suggestion.trigger_source,
          confidence_score: suggestion.confidence_score,
          shown_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error("copilot-suggest insert error:", insertErr.message);
      }

      return new Response(
        JSON.stringify({ has_suggestion: true, suggestion: inserted || suggestion }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ has_suggestion: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("copilot-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
