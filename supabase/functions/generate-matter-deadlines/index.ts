import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map jurisdiction codes used in matters to ipo_offices codes
const JURISDICTION_ALIASES: Record<string, string[]> = {
  EU: ["EU", "EM"],
  PCT: ["PCT", "WO"],
};

// Some IANA timezone names aren't supported in Deno's Intl
const TIMEZONE_FALLBACKS: Record<string, string> = {
  "Europe/Munich": "Europe/Berlin",
};

// Common timezone guesses by country code
const COUNTRY_TIMEZONE_GUESS: Record<string, string> = {
  US: "America/New_York", GB: "Europe/London", DE: "Europe/Berlin",
  FR: "Europe/Paris", ES: "Europe/Madrid", IT: "Europe/Rome",
  JP: "Asia/Tokyo", CN: "Asia/Shanghai", KR: "Asia/Seoul",
  AU: "Australia/Sydney", BR: "America/Sao_Paulo", IN: "Asia/Kolkata",
  MX: "America/Mexico_City", CA: "America/Toronto", AR: "America/Buenos_Aires",
  CL: "America/Santiago", CO: "America/Bogota", PE: "America/Lima",
  ZA: "Africa/Johannesburg", EG: "Africa/Cairo", NG: "Africa/Lagos",
  AE: "Asia/Dubai", SA: "Asia/Riyadh", IL: "Asia/Jerusalem",
  TR: "Europe/Istanbul", RU: "Europe/Moscow", NZ: "Pacific/Auckland",
  TH: "Asia/Bangkok", SG: "Asia/Singapore", MY: "Asia/Kuala_Lumpur",
  PH: "Asia/Manila", ID: "Asia/Jakarta", VN: "Asia/Ho_Chi_Minh",
  KM: "Indian/Comoro", MG: "Indian/Antananarivo",
};

interface MissingField {
  field: string;
  label: string;
  type: string;
  suggestion: string | number | null;
  help?: string;
}

interface OfficeCompleteness {
  missing: MissingField[];
  available: Record<string, any>;
  isComplete: boolean;
}

function checkOfficeDataCompleteness(
  office: any,
  matterType: string
): OfficeCompleteness {
  const missing: MissingField[] = [];
  const available: Record<string, any> = {};

  if (!office?.timezone) {
    missing.push({
      field: "timezone",
      label: "Zona horaria de la oficina",
      type: "timezone_select",
      suggestion: COUNTRY_TIMEZONE_GUESS[office?.country_code] || "UTC",
      help: "Usa la timezone del país donde se presenta la solicitud",
    });
  } else {
    available.timezone = office.timezone;
  }

  if (matterType === "trademark") {
    if (
      office?.handles_trademarks &&
      !office?.tm_opposition_period_days
    ) {
      missing.push({
        field: "tm_opposition_period_days",
        label: "Período de oposición (días)",
        type: "number",
        suggestion: 90,
        help: "Período estándar: 60-90 días en la mayoría de oficinas",
      });
    } else if (office?.tm_opposition_period_days) {
      available.opposition_days = office.tm_opposition_period_days;
    }

    if (!office?.tm_registration_duration_years) {
      missing.push({
        field: "tm_registration_duration_years",
        label: "Duración del registro (años)",
        type: "number",
        suggestion: 10,
        help: "10 años es el estándar global (TRIPS Art.18)",
      });
    } else {
      available.registration_years = office.tm_registration_duration_years;
    }
  }

  // Grace period is nice-to-have, not blocking
  if (office?.renewal_grace_period_days || office?.grace_period_days) {
    available.grace_period =
      office?.renewal_grace_period_days || office?.grace_period_days;
  }

  return { missing, available, isComplete: missing.length === 0 };
}

