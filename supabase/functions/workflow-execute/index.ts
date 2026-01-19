import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowAction {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  conditions?: unknown[];
}

interface ExecutionContext {
  trigger_data: Record<string, unknown>;
  variables: Record<string, unknown>;
  action_outputs: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { execution_id, queue_id } = await req.json();

    if (!execution_id && !queue_id) {
      throw new Error('execution_id or queue_id is required');
    }

    let executionId = execution_id;
    let queueItem = null;

    // If queue_id provided, get execution from queue
    if (queue_id) {
      const { data: queue, error: queueError } = await supabase
        .from('workflow_queue')
        .select('*')
        .eq('id', queue_id)
        .single();

      if (queueError) throw queueError;
      queueItem = queue;

      // Create execution record
      const { data: newExecution, error: execError } = await supabase
        .from('workflow_executions')
        .insert({
          organization_id: queue.organization_id,
          workflow_id: queue.workflow_id,
          trigger_type: queue.trigger_type,
          trigger_data: queue.trigger_data,
          status: 'running',
          started_at: new Date().toISOString(),
          context: {}
        })
        .select()
        .single();

      if (execError) throw execError;
      executionId = newExecution.id;

      // Update queue with execution_id
      await supabase
        .from('workflow_queue')
        .update({ 
          execution_id: executionId,
          status: 'processing',
          locked_at: new Date().toISOString()
        })
        .eq('id', queue_id);
    }

