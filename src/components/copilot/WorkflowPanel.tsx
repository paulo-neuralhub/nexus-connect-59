import { useCallback } from 'react'
import type { WorkflowRun, WorkflowStep } from '@/hooks/workflow/use-workflow'

// ── Configuración visual por agente ──────────────────────
const AGENT_CONFIG: Record<string, { name: string; emoji: string; color: string; bg: string }> = {
  orchestrator: { name: 'Nexus',   emoji: '⚡', color: '#1E293B', bg: '#F1F5F9' },
  jurisdiction: { name: 'Lex',     emoji: '⚖️', color: '#8B5CF6', bg: '#F5F3FF' },
  dossier:      { name: 'Archie',  emoji: '📋', color: '#0EA5E9', bg: '#F0F9FF' },
  document:     { name: 'Draft',   emoji: '✍️', color: '#F59E0B', bg: '#FFFBEB' },
  competitor:   { name: 'Scout',   emoji: '🔍', color: '#10B981', bg: '#F0FDF4' },
  communication:{ name: 'Iris',    emoji: '💬', color: '#6366F1', bg: '#EEF2FF' },
  portfolio:    { name: 'Sage',    emoji: '📊', color: '#14B8A6', bg: '#F0FDFA' },
  execute:      { name: 'Nexus',   emoji: '⚙️', color: '#1E293B', bg: '#F1F5F9' },
}

const STATUS_LABELS: Record<string, string> = {
  planning:         'Preparando el plan...',
  running:          'Trabajando...',
  paused:           'En pausa',
  approval_needed:  'Esperando tu aprobación',
  completed:        'Completado',
  failed:           'Error',
  cancelled:        'Cancelado',
}

interface WorkflowPanelProps {
  workflow: WorkflowRun
  onApprove: (workflowId: string) => void
  onCancel: (workflowId: string) => void
  onClose: () => void
}

export function WorkflowPanel({
  workflow, onApprove, onCancel, onClose
}: WorkflowPanelProps) {

  const isTerminal = ['completed', 'failed', 'cancelled']
    .includes(workflow.status)
  const isWorking = ['planning', 'running'].includes(workflow.status)
  const needsApproval = workflow.status === 'approval_needed'

  const synthesis = workflow.results_json?.synthesis as Record<string, unknown> | undefined
  const keyOutputs = (synthesis?.key_outputs as string[]) ?? []
  const nextActions = (synthesis?.next_actions as string[]) ?? []
  const summary = synthesis?.summary as string | undefined

  const handleApprove = useCallback(() => {
    onApprove(workflow.id)
  }, [onApprove, workflow.id])

  const handleCancel = useCallback(() => {
    onCancel(workflow.id)
  }, [onCancel, workflow.id])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">
            {workflow.status === 'completed' ? '✅'
           : workflow.status === 'failed' ? '❌'
           : workflow.status === 'approval_needed' ? '✋'
           : '⚡'}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {STATUS_LABELS[workflow.status] ?? workflow.status}
            </span>
            <span className="text-sm font-medium text-foreground line-clamp-2">
              {workflow.goal_text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isWorking && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {workflow.elapsed_seconds}s
            </span>
          )}
          {isTerminal && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none p-1">
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────── */}
      {!isTerminal && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${workflow.progress}%` }}
          />
        </div>
      )}

      {/* ── Steps list ─────────────────────────────────── */}
      {workflow.plan_json.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          {workflow.plan_json.map((step: WorkflowStep) => {
            const cfg = AGENT_CONFIG[step.agent] ??
              AGENT_CONFIG['orchestrator']
            const isDone    = step.status === 'done'
            const isFailed  = step.status === 'failed'
            const isRunning = step.status === 'running' ||
              (step.step === workflow.current_step && isWorking)
            const isPending = step.status === 'pending' && !isRunning

            return (
              <div key={step.step} className={`flex items-start gap-3 py-1.5 ${isPending ? 'opacity-40' : ''}`}>
                {/* Step indicator */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    backgroundColor: isDone ? '#10B981' : isFailed ? '#EF4444' : isRunning ? cfg.color : '#E2E8F0',
                    color: isDone || isFailed || isRunning ? '#FFF' : '#94A3B8',
                  }}
                >
                  {isDone ? '✓'
                 : isFailed ? '✗'
                 : isRunning ? (
                    <span className="animate-spin text-[10px]">◌</span>
                  ) : <span>{step.step}</span>}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                      {cfg.emoji} {cfg.name}
                    </span>
                    {step.step === workflow.current_step && isWorking && (
                      <span className="text-[10px] text-muted-foreground animate-pulse">
                        procesando...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {step.task}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Planning state (no steps yet) ──────────────── */}
      {workflow.plan_json.length === 0 && isWorking && (
        <div className="px-4 py-6 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-xs text-muted-foreground ml-2">
            Nexus está preparando el plan...
          </span>
        </div>
      )}

      {/* ── Approval needed ────────────────────────────── */}
      {needsApproval && workflow.approval_payload && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-sm font-semibold text-foreground mb-2">
            ✋ Antes de continuar:
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {(workflow.approval_payload as Record<string, unknown>).description as string}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              ✓ Aprobar y continuar
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
            La responsabilidad de esta acción recae en el abogado responsable
          </p>
        </div>
      )}

      {/* ── Completed result ───────────────────────────── */}
      {workflow.status === 'completed' && (
        <div className="px-4 py-3 border-t border-border space-y-3">
          {summary && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-foreground leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {keyOutputs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Preparado
              </p>
              {keyOutputs.map((output: string, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-foreground py-0.5">
                  <span className="text-primary">•</span>
                  <span>{output}</span>
                </div>
              ))}
            </div>
          )}

          {nextActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Próximos pasos
              </p>
              {nextActions.slice(0, 2).map((action: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-foreground py-0.5">
                  <span className="text-primary mt-px">→</span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Failed state ───────────────────────────────── */}
      {workflow.status === 'failed' && (
        <div className="px-4 py-3 border-t border-border">
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-xs text-destructive">
              {workflow.error_message ?? 'Error desconocido. Intenta de nuevo.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Cancel button (while running) ──────────────── */}
      {isWorking && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={handleCancel}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkflowPanel
