import { useCallback } from 'react'
import type { WorkflowRun, WorkflowStep } from '@/hooks/workflow/use-workflow'

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

  const isTerminal = ['completed', 'failed', 'cancelled'].includes(workflow.status)
  const isWorking = ['planning', 'running'].includes(workflow.status)

  const synthesis = workflow.results_json?.synthesis as Record<string, unknown> | undefined
  const keyOutputs = (synthesis?.key_outputs as string[]) ?? []
  const nextActions = (synthesis?.next_actions as string[]) ?? []
  const summary = synthesis?.summary as string | undefined

  const handleCancel = useCallback(() => {
    onCancel(workflow.id)
  }, [onCancel, workflow.id])

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid #F1F5F9',
      animation: 'cpSlideUp 0.3s ease-out',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* HEADER — always neutral bg */}
      <div style={{
        background: '#F8FAFC',
        padding: '10px 14px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>
            {workflow.status === 'completed' ? '✅'
           : workflow.status === 'failed' ? '❌'
           : workflow.status === 'approval_needed' ? '⏸️'
           : '⚡'}
          </span>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#1E293B',
              fontFamily: 'Inter, sans-serif',
            }}>
              {STATUS_LABELS[workflow.status] ?? workflow.status}
            </div>
            <div style={{
              fontSize: 10, color: '#94A3B8',
              fontFamily: 'Inter, sans-serif',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {workflow.goal_text}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isWorking && (
            <span style={{ fontSize: 10, color: '#94A3B8' }}>
              {workflow.elapsed_seconds}s
            </span>
          )}
          {isTerminal && (
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              color: '#94A3B8', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: '2px 6px',
            }}>×</button>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      {!isTerminal && (
        <div style={{ height: 3, background: '#F1F5F9', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${workflow.progress}%`,
            background: workflow.status === 'approval_needed'
              ? '#F59E0B' : '#1E293B',
            transition: 'width 0.6s ease',
          }} />
        </div>
      )}

      {/* STEPS */}
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {workflow.plan_json.length > 0
          ? workflow.plan_json.map((step: WorkflowStep) => {
              const cfg = AGENT_CONFIG[step.agent] ?? AGENT_CONFIG['orchestrator']
              const isDone    = step.status === 'done'
              const isFailed  = step.status === 'failed'
              const isRunning = step.status === 'running' ||
                (step.step === workflow.current_step && isWorking)
              const isPending = !isDone && !isFailed && !isRunning
              return (
                <div key={step.step} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  opacity: isPending ? 0.4 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isDone ? '#F0FDF4'
                                : isFailed ? '#FEF2F2'
                                : isRunning ? cfg.bg : '#F8FAFC',
                    border: `1.5px solid ${
                      isDone ? '#22C55E'
                      : isFailed ? '#EF4444'
                      : isRunning ? cfg.color : '#E2E8F0'}`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11, flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {isDone ? '✓'
                   : isFailed ? '✗'
                   : isRunning ? (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: cfg.color,
                        animation: 'cpBreath 1s ease-in-out infinite',
                        display: 'block',
                      }} />
                    ) : (
                      <span style={{ fontSize: 10, color: '#CBD5E1' }}>
                        {step.step}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      color: isRunning ? cfg.color : '#64748B',
                      fontFamily: 'Inter, sans-serif',
                      marginBottom: 2,
                    }}>
                      {cfg.emoji} {cfg.name}
                      {isRunning && (
                        <span style={{
                          fontWeight: 400, color: '#94A3B8',
                          marginLeft: 6,
                        }}>
                          procesando...
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11, color: '#374151',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {step.task}
                    </div>
                  </div>
                </div>
              )
            })
          : isWorking && (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: 20,
              }}>
                <span className="cp-dot" style={{ background: '#1E293B' }} />
                <span className="cp-dot" style={{ background: '#1E293B' }} />
                <span className="cp-dot" style={{ background: '#1E293B' }} />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  Preparando el plan...
                </span>
              </div>
            )
        }

        {/* Completed result */}
        {workflow.status === 'completed' && synthesis && (
          <div style={{ marginTop: 4 }}>
            {summary && (
              <div style={{
                background: '#F0FDF4', borderRadius: 10,
                padding: '10px 12px', border: '1px solid #BBF7D0',
                marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 12, color: '#166534',
                  fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                }}>
                  {summary}
                </div>
              </div>
            )}
            {keyOutputs.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#94A3B8',
                  marginBottom: 4, textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}>
                  Preparado
                </div>
                {keyOutputs.map((o: string, i: number) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#374151',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex', gap: 6, marginBottom: 3,
                  }}>
                    <span style={{ color: '#22C55E' }}>•</span>{o}
                  </div>
                ))}
              </div>
            )}
            {nextActions.length > 0 && (
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#94A3B8',
                  marginBottom: 4, textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}>
                  Próximos pasos
                </div>
                {nextActions.slice(0, 2).map((a: string, i: number) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#374151',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex', gap: 6, marginBottom: 3,
                  }}>
                    <span style={{ color: '#F59E0B' }}>→</span>{a}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {workflow.status === 'failed' && (
          <div style={{
            background: '#FEF2F2', borderRadius: 10,
            padding: '10px 12px', border: '1px solid #FECACA',
            marginTop: 4,
          }}>
            <div style={{
              fontSize: 12, color: '#991B1B',
              fontFamily: 'Inter, sans-serif',
            }}>
              {workflow.error_message ?? 'Error desconocido.'}
            </div>
          </div>
        )}
      </div>

      {/* CANCEL — while running */}
      {isWorking && (
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button onClick={handleCancel} style={{
            background: 'transparent', color: '#94A3B8',
            border: '1px solid #E2E8F0', borderRadius: 8,
            padding: '5px 14px', fontSize: 11,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkflowPanel
