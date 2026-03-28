import { useState, useEffect, useRef } from 'react'
import { Plus, CheckSquare, Square, Pencil, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import {
  TRIGGER_DEFS, ACTION_DEFS,
  buildTriggerConfig, buildActionConfig, summarizeConfig,
  type ConfigField,
} from './automationConstants'

interface Props {
  open: boolean
  onClose: () => void
  stageId: string
  stageName: string
  pipelineId: string
  organizationId: string
}

function DynamicField({
  field, value, onChange,
}: {
  field: ConfigField
  value: any
  onChange: (v: any) => void
}) {
  if (field.type === 'text') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          {field.label}{field.required && ' *'}
        </label>
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className="h-8 text-sm"
        />
        {field.placeholder?.includes('{{') && (
          <p className="text-[10px] text-muted-foreground">
            Variables: {'{{account_name}}'}, {'{{deal_name}}'}
          </p>
        )}
      </div>
    )
  }
  if (field.type === 'number') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          {field.label}{field.required && ' *'}
        </label>
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? field.default ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    )
  }
  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          {field.label}{field.required && ' *'}
        </label>
        <Select value={value ?? ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-medium text-foreground">{field.label}</span>
        <input
          type="checkbox"
          checked={value ?? field.default ?? false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4"
        />
      </div>
    )
  }
  return null
}

