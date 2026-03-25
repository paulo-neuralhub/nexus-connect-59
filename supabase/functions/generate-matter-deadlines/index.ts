import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map jurisdiction codes used in matters to ipo_offices codes
const JURISDICTION_ALIASES: Record<string, string[]> = {
  EU: ["EU", "EM"], // matters use EU, rules linked to EM (EUIPO)
  PCT: ["PCT", "WO"],
};

function calculateDeadlineInTimezone(
  baseDate: Date,
  value: number,
  unit: string,
  timezone: string
): Date {
  const date = new Date(baseDate);

  switch (unit) {
    case "days":
      date.setUTCDate(date.getUTCDate() + value);
      break;
    case "months":
      date.setUTCMonth(date.getUTCMonth() + value);
      break;
    case "years":
      date.setUTCFullYear(date.getUTCFullYear() + value);
      break;
  }

  // End of day in office timezone
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  // Return 23:59:59 in office timezone (approximate via UTC)
  return new Date(`${dateStr}T23:59:59`);
}

function formatDaysText(daysBefore: number): string {
  if (daysBefore === 0) return "HOY";
  if (daysBefore < 30) return `${daysBefore} días`;
  if (daysBefore < 365) return `${Math.round(daysBefore / 30)} meses`;
  return `${Math.round(daysBefore / 365)} año(s)`;
}

function getAlertColor(daysBefore: number): string {
  if (daysBefore <= 7) return "#7F1D1D";
  if (daysBefore <= 14) return "#EF4444";
  if (daysBefore <= 30) return "#F97316";
  if (daysBefore <= 90) return "#F59E0B";
  return "#3B82F6";
}

