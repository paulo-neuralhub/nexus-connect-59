import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type WorkflowStatus =
  | 'idle' | 'planning' | 'running' | 'paused'
  | 'approval_needed' | 'completed' | 'failed' | 'cancelled'

export type WorkflowType =
  | 'oa_response' | 'spider_analysis' | 'renewal'
  | 'portfolio_report' | 'competitor_analysis' | 'new_matter'
  | 'communication' | 'translation' | 'email_analysis'
  | 'due_diligence' | 'international_strategy'
  | 'infringement_analysis' | 'morning_briefing'
  | 'service_proposal' | 'full_matter_prep'

export interface WorkflowStep {
  step: number
  agent: string
  task: string
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: Record<string, unknown>
  started_at?: string
  completed_at?: string
  error?: string
}

export interface WorkflowRun {
  id: string
  status: WorkflowStatus
  workflow_type: WorkflowType
  goal_text: string
  plan_json: WorkflowStep[]
  current_step: number
  total_steps: number
  results_json: Record<string, unknown>
  approval_payload: Record<string, unknown> | null
  error_message: string | null
  progress: number
  elapsed_seconds: number
  matter_id: string | null
  client_id: string | null
  started_at: string
  completed_at: string | null
  tokens_by_agent: Record<string, number>
  cost_by_agent: Record<string, number>
  quality_scores: Record<string, number>
}

interface StartWorkflowInput {
  goal: string
  workflow_type: WorkflowType
  matter_id?: string
  client_id?: string
  context?: Record<string, unknown>
}