export function StageAutomationSheet({
  open, onClose, stageId, stageName,
  pipelineId, organizationId,
}: Props) {
  const [rules, setRules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingFor, setIsAddingFor] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<any | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!open || !stageId || !organizationId) return
    loadRules()
  }, [open, stageId, organizationId])

  async function loadRules() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_automation_rules' as any)
      .select(`id, name, trigger_type, action_type, is_active,
               trigger_config, action_config, execution_count,
               last_executed_at`)
      .eq('organization_id', organizationId)
      .eq('stage_id', stageId)
      .neq('trigger_type', 'stage_blocked')
      .order('trigger_type')

    if (!mountedRef.current) return
    if (error) {
      toast.error('Error al cargar automaciones')
    } else {
      setRules((data as any[]) ?? [])
    }
    setIsLoading(false)
  }

  async function toggleActive(rule: any) {
    setRules(prev => prev.map(r =>
      r.id === rule.id ? { ...r, is_active: !r.is_active } : r
    ))
    const { error } = await supabase
      .from('crm_automation_rules' as any)
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)
      .eq('organization_id', organizationId)

    if (error) {
      setRules(prev => prev.map(r =>
        r.id === rule.id ? { ...r, is_active: rule.is_active } : r
      ))
      toast.error('Error al actualizar')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase
      .from('crm_automation_rules' as any)
      .delete()
      .eq('id', deleteTarget.id)
      .eq('organization_id', organizationId)

    setDeleteTarget(null)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Automación eliminada')
      await loadRules()
    }
  }

  function startAdd(triggerType: string) {
    const tDef = TRIGGER_DEFS.find(t => t.value === triggerType)
    const defaults: Record<string, any> = {
      name: '', trigger_type: triggerType, action_type: '',
      stage_id: stageId,
    }
    tDef?.config_fields.forEach(f => {
      if (f.default !== undefined) defaults[f.key] = f.default
    })
    setFormData(defaults)
    setEditingRule(null)
    setIsAddingFor(triggerType)
  }

  function startEdit(rule: any) {
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      action_type: rule.action_type,
      stage_id: rule.stage_id ?? stageId,
      ...(rule.trigger_config ?? {}),
      ...(rule.action_config ?? {}),
    })
    setEditingRule(rule)
    setIsAddingFor(rule.trigger_type)
  }

  async function handleSave() {
    if (!formData.name?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.action_type) {
      toast.error('Selecciona una acción')
      return
    }
    setIsSaving(true)
    try {
      const triggerConfig = buildTriggerConfig({
        ...formData, stage_id: stageId
      })
      const actionConfig = buildActionConfig(formData)

      if (editingRule) {
        const { error } = await supabase
          .from('crm_automation_rules' as any)
          .update({
            name: formData.name.trim(),
            trigger_type: formData.trigger_type,
            trigger_config: triggerConfig,
            action_type: formData.action_type,
            action_config: actionConfig,
          })
          .eq('id', editingRule.id)
          .eq('organization_id', organizationId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('crm_automation_rules' as any)
          .insert({
            organization_id: organizationId,
            pipeline_id: pipelineId,
            stage_id: stageId,
            name: formData.name.trim(),
            trigger_type: formData.trigger_type,
            trigger_config: triggerConfig,
            action_type: formData.action_type,
            action_config: actionConfig,
            is_active: true,
            execution_count: 0,
          })
        if (error) throw error
      }

      toast.success('Automación guardada')
      setIsAddingFor(null)
      setEditingRule(null)
      setFormData({})
      await loadRules()

    } catch (err: any) {
      toast.error(
        err.message?.startsWith('Campo requerido')
          ? err.message : 'Error al guardar'
      )
    } finally {
      if (mountedRef.current) setIsSaving(false)
    }
  }

  const activeCount = rules.filter(r => r.is_active).length

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Automaciones · {stageName}
            </SheetTitle>
            {activeCount > 0 && (
              <Badge variant="secondary" className="w-fit text-xs">
                {activeCount} activa(s)
              </Badge>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : isAddingFor ? (
            /* ── FORMULARIO ────────────────────────────── */
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  {editingRule ? 'Editar automación' : 'Nueva automación'}
                </h4>
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsAddingFor(null)
                  setEditingRule(null)
                  setFormData({})
                }}>
                  Cancelar
                </Button>
              </div>

              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Nombre *
                </label>
                <Input
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
                  placeholder="Ej: Notificar al cliente al entrar"
                  className="h-8 text-sm"
                />
              </div>

              {/* Trigger */}
              {editingRule ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Cuándo
                  </label>
                  <Select
                    value={formData.trigger_type ?? ''}
                    onValueChange={(v) => setFormData(p => ({...p, trigger_type: v}))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_DEFS.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Cuándo
                  </label>
                  {(() => {
                    const tDef = TRIGGER_DEFS.find(
                      t => t.value === isAddingFor
                    )
                    if (!tDef) return null
                    const Icon = tDef.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${tDef.bgClass} ${tDef.textClass} ${tDef.borderClass}`}>
                        <Icon className={`w-3 h-3 ${tDef.iconClass}`} />
                        {tDef.label}
                      </span>
                    )
                  })()}
                </div>
              )}

              {/* Campos del trigger */}
              {TRIGGER_DEFS.find(
                t => t.value === (formData.trigger_type ?? isAddingFor)
              )?.config_fields.map(field => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onChange={(v) => setFormData(p => ({...p, [field.key]: v}))}
                />
              ))}

              {/* Acción */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Qué ocurre *
                </label>
                <Select
                  value={formData.action_type ?? ''}
                  onValueChange={(v) => setFormData(p => ({...p, action_type: v}))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar acción..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_DEFS.map(a => (
                      <SelectItem key={a.value} value={a.value} className="text-xs">
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos del action */}
              {formData.action_type && ACTION_DEFS.find(
                a => a.value === formData.action_type
              )?.config_fields.map(field => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onChange={(v) => setFormData(p => ({...p, [field.key]: v}))}
                />
              ))}

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? 'Guardando...' : (
                  editingRule ? 'Guardar cambios' : 'Crear automación'
                )}
              </Button>
            </div>
          ) : (
            /* ── LISTA POR SECCIONES ──────────────────── */
            <div className="space-y-5 mt-4">
              {TRIGGER_DEFS.map(tDef => {
                const sectionRules = rules.filter(
                  r => r.trigger_type === tDef.value
                )
                const Icon = tDef.icon

                return (
                  <div key={tDef.value} className="space-y-2">
                    {/* Header sección */}
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${tDef.iconClass}`} />
                      <span className={`text-xs font-medium ${tDef.textClass}`}>
                        {tDef.label}
                      </span>
                    </div>

                    {/* Reglas */}
                    <div className="space-y-1.5">
                      {sectionRules.map(rule => {
                        const aDef = ACTION_DEFS.find(
                          a => a.value === rule.action_type
                        )
                        const ActionIcon = aDef?.icon ?? Zap

                        return (
                          <div
                            key={rule.id}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                          >
                            {/* Dot estado */}
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              rule.is_active ? 'bg-green-500' : 'bg-slate-300'
                            }`} />
                            <ActionIcon className={`w-3.5 h-3.5 shrink-0 ${aDef?.iconClass ?? 'text-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {rule.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {summarizeConfig(rule.action_config)}
                                {(rule.execution_count ?? 0) > 0 &&
                                  ` · ${rule.execution_count}x`}
                              </p>
                            </div>
                            {/* Botones */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleActive(rule)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                  rule.is_active
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                                title={rule.is_active ? 'Desactivar' : 'Activar'}
                              >
                                {rule.is_active
                                  ? <CheckSquare className="w-3.5 h-3.5" />
                                  : <Square className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(rule)}
                                className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(rule)}
                                className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Botón añadir */}
                    <button
                      type="button"
                      onClick={() => startAdd(tDef.value)}
                      className="w-full mt-1.5 py-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Añadir automación
                    </button>
                  </div>
                )
              })}

              {rules.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Sin automaciones todavía
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Añade la primera usando los botones de arriba
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar automación?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
