// =============================================
// IP-WORKFLOW TYPES
// =============================================

export type WorkflowTriggerType =
  | 'matter_created'
  | 'matter_status_changed'
  | 'deadline_approaching'
  | 'deal_stage_changed'
  | 'contact_created'
  | 'spider_alert'
  | 'filing_submitted'
  | 'invoice_overdue'
  | 'schedule'
  | 'manual'
  | 'webhook';

export type WorkflowActionType =
  | 'send_email'
  | 'send_notification'
  | 'create_task'
  | 'update_field'
  | 'create_activity'
  | 'webhook'
  | 'delay'
  | 'condition'
  | 'assign_user'
  | 'add_tag'
  | 'remove_tag'
  | 'ai_generate';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type WorkflowCategory = 
  | 'onboarding'
  | 'deadlines'
  | 'notifications'
  | 'crm'
  | 'billing'
  | 'spider'
  | 'custom';

// Condition operators
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list';

// Workflow condition
export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
}

// Workflow action configuration
export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  name: string;
  config: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  onSuccess?: string; // Next action id
  onFailure?: string; // Next action id on failure
}

// Trigger configuration
export interface WorkflowTriggerConfig {
  // For matter_status_changed
  from_status?: string;
  to_status?: string;
  
  // For deadline_approaching
  days_before?: number;
  deadline_types?: string[];
  
  // For deal_stage_changed
  from_stage_id?: string;
  to_stage_id?: string;
  
  // For schedule
  cron_expression?: string;
  timezone?: string;
  
  // For webhook
  webhook_secret?: string;
  
  // Generic filters
  filters?: WorkflowCondition[];
}

// Workflow Template
export interface WorkflowTemplate {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  trigger_type: WorkflowTriggerType;
  trigger_config: WorkflowTriggerConfig;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  is_system: boolean;
  execution_count: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  organization_id: string;
  workflow_id: string;
  trigger_type: WorkflowTriggerType;
  trigger_data: Record<string, unknown>;
  status: WorkflowStatus;
  started_at?: string;
  completed_at?: string;
  current_action_index: number;
  actions_completed: number;
  actions_failed: number;
  result: Record<string, unknown>;
  error_message?: string;
  context: Record<string, unknown>;
  created_at: string;
  
  // Joined data
  workflow?: WorkflowTemplate;
}

// Workflow Action Log
export interface WorkflowActionLog {
  id: string;
  execution_id: string;
  action_index: number;
  action_type: WorkflowActionType;
  action_config: Record<string, unknown>;
  status: WorkflowStatus;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

// Workflow Queue Item
export interface WorkflowQueueItem {
  id: string;
  organization_id: string;
  workflow_id: string;
  execution_id?: string;
  trigger_type: WorkflowTriggerType;
  trigger_data: Record<string, unknown>;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_for: string;
  locked_at?: string;
  locked_by?: string;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  created_at: string;
  