export function useWorkflow() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRun | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const workflowIdRef = useRef<string | null>(null)

  // Polling cada 2 segundos mientras hay workflow activo
  const startPolling = useCallback((workflowId: string) => {
    workflowIdRef.current = workflowId
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        // Llamada con query param manual
        const url = `${(supabase as any).functionsUrl}/genius-workflow-status?workflow_id=${workflowId}`
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const resp = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: (supabase as any).supabaseKey || '',
          },
        })

        if (!resp.ok) return

        const workflow: WorkflowRun = await resp.json()
        setActiveWorkflow(workflow)

        // Parar polling si el workflow terminó
        if (['completed', 'failed', 'cancelled', 'approval_needed']
            .includes(workflow.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch (e) {
        console.warn('[useWorkflow] polling error:', e)
      }
    }, 2000)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Limpiar al desmontar
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Iniciar un workflow
  const startWorkflow = useCallback(async (input: StartWorkflowInput) => {
    setIsStarting(true)
    setError(null)
    setActiveWorkflow(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'genius-orchestrator',
        { body: input }
      )

      if (fnError) throw new Error(fnError.message)
      if (!data?.workflow_id) throw new Error('No workflow_id returned')

      // Iniciar polling
      startPolling(data.workflow_id)

      // Estado inicial optimista
      setActiveWorkflow({
        id: data.workflow_id,
        status: 'planning',
        workflow_type: input.workflow_type,
        goal_text: input.goal,
        plan_json: [],
        current_step: 0,
        total_steps: 0,
        results_json: {},
        approval_payload: null,
        error_message: null,
        progress: 0,
        elapsed_seconds: 0,
        matter_id: input.matter_id || null,
        client_id: input.client_id || null,
        started_at: new Date().toISOString(),
        completed_at: null,
        tokens_by_agent: {},
        cost_by_agent: {},
        quality_scores: {},
      })

      return data.workflow_id as string

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error starting workflow'
      setError(msg)
      return null
    } finally {
      setIsStarting(false)
    }
  }, [startPolling])

  // Aprobar un paso que requiere aprobación
  const approveWorkflow = useCallback(async (workflowId: string) => {
    try {
      await (supabase as any)
        .from('genius_workflow_runs')
        .update({ status: 'running', approved_at: new Date().toISOString() })
        .eq('id', workflowId)

      // Reanudar polling
      startPolling(workflowId)
    } catch (e) {
      console.error('[useWorkflow] approve error:', e)
    }
  }, [startPolling])

  // Cancelar un workflow
  const cancelWorkflow = useCallback(async (workflowId: string) => {
    try {
      await (supabase as any)
        .from('genius_workflow_runs')
        .update({ status: 'cancelled' })
        .eq('id', workflowId)

      stopPolling()
      setActiveWorkflow(prev =>
        prev ? { ...prev, status: 'cancelled' } : null
      )
    } catch (e) {
      console.error('[useWorkflow] cancel error:', e)
    }
  }, [stopPolling])

  // Limpiar workflow completado
  const clearWorkflow = useCallback(() => {
    stopPolling()
    setActiveWorkflow(null)
    setError(null)
    workflowIdRef.current = null
  }, [stopPolling])

  // Detectar si un mensaje es un workflow
  const detectWorkflowIntent = useCallback((message: string): {
    isWorkflow: boolean
    workflow_type: WorkflowType | null
    confidence: number
  } => {
    const lower = message.toLowerCase()

    const patterns: Array<{ keywords: string[], type: WorkflowType, weight: number }> = [
      { keywords: ['office action', 'oa ', 'respuesta oa', 'responder oa', 'office action'], type: 'oa_response', weight: 0.95 },
      { keywords: ['alerta spider', 'analiza alerta', 'similitud', 'oposición', 'oponerse'], type: 'spider_analysis', weight: 0.90 },
      { keywords: ['renovar', 'renovación', 'renewal', 'renovar marca'], type: 'renewal', weight: 0.88 },
      { keywords: ['informe cartera', 'portfolio report', 'informe de marcas'], type: 'portfolio_report', weight: 0.88 },
      { keywords: ['competencia', 'competidores', 'marcas similares', 'competitor'], type: 'competitor_analysis', weight: 0.85 },
      { keywords: ['nuevo expediente', 'registrar marca', 'nueva solicitud', 'crear expediente'], type: 'new_matter', weight: 0.90 },
      { keywords: ['redactar email', 'escribir carta', 'preparar comunicación'], type: 'communication', weight: 0.85 },
      { keywords: ['traducir', 'traducción', 'translate'], type: 'translation', weight: 0.92 },
      { keywords: ['analizar email', 'email recibido', 'comunicación recibida'], type: 'email_analysis', weight: 0.87 },
      { keywords: ['due diligence', 'diligencia debida', 'valoración cartera'], type: 'due_diligence', weight: 0.90 },
      { keywords: ['estrategia internacional', 'qué países', 'expansión internacional'], type: 'international_strategy', weight: 0.88 },
      { keywords: ['infracción', 'copia de mi marca', 'está usando mi'], type: 'infringement_analysis', weight: 0.90 },
      { keywords: ['briefing', 'resumen del día', 'qué tengo hoy'], type: 'morning_briefing', weight: 0.85 },
      { keywords: ['propuesta de servicios', 'nuevos servicios', 'qué más puedo ofrecer'], type: 'service_proposal', weight: 0.83 },
      { keywords: ['preparar expediente completo', 'crear expediente completo'], type: 'full_matter_prep', weight: 0.88 },
    ]

    for (const pattern of patterns) {
      if (pattern.keywords.some(kw => lower.includes(kw))) {
        return { isWorkflow: true, workflow_type: pattern.type, confidence: pattern.weight }
      }
    }

    // Señales genéricas de workflow
    const workflowSignals = ['prepara', 'genera', 'redacta', 'elabora', 'analiza', 'crea el informe']
    if (workflowSignals.some(s => lower.includes(s))) {
      return { isWorkflow: true, workflow_type: 'communication', confidence: 0.65 }
    }

    return { isWorkflow: false, workflow_type: null, confidence: 0 }
  }, [])

  return {
    activeWorkflow,
    isStarting,
    error,
    startWorkflow,
    approveWorkflow,
    cancelWorkflow,
    clearWorkflow,
    detectWorkflowIntent,
    isActive: activeWorkflow !== null &&
      !['completed', 'failed', 'cancelled'].includes(activeWorkflow.status),
  }
}
