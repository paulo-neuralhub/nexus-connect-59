import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface AgentSuggestion {
  id: string
  type: 'urgent' | 'high' | 'medium' | 'info'
  emoji: string
  title: string
  body: string
  actionLabel?: string
  actionType?: 'create_deadline' | 'generate_doc' | 'send_email'
               | 'navigate' | 'analyze' | 'activate_spider'
  actionPayload?: Record<string, unknown>
  matterId?: string
  clientId?: string
  expiresAt?: number
}

export function useAgentBrain(orgId: string | null) {
  const [suggestion, setSuggestion] = useState<AgentSuggestion | null>(null)
  const [bubbleState, setBubbleState] = useState<
    'standby' | 'attentive' | 'urgent' | 'speaking'
  >('standby')
  const dismissed = useRef<Set<string>>(new Set())
  const running = useRef(false)

  const analyze = useCallback(async () => {
    if (!orgId || running.current) return
    running.current = true
    try {
      // 1. Plazos fatales (< 72h)
      const client: any = supabase
      const { data: deadlines } = await client
        .from('matter_deadlines')
        .select(`
          id, title, deadline_date, is_critical,
          matters!inner(id, title, reference, organization_id)
        `)
        .eq('matters.organization_id', orgId)
        .eq('status', 'pending')
        .gt('deadline_date', new Date().toISOString())
        .lt('deadline_date', new Date(Date.now() + 72 * 3600000).toISOString())
        .order('deadline_date', { ascending: true })
        .limit(3)

      if (deadlines && deadlines.length > 0) {
        const d = deadlines[0] as any
        const hours = Math.round(
          (new Date(d.deadline_date).getTime() - Date.now()) / 3600000
        )
        const matter = Array.isArray(d.matters) ? d.matters[0] : d.matters
        const sid = `deadline_${d.id}`
        if (!dismissed.current.has(sid)) {
          setSuggestion({
            id: sid,
            type: hours < 24 ? 'urgent' : 'high',
            emoji: hours < 24 ? '🚨' : '⏰',
            title: hours < 24
              ? `PLAZO FATAL: ${hours}h restantes`
              : `Plazo en ${hours}h`,
            body: `${matter?.title || 'Expediente'}: ${d.title}`,
            actionLabel: 'Ver expediente →',
            actionType: 'navigate',
            actionPayload: { path: `/app/matters/${matter?.id}` },
            matterId: matter?.id,
            expiresAt: Date.now() + 300000,
          })
          setBubbleState(hours < 24 ? 'urgent' : 'attentive')
          return
        }
      }

      // 2. Alertas Spider críticas
      const { data: alerts } = await client
        .from('spider_alerts')
        .select('id, title, severity, matter_id')
        .eq('organization_id', orgId)
        .eq('status', 'new')
        .in('severity', ['critical', 'high'])
        .order('severity', { ascending: false })
        .limit(1)

      if (alerts && alerts.length > 0) {
        const a = alerts[0] as any
        const sid = `alert_${a.id}`
        if (!dismissed.current.has(sid)) {
          setSuggestion({
            id: sid,
            type: a.severity === 'critical' ? 'urgent' : 'high',
            emoji: '🔍',
            title: 'Alerta Spider sin revisar',
            body: a.title,
            actionLabel: 'Analizar ahora →',
            actionType: 'navigate',
            actionPayload: { path: '/app/spider' },
            matterId: a.matter_id,
            expiresAt: Date.now() + 600000,
          })
          setBubbleState('attentive')
          return
        }
      }

      // 3. Facturas vencidas
      const { data: invoices } = await client
        .from('invoices')
        .select('id, full_number, total')
        .eq('organization_id', orgId)
        .eq('status', 'overdue')
        .limit(1)

      if (invoices && invoices.length > 0) {
        const inv = invoices[0] as any
        const sid = `invoice_${inv.id}`
        if (!dismissed.current.has(sid)) {
          setSuggestion({
            id: sid,
            type: 'medium',
            emoji: '💰',
            title: 'Factura vencida',
            body: `Factura ${inv.full_number || inv.id}`,
            actionLabel: 'Ver factura →',
            actionType: 'navigate',
            actionPayload: { path: '/app/finance' },
            expiresAt: Date.now() + 900000,
          })
          setBubbleState('attentive')
          return
        }
      }

      // Sin sugerencias urgentes
      setBubbleState('standby')
      setSuggestion(null)

    } catch (e) {
      console.warn('[AgentBrain] Error:', e)
    } finally {
      running.current = false
    }
  }, [orgId])

  // Correr al montar y cada 5 minutos
  useEffect(() => {
    if (!orgId) return
    analyze()
    const interval = setInterval(analyze, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [orgId, analyze])

  const dismissSuggestion = useCallback(() => {
    if (suggestion) dismissed.current.add(suggestion.id)
    setSuggestion(null)
    setBubbleState('standby')
  }, [suggestion])

  return { suggestion, bubbleState, dismissSuggestion, refresh: analyze }
}
