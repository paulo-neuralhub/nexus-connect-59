import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Upload, Sparkles, CheckCircle, AlertTriangle,
  ChevronRight, FileSpreadsheet, FileText,
  ArrowRight, RotateCcw, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useImportProcessor,
  useImportJob,
  AVAILABLE_FIELDS,
  type EntityType,
  type ParseResult,
  type MappingResult,
  type ImportResult,
} from '@/hooks/use-import-processor'

// ── TIPOS INTERNOS ───────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4

interface WizardState {
  step: WizardStep
  file: File | null
  entityType: EntityType
  jobId: string | null
  columns: string[]
  preview: any[][]
  aiMapping: MappingResult | null
  confirmedMapping: Record<string, string>
  result: ImportResult | null
}

const INITIAL_STATE: WizardState = {
  step: 1,
  file: null,
  entityType: 'matters',
  jobId: null,
  columns: [],
  preview: [],
  aiMapping: null,
  confirmedMapping: {},
  result: null,
}

const ENTITY_LABELS: Record<EntityType, string> = {
  matters: 'Expedientes de PI',
  contacts: 'Contactos',
  crm_accounts: 'Cuentas / Clientes',
}

const SOURCE_SYSTEMS = [
  'Anaqua', 'PatSnap', 'CPA Global', 'Dennemeyer',
  'IPAN', 'Thomson CompuMark', 'Corsearch',
  'Questel Orbit', 'Excel propio', 'Otro',
]

// ── COMPONENTE PRINCIPAL ─────────────────────────────────

