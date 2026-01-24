// ============================================================
// IP-NEXUS - CALCULATE DEADLINES EDGE FUNCTION
// Motor de cálculo automático de plazos según reglas
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeadlineRule {
  id: string;
  deadline_type_id: string;
  jurisdiction: string;
  trigger_event: string;
  days_offset: number;
  months_offset: number;
  years_offset: number;
  business_days_only: boolean;
  adjust_to_next_business_day: boolean;
  exclude_holidays: boolean;
  holiday_calendar: string;
  reminder_days: number[];
  priority: string;
  is_fatal: boolean;
  deadline_type?: {
    id: string;
    code: string;
    name_es: string;
    matter_types: string[];
  };
}

// Función para añadir días hábiles
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }
  
  return result;
}

// Verificar si es festivo
async function isHoliday(
  supabase: ReturnType<typeof createClient>,
  date: Date,
  calendarCode: string
): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('holiday_calendars')
    .select('id')
    .eq('country_code', calendarCode)
    .eq('date', dateStr)
    .maybeSingle();
  
  return !!data;
}

// Ajustar a siguiente día hábil
async function adjustToNextBusinessDay(
  supabase: ReturnType<typeof createClient>,
  date: Date,
  excludeHolidays: boolean,
  calendarCode: string
): Promise<Date> {
  const result = new Date(date);
  let maxIterations = 30; // Prevenir loops infinitos
  
  while (maxIterations > 0) {
    const dayOfWeek = result.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHolidayDate = excludeHolidays && await isHoliday(supabase, result, calendarCode);
    
    if (!isWeekend && !isHolidayDate) {
      break;
    }
    
    result.setDate(result.getDate() + 1);
    maxIterations--;
  }
  
  return result;
}

// Calcular fecha de vencimiento según regla
async function calculateDueDate(
  supabase: ReturnType<typeof createClient>,
  baseDate: Date,
  rule: DeadlineRule
): Promise<Date> {
  let result = new Date(baseDate);
  
  // Aplicar offsets
  if (rule.years_offset !== 0) {
    result.setFullYear(result.getFullYear() + rule.years_offset);
  }
  
  if (rule.months_offset !== 0) {
    result.setMonth(result.getMonth() + rule.months_offset);
  }
  
  if (rule.days_offset !== 0) {
    if (rule.business_days_only) {
      result = addBusinessDays(result, rule.days_offset);
    } else {
      result.setDate(result.getDate() + rule.days_offset);
    }
  }
  
  // Ajustar a día hábil si es necesario
  if (rule.adjust_to_next_business_day) {
    result = await adjustToNextBusinessDay(
      supabase,
      result,
      rule.exclude_holidays,
      rule.holiday_calendar
    );
  }
  
  return result;
}

// Obtener fecha base del expediente según trigger_event
function getTriggerDate(matter: Record<string, unknown>, triggerEvent: string): Date | null {
  const dateFields: Record<string, string> = {
    'filing_date': 'filing_date',
    'publication_date': 'publication_date',
    'registration_date': 'registration_date',
    'expiry_date': 'expiry_date',
    'priority_date': 'priority_date',
    'notification_date': 'notification_date',
    'grant_date': 'grant_date',
  };
  
  const field = dateFields[triggerEvent];
  if (!field || !matter[field]) return null;
  
  return new Date(matter[field] as string);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { matterId, triggerEvent, triggerDate, recalculate } = await req.json();

    if (!matterId) {
      return new Response(
        JSON.stringify({ error: 'matterId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener expediente
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('*')
      .eq('id', matterId)
      .single();

    if (matterError || !matter) {
      return new Response(
        JSON.stringify({ error: 'Matter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si recalculate, eliminar plazos auto-generados pendientes
    if (recalculate) {
      await supabase
        .from('matter_deadlines')
        .delete()
        .eq('matter_id', matterId)
        .eq('auto_generated', true)
        .in('status', ['pending', 'upcoming']);
    }

    // Obtener reglas aplicables
    const { data: rules, error: rulesError } = await supabase
      .from('deadline_rules')
      .select(`
        *,
        deadline_type:deadline_types(*)
      `)
      .eq('jurisdiction', matter.jurisdiction_code)
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    // Filtrar reglas por tipo de expediente
    const applicableRules = (rules || []).filter((rule: DeadlineRule) => {
      return rule.deadline_type?.matter_types?.includes(matter.type);
    });

    const createdDeadlines: unknown[] = [];
    const errors: string[] = [];

    // Procesar cada regla
    for (const rule of applicableRules) {
      try {
        // Obtener fecha trigger
        let baseDateValue: Date | null = null;
        
        if (triggerEvent === rule.trigger_event && triggerDate) {
          baseDateValue = new Date(triggerDate);
        } else {
          baseDateValue = getTriggerDate(matter, rule.trigger_event);
        }

        if (!baseDateValue) continue;

        // Calcular fecha de vencimiento
        const dueDate = await calculateDueDate(supabase, baseDateValue, rule);

        // Verificar si ya existe este plazo
        const { data: existing } = await supabase
          .from('matter_deadlines')
          .select('id')
          .eq('matter_id', matterId)
          .eq('deadline_type_id', rule.deadline_type_id)
          .maybeSingle();

        if (existing && !recalculate) continue;

        // Crear deadline
        const deadlineData = {
          organization_id: matter.organization_id,
          matter_id: matterId,
          deadline_type_id: rule.deadline_type_id,
          deadline_rule_id: rule.id,
          rule_code: rule.deadline_type?.code,
          deadline_type: rule.deadline_type?.code,
          title: rule.deadline_type?.name_es || 'Plazo',
          trigger_date: baseDateValue.toISOString().split('T')[0],
          deadline_date: dueDate.toISOString().split('T')[0],
          original_deadline: dueDate.toISOString().split('T')[0],
          status: 'pending',
          priority: rule.priority,
          auto_generated: true,
          source: 'system',
        };

        const { data: deadline, error: deadlineError } = await supabase
          .from('matter_deadlines')
          .insert(deadlineData)
          .select()
          .single();

        if (deadlineError) {
          errors.push(`Error creating deadline: ${deadlineError.message}`);
          continue;
        }

        createdDeadlines.push(deadline);

        // Crear recordatorios
        if (rule.reminder_days && rule.reminder_days.length > 0) {
          const reminders = rule.reminder_days.map((daysBefore: number) => {
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(reminderDate.getDate() - daysBefore);
            
            return {
              deadline_id: deadline.id,
              reminder_date: reminderDate.toISOString().split('T')[0],
              days_before: daysBefore,
              status: 'scheduled',
              channel: 'in_app',
            };
          });

          await supabase.from('deadline_reminders').insert(reminders);
        }
      } catch (e) {
        errors.push(`Rule ${rule.id}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        matterId,
        deadlinesCreated: createdDeadlines.length,
        deadlines: createdDeadlines,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-deadlines:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