function calculateDeadlineInTimezone(
  baseDate: Date,
  value: number,
  unit: string,
  timezone: string
): Date {
  const tz = TIMEZONE_FALLBACKS[timezone] || timezone;
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

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load matter
    const { data: matter, error: matterErr } = await supabase
      .from("matters")
      .select(
        "id, type, status, jurisdiction_code, filing_date, registration_date, expiry_date, application_number, registration_number, organization_id, client_id, assigned_to"
      )
      .eq("id", matter_id)
      .single();

    if (matterErr || !matter) {
      return new Response(
        JSON.stringify({
          error: "Matter not found",
          details: matterErr?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Resolve office codes
    const jCode = matter.jurisdiction_code || "";
    const officeCodes = JURISDICTION_ALIASES[jCode] || [jCode];

    const { data: offices } = await supabase
      .from("ipo_offices")
      .select(
        "id, code, name_short, timezone, country_code, handles_trademarks, handles_patents, tm_opposition_period_days, tm_registration_duration_years, renewal_grace_period_days, grace_period_days"
      )
      .in("code", officeCodes);

    const office = offices?.[0];

    // ═══════════════════════════════════════════
    // LEVEL 1 — Check office data completeness
    // ═══════════════════════════════════════════
    const completeness = checkOfficeDataCompleteness(office, matter.type);

    if (!completeness.isComplete) {
      // ═══════════════════════════════════════════
      // LEVEL 2 — Check if matter has official docs
      // ═══════════════════════════════════════════
      let geniusSuggestions: any[] = [];

      const { data: docs } = await supabase
        .from("matter_documents")
        .select("id, name, file_path, mime_type, category")
        .eq("matter_id", matter_id)
        .eq("is_official", true)
        .in("category", [
          "certificate",
          "office_action",
          "official_document",
          "application",
        ]);

      if (docs && docs.length > 0) {
        // We have docs — note it in suggestions but don't block
        geniusSuggestions.push({
          source: "official_documents",
          message: `Se encontraron ${docs.length} documento(s) oficiales que podrían contener los datos faltantes.`,
          documents: docs.map((d: any) => ({
            id: d.id,
            name: d.name,
          })),
        });
      }

      // ═══════════════════════════════════════════
      // LEVEL 3 — Check Genius Knowledge Base
      // ═══════════════════════════════════════════
      const { data: kbResults } = await supabase
        .from("genius_knowledge_global")
        .select("content, data_confidence, source_url, title")
        .eq("jurisdiction_code", jCode)
        .eq("is_active", true)
        .in("knowledge_type", ["deadline", "fee_structure", "legislation"])
        .order("data_confidence", { ascending: false })
        .limit(3);

      if (kbResults && kbResults.length > 0) {
        geniusSuggestions.push({
          source: "knowledge_base",
          message: `IP-GENIUS tiene ${kbResults.length} referencia(s) para esta jurisdicción.`,
          references: kbResults.map((r: any) => ({
            title: r.title,
            confidence: r.data_confidence,
            excerpt: r.content?.substring(0, 200),
          })),
        });
      }

      // ═══════════════════════════════════════════
      // LEVEL 4 — If no office found at all OR critical
      //           fields missing → require manual input
      // ═══════════════════════════════════════════
      // If timezone is the ONLY missing field, use the suggestion and proceed
      const criticalMissing = completeness.missing.filter(
        (m) => m.field === "timezone"
      );
      const nonCriticalMissing = completeness.missing.filter(
        (m) => m.field !== "timezone"
      );

      // If only timezone is missing, auto-fill with suggestion and proceed
      if (nonCriticalMissing.length === 0 && criticalMissing.length > 0) {
        // Use timezone suggestion and continue generating deadlines
        // (fall through to the normal flow below)
      } else if (!office || nonCriticalMissing.length > 0) {
        // Return manual input request
        return new Response(
          JSON.stringify({
            success: false,
            requires_manual_input: true,
            office_code: office?.code || jCode,
            office_name: office?.name_short || jCode,
            office_id: office?.id || null,
            country_code: office?.country_code || null,
            missing_fields: completeness.missing,
            available_data: completeness.available,
            genius_suggestions: geniusSuggestions,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // ═══════════════════════════════════════════
    // Proceed with deadline generation
    // ═══════════════════════════════════════════
    const rawTz = office?.timezone || completeness.missing.find(m => m.field === 'timezone')?.suggestion as string || "UTC";
    const officeTimezone = TIMEZONE_FALLBACKS[rawTz] || rawTz;

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

    // Universal rules
    const { data: universalRules } = await supabase
      .from("deadline_rules")
      .select("*")
      .is("jurisdiction_id", null)
      .eq("is_active", true);

    allRules = [...allRules, ...(universalRules || [])];

    allRules = allRules.filter(
      (r: any) => !r.right_type || r.right_type === matter.type
    );

    let deadlinesCreated = 0;
    let calendarEventsCreated = 0;
    const errors: string[] = [];
    const now = new Date();

    for (const rule of allRules) {
      try {
        let baseDate: Date | null = null;

        switch (rule.trigger_field) {
          case "expiry_date":
            baseDate = matter.expiry_date
              ? new Date(matter.expiry_date)
              : null;
            break;
          case "priority_deadline":
            baseDate = matter.filing_date
              ? new Date(matter.filing_date)
              : null;
            break;
          case "national_phase_deadline":
            baseDate = matter.filing_date
              ? new Date(matter.filing_date)
              : null;
            break;
          case "response_deadline":
          case "opposition_deadline":
            if (
              rule.trigger_field === "response_deadline" &&
              matter.status === "office_action"
            ) {
              baseDate = matter.filing_date
                ? new Date(matter.filing_date)
                : null;
            }
            if (
              rule.trigger_field === "opposition_deadline" &&
              (matter.status === "published" ||
                matter.status === "registered")
            ) {
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

        const deadlineDate = calculateDeadlineInTimezone(
          baseDate,
          rule.time_value,
          rule.time_unit,
          officeTimezone
        );

        // Insert or update
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
              priority:
                rule.criticality === "critical" ? "critical" : "high",
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
          const { error: dlErr } = await supabase
            .from("matter_deadlines")
            .insert({
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
              priority:
                rule.criticality === "critical" ? "critical" : "high",
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

        // Calendar: deadline day event
        if (deadlineDate > now) {
          const { error: finalErr } = await supabase
            .from("calendar_events")
            .insert({
              organization_id: matter.organization_id,
              title: `🔴 VENCIMIENTO: ${rule.name_es || rule.name_en}`,
              description: `PLAZO FINAL — ${office?.name_short || jCode}\n${rule.consequence_if_missed || ""}`,
              event_type: "deadline_fatal",
              start_at: deadlineDate.toISOString(),
              end_at: new Date(
                deadlineDate.getTime() + 3600000
              ).toISOString(),
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

        // Calendar: alert reminders
        const alertDays: number[] = rule.alert_days || [];
        for (const daysBefore of alertDays) {
          const alertDate = new Date(deadlineDate);
          alertDate.setDate(alertDate.getDate() - daysBefore);
          if (alertDate < now) continue;

          const daysText = formatDaysText(daysBefore);
          const prefix = getAlertPrefix(daysBefore);
          const color = getAlertColor(daysBefore);

          const { error: ceErr } = await supabase
            .from("calendar_events")
            .insert({
              organization_id: matter.organization_id,
              title: `${prefix}${rule.name_es || rule.name_en} — vence en ${daysText}`,
              description: [
                `Expediente: ${matter.application_number || matter.registration_number || ""}`,
                `Oficina: ${office?.name_short || jCode} (${office?.code || jCode})`,
                `Timezone oficina: ${officeTimezone}`,
                `Vencimiento: ${deadlineDate.toLocaleDateString("es-ES")}`,
                rule.consequence_if_missed
                  ? `Si se pierde: ${rule.consequence_if_missed}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n"),
              event_type: daysBefore <= 14 ? "deadline_fatal" : "deadline",
              start_at: alertDate.toISOString(),
              end_at: new Date(
                alertDate.getTime() + 3600000
              ).toISOString(),
              all_day: false,
              matter_id: matter.id,
              color,
              status: "confirmed",
              created_by: matter.assigned_to,
            });

          if (ceErr) {
            errors.push(
              `Calendar ${rule.code}@${daysBefore}d: ${ceErr.message}`
            );
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
        data_completeness: completeness.isComplete
          ? "complete"
          : "partial",
        errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