  // Joined data
  workflow?: WorkflowTemplate;
}

// Workflow Variable
export interface WorkflowVariable {
  id: string;
  organization_id: string;
  scope: 'organization' | 'workflow' | 'user';
  scope_id?: string;
  key: string;
  value: unknown;
  value_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  description?: string;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

// Workflow Schedule
export interface WorkflowSchedule {
  id: string;
  organization_id: string;
  workflow_id: string;
  name: string;
  description?: string;
  schedule_type: 'cron' | 'interval';
  cron_expression?: string;
  interval_minutes?: number;
  timezone: string;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  workflow?: WorkflowTemplate;
}

// Workflow Stats
export interface WorkflowStats {
  total_executions: number;
  successful: number;
  failed: number;
  pending: number;
  avg_duration_ms: number;
  by_workflow: { workflow_id: string; count: number }[];
}

// Predefined template for gallery
export interface PredefinedTemplate {
  code: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  trigger_type: WorkflowTriggerType;
  trigger_config: WorkflowTriggerConfig;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  icon: string;
  color: string;
}

// Action type definitions for the builder
export const WORKFLOW_TRIGGER_TYPES: {
  type: WorkflowTriggerType;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  { type: 'matter_created', label: 'Expediente Creado', description: 'Cuando se crea un nuevo expediente', icon: 'FolderPlus', color: 'blue' },
  { type: 'matter_status_changed', label: 'Cambio de Estado', description: 'Cuando un expediente cambia de estado', icon: 'RefreshCw', color: 'purple' },
  { type: 'deadline_approaching', label: 'Plazo Próximo', description: 'Días antes de un vencimiento', icon: 'Clock', color: 'orange' },
  { type: 'deal_stage_changed', label: 'Cambio de Etapa CRM', description: 'Cuando un deal cambia de etapa', icon: 'TrendingUp', color: 'pink' },
  { type: 'contact_created', label: 'Contacto Creado', description: 'Cuando se añade un nuevo contacto', icon: 'UserPlus', color: 'green' },
  { type: 'spider_alert', label: 'Alerta Spider', description: 'Cuando Spider detecta una alerta', icon: 'AlertTriangle', color: 'red' },
  { type: 'filing_submitted', label: 'Solicitud Presentada', description: 'Cuando se presenta una solicitud', icon: 'Send', color: 'cyan' },
  { type: 'invoice_overdue', label: 'Factura Vencida', description: 'Cuando una factura supera el vencimiento', icon: 'DollarSign', color: 'amber' },
  { type: 'schedule', label: 'Programado', description: 'Ejecutar en horarios específicos', icon: 'Calendar', color: 'indigo' },
  { type: 'manual', label: 'Manual', description: 'Ejecutar manualmente', icon: 'Play', color: 'gray' },
  { type: 'webhook', label: 'Webhook', description: 'Cuando se recibe un webhook externo', icon: 'Webhook', color: 'slate' },
];

export const WORKFLOW_ACTION_TYPES: {
  type: WorkflowActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  configSchema: Record<string, unknown>;
}[] = [
  { 
    type: 'send_email', 
    label: 'Enviar Email', 
    description: 'Envía un email usando plantillas', 
    icon: 'Mail',
    color: 'blue',
    configSchema: {
      to: { type: 'string', label: 'Destinatario', required: true },
      template_id: { type: 'select', label: 'Plantilla', required: true },
      variables: { type: 'object', label: 'Variables' }
    }
  },
  { 
    type: 'send_notification', 
    label: 'Enviar Notificación', 
    description: 'Notificación in-app o push', 
    icon: 'Bell',
    color: 'yellow',
    configSchema: {
      user_id: { type: 'string', label: 'Usuario' },
      title: { type: 'string', label: 'Título', required: true },
      message: { type: 'string', label: 'Mensaje', required: true },
      type: { type: 'select', label: 'Tipo', options: ['info', 'warning', 'success', 'error'] }
    }
  },
  { 
    type: 'create_task', 
    label: 'Crear Tarea', 
    description: 'Crea una tarea o actividad', 
    icon: 'CheckSquare',
    color: 'green',
    configSchema: {
      title: { type: 'string', label: 'Título', required: true },
      description: { type: 'string', label: 'Descripción' },
      assigned_to: { type: 'string', label: 'Asignar a' },
      due_date: { type: 'date', label: 'Fecha límite' },
      priority: { type: 'select', label: 'Prioridad', options: ['low', 'medium', 'high'] }
    }
  },
  { 
    type: 'update_field', 
    label: 'Actualizar Campo', 
    description: 'Modifica un campo del registro', 
    icon: 'Edit3',
    color: 'purple',
    configSchema: {
      entity: { type: 'select', label: 'Entidad', required: true, options: ['matter', 'contact', 'deal'] },
      field: { type: 'string', label: 'Campo', required: true },
      value: { type: 'string', label: 'Valor', required: true }
    }
  },
  { 
    type: 'create_activity', 
    label: 'Registrar Actividad', 
    description: 'Añade una entrada al timeline', 
    icon: 'Activity',
    color: 'cyan',
    configSchema: {
      type: { type: 'select', label: 'Tipo', required: true, options: ['note', 'call', 'meeting', 'email'] },
      subject: { type: 'string', label: 'Asunto', required: true },
      content: { type: 'string', label: 'Contenido' }
    }
  },
  { 
    type: 'webhook', 
    label: 'Webhook', 
    description: 'Llama a un endpoint externo', 
    icon: 'Globe',
    color: 'slate',
    configSchema: {
      url: { type: 'string', label: 'URL', required: true },
      method: { type: 'select', label: 'Método', options: ['GET', 'POST', 'PUT', 'PATCH'] },
      headers: { type: 'object', label: 'Headers' },
      body: { type: 'object', label: 'Body' }
    }
  },
  { 
    type: 'delay', 
    label: 'Esperar', 
    description: 'Pausa la ejecución', 
    icon: 'Clock',
    color: 'gray',
    configSchema: {
      duration: { type: 'number', label: 'Duración', required: true },
      unit: { type: 'select', label: 'Unidad', options: ['minutes', 'hours', 'days'] }
    }
  },
  { 
    type: 'condition', 
    label: 'Condición', 
    description: 'Bifurca según condiciones', 
    icon: 'GitBranch',
    color: 'orange',
    configSchema: {
      conditions: { type: 'array', label: 'Condiciones', required: true },
      then_action: { type: 'string', label: 'Si cumple' },
      else_action: { type: 'string', label: 'Si no cumple' }
    }
  },
  { 
    type: 'assign_user', 
    label: 'Asignar Usuario', 
    description: 'Asigna a un usuario o equipo', 
    icon: 'UserCheck',
    color: 'indigo',
    configSchema: {
      user_id: { type: 'string', label: 'Usuario' },
      assignment_type: { type: 'select', label: 'Tipo', options: ['specific', 'round_robin', 'least_busy'] }
    }
  },
  { 
    type: 'add_tag', 
    label: 'Añadir Etiqueta', 
    description: 'Añade una etiqueta', 
    icon: 'Tag',
    color: 'pink',
    configSchema: {
      tag: { type: 'string', label: 'Etiqueta', required: true }
    }
  },
  { 
    type: 'remove_tag', 
    label: 'Quitar Etiqueta', 
    description: 'Elimina una etiqueta', 
    icon: 'X',
    color: 'red',
    configSchema: {
      tag: { type: 'string', label: 'Etiqueta', required: true }
    }
  },
  { 
    type: 'ai_generate', 
    label: 'Generar con IA', 
    description: 'Genera contenido con NEXUS', 
    icon: 'Sparkles',
    color: 'amber',
    configSchema: {
      prompt: { type: 'string', label: 'Prompt', required: true },
      model: { type: 'select', label: 'Modelo', options: ['nexus_ops', 'nexus_legal'] },
      output_field: { type: 'string', label: 'Campo de salida' }
    }
  },
];

// Predefined workflow templates
export const PREDEFINED_WORKFLOW_TEMPLATES: PredefinedTemplate[] = [
  {
    code: 'new_matter_onboarding',
    name: 'Onboarding Nuevo Expediente',
    description: 'Notifica al equipo y crea tareas iniciales cuando se crea un expediente',
    category: 'onboarding',
    trigger_type: 'matter_created',
    trigger_config: {},
    conditions: [],
    actions: [
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Notificar equipo',
        config: {
          title: 'Nuevo expediente: {{matter.reference}}',
          message: '{{matter.title}} ha sido creado',
          type: 'info'
        }
      },
      {
        id: 'task',
        type: 'create_task',
        name: 'Crear tarea de revisión',
        config: {
          title: 'Revisar documentación inicial',
          description: 'Verificar que toda la documentación está completa',
          priority: 'medium'
        }
      }
    ],
    icon: 'FolderPlus',
    color: 'blue'
  },
  {
    code: 'deadline_reminder',
    name: 'Recordatorio de Plazos',
    description: 'Envía recordatorios antes de vencimientos importantes',
    category: 'deadlines',
    trigger_type: 'deadline_approaching',
    trigger_config: {
      days_before: 7
    },
    conditions: [],
    actions: [
      {
        id: 'email',
        type: 'send_email',
        name: 'Enviar recordatorio',
        config: {
          to: '{{matter.assigned_to.email}}',
          template_id: 'deadline_reminder'
        }
      },
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Notificación in-app',
        config: {
          title: 'Plazo próximo: {{deadline.title}}',
          message: 'Vence en {{deadline.days_remaining}} días',
          type: 'warning'
        }
      }
    ],
    icon: 'Clock',
    color: 'orange'
  },
  {
    code: 'spider_alert_response',
    name: 'Respuesta a Alertas Spider',
    description: 'Actúa automáticamente ante alertas de vigilancia',
    category: 'spider',
    trigger_type: 'spider_alert',
    trigger_config: {},
    conditions: [
      { field: 'severity', operator: 'in_list', value: ['critical', 'high'] }
    ],
    actions: [
      {
        id: 'task',
        type: 'create_task',
        name: 'Crear tarea urgente',
        config: {
          title: 'Analizar alerta: {{alert.title}}',
          priority: 'high'
        }
      },
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Notificación urgente',
        config: {
          title: '⚠️ Alerta Spider: {{alert.title}}',
          message: 'Similaridad: {{alert.similarity_score}}%',
          type: 'warning'
        }
      }
    ],
    icon: 'AlertTriangle',
    color: 'red'
  },
  {
    code: 'deal_won_celebration',
    name: 'Celebración Deal Ganado',
    description: 'Notifica y registra cuando se gana un deal',
    category: 'crm',
    trigger_type: 'deal_stage_changed',
    trigger_config: {},
    conditions: [
      { field: 'new_stage.is_won_stage', operator: 'equals', value: true }
    ],
    actions: [
      {
        id: 'activity',
        type: 'create_activity',
        name: 'Registrar victoria',
        config: {
          type: 'note',
          subject: '🎉 Deal ganado',
          content: 'El deal {{deal.title}} se ha cerrado exitosamente'
        }
      },
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Celebrar',
        config: {
          title: '🎉 ¡Deal ganado!',
          message: '{{deal.title}} - {{deal.value}} {{deal.currency}}',
          type: 'success'
        }
      }
    ],
    icon: 'Trophy',
    color: 'green'
  },
  {
    code: 'new_contact_welcome',
    name: 'Bienvenida Nuevo Contacto',
    description: 'Envía un email de bienvenida a nuevos contactos',
    category: 'crm',
    trigger_type: 'contact_created',
    trigger_config: {},
    conditions: [
      { field: 'email', operator: 'is_not_empty', value: null }
    ],
    actions: [
      {
        id: 'email',
        type: 'send_email',
        name: 'Email de bienvenida',
        config: {
          to: '{{contact.email}}',
          template_id: 'welcome_contact'
        }
      },
      {
        id: 'tag',
        type: 'add_tag',
        name: 'Marcar como nuevo',
        config: {
          tag: 'nuevo'
        }
      }
    ],
    icon: 'UserPlus',
    color: 'cyan'
  },
  {
    code: 'matter_status_notification',
    name: 'Notificación Cambio de Estado',
    description: 'Informa cuando un expediente cambia de estado',
    category: 'notifications',
    trigger_type: 'matter_status_changed',
    trigger_config: {},
    conditions: [],
    actions: [
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Notificar cambio',
        config: {
          title: 'Estado actualizado: {{matter.reference}}',
          message: '{{old_status}} → {{new_status}}',
          type: 'info'
        }
      },
      {
        id: 'activity',
        type: 'create_activity',
        name: 'Registrar cambio',
        config: {
          type: 'note',
          subject: 'Cambio de estado',
          content: 'El expediente cambió de {{old_status}} a {{new_status}}'
        }
      }
    ],
    icon: 'RefreshCw',
    color: 'purple'
  },
  {
    code: 'invoice_overdue_follow_up',
    name: 'Seguimiento Facturas Vencidas',
    description: 'Actúa cuando una factura supera la fecha de vencimiento',
    category: 'billing',
    trigger_type: 'invoice_overdue',
    trigger_config: {},
    conditions: [],
    actions: [
      {
        id: 'email',
        type: 'send_email',
        name: 'Recordatorio de pago',
        config: {
          to: '{{invoice.client.email}}',
          template_id: 'payment_reminder'
        }
      },
      {
        id: 'task',
        type: 'create_task',
        name: 'Seguimiento manual',
        config: {
          title: 'Llamar a {{invoice.client.name}} por factura vencida',
          priority: 'high'
        }
      }
    ],
    icon: 'DollarSign',
    color: 'amber'
  },
  {
    code: 'filing_submitted_confirmation',
    name: 'Confirmación de Presentación',
    description: 'Notifica cuando se presenta una solicitud exitosamente',
    category: 'notifications',
    trigger_type: 'filing_submitted',
    trigger_config: {},
    conditions: [],
    actions: [
      {
        id: 'email',
        type: 'send_email',
        name: 'Confirmar al cliente',
        config: {
          to: '{{filing.applicant.email}}',
          template_id: 'filing_confirmation'
        }
      },
      {
        id: 'notify',
        type: 'send_notification',
        name: 'Notificar internamente',
        config: {
          title: '✅ Solicitud presentada',
          message: '{{filing.tracking_number}} enviada a {{filing.office}}',
          type: 'success'
        }
      }
    ],
    icon: 'Send',
    color: 'cyan'
  }
];
