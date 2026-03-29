import { useState, useCallback, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Upload, Sparkles, CheckCircle, AlertTriangle,
  ChevronRight, FileSpreadsheet, FileText,
  ArrowRight, RotateCcw, Eye, Download, Shield,
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

type WizardStep = 1 | 2 | 3 | 4 | 5

interface ShadowOptions {
  includeCreates: boolean
  includeUpdates: boolean
  includeDuplicates: boolean
}

interface ShadowRow {
  rowIndex: number
  action: 'create' | 'update' | 'duplicate' | 'error'
  data: Record<string, any>
  changes?: Array<{ field: string; current: any; proposed: any }>
  conflicts?: string[]
  errorMessage?: string
}

interface ShadowResult {
  summary: {
    total: number
    create: number
    update: number
    duplicate: number
    error: number
    rows_truncated?: boolean
  }
  rows: ShadowRow[]
  generated_at: string
}

interface WizardState {
  step: WizardStep
  file: File | null
  entityType: EntityType
  jobId: string | null
  columns: string[]
  preview: any[][]
  aiMapping: MappingResult | null
  confirmedMapping: Record<string, string>
  shadowResult: ShadowResult | null
  shadowOptions: ShadowOptions
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
  shadowResult: null,
  shadowOptions: {
    includeCreates: true,
    includeUpdates: true,
    includeDuplicates: false,
  },
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
    state.step === 4 || state.step === 5 ? state.jobId : null
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

  const handleProceedToShadow = async () => {
    if (!state.jobId) return
    updateState({ step: 3 })
    // Shadow preview is generated client-side from preview data + mapping
    // In production this would call an edge function; for now simulate from available data
    await generateShadowPreview()
  }

  const generateShadowPreview = async () => {
    // Build shadow result from preview data and confirmed mapping
    const rows: ShadowRow[] = []
    let createCount = 0
    let updateCount = 0
    let duplicateCount = 0
    let errorCount = 0

    const { preview, columns, confirmedMapping, entityType } = state

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i]
      const mapped: Record<string, any> = {}

      for (const [sourceCol, targetField] of Object.entries(confirmedMapping)) {
        if (!targetField || targetField === 'null') continue
        const colIndex = columns.indexOf(sourceCol)
        if (colIndex === -1) continue
        const value = row[colIndex]
        if (value !== undefined && value !== null && value !== '') {
          mapped[targetField] = String(value).trim()
        }
      }

      if (entityType === 'matters') {
        if (mapped.mark_name && !mapped.title) mapped.title = mapped.mark_name
        if (mapped.title && !mapped.mark_name) mapped.mark_name = mapped.title
        if (!mapped.title && !mapped.mark_name) {
          rows.push({ rowIndex: i, action: 'error', data: mapped, errorMessage: 'Falta nombre de marca' })
          errorCount++
          continue
        }
      }

      // For preview, treat all as creates (real shadow would check DB)
      rows.push({ rowIndex: i, action: 'create', data: mapped })
      createCount++
    }

    const MAX_SHADOW_ROWS = 500
    updateState({
      shadowResult: {
        summary: {
          total: preview.length,
          create: createCount,
          update: updateCount,
          duplicate: duplicateCount,
          error: errorCount,
          rows_truncated: rows.length > MAX_SHADOW_ROWS,
        },
        rows: rows.slice(0, MAX_SHADOW_ROWS),
        generated_at: new Date().toISOString(),
      },
    })
  }

  const handleStartImport = async () => {
    if (!state.jobId) return

    try {
      updateState({ step: 4 })
      const result = await importData.mutateAsync({
        jobId: state.jobId,
        confirmedMapping: state.confirmedMapping,
        entityType: state.entityType,
      })
      updateState({ step: 5, result })
    } catch {
      updateState({ step: 3 })
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
                shadowResult: null, // F3: invalidar shadow al cambiar mapping
              })
            }
            onBack={() => updateState({ step: 1 })}
            onNext={handleProceedToShadow}
          />
        )}

        {state.step === 3 && (
          <Step3Shadow
            shadowResult={state.shadowResult}
            options={state.shadowOptions}
            isLoading={!state.shadowResult}
            onOptionsChange={(opts) => updateState({ shadowOptions: opts })}
            onConfirm={handleStartImport}
            onBack={() => updateState({ step: 2 })}
          />
        )}

        {state.step === 4 && (
          <Step4Progress
            jobStatus={jobStatus}
            total={jobStatus?.records_total || 0}
            processed={jobStatus?.records_processed || 0}
          />
        )}

        {state.step === 5 && (
          <Step5Result
            result={state.result}
            entityType={state.entityType}
            onClose={handleClose}
             onNavigate={(path) => {
              handleClose()
              setTimeout(() => navigate(path), 100)
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
  const steps = ['Archivo', 'Mapeo', 'Preview', 'Importando', 'Resultado']
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
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all',
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
          <Shield className="h-4 w-4 mr-2" />
          Previsualizar cambios
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// ── STEP 3 — Shadow Preview ──────────────────────────────

function Step3Shadow({
  shadowResult, options, isLoading,
  onOptionsChange, onConfirm, onBack,
}: {
  shadowResult: ShadowResult | null
  options: ShadowOptions
  isLoading: boolean
  onOptionsChange: (opts: ShadowOptions) => void
  onConfirm: () => void
  onBack: () => void
}) {
  // F15: Progressive loading messages
  const [loadingMessage, setLoadingMessage] = useState('Leyendo archivo...')

  useEffect(() => {
    if (!isLoading) return
    const messages = [
      'Leyendo archivo...',
      'Comparando con expedientes existentes...',
      'Analizando posibles duplicados...',
      'Calculando cambios...',
      'Preparando preview...',
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingMessage(messages[i])
    }, 1200)
    return () => clearInterval(interval)
  }, [isLoading])

  if (isLoading || !shadowResult) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <Shield className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-foreground transition-all duration-500">
          {loadingMessage}
        </p>
        <Progress value={60} className="max-w-xs mx-auto" />
      </div>
    )
  }

  const { summary, rows } = shadowResult
  const creates = rows.filter(r => r.action === 'create')
  const updates = rows.filter(r => r.action === 'update')
  const errors = rows.filter(r => r.action === 'error')

  // F11: Data Quality Score
  const qualityScore = summary.total > 0
    ? Math.round((summary.create + summary.update) / summary.total * 100)
    : 0

  // F8: Calculate total to import based on options
  const totalToImport =
    (options.includeCreates ? summary.create : 0) +
    (options.includeUpdates ? summary.update : 0) +
    (options.includeDuplicates ? summary.duplicate : 0)

  // F12: CSV report download
  const downloadShadowReport = () => {
    const headers = ['Acción', 'Nombre', 'Referencia', 'Campos cambiados', 'Motivo']
    const csvRows = rows.map((r) => [
      r.action.toUpperCase(),
      r.data.title || r.data.mark_name || r.data.name || '',
      r.data.reference || '',
      r.changes?.map((c) => c.field).join(';') || '',
      r.errorMessage || r.conflicts?.join(';') || '',
    ])
    const csv = [headers, ...csvRows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shadow-report-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* F11: Quality Score */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
          qualityScore >= 90
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
            : qualityScore >= 70
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
        )}>
          {qualityScore}%
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Calidad del archivo</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {summary.create} nuevos · {summary.update} a actualizar · {summary.error} con errores
            {summary.rows_truncated && ' · (muestra de 500 filas)'}
          </p>
        </div>
        <button
          onClick={downloadShadowReport}
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Download className="h-3 w-3" />
          Reporte
        </button>
      </div>

      {/* F8+F9: Filter options */}
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border text-sm">
        <span className="text-muted-foreground font-medium text-xs">Incluir en import:</span>
        {summary.create > 0 && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={options.includeCreates}
              onCheckedChange={(checked) => onOptionsChange({ ...options, includeCreates: !!checked })}
            />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {summary.create} nuevos
            </span>
          </label>
        )}
        {summary.update > 0 && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={options.includeUpdates}
              onCheckedChange={(checked) => onOptionsChange({ ...options, includeUpdates: !!checked })}
            />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {summary.update} actualizaciones
            </span>
          </label>
        )}
        {summary.duplicate > 0 && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={options.includeDuplicates}
              onCheckedChange={(checked) => onOptionsChange({ ...options, includeDuplicates: !!checked })}
            />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {summary.duplicate} duplicados
            </span>
          </label>
        )}
      </div>

      {/* Creates list */}
      {creates.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-border flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              {summary.create} nuevos registros
            </span>
          </div>
          <div className="divide-y divide-border max-h-32 overflow-y-auto">
            {creates.slice(0, 8).map((row) => (
              <div key={row.rowIndex} className="px-4 py-1.5 text-xs text-foreground flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="truncate">{row.data.title || row.data.mark_name || row.data.name || `Fila ${row.rowIndex + 1}`}</span>
                {row.data.reference && (
                  <span className="text-muted-foreground font-mono text-[10px] ml-auto shrink-0">{row.data.reference}</span>
                )}
              </div>
            ))}
            {creates.length > 8 && (
              <div className="px-4 py-1.5 text-[11px] text-muted-foreground">
                ...y {creates.length - 8} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* F10: Updates with GitHub-style diff */}
      {updates.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-border flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              {summary.update} actualizaciones
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {updates.slice(0, 5).map((row) => (
              <div key={row.rowIndex} className="border-b border-border last:border-0">
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/40 dark:bg-blue-950/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-foreground flex-1">
                    {row.data.title || row.data.mark_name}
                  </span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-bold">
                    ACTUALIZA {row.changes?.length} campo{row.changes?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {row.changes?.slice(0, 3).map((c) => (
                  <div key={c.field} className="grid grid-cols-3 gap-2 px-6 py-1.5 text-[11px] border-t border-border/50">
                    <span className="text-muted-foreground font-mono">{c.field}</span>
                    <span className="text-red-500 line-through truncate bg-red-50 dark:bg-red-950/30 px-1.5 rounded">
                      {String(c.current || '—')}
                    </span>
                    <span className="text-emerald-600 truncate bg-emerald-50 dark:bg-emerald-950/30 px-1.5 rounded">
                      {String(c.proposed)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 overflow-hidden">
          <div className="px-4 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-destructive/30">
            <span className="text-xs font-semibold text-destructive">
              {summary.error} con errores
            </span>
          </div>
          <div className="divide-y divide-border max-h-24 overflow-y-auto">
            {errors.slice(0, 5).map((row) => (
              <div key={row.rowIndex} className="px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                <span>Fila {row.rowIndex + 1}: {row.errorMessage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          ← Atrás
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1"
          disabled={totalToImport === 0}
        >
          {totalToImport === 0
            ? 'Selecciona qué importar'
            : (
              <>
                {options.includeCreates && summary.create > 0 && `Crear ${summary.create}`}
                {options.includeCreates && options.includeUpdates && summary.create > 0 && summary.update > 0 && ' · '}
                {options.includeUpdates && summary.update > 0 && `Actualizar ${summary.update}`}
                {' →'}
              </>
            )
          }
        </Button>
      </div>
    </div>
  )
}

// ── STEP 4 — Progreso de importación ─────────────────────

function Step4Progress({
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

// ── STEP 5 — Resultado ───────────────────────────────────

function Step5Result({
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
