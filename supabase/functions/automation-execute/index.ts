// ============================================================================
// IP-NEXUS: AUTOMATION EXECUTE - Motor de ejecución para tenant_automations
// v1.1.0 - Corregido schema de notifications
// ============================================================================
// Este motor ejecuta las automatizaciones configuradas por cada tenant.
// Usa las tablas: tenant_automations, automation_executions
// Acciones soportadas: send_notification, send_email, create_task, update_field
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AutomationAction {
  order: number;
  type: string;
  config: Record<string, unknown>;
}

interface Condition {
  field: string;
  operator: string;
  value: unknown;
  value_param?: string;
}

interface ExecutionContext {
  trigger_type: string;
  trigger_data: Record<string, unknown>;
  entity_type?: string;
  entity_id?: string;
  organization_id: string;
  custom_params: Record<string, unknown>;
  variables: Record<string, unknown>;
  action_outputs: Record<string, unknown>;
}

interface ActionLog {
  action_order: number;
  action_type: string;
  status: 'success' | 'error' | 'skipped';
  started_at: string;
  completed_at: string;
  duration_ms: number;
  output?: Record<string, unknown>;
  error?: string;
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      automation_id,       // ID de tenant_automation
      trigger_type,        // Para buscar automatizaciones por trigger
      trigger_data = {},   // Datos del disparador
      entity_type,         // Tipo de entidad (matter, contact, etc.)
      entity_id,           // ID de la entidad
      organization_id,     // Organización
      idempotency_key,     // Para evitar duplicados
    } = body;

    // ─── Modo 1: Ejecutar una automatización específica ───────────────────
    if (automation_id) {
      return await executeSpecificAutomation(
        supabase,
        automation_id,
        trigger_data,
        entity_type,
        entity_id,
        idempotency_key,
        startTime
      );
    }

    // ─── Modo 2: Buscar y ejecutar todas las automatizaciones que coincidan ───
    if (trigger_type && organization_id) {
      return await executeTriggerBasedAutomations(
        supabase,
        trigger_type,
        trigger_data,
        entity_type,
        entity_id,
        organization_id,
        startTime
      );
    }

    throw new Error('Se requiere automation_id o (trigger_type + organization_id)');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[AutomationExecute] Error fatal:', error);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE SPECIFIC AUTOMATION
// ─────────────────────────────────────────────────────────────────────────────

