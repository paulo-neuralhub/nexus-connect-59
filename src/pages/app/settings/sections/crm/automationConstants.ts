import {
  LogIn, LogOut, Clock, Mail, CheckSquare,
  FileText, Sparkles, type LucideIcon
} from 'lucide-react'

export interface ConfigField {
  key: string
  type: 'text' | 'number' | 'select' | 'boolean'
  label: string
  placeholder?: string
  min?: number
  max?: number
  default?: string | number | boolean
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

export interface TriggerDef {
  value: string
  label: string
  icon: LucideIcon
  bgClass: string
  textClass: string
  borderClass: string
  iconClass: string
  config_fields: ConfigField[]
}

export interface ActionDef {
  value: string
  label: string
  icon: LucideIcon
  iconClass: string
  config_fields: ConfigField[]
}

export const TRIGGER_DEFS: TriggerDef[] = [
  {
    value: 'stage_enter', label: 'Al entrar en la etapa',
    icon: LogIn,
    bgClass: 'bg-green-50', textClass: 'text-green-700',
    borderClass: 'border-green-200', iconClass: 'text-green-600',
    config_fields: [],
  },
  {
    value: 'stage_exit', label: 'Al salir de la etapa',
    icon: LogOut,
    bgClass: 'bg-slate-50', textClass: 'text-slate-700',
    borderClass: 'border-slate-200', iconClass: 'text-slate-500',
    config_fields: [],
  },
  {
    value: 'stage_time_elapsed', label: 'Si lleva X días sin avanzar',
    icon: Clock,
    bgClass: 'bg-amber-50', textClass: 'text-amber-700',
    borderClass: 'border-amber-200', iconClass: 'text-amber-600',
    config_fields: [
      {
        key: 'days', type: 'number', label: 'Días sin avanzar',
        min: 1, max: 365, default: 7, required: true,
      },
    ],
  },
]

export const ACTION_DEFS: ActionDef[] = [
  {
    value: 'send_email', label: 'Enviar email al cliente',
    icon: Mail, iconClass: 'text-blue-600',
    config_fields: [
      {
        key: 'to', type: 'select', label: 'Destinatario',
        required: true,
        options: [
          { value: 'client', label: 'Cliente' },
          { value: 'responsible', label: 'Responsable' },
          { value: 'admin', label: 'Administrador' },
        ],
      },
      {
        key: 'subject', type: 'text', label: 'Asunto',
        placeholder: 'Ej: {{deal_name}} — actualización',
        required: true,
      },
      {
        key: 'template', type: 'select', label: 'Plantilla',
        required: true,
        options: [
          { value: 'welcome_mandate', label: 'Bienvenida mandato' },
          { value: 'search_report_ready', label: 'Informe listo' },
          { value: 'filing_confirmation', label: 'Confirmación presentación' },
          { value: 'office_action_received', label: 'Office Action recibida' },
          { value: 'renewal_reminder', label: 'Recordatorio renovación' },
        ],
      },
    ],
  },
  {
    value: 'create_task', label: 'Crear tarea',
    icon: CheckSquare, iconClass: 'text-violet-600',
    config_fields: [
      {
        key: 'title', type: 'text', label: 'Título de la tarea',
        placeholder: 'Ej: Abrir expediente para {{account_name}}',
        required: true,
      },
      {
        key: 'assignee', type: 'select', label: 'Asignar a',
        required: true,
        options: [
          { value: 'responsible', label: 'Responsable del deal' },
          { value: 'admin', label: 'Administrador' },
        ],
      },
      {
        key: 'days_due', type: 'number', label: 'Días para completar',
        min: 1, max: 90, default: 3, required: true,
      },
    ],
  },
  {
    value: 'generate_document', label: 'Generar documento',
    icon: FileText, iconClass: 'text-teal-600',
    config_fields: [
      {
        key: 'template', type: 'select', label: 'Plantilla',
        required: true,
        options: [
          { value: 'power_of_attorney', label: 'Poder notarial' },
          { value: 'filing_receipt', label: 'Justificante' },
          { value: 'opposition_letter', label: 'Escrito oposición' },
        ],
      },
      {
        key: 'notify_responsible', type: 'boolean',
        label: 'Notificar al responsable', default: true,
      },
    ],
  },
  {
    value: 'ai_suggest', label: 'Sugerencia IP-GENIUS',
    icon: Sparkles, iconClass: 'text-amber-600',
    config_fields: [
      {
        key: 'suggestion_type', type: 'select',
        label: 'Tipo de sugerencia', required: true,
        options: [
          { value: 'follow_up', label: 'Seguimiento' },
          { value: 'renewal_opportunity', label: 'Renovación' },
          { value: 'reengagement', label: 'Reactivación' },
          { value: 'office_action_response', label: 'Office Action' },
        ],
      },
      {
        key: 'priority', type: 'select', label: 'Prioridad',
        default: 'medium',
        options: [
          { value: 'high', label: 'Alta' },
          { value: 'medium', label: 'Media' },
          { value: 'low', label: 'Baja' },
        ],
      },
    ],
  },
]

export function buildTriggerConfig(
  formData: Record<string, any>
): Record<string, any> {
  if (formData.trigger_type === 'stage_time_elapsed') {
    return { days: Number(formData.days ?? 7), stage_id: formData.stage_id ?? null }
  }
  return { stage_id: formData.stage_id ?? null }
}

export function buildActionConfig(
  formData: Record<string, any>
): Record<string, any> {
  const def = ACTION_DEFS.find(a => a.value === formData.action_type)
  if (!def) return {}
  const result: Record<string, any> = {}
  for (const field of def.config_fields) {
    const val = formData[field.key]
    if (val !== undefined && val !== '') {
      result[field.key] = field.type === 'number' ? Number(val) : val
    } else if (field.default !== undefined) {
      result[field.key] = field.default
    } else if (field.required) {
      throw new Error(`Campo requerido: ${field.label}`)
    }
  }
  return result
}

export function summarizeConfig(
  config: Record<string, any> | null | undefined
): string {
  if (!config) return '—'
  const parts: string[] = []
  if (config.to) parts.push(String(config.to))
  if (config.template) parts.push(String(config.template))
  if (config.title) parts.push(String(config.title).slice(0, 25))
  if (config.suggestion_type) parts.push(String(config.suggestion_type))
  if (config.days_due) parts.push(`${config.days_due}d`)
  return parts.slice(0, 2).join(' · ') || '—'
}