    // Get execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow:workflow_templates(*)
      `)
      .eq('id', executionId)
      .single();

    if (execError) throw execError;

    const workflow = execution.workflow;
    const actions = workflow.actions as WorkflowAction[];
    
    console.log(`[Workflow ${workflow.code}] Starting execution ${executionId}`);
    console.log(`[Workflow ${workflow.code}] ${actions.length} actions to execute`);

    // Initialize context
    const context: ExecutionContext = {
      trigger_data: execution.trigger_data || {},
      variables: {},
      action_outputs: {}
    };

    // Load workflow variables
    const { data: variables } = await supabase
      .from('workflow_variables')
      .select('key, value')
      .eq('organization_id', execution.organization_id);
    
    if (variables) {
      for (const v of variables) {
        context.variables[v.key] = v.value;
      }
    }

    let actionsCompleted = 0;
    let actionsFailed = 0;
    let currentIndex = 0;

    // Execute each action
    for (const action of actions) {
      currentIndex++;
      
      console.log(`[Workflow ${workflow.code}] Executing action ${currentIndex}/${actions.length}: ${action.type}`);

      // Create action log
      const { data: actionLog } = await supabase
        .from('workflow_action_logs')
        .insert({
          execution_id: executionId,
          action_index: currentIndex,
          action_type: action.type,
          action_config: action.config,
          status: 'running',
          started_at: new Date().toISOString(),
          input_data: context
        })
        .select()
        .single();

      const startTime = Date.now();

      try {
        // Execute action based on type
        const result = await executeAction(supabase, action, context, execution.organization_id);
        
        const duration = Date.now() - startTime;
        
        // Store output in context for next actions
        context.action_outputs[action.id] = result;

        // Update action log as completed
        await supabase
          .from('workflow_action_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            output_data: result
          })
          .eq('id', actionLog.id);

        actionsCompleted++;
        console.log(`[Workflow ${workflow.code}] Action ${action.type} completed in ${duration}ms`);

      } catch (actionError: unknown) {
        const duration = Date.now() - startTime;
        actionsFailed++;
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';

        console.error(`[Workflow ${workflow.code}] Action ${action.type} failed:`, actionError);

        // Update action log as failed
        await supabase
          .from('workflow_action_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            error_message: errorMessage
          })
          .eq('id', actionLog.id);

        // For now, continue to next action on failure
        // In future: implement onFailure branching
      }

      // Update execution progress
      await supabase
        .from('workflow_executions')
        .update({
          current_action_index: currentIndex,
          actions_completed: actionsCompleted,
          actions_failed: actionsFailed,
          context
        })
        .eq('id', executionId);
    }

    // Mark execution as completed
    const finalStatus = actionsFailed > 0 ? 
      (actionsCompleted > 0 ? 'completed' : 'failed') : 'completed';

    await supabase
      .from('workflow_executions')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        result: context.action_outputs
      })
      .eq('id', executionId);

    // Update workflow stats
    await supabase
      .from('workflow_templates')
      .update({
        execution_count: workflow.execution_count + 1,
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflow.id);

    // Update queue if applicable
    if (queueItem) {
      await supabase
        .from('workflow_queue')
        .update({ status: 'completed' })
        .eq('id', queue_id);
    }

    console.log(`[Workflow ${workflow.code}] Execution completed: ${actionsCompleted} succeeded, ${actionsFailed} failed`);

    return new Response(JSON.stringify({
      success: true,
      execution_id: executionId,
      status: finalStatus,
      actions_completed: actionsCompleted,
      actions_failed: actionsFailed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[Workflow Execute] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// =============================================
// ACTION EXECUTORS
// =============================================

async function executeAction(
  supabase: any,
  action: WorkflowAction,
  context: ExecutionContext,
  organizationId: string
): Promise<Record<string, unknown>> {
  const config = interpolateConfig(action.config, context);

  switch (action.type) {
    case 'send_email':
      return await executeSendEmail(supabase, config, organizationId);
    
    case 'send_notification':
      return await executeSendNotification(supabase, config, organizationId);
    
    case 'create_task':
      return await executeCreateTask(supabase, config, organizationId, context);
    
    case 'update_field':
      return await executeUpdateField(supabase, config, context);
    
    case 'create_activity':
      return await executeCreateActivity(supabase, config, organizationId, context);
    
    case 'webhook':
      return await executeWebhook(config);
    
    case 'delay':
      return await executeDelay(config);
    
    case 'add_tag':
      return await executeAddTag(supabase, config, context);
    
    case 'remove_tag':
      return await executeRemoveTag(supabase, config, context);
    
    case 'assign_user':
      return await executeAssignUser(supabase, config, context);
    
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return { skipped: true, reason: 'unknown_action_type' };
  }
}

// Interpolate template variables in config
function interpolateConfig(config: Record<string, unknown>, context: ExecutionContext): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      result[key] = interpolateString(value, context);
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
    const value = getNestedValue(context as unknown as Record<string, unknown>, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  // Check trigger_data first
  if (parts[0] !== 'variables' && parts[0] !== 'action_outputs') {
    current = (obj as Record<string, unknown>).trigger_data;
  }
  
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// =============================================
// INDIVIDUAL ACTION EXECUTORS
// =============================================

async function executeSendEmail(supabase: any, config: Record<string, unknown>, organizationId: string) {
  // In production, integrate with email service (Resend, etc.)
  console.log('[Action] Send Email:', config);
  
  // For now, just log the action
  return { 
    sent: true, 
    to: config.to,
    template_id: config.template_id
  };
}

async function executeSendNotification(supabase: any, config: Record<string, unknown>, organizationId: string) {
  // Create notification record
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      organization_id: organizationId,
      user_id: config.user_id || null,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      is_read: false
    })
    .select()
    .single();

  if (error) {
    // If notifications table doesn't exist, log instead
    console.log('[Action] Send Notification:', config);
    return { sent: true, simulated: true };
  }

  return { sent: true, notification_id: data?.id };
}

async function executeCreateTask(supabase: any, config: Record<string, unknown>, organizationId: string, context: ExecutionContext) {
  // Create activity of type task
  const { data, error } = await supabase
    .from('activities')
    .insert({
      organization_id: organizationId,
      owner_type: 'tenant',
      type: 'task',
      subject: config.title,
      content: config.description,
      due_date: config.due_date,
      is_completed: false,
      matter_id: context.trigger_data?.matter_id,
      contact_id: context.trigger_data?.contact_id,
      deal_id: context.trigger_data?.deal_id
    })
    .select()
    .single();

  if (error) throw error;
  return { created: true, task_id: data.id };
}

async function executeUpdateField(supabase: any, config: Record<string, unknown>, context: ExecutionContext) {
  const entity = config.entity as string;
  const field = config.field as string;
  const value = config.value;
  
  let table = '';
  let recordId = '';
  
  switch (entity) {
    case 'matter':
      table = 'matters';
      recordId = context.trigger_data?.matter_id as string;
      break;
    case 'contact':
      table = 'contacts';
      recordId = context.trigger_data?.contact_id as string;
      break;
    case 'deal':
      table = 'deals';
      recordId = context.trigger_data?.deal_id as string;
      break;
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }

  if (!recordId) {
    throw new Error(`No ${entity}_id in trigger data`);
  }

  const { error } = await supabase
    .from(table)
    .update({ [field]: value })
    .eq('id', recordId);

  if (error) throw error;
  return { updated: true, entity, field, value };
}

async function executeCreateActivity(supabase: any, config: Record<string, unknown>, organizationId: string, context: ExecutionContext) {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      organization_id: organizationId,
      owner_type: 'tenant',
      type: config.type || 'note',
      subject: config.subject,
      content: config.content,
      matter_id: context.trigger_data?.matter_id,
      contact_id: context.trigger_data?.contact_id,
      deal_id: context.trigger_data?.deal_id
    })
    .select()
    .single();

  if (error) throw error;
  return { created: true, activity_id: data.id };
}

async function executeWebhook(config: Record<string, unknown>) {
  const url = config.url as string;
  const method = (config.method as string) || 'POST';
  const headers = (config.headers as Record<string, string>) || {};
  const body = config.body;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const responseData = await response.text();
  
  return {
    status: response.status,
    ok: response.ok,
    response: responseData
  };
}

async function executeDelay(config: Record<string, unknown>) {
  const duration = config.duration as number;
  const unit = config.unit as string;
  
  let ms = duration;
  switch (unit) {
    case 'minutes':
      ms = duration * 60 * 1000;
      break;
    case 'hours':
      ms = duration * 60 * 60 * 1000;
      break;
    case 'days':
      ms = duration * 24 * 60 * 60 * 1000;
      break;
  }

  // For now, just wait (in production, use queue scheduling)
  // Cap at 30 seconds for edge function limits
  const actualDelay = Math.min(ms, 30000);
  await new Promise(resolve => setTimeout(resolve, actualDelay));
  
  return { delayed: true, requested_ms: ms, actual_ms: actualDelay };
}

async function executeAddTag(supabase: any, config: Record<string, unknown>, context: ExecutionContext) {
  const tag = config.tag as string;
  const entityId = context.trigger_data?.matter_id || context.trigger_data?.contact_id || context.trigger_data?.deal_id;
  const table = context.trigger_data?.matter_id ? 'matters' : 
                context.trigger_data?.contact_id ? 'contacts' : 'deals';

  if (!entityId) return { skipped: true, reason: 'no_entity_id' };

  // Get current tags
  const { data: entity } = await supabase
    .from(table)
    .select('tags')
    .eq('id', entityId)
    .single();

  const currentTags = (entity?.tags || []) as string[];
  if (!currentTags.includes(tag)) {
    const { error } = await supabase
      .from(table)
      .update({ tags: [...currentTags, tag] })
      .eq('id', entityId);

    if (error) throw error;
  }

  return { added: true, tag };
}

async function executeRemoveTag(supabase: any, config: Record<string, unknown>, context: ExecutionContext) {
  const tag = config.tag as string;
  const entityId = context.trigger_data?.matter_id || context.trigger_data?.contact_id || context.trigger_data?.deal_id;
  const table = context.trigger_data?.matter_id ? 'matters' : 
                context.trigger_data?.contact_id ? 'contacts' : 'deals';

  if (!entityId) return { skipped: true, reason: 'no_entity_id' };

  const { data: entity } = await supabase
    .from(table)
    .select('tags')
    .eq('id', entityId)
    .single();

  const currentTags = (entity?.tags || []) as string[];
  const newTags = currentTags.filter(t => t !== tag);

  const { error } = await supabase
    .from(table)
    .update({ tags: newTags })
    .eq('id', entityId);

  if (error) throw error;
  return { removed: true, tag };
}

async function executeAssignUser(supabase: any, config: Record<string, unknown>, context: ExecutionContext) {
  const userId = config.user_id as string;
  const entityId = context.trigger_data?.matter_id || context.trigger_data?.deal_id;
  const table = context.trigger_data?.matter_id ? 'matters' : 'deals';
  const field = context.trigger_data?.matter_id ? 'assigned_to' : 'assigned_to';

  if (!entityId) return { skipped: true, reason: 'no_entity_id' };

  const { error } = await supabase
    .from(table)
    .update({ [field]: userId })
    .eq('id', entityId);

  if (error) throw error;
  return { assigned: true, user_id: userId };
}