async function executeSpecificAutomation(
  supabase: SupabaseClient,
  automationId: string,
  triggerData: Record<string, unknown>,
  entityType: string | undefined,
  entityId: string | undefined,
  idempotencyKey: string | undefined,
  startTime: number
) {
  // Verificar idempotencia
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('automation_executions')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Ejecución duplicada ignorada',
        existing_execution_id: existing.id,
        status: existing.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Obtener la automatización
  const { data: automation, error: autoError } = await supabase
    .from('tenant_automations')
    .select('*')
    .eq('id', automationId)
    .single();

  if (autoError || !automation) {
    throw new Error(`Automatización no encontrada: ${automationId}`);
  }

  if (!automation.is_active) {
    return new Response(JSON.stringify({
      success: false,
      message: 'La automatización está desactivada',
      automation_id: automationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Ejecutar
  const result = await runAutomation(
    supabase,
    automation,
    triggerData,
    entityType,
    entityId,
    idempotencyKey,
    startTime
  );

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE TRIGGER-BASED AUTOMATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function executeTriggerBasedAutomations(
  supabase: SupabaseClient,
  triggerType: string,
  triggerData: Record<string, unknown>,
  entityType: string | undefined,
  entityId: string | undefined,
  organizationId: string,
  startTime: number
) {
  // Buscar automatizaciones activas con este trigger
  const { data: automations, error } = await supabase
    .from('tenant_automations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('trigger_type', triggerType)
    .eq('is_active', true);

  if (error) throw error;

  if (!automations || automations.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No hay automatizaciones activas para este trigger',
      trigger_type: triggerType,
      automations_found: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log(`[AutomationExecute] Encontradas ${automations.length} automatizaciones para trigger ${triggerType}`);

  const results = [];

  for (const automation of automations) {
    try {
      const result = await runAutomation(
        supabase,
        automation,
        triggerData,
        entityType,
        entityId,
        undefined,
        Date.now()
      );
      results.push({ automation_id: automation.id, name: automation.name, ...result });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Error';
      results.push({ automation_id: automation.id, name: automation.name, success: false, error: errMsg });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    trigger_type: triggerType,
    automations_found: automations.length,
    automations_executed: results.filter(r => r.success).length,
    results,
    duration_ms: Date.now() - startTime
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN AUTOMATION
// ─────────────────────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function runAutomation(
  supabase: SupabaseClient,
  automation: any,
  triggerData: Record<string, unknown>,
  entityType: string | undefined,
  entityId: string | undefined,
  idempotencyKey: string | undefined,
  startTime: number
) {
  const organizationId = automation.organization_id as string;
  const actions = (automation.actions || []) as AutomationAction[];
  const conditions = (automation.conditions || []) as Condition[];
  const customParams = (automation.custom_params || {}) as Record<string, unknown>;

  console.log(`[AutomationExecute] Ejecutando: ${automation.name} (${automation.id})`);

  // Crear registro de ejecución
  const { data: execution, error: execError } = await supabase
    .from('automation_executions')
    .insert({
      organization_id: organizationId,
      tenant_automation_id: automation.id,
      trigger_type: automation.trigger_type,
      trigger_data: triggerData,
      entity_type: entityType,
      entity_id: entityId,
      status: 'running',
      actions_log: [],
      retry_count: 0,
      max_retries: 3,
      started_at: new Date().toISOString(),
      idempotency_key: idempotencyKey
    })
    .select()
    .single();

  if (execError) {
    console.error('[AutomationExecute] Error creando ejecución:', execError);
    throw execError;
  }

  // Construir contexto
  const context: ExecutionContext = {
    trigger_type: automation.trigger_type as string,
    trigger_data: triggerData,
    entity_type: entityType,
    entity_id: entityId,
    organization_id: organizationId,
    custom_params: customParams,
    variables: {
      today: new Date().toISOString().split('T')[0],
      now: new Date().toISOString(),
      tomorrow: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    },
    action_outputs: {}
  };

  // Evaluar condiciones globales
  const conditionsMet = evaluateConditions(conditions, context);
  if (!conditionsMet) {
    console.log(`[AutomationExecute] Condiciones no cumplidas, saltando`);
    
    await supabase
      .from('automation_executions')
      .update({
        status: 'skipped',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error_message: 'Condiciones no cumplidas'
      })
      .eq('id', execution.id);

    return {
      success: true,
      execution_id: execution.id,
      status: 'skipped',
      reason: 'conditions_not_met'
    };
  }

  // Ejecutar acciones
  const actionsLog: ActionLog[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Ordenar acciones
  const sortedActions = [...actions].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const action of sortedActions) {
    const actionStart = Date.now();
    
    try {
      console.log(`[AutomationExecute] Ejecutando acción: ${action.type}`);
      
      const result = await executeAction(supabase, action, context);
      
      context.action_outputs[`action_${action.order}`] = result;
      
      actionsLog.push({
        action_order: action.order,
        action_type: action.type,
        status: 'success',
        started_at: new Date(actionStart).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - actionStart,
        output: result
      });
      
      successCount++;
      
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error(`[AutomationExecute] Error en acción ${action.type}:`, e);
      
      actionsLog.push({
        action_order: action.order,
        action_type: action.type,
        status: 'error',
        started_at: new Date(actionStart).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - actionStart,
        error: errMsg
      });
      
      errorCount++;
    }
  }

  // Determinar estado final
  const finalStatus = errorCount === 0 ? 'success' : 
                      successCount > 0 ? 'partial' : 'error';

  const durationMs = Date.now() - startTime;

  // Actualizar ejecución
  await supabase
    .from('automation_executions')
    .update({
      status: finalStatus,
      actions_log: actionsLog,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs
    })
    .eq('id', execution.id);

  // Actualizar estadísticas de la automatización
  const updateField = finalStatus === 'success' ? 'success_count' : 'error_count';
  const currentCount = automation[updateField] || 0;
  const currentRunCount = automation.run_count || 0;
  
  await supabase
    .from('tenant_automations')
    .update({
      last_run_at: new Date().toISOString(),
      run_count: currentRunCount + 1,
      [updateField]: currentCount + 1
    })
    .eq('id', automation.id);

  console.log(`[AutomationExecute] Completado: ${finalStatus} (${successCount} ok, ${errorCount} err) en ${durationMs}ms`);

  return {
    success: finalStatus !== 'error',
    execution_id: execution.id,
    status: finalStatus,
    actions_completed: successCount,
    actions_failed: errorCount,
    duration_ms: durationMs
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATE CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

function evaluateConditions(conditions: Condition[], context: ExecutionContext): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const condition of conditions) {
    // deno-lint-ignore no-explicit-any
    const fieldValue = getNestedValue(context as any, condition.field);
    let compareValue = condition.value;
    
    // Si hay value_param, usar el valor del custom_params
    if (condition.value_param && context.custom_params[condition.value_param] !== undefined) {
      compareValue = context.custom_params[condition.value_param];
    }

    const result = evaluateSingleCondition(fieldValue, condition.operator, compareValue);
    if (!result) return false; // AND logic
  }

  return true;
}

function evaluateSingleCondition(fieldValue: unknown, operator: string, compareValue: unknown): boolean {
  switch (operator) {
    case 'equals':
    case 'eq':
      return String(fieldValue) === String(compareValue);
    
    case 'not_equals':
    case 'neq':
      return String(fieldValue) !== String(compareValue);
    
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    
    case 'greater_than':
    case 'gt':
      return Number(fieldValue) > Number(compareValue);
    
    case 'less_than':
    case 'lt':
      return Number(fieldValue) < Number(compareValue);
    
    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue);
      }
      return false;
    
    case 'not_in':
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue);
      }
      return true;
    
    case 'is_empty':
    case 'is_null':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    
    case 'not_empty':
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    
    case 'is_true':
      return fieldValue === true || fieldValue === 'true';
    
    case 'is_false':
      return fieldValue === false || fieldValue === 'false';
    
    default:
      console.warn(`[Conditions] Operador desconocido: ${operator}`);
      return true;
  }
}

// deno-lint-ignore no-explicit-any
function getNestedValue(obj: Record<string, any>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE ACTION
// ─────────────────────────────────────────────────────────────────────────────

async function executeAction(
  supabase: SupabaseClient,
  action: AutomationAction,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const config = interpolateConfig(action.config, context);

  switch (action.type) {
    case 'send_notification':
    case 'create_notification':
      return await actionSendNotification(supabase, config, context);
    
    case 'send_email':
      return await actionSendEmail(config, context);
    
    case 'create_task':
      return await actionCreateTask(supabase, config, context);
    
    case 'update_field':
      return await actionUpdateField(supabase, config, context);
    
    case 'change_status':
      return await actionChangeStatus(supabase, config, context);
    
    case 'add_tag':
      return await actionAddTag(supabase, config, context);
    
    case 'webhook':
      return await actionWebhook(config);
    
    case 'delay':
      return await actionDelay(config);
    
    default:
      console.warn(`[Action] Tipo no soportado: ${action.type}`);
      return { skipped: true, reason: `unsupported_action_type: ${action.type}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: SEND NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

async function actionSendNotification(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  // Mapear campos al schema real de notifications
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      organization_id: context.organization_id,
      user_id: config.recipient || config.user_id || null,
      title: config.title,
      body: config.message || config.body || '',
      type: config.type || 'automation',
      priority: config.priority || 'normal',
      action_url: config.link || config.action_url || null,
      is_read: false,
      reference_type: context.entity_type || null,
      reference_id: context.entity_id || null,
      metadata: { automation: true, trigger_type: context.trigger_type }
    })
    .select()
    .single();

  if (error) {
    console.error('[Action:Notification] Error:', error.message);
    throw new Error(`Error creando notificación: ${error.message}`);
  }

  return { sent: true, notification_id: data?.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: SEND EMAIL
// ─────────────────────────────────────────────────────────────────────────────

async function actionSendEmail(
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({
      to: config.to,
      cc: config.cc,
      subject: config.subject,
      html: config.body || config.html,
      template_code: config.template_code,
      variables: config.variables,
      organization_id: context.organization_id
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Error enviando email: ${result.error || response.statusText}`);
  }

  return { sent: true, to: config.to, message_id: result.message_id };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: CREATE TASK
// ─────────────────────────────────────────────────────────────────────────────

async function actionCreateTask(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  // Calcular fecha de vencimiento
  let dueDate: string | null = null;
  if (config.due_date) {
    dueDate = String(config.due_date);
  } else if (config.due_date_offset_days) {
    const offsetDays = Number(config.due_date_offset_days);
    dueDate = new Date(Date.now() + offsetDays * 86400000).toISOString();
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: context.organization_id,
      matter_id: context.entity_type === 'matter' ? context.entity_id : config.matter_id,
      title: config.title,
      description: config.description,
      priority: config.priority || 'medium',
      status: 'pending',
      due_date: dueDate,
      assigned_to: config.assignee || config.assigned_to || null,
      is_completed: false
    })
    .select()
    .single();

  if (error) {
    console.error('[Action:Task] Error:', error.message);
    throw new Error(`Error creando tarea: ${error.message}`);
  }

  return { created: true, task_id: data?.id, title: config.title };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: UPDATE FIELD
// ─────────────────────────────────────────────────────────────────────────────

async function actionUpdateField(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const table = config.table as string;
  const field = config.field as string;
  const value = config.value;
  const entityId = config.entity_id || context.entity_id;

  if (!table || !field || !entityId) {
    throw new Error('update_field requiere table, field y entity_id');
  }

  const { error } = await supabase
    .from(table)
    .update({ [field]: value })
    .eq('id', entityId);

  if (error) {
    throw new Error(`Error actualizando campo: ${error.message}`);
  }

  return { updated: true, table, field, value };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: CHANGE STATUS
// ─────────────────────────────────────────────────────────────────────────────

async function actionChangeStatus(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const table = (config.table || 'matters') as string;
  const newStatus = config.new_status || config.status || config.value;
  const entityId = config.entity_id || context.entity_id;

  if (!entityId) {
    throw new Error('change_status requiere entity_id');
  }

  const { error } = await supabase
    .from(table)
    .update({ status: newStatus })
    .eq('id', entityId);

  if (error) {
    throw new Error(`Error cambiando estado: ${error.message}`);
  }

  return { updated: true, new_status: newStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: ADD TAG
// ─────────────────────────────────────────────────────────────────────────────

async function actionAddTag(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const table = (config.table || 'matters') as string;
  const tagToAdd = config.tag as string;
  const entityId = config.entity_id || context.entity_id;

  if (!entityId || !tagToAdd) {
    throw new Error('add_tag requiere entity_id y tag');
  }

  // Obtener tags actuales
  const { data: current } = await supabase
    .from(table)
    .select('tags')
    .eq('id', entityId)
    .single();

  const currentTags = (current?.tags as string[]) || [];
  if (!currentTags.includes(tagToAdd)) {
    const { error } = await supabase
      .from(table)
      .update({ tags: [...currentTags, tagToAdd] })
      .eq('id', entityId);

    if (error) {
      throw new Error(`Error añadiendo tag: ${error.message}`);
    }
  }

  return { added: true, tag: tagToAdd };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: WEBHOOK
// ─────────────────────────────────────────────────────────────────────────────

async function actionWebhook(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = config.url as string;
  const method = (config.method as string || 'POST').toUpperCase();
  const headers = (config.headers || {}) as Record<string, string>;
  const body = config.body;

  if (!url) {
    throw new Error('webhook requiere url');
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return {
    sent: true,
    status_code: response.status,
    ok: response.ok
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: DELAY
// ─────────────────────────────────────────────────────────────────────────────

async function actionDelay(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const seconds = Number(config.seconds || config.duration || 0);
  const maxDelay = 30; // Máximo 30 segundos para no timeout

  const actualDelay = Math.min(seconds, maxDelay);
  
  if (actualDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, actualDelay * 1000));
  }

  return { delayed: true, seconds: actualDelay };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERPOLATE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function interpolateConfig(
  config: Record<string, unknown>,
  context: ExecutionContext
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      result[key] = interpolateString(value, context);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string' ? interpolateString(item, context) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = interpolateConfig(value as Record<string, unknown>, context);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function interpolateString(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    // Buscar en diferentes lugares
    // deno-lint-ignore no-explicit-any
    let value = getNestedValue(context.trigger_data as any, path.trim());
    if (value === undefined) {
      // deno-lint-ignore no-explicit-any
      value = getNestedValue(context.custom_params as any, path.trim());
    }
    if (value === undefined) {
      // deno-lint-ignore no-explicit-any
      value = getNestedValue(context.variables as any, path.trim());
    }
    if (value === undefined) {
      // deno-lint-ignore no-explicit-any
      value = getNestedValue(context as any, path.trim());
    }
    
    return value !== undefined ? String(value) : match;
  });
}