function getAlertPrefix(daysBefore: number): string {
  if (daysBefore <= 3) return "🚨 FATAL: ";
  if (daysBefore <= 7) return "🔴 URGENTE: ";
  if (daysBefore <= 30) return "⚠️ ";
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matter_id, event_type, trigger_field } = await req.json();

    if (!matter_id) {
      return new Response(
        JSON.stringify({ error: "matter_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load matter
    const { data: matter, error: matterErr } = await supabase
      .from("matters")
      .select("id, type, status, jurisdiction_code, filing_date, registration_date, expiry_date, application_number, registration_number, organization_id, client_id, assigned_to")
      .eq("id", matter_id)
      .single();

    if (matterErr || !matter) {
      return new Response(
        JSON.stringify({ error: "Matter not found", details: matterErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Resolve office codes (handle EU→EM, PCT→WO aliases)
    const jCode = matter.jurisdiction_code || "";
    const officeCodes = JURISDICTION_ALIASES[jCode] || [jCode];

    // Fetch all matching offices
    const { data: offices } = await supabase
      .from("ipo_offices")
      .select("id, code, name_short, timezone, tm_opposition_period_days, tm_registration_duration_years, renewal_grace_period_days, grace_period_days")
      .in("code", officeCodes);

    const office = offices?.[0];
    const officeTimezone = office?.timezone || "UTC";

    // 3. Load applicable rules
    const officeIds = (offices || []).map((o: any) => o.id);

    let allRules: any[] = [];

    if (officeIds.length > 0) {
      const { data: rules } = await supabase
        .from("deadline_rules")
        .select("*")
        .in("jurisdiction_id", officeIds)
        .eq("is_active", true);
      allRules = rules || [];
    }

    // Universal rules (no jurisdiction)
    const { data: universalRules } = await supabase
      .from("deadline_rules")
      .select("*")
      .is("jurisdiction_id", null)
      .eq("is_active", true);

    allRules = [...allRules, ...(universalRules || [])];

    // Filter by right_type if set
    allRules = allRules.filter(
      (r: any) => !r.right_type || r.right_type === matter.type
    );

    let deadlinesCreated = 0;
    let calendarEventsCreated = 0;
    const errors: string[] = [];

    const now = new Date();

    for (const rule of allRules) {
      try {
        // 4. Determine base date from trigger_field
        let baseDate: Date | null = null;

        switch (rule.trigger_field) {
          case "expiry_date":
            baseDate = matter.expiry_date ? new Date(matter.expiry_date) : null;
            break;
          case "priority_deadline":
            // Paris priority: calculated from filing_date
            baseDate = matter.filing_date ? new Date(matter.filing_date) : null;
            break;
          case "national_phase_deadline":
            // PCT national phase: from filing_date
            baseDate = matter.filing_date ? new Date(matter.filing_date) : null;
            break;
          case "response_deadline":
          case "opposition_deadline":
            // These are event-driven, only generate if the matter
            // status matches (office_action, published, etc.)
            if (rule.trigger_field === "response_deadline" &&
                matter.status === "office_action") {
              // Use filing_date as proxy (real OA date would come from a notification)
              baseDate = matter.filing_date ? new Date(matter.filing_date) : null;
            }
            if (rule.trigger_field === "opposition_deadline" &&
                (matter.status === "published" || matter.status === "registered")) {
              baseDate = matter.registration_date
                ? new Date(matter.registration_date)
                : matter.filing_date
                ? new Date(matter.filing_date)
                : null;
            }
            break;
          default:
            continue;
        }

        if (!baseDate || isNaN(baseDate.getTime())) continue;

        // 5. Calculate deadline date
        const deadlineDate = calculateDeadlineInTimezone(
          baseDate,
          rule.time_value,
          rule.time_unit,
          officeTimezone
        );

        // 6. Insert or update matter_deadlines (no unique constraint on composite)
        // Check if deadline already exists for this matter+rule
        const { data: existing } = await supabase
          .from("matter_deadlines")
          .select("id")
          .eq("matter_id", matter.id)
          .eq("rule_code", rule.code)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("matter_deadlines")
            .update({
              deadline_date: deadlineDate.toISOString(),
              trigger_date: baseDate.toISOString(),
              original_deadline: deadlineDate.toISOString(),
              status: deadlineDate > now ? "pending" : "overdue",
              priority: rule.criticality === "critical" ? "critical" : "high",
              metadata: {
                rule_code: rule.code,
                office_timezone: officeTimezone,
                office_code: office?.code || jCode,
                calculated_at: now.toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          const { error: dlErr } = await supabase.from("matter_deadlines").insert({
            organization_id: matter.organization_id,
            matter_id: matter.id,
            rule_id: rule.id,
            rule_code: rule.code,
            deadline_type: rule.category,
            title: rule.name_es || rule.name_en,
            description: rule.consequence_if_missed,
            trigger_date: baseDate.toISOString(),
            deadline_date: deadlineDate.toISOString(),
            original_deadline: deadlineDate.toISOString(),
            status: deadlineDate > now ? "pending" : "overdue",
            priority: rule.criticality === "critical" ? "critical" : "high",
            auto_generated: true,
            source: "ip_nexus_auto",
            metadata: {
              rule_code: rule.code,
              office_timezone: officeTimezone,
              office_code: office?.code || jCode,
              calculated_at: now.toISOString(),
            },
          });
          if (dlErr) {
            errors.push(`Deadline ${rule.code}: ${dlErr.message}`);
          }
        }
        deadlinesCreated++;

        // 9. Event on the exact deadline day
        if (deadlineDate > now) {
          const { error: finalErr } = await supabase.from("calendar_events").insert({
            organization_id: matter.organization_id,
            title: `🔴 VENCIMIENTO: ${rule.name_es || rule.name_en}`,
            description: `PLAZO FINAL — ${office?.name_short || jCode}\n${rule.consequence_if_missed || ""}`,
            event_type: "deadline_fatal",
            start_at: deadlineDate.toISOString(),
            end_at: new Date(deadlineDate.getTime() + 3600000).toISOString(),
            all_day: true,
            matter_id: matter.id,
            color: "#7F1D1D",
            status: "confirmed",
            created_by: matter.assigned_to,
          });

          if (finalErr) {
            errors.push(`Final event ${rule.code}: ${finalErr.message}`);
          } else {
            calendarEventsCreated++;
          }
        }
      } catch (ruleErr: any) {
        errors.push(`Rule ${rule.code}: ${ruleErr.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deadlines_created: deadlinesCreated,
        calendar_events_created: calendarEventsCreated,
        rules_evaluated: allRules.length,
        office: office?.code || jCode,
        timezone: officeTimezone,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