interface ImportWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportWizardModal({
  open, onOpenChange,
}: ImportWizardModalProps) {
  const navigate = useNavigate()
  const { parseFile, mapFields, importData } = useImportProcessor()
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [isDragging, setIsDragging] = useState(false)
  const [sourceSystem, setSourceSystem] = useState('')

  const { data: jobStatus } = useImportJob(
    state.step === 3 || state.step === 4 ? state.jobId : null
  )

  const updateState = (patch: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...patch }))

  const handleClose = () => {
    setState(INITIAL_STATE)
    setSourceSystem('')
    onOpenChange(false)
  }

  const handleFileSelected = useCallback(async (file: File) => {
    updateState({ file })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }, [handleFileSelected])

  const handleProceedToMapping = async () => {
    if (!state.file) return

    try {
      updateState({ step: 2 })
      const parseResult: ParseResult = await parseFile.mutateAsync(state.file)
      updateState({
        jobId: parseResult.jobId,
        columns: parseResult.columns,
        preview: parseResult.preview,
      })

      const mappingResult: MappingResult = await mapFields.mutateAsync({
        jobId: parseResult.jobId,
        detectedColumns: parseResult.columns,
        entityType: state.entityType,
      })

      const initial: Record<string, string> = {}
      for (const [col, field] of Object.entries(mappingResult.mapping)) {
        if (field && field !== 'null') initial[col] = field
      }

      updateState({
        aiMapping: mappingResult,
        confirmedMapping: initial,
      })
    } catch {
      updateState({ step: 1 })
    }
  }

  const handleStartImport = async () => {
    if (!state.jobId) return

    try {
      updateState({ step: 3 })
      const result = await importData.mutateAsync({
        jobId: state.jobId,
        confirmedMapping: state.confirmedMapping,
        entityType: state.entityType,
      })
      updateState({ step: 4, result })
    } catch {
      updateState({ step: 2 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar datos
          </DialogTitle>
        </DialogHeader>

        <StepIndicator current={state.step} />

        {state.step === 1 && (
          <Step1
            file={state.file}
            entityType={state.entityType}
            sourceSystem={sourceSystem}
            isDragging={isDragging}
            onFileSelect={(f) => updateState({ file: f })}
            onEntityChange={(v) => updateState({ entityType: v })}
            onSourceChange={setSourceSystem}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onNext={handleProceedToMapping}
            isLoading={parseFile.isPending || mapFields.isPending}
          />
        )}

        {state.step === 2 && (
          <Step2
            columns={state.columns}
            preview={state.preview}
            aiMapping={state.aiMapping}
            confirmedMapping={state.confirmedMapping}
            entityType={state.entityType}
            isLoadingAI={parseFile.isPending || mapFields.isPending}
            onMappingChange={(col, field) =>
              updateState({
                confirmedMapping: {
                  ...state.confirmedMapping,
                  [col]: field,
                },
              })
            }
            onBack={() => updateState({ step: 1 })}
            onNext={handleStartImport}
          />
        )}

        {state.step === 3 && (
          <Step3
            jobStatus={jobStatus}
            total={jobStatus?.records_total || 0}
            processed={jobStatus?.records_processed || 0}
          />
        )}

        {state.step === 4 && (
          <Step4
            result={state.result}
            entityType={state.entityType}
            onClose={handleClose}
            onNavigate={(path) => {
              handleClose()
              navigate(path)
            }}
            onNewImport={() => setState(INITIAL_STATE)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── STEP INDICATOR ───────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  const steps = ['Archivo', 'Mapeo', 'Importando', 'Resultado']
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {steps.map((label, i) => {
        const step = (i + 1) as WizardStep
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  isActive && 'bg-primary text-primary-foreground shadow-md',
                  isDone && 'bg-primary/20 text-primary',
                  !isActive && !isDone && 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? '✓' : step}
              </div>
              <span className={cn(
                'text-[10px]',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground mb-4" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── STEP 1 — Selección de archivo y tipo ─────────────────

function Step1({
  file, entityType, sourceSystem, isDragging,
  onFileSelect, onEntityChange, onSourceChange,
  onDrop, onDragOver, onDragLeave, onNext, isLoading,
}: {
  file: File | null
  entityType: EntityType
  sourceSystem: string
  isDragging: boolean
  onFileSelect: (f: File) => void
  onEntityChange: (v: EntityType) => void
  onSourceChange: (v: string) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onNext: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          ¿Qué quieres importar?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(ENTITY_LABELS) as [EntityType, string][])
            .map(([value, label]) => (
              <button
                key={value}
                onClick={() => onEntityChange(value)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left text-sm',
                  'transition-all duration-200',
                  entityType === value
                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                )}
              >
                {label}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Sistema de origen
        </label>
        <Select value={sourceSystem} onValueChange={onSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar sistema..." />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_SYSTEMS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Archivo
        </label>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            file && 'border-primary/30 bg-primary/5'
          )}
          onClick={() => document.getElementById('import-file-input')?.click()}
        >
          <input
            id="import-file-input"
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFileSelect(f)
            }}
          />
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              {file.name.endsWith('.csv')
                ? <FileText className="h-8 w-8 text-primary" />
                : <FileSpreadsheet className="h-8 w-8 text-primary" />
              }
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-primary ml-2" />
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                Arrastra tu archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, Excel (.xlsx, .xls)
              </p>
            </>
          )}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!file || isLoading}
        onClick={onNext}
      >
        {isLoading ? (
          <>
            <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
            Analizando con IA...
          </>
        ) : (
          <>
            Analizar archivo
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}

// ── STEP 2 — Mapeo de campos ─────────────────────────────

function Step2({
  columns, preview, aiMapping, confirmedMapping,
  entityType, isLoadingAI,
  onMappingChange, onBack, onNext,
}: {
  columns: string[]
  preview: any[][]
  aiMapping: MappingResult | null
  confirmedMapping: Record<string, string>
  entityType: EntityType
  isLoadingAI: boolean
  onMappingChange: (col: string, field: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const availableFields = AVAILABLE_FIELDS[entityType]
  const confidence = aiMapping ? Math.round(aiMapping.confidence * 100) : 0
  const mappedCount = Object.values(confirmedMapping)
    .filter(v => v && v !== 'null').length

  if (isLoadingAI) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <p className="text-lg font-medium text-foreground">
          Analizando estructura con IA...
        </p>
        <p className="text-sm text-muted-foreground">
          Claude está mapeando tus columnas automáticamente
        </p>
        <Progress value={45} className="max-w-xs mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {aiMapping && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground flex-1">
            IA mapeó{' '}
            <span className="font-semibold">
              {mappedCount} de {columns.length}
            </span>{' '}
            columnas con{' '}
            <span className={cn(
              'font-semibold',
              confidence >= 80 ? 'text-emerald-600'
                : confidence >= 60 ? 'text-amber-600'
                : 'text-red-600'
            )}>
              {confidence}% de confianza
            </span>
          </p>
          <Badge variant={
            confidence >= 80 ? 'default'
              : confidence >= 60 ? 'secondary'
              : 'destructive'
          }>
            {confidence >= 80 ? 'Alto'
              : confidence >= 60 ? 'Medio'
              : 'Bajo'}
          </Badge>
        </div>
      )}

      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground px-1">
          <span>Columna del archivo</span>
          <span>Campo en IP-NEXUS</span>
        </div>
        <div className="space-y-1.5">
          {columns.map((col) => {
            const mapped = confirmedMapping[col]
            const isMapped = mapped && mapped !== 'null'
            return (
              <div key={col} className="grid grid-cols-2 gap-2 items-center">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded text-sm truncate">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{col}</span>
                </div>
                <div>
                  <Select
                    value={isMapped ? mapped : 'skip'}
                    onValueChange={(v) =>
                      onMappingChange(col, v === 'skip' ? '' : v)
                    }
                  >
                    <SelectTrigger className={cn(
                      'text-sm h-9',
                      isMapped ? 'border-primary/30' : ''
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">
                        — No importar —
                      </SelectItem>
                      {availableFields.map(f => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {preview.length > 0 && (
        <details className="rounded-lg border border-border">
          <summary className="px-3 py-2 text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Ver preview de datos ({preview.length} filas)
          </summary>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {columns.map(c => (
                    <th key={c} className="px-2 py-1 text-left text-muted-foreground font-medium whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {columns.map((_, ci) => (
                      <td key={ci} className="px-2 py-1 whitespace-nowrap text-foreground">
                        {String(row[ci] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          ← Atrás
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={mappedCount === 0}>
          Importar {mappedCount} campos mapeados
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// ── STEP 3 — Progreso de importación ─────────────────────

function Step3({
  jobStatus, total, processed,
}: {
  jobStatus: any
  total: number
  processed: number
}) {
  const progress = total > 0
    ? Math.round((processed / total) * 100)
    : 0

  return (
    <div className="py-12 text-center space-y-6">
      <div className="flex justify-center">
        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">
          Importando registros...
        </p>
        <p className="text-sm text-muted-foreground">
          {processed} de {total || '?'} procesados
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-2">
        <Progress value={progress} />
        <p className="text-xs text-muted-foreground">
          {progress}% completado
        </p>
      </div>

      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
        Este proceso puede tardar unos minutos según
        el tamaño del archivo. No cierres esta ventana.
      </p>
    </div>
  )
}

// ── STEP 4 — Resultado ───────────────────────────────────

function Step4({
  result, entityType, onClose, onNavigate, onNewImport,
}: {
  result: ImportResult | null
  entityType: EntityType
  onClose: () => void
  onNavigate: (path: string) => void
  onNewImport: () => void
}) {
  if (!result) return null

  const { total, processed, failed, duplicates } = result
  const successRate = total > 0
    ? Math.round((processed / total) * 100)
    : 0
  const isSuccess = failed === 0
  const entityPath = entityType === 'matters'
    ? '/app/expedientes'
    : entityType === 'contacts'
      ? '/app/contacts'
      : '/app/crm'

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          {isSuccess
            ? <CheckCircle className="h-14 w-14 text-emerald-500" />
            : <AlertTriangle className="h-14 w-14 text-amber-500" />
          }
        </div>
        <p className="text-lg font-semibold text-foreground">
          {isSuccess ? 'Importación completada' : 'Completado con avisos'}
        </p>
        <p className="text-sm text-muted-foreground">
          {successRate}% de éxito
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-600">
            {processed}
          </p>
          <p className="text-xs text-muted-foreground">Importados</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
          <p className="text-2xl font-bold text-amber-600">
            {duplicates}
          </p>
          <p className="text-xs text-muted-foreground">En revisión</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
          <p className="text-2xl font-bold text-red-600">
            {failed}
          </p>
          <p className="text-xs text-muted-foreground">Con error</p>
        </div>
      </div>

      {result.errors && result.errors.length > 0 && (
        <details className="rounded-lg border border-destructive/30">
          <summary className="px-3 py-2 text-sm font-medium text-destructive cursor-pointer">
            Ver errores ({result.errors.length})
          </summary>
          <div className="px-3 pb-3 space-y-1">
            {result.errors.slice(0, 10).map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                Fila {e.row}: {e.error}
              </p>
            ))}
          </div>
        </details>
      )}

      <div className="space-y-2">
        <Button
          onClick={() => onNavigate(entityPath)}
          className="w-full"
        >
          Ver {ENTITY_LABELS[entityType]} importados
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        {duplicates > 0 && (
          <Button
            variant="outline"
            onClick={() => onNavigate('/app/data-hub?tab=imports')}
            className="w-full"
          >
            Revisar {duplicates} duplicados
          </Button>
        )}
        <Button variant="ghost" onClick={onNewImport} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Nueva importación
        </Button>
      </div>
    </div>
  )
}
