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
  jurisdiction: string;
  matter_type: string;
  event_type: string;
  code: string;
  name: string;
  days_from_event: number;
  calendar_type: string;
  creates_deadline: boolean;
  deadline_type?: string;
  priority: string;
  auto_create_task: boolean;
  alert_days?: number[];
  is_active: boolean;
}

interface Holiday {
  date: string;
  name: string;
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
function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(h => h.date === dateStr);
}

// Ajustar a siguiente día hábil
function adjustToNextBusinessDay(date: Date, holidays: Holiday[]): Date {
  const result = new Date(date);
  let maxIterations = 30;
  
  while (maxIterations > 0) {
    const dayOfWeek = result.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHolidayDate = isHoliday(result, holidays);
    
    if (!isWeekend && !isHolidayDate) {
      break;
    }
    
    result.setDate(result.getDate() + 1);
    maxIterations--;
  }
  
  return result;
}

// Calcular fecha de vencimiento según regla
function calculateDueDate(
  baseDate: Date,
  rule: DeadlineRule,
  holidays: Holiday[]
): Date {
  let result = new Date(baseDate);
  
  // Aplicar offset de días
  if (rule.calendar_type === 'business') {
    result = addBusinessDays(result, rule.days_from_event);
  } else {
    result.setDate(result.getDate() + rule.days_from_event);
  }
  
  // Ajustar a día hábil si cae en fin de semana o festivo
  result = adjustToNextBusinessDay(result, holidays);
  
  return result;
}

// Obtener fecha base del expediente según event_type
function getTriggerDate(matter: Record<string, unknown>, eventType: string): Date | null {
  const dateFields: Record<string, string> = {
    'filing': 'filing_date',
    'filing_date': 'filing_date',
    'publication': 'publication_date',
    'publication_date': 'publication_date',
    'registration': 'registration_date',
    'registration_date': 'registration_date',
    'expiry': 'expiry_date',
    'expiry_date': 'expiry_date',
    'priority': 'priority_date',
    'priority_date': 'priority_date',
    'notification': 'notification_date',
    'notification_date': 'notification_date',
    'grant': 'grant_date',
    'grant_date': 'grant_date',
  };
  
  const field = dateFields[eventType];
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
      .select('*')
      .eq('jurisdiction', matter.jurisdiction_code)
      .eq('matter_type', matter.type)
      .eq('is_active', true)
      .eq('creates_deadline', true);

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      throw rulesError;
    }

    // Obtener festivos para la jurisdicción
    const currentYear = new Date().getFullYear();
    const { data: holidays } = await supabase
      .from('holiday_calendars')
      .select('date, name')
      .eq('country_code', matter.jurisdiction_code)
      .gte('year', currentYear - 1)
      .lte('year', currentYear + 2);

    const holidayList: Holiday[] = (holidays || []).map(h => ({
      date: h.date,
      name: h.name || '',
    }));

    const createdDeadlines: unknown[] = [];
    const errors: string[] = [];

    // Procesar cada regla
    for (const rule of (rules || []) as DeadlineRule[]) {
      try {
        // Obtener fecha trigger
        let baseDateValue: Date | null = null;
        
        if (triggerEvent === rule.event_type && triggerDate) {
          baseDateValue = new Date(triggerDate);
        } else {
          baseDateValue = getTriggerDate(matter, rule.event_type);
        }

        if (!baseDateValue) continue;

        // Calcular fecha de vencimiento
        const dueDate = calculateDueDate(baseDateValue, rule, holidayList);

        // Verificar si ya existe este plazo
        const { data: existing } = await supabase
          .from('matter_deadlines')
          .select('id')
          .eq('matter_id', matterId)
          .eq('rule_code', rule.code)
          .maybeSingle();

        if (existing && !recalculate) continue;

        // Crear deadline
        const deadlineData = {
          organization_id: matter.organization_id,
          matter_id: matterId,
          rule_id: rule.id,
          rule_code: rule.code,
          deadline_type: rule.deadline_type || rule.code,
          title: rule.name,
          description: `Generado automáticamente desde regla: ${rule.code}`,
          trigger_date: baseDateValue.toISOString().split('T')[0],
          deadline_date: dueDate.toISOString().split('T')[0],
          original_deadline: dueDate.toISOString().split('T')[0],
          status: 'pending',
          priority: rule.priority || 'medium',
          auto_generated: true,
          source: 'system',
        };

        const { data: deadline, error: deadlineError } = await supabase
          .from('matter_deadlines')
          .insert(deadlineData)
          .select()
          .single();

        if (deadlineError) {
          errors.push(`Error creating deadline for rule ${rule.code}: ${deadlineError.message}`);
          continue;
        }

        createdDeadlines.push(deadline);

        // Crear recordatorios si existen alert_days
        if (rule.alert_days && rule.alert_days.length > 0) {
          const reminders = rule.alert_days.map((daysBefore: number) => {
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

          const { error: reminderError } = await supabase
            .from('deadline_reminders')
            .insert(reminders);
          
          if (reminderError) {
            console.error('Error creating reminders:', reminderError);
          }
        }

        // Crear tarea automática si está configurado
        if (rule.auto_create_task) {
          const taskData = {
            organization_id: matter.organization_id,
            matter_id: matterId,
            title: `[AUTO] ${rule.name}`,
            description: `Tarea generada automáticamente para: ${rule.name}`,
            due_date: dueDate.toISOString().split('T')[0],
            priority: rule.priority || 'medium',
            status: 'pending',
            source: 'deadline_rule',
          };

          await supabase.from('tasks').insert(taskData);
        }
      } catch (e) {
        errors.push(`Rule ${rule.code}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        matterId,
        jurisdiction: matter.jurisdiction_code,
        matterType: matter.type,
        rulesEvaluated: (rules || []).length,
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
