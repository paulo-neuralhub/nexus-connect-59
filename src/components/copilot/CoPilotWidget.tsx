import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAgentBrain } from '@/hooks/use-agent-brain'
import { useWorkflow } from '@/hooks/workflow/use-workflow'
import type { WorkflowType } from '@/hooks/workflow/use-workflow'
import { WorkflowPanel } from '@/components/copilot/WorkflowPanel'
import { useGeniusTenantConfig } from '@/hooks/genius/useGeniusTenantConfig'
import { useQuery } from '@tanstack/react-query'

// ── Inyectar CSS en el <head> del documento ──────────────
const CSS_ID = 'copilot-widget-styles'
const CSS_CONTENT = `
  .cp-bubble {
    width: 56px; height: 56px; border-radius: 50%;
    overflow: hidden; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;
  }
  .cp-bubble:hover { transform: scale(1.08); }
  .cp-bubble.state-standby {
    box-shadow: 0 4px 20px rgba(30,41,59,0.30);
    animation: cpBreath 3.5s ease-in-out infinite;
  }
  .cp-bubble.state-attentive {
    box-shadow: 0 4px 24px rgba(30,41,59,0.50);
    animation: cpAttentive 2s ease-in-out infinite;
  }
  .cp-bubble.state-urgent {
    box-shadow: 0 0 0 0 rgba(239,68,68,0.4);
    animation: cpUrgent 1.5s ease-in-out infinite;
  }
  .cp-bubble.state-speaking {
    box-shadow: 0 4px 24px rgba(245,158,11,0.45);
    animation: cpBreath 2s ease-in-out infinite;
  }
  .cp-bubble-light {
    background: #374151; border: 2.5px solid #6B7280;
  }
  .cp-bubble-full {
    background: linear-gradient(135deg, #F59E0B, #B45309);
    border: 2.5px solid #D97706;
  }
  .cp-glow {
    animation: cpGlow 5s ease-in-out infinite;
  }
  @keyframes cpGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.3); }
    50% { box-shadow: 0 0 20px rgba(245,158,11,0.6); }
  }
  .cp-panel {
    animation: cpSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cp-tooltip {
    animation: cpSlideUp 0.3s ease-out;
  }
  .cp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #9CA3AF; display: inline-block;
    animation: cpDot 1.2s ease-in-out infinite;
  }
  .cp-dot:nth-child(2) { animation-delay: 0.2s; }
  .cp-dot:nth-child(3) { animation-delay: 0.4s; }
  .cp-bubble-wrapper {
    position: relative; display: inline-flex;
    align-items: center; justify-content: center;
  }
  .cp-ring {
    position: absolute; width: 72px; height: 72px;
    border-radius: 50%; border: 2px solid rgba(30,41,59,0.4);
    animation: cpRing 2.5s ease-out infinite; pointer-events: none;
  }
  .cp-ring:nth-child(2) {
    animation-delay: 0.8s; border-color: rgba(30,41,59,0.2);
  }
  .cp-pro-badge {
    position: absolute; top: -4px; right: -4px;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: white; font-size: 8px; font-weight: 800;
    padding: 2px 5px; border-radius: 6px;
    letter-spacing: 0.5px; z-index: 1;
    border: 1.5px solid white;
  }
  .cp-minicard {
    animation: cpMiniSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes cpMiniSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cpRing {
    0% { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes cpBreath {
    0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(30,41,59,0.35); }
    50% { transform: scale(1.09); box-shadow: 0 6px 28px rgba(30,41,59,0.55); }
  }
  @keyframes cpSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cpDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes cpLand {
    0%   { opacity: 0; transform: translateY(100px) scale(0.3); }
    55%  { opacity: 1; transform: translateY(-10px) scale(1.08); }
    75%  { transform: translateY(4px) scale(0.96); }
    90%  { transform: translateY(-2px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .cp-highlight {
    outline: 2.5px solid #F59E0B !important;
    outline-offset: 4px !important; border-radius: 8px !important;
    box-shadow: 0 0 0 6px rgba(245,158,11,0.15) !important;
    transition: all 0.4s ease !important;
    animation: cpHighlightPulse 1s ease-in-out 3 !important;
  }
  @keyframes cpHighlightPulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(245,158,11,0.15); }
    50% { box-shadow: 0 0 0 10px rgba(245,158,11,0.05); }
  }
  @keyframes cpAttentive {
    0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(30,41,59,0.40); }
    50% { transform: scale(1.07); box-shadow: 0 6px 30px rgba(30,41,59,0.60); }
  }
  @keyframes cpUrgent {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
    50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  }
`

function injectCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById(CSS_ID)) return
  const style = document.createElement('style')
  style.id = CSS_ID
  style.textContent = CSS_CONTENT
  document.head.appendChild(style)
}

// ── Page name mapping ──────────────────────────────────────
const PAGE_NAMES: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/plazos': 'Plazos',
  '/app/expedientes': 'Expedientes',
  '/app/calendario': 'Calendario',
  '/app/crm': 'CRM',
  '/app/vigilancia': 'Vigilancia',
  '/app/genius': 'IP-GENIUS',
  '/app/operaciones': 'Operaciones',
  '/app/reportes': 'Reportes',
  '/app/settings': 'Configuración',
  '/app/help': 'Ayuda',
}

function getPageName(pathname: string): string {
  for (const [path, name] of Object.entries(PAGE_NAMES)) {
    if (pathname.startsWith(path)) return name
  }
  if (pathname.includes('/expedientes/oposiciones')) return 'Oposiciones'
  if (pathname.includes('/expedientes/')) return 'Detalle Expediente'
  if (pathname.includes('/clientes')) return 'Clientes'
  if (pathname.includes('/finanzas')) return 'Finanzas'
  return 'IP-NEXUS'
}

// ── Contextual suggestions by route ──────────────────────
function getContextualSuggestions(pathname: string): string[] {
  if (pathname.includes('/plazos')) return ['Ver plazos urgentes', 'Redactar respuesta office action']
  if (pathname.match(/\/expedientes\/[a-f0-9-]{36}/)) return ['Analizar este expediente', 'Redactar email al cliente', 'Generar informe']
  if (pathname.includes('/oposiciones')) return ['Generar borrador oposición', 'Analizar probabilidad éxito']
  if (pathname.includes('/crm') || pathname.includes('/clientes')) return ['Redactar email seguimiento', 'Generar informe de cartera']
  if (pathname.includes('/finanzas')) return ['Generar presupuesto', 'Resumen financiero']
  if (pathname.includes('/vigilancia') || pathname.includes('/spider')) return ['Analizar alerta', 'Evaluar riesgo oposición']
  return ['¿En qué puedo ayudarte?', 'Ver briefing del día']
}

// ── Tipos ─────────────────────────────────────────────────
type PanelState = 'closed' | 'bubble' | 'open'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isLegal?: boolean
}

interface MiniCard {
  id: string
  message: string
  action: string
  actionPath?: string
  emoji: string
}

// ── Componente ────────────────────────────────────────────
export function CoPilotWidget() {
  const location = useLocation()

  useEffect(() => { injectCSS() }, [])

  // ── Dual-tier detection ────────────────────────────────
  const { data: tenantConfig } = useGeniusTenantConfig()
  const isGeniusFull = tenantConfig?.is_active === true

  const [panel, setPanel] = useState<PanelState>('closed')
  const [messages, setMessages] = useState<Message[]>([])
  const {
    activeWorkflow, isStarting, startWorkflow, approveWorkflow,
    cancelWorkflow, clearWorkflow, detectWorkflowIntent, isActive: workflowIsActive,
  } = useWorkflow()

  const [panelMode, setPanelMode] = useState<'chat' | 'workflow'>('chat')
  const [pendingWorkflow, setPendingWorkflow] = useState<{
    type: WorkflowType; goal: string
  } | null>(null)

  // ── Disclaimer modal (Full only, once per session) ─────
  const [disclaimerShown, setDisclaimerShown] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return sessionStorage.getItem('genius_copilot_disclaimer') === 'true'
  })

  // When Full copilot opens for first time, show disclaimer
  useEffect(() => {
    if (panel === 'open' && isGeniusFull && !disclaimerAccepted && !disclaimerShown) {
      setDisclaimerShown(true)
    }
  }, [panel, isGeniusFull, disclaimerAccepted, disclaimerShown])

  // Workflow completion → inject summary in chat
  useEffect(() => {
    if (!activeWorkflow) return
    if (activeWorkflow.status === 'completed') {
      const synthesis = activeWorkflow.results_json?.synthesis as Record<string, unknown> | undefined
      const summary = synthesis?.summary as string | undefined
      if (summary) {
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `✅ **Workflow completado**\n\n${summary}${
            (synthesis?.next_actions as string[] | undefined)?.length
              ? '\n\n**Próximos pasos:**\n' + (synthesis.next_actions as string[]).slice(0, 2).map(a => `→ ${a}`).join('\n')
              : ''
          }`,
          isLegal: true,
        }])
      }
      setTimeout(() => { setPanelMode('chat'); clearWorkflow() }, 1500)
    }
    if (activeWorkflow.status === 'failed') {
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: `❌ El workflow no pudo completarse: ${activeWorkflow.error_message ?? 'Error desconocido'}. Puedes preguntarme directamente si quieres.`,
      }])
      setTimeout(() => { setPanelMode('chat'); clearWorkflow() }, 2000)
    }
  }, [activeWorkflow?.status])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [greeting, setGreeting] = useState('')
  const [pos, setPos] = useState({ right: 24, bottom: 24 })
  const dragging = useRef(false)
  const moved = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)
  const didLand = useRef(false)

  // ── Agent Brain ────────────────────────────────────────
  const [orgId, setOrgId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const client: any = supabase
      client.from('profiles')
        .select('organization_id')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }: any) => { if (p) setOrgId(p.organization_id) })
    })
  }, [])

  const { suggestion, bubbleState, dismissSuggestion } = useAgentBrain(orgId)
  const [executing, setExecuting] = useState<string | null>(null)

  const executeAction = async (type: string, payload: Record<string, unknown>) => {
    setExecuting('Iniciando...')
    try {
      if (type === 'navigate' && payload.path) {
        setExecuting('Navegando...')
        await new Promise(r => setTimeout(r, 500))
        window.location.href = payload.path as string
        return
      }
      if (type === 'create_deadline') {
        setExecuting('Creando plazo...')
        const client: any = supabase
        await client.from('matter_deadlines').insert({
          matter_id: payload.matter_id, organization_id: orgId,
          title: payload.title as string, deadline_date: payload.due_date as string,
          status: 'pending', deadline_type: 'internal',
        })
        setExecuting('✓ Plazo creado')
        setTimeout(() => setExecuting(null), 2000)
        return
      }
      if (type === 'analyze') {
        setExecuting('Analizando...')
        setPanel('open')
        setExecuting(null)
        return
      }
    } catch {
      setExecuting('Error. Intenta de nuevo.')
      setTimeout(() => setExecuting(null), 3000)
    }
  }

  // Show urgent suggestions automatically
  useEffect(() => {
    if (!suggestion) return
    if (panel === 'open') return
    if (suggestion.type === 'urgent' || suggestion.type === 'high') {
      setGreeting(suggestion.emoji + ' ' + suggestion.title + '\n' + suggestion.body)
      setPanel('bubble')
    }
  }, [suggestion])

  // ── Proactive Mini-Cards (Full only) ───────────────────
  const { data: miniCardData } = useQuery({
    queryKey: ['copilot-proactive', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const now = new Date()
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      const cards: MiniCard[] = []

      // Overdue deadlines
      const { count: overdueCount } = await (supabase as any)
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .lt('deadline_date', now.toISOString())
        .neq('status', 'completed')
      if (overdueCount && overdueCount > 0) {
        cards.push({ id: 'overdue', message: `${overdueCount} plazos vencidos`, action: 'Ver plazos', actionPath: '/app/plazos', emoji: '⚡' })
      }

      // Upcoming deadlines (3 days)
      const { count: upcomingCount } = await (supabase as any)
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('deadline_date', now.toISOString())
        .lt('deadline_date', threeDays)
        .neq('status', 'completed')
      if (upcomingCount && upcomingCount > 0) {
        cards.push({ id: 'upcoming', message: `${upcomingCount} plazos en 3 días`, action: '¿Preparo respuesta?', emoji: '📅' })
      }

      return cards
    },
    enabled: !!orgId && isGeniusFull,
    refetchInterval: 5 * 60 * 1000,
  })

  const [activeMiniCard, setActiveMiniCard] = useState<MiniCard | null>(null)
  const [miniCardDismissed, setMiniCardDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!miniCardData?.length || panel === 'open') return
    const next = miniCardData.find(c => !miniCardDismissed.has(c.id))
    if (next && !activeMiniCard) {
      setActiveMiniCard(next)
      // Auto-dismiss after 15s
      const t = setTimeout(() => {
        setMiniCardDismissed(prev => new Set([...prev, next.id]))
        setActiveMiniCard(null)
      }, 15000)
      return () => clearTimeout(t)
    }
  }, [miniCardData, miniCardDismissed, panel, activeMiniCard])

  // ── Landing animation ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cp_pos_v3')
      if (saved) setPos(JSON.parse(saved))
    } catch { /* ignore */ }

    const t1 = setTimeout(() => {
      if (!bubbleRef.current || didLand.current) return
      didLand.current = true
      const el = bubbleRef.current
      el.style.animation = 'none'
      void el.offsetWidth
      el.style.animation = 'cpLand 1.2s cubic-bezier(0.22,1,0.36,1) forwards'
      el.addEventListener('animationend', () => { el.style.animation = '' }, { once: true })
    }, 400)

    const t2 = setTimeout(() => {
      const today = new Date().toDateString()
      if (localStorage.getItem('cp_greeted_v3') === today) return
      localStorage.setItem('cp_greeted_v3', today)
      const h = new Date().getHours()
      const sal = h < 12 ? 'Buenos días ☀️' : h < 20 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙'
      setGreeting(`${sal} Soy tu asistente de PI. ¿En qué puedo ayudarte?`)
      setPanel('bubble')
    }, 1800)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // ── Avatar movement toward relevant element ────────────
  const lastMovePath = useRef('')
  useEffect(() => {
    if (location.pathname === lastMovePath.current) return
    lastMovePath.current = location.pathname
    const t = setTimeout(() => {
      if (panel === 'open') return
      let targetEl: Element | null = null
      if (location.pathname.match(/\/matters\/[a-f0-9-]{36}|\/expedientes\/[a-f0-9-]{36}/)) {
        targetEl = document.querySelector('[data-copilot="matter-deadlines"]') || document.querySelector('[data-copilot="matter-header"]')
      } else if (location.pathname.includes('/spider') || location.pathname.includes('/alerts')) {
        targetEl = document.querySelector('[data-copilot="alert-critical"]') || document.querySelector('[data-copilot="spider-dashboard"]')
      } else if (location.pathname.includes('/calendar') || location.pathname.includes('/calendario')) {
        targetEl = document.querySelector('[data-copilot="calendar-urgent"]')
      }
      if (!targetEl) return
      const rect = targetEl.getBoundingClientRect()
      const newRight = Math.max(16, window.innerWidth - rect.right - 80)
      const newBottom = Math.max(16, window.innerHeight - rect.bottom - 20)
      setPos({ right: newRight, bottom: newBottom })
      localStorage.setItem('cp_pos_v3', JSON.stringify({ right: newRight, bottom: newBottom }))
      targetEl.classList.add('cp-highlight')
      setTimeout(() => { targetEl?.classList.remove('cp-highlight') }, 3000)
    }, 800)
    return () => clearTimeout(t)
  }, [location.pathname, panel])

  // ── Drag ──────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = Math.abs(e.clientX - dragStart.current.x)
      const dy = Math.abs(e.clientY - dragStart.current.y)
      if (dx > 5 || dy > 5) {
        moved.current = true
        setPos({
          right: Math.max(8, Math.min(window.innerWidth - 80, dragStart.current.right + (dragStart.current.x - e.clientX))),
          bottom: Math.max(8, Math.min(window.innerHeight - 80, dragStart.current.bottom + (dragStart.current.y - e.clientY)))
        })
      }
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      if (moved.current) {
        setPos(p => { localStorage.setItem('cp_pos_v3', JSON.stringify(p)); return p })
      }
      setTimeout(() => { moved.current = false }, 50)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const placeholder = (() => {
    const p = location.pathname
    if (p.match(/\/matters\/[^/]+/) || p.match(/\/expedientes\/[^/]+/)) return 'Pregunta sobre este expediente...'
    if (p.includes('/spider')) return 'Analiza esta alerta...'
    if (p.includes('/crm')) return 'Pregúntame sobre este cliente...'
    if (p.includes('/plazos') || p.includes('/calendar')) return 'Pregunta sobre plazos...'
    if (p.includes('/dashboard')) return '¿En qué puedo ayudarte hoy?'
    return 'Pregúntame lo que necesites...'
  })()

  const contextualChips = useMemo(() => {
    return isGeniusFull ? getContextualSuggestions(location.pathname) : []
  }, [location.pathname, isGeniusFull])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading || isStarting) return
    setInput('')

    // ── CASE 1: Pending workflow awaiting matter ──
    if (pendingWorkflow) {
      setMessages(prev => [...prev, { role: 'user' as const, content: msg }])
      const { data: found } = await supabase.from('matters')
        .select('id, title, reference, type, status, jurisdiction')
        .or(`title.ilike.%${msg}%,reference.ilike.%${msg}%`)
        .limit(1).single()

      if (found) {
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `Perfecto. Trabajando en **${found.title}**${found.reference ? ` (${found.reference})` : ''} — ${found.jurisdiction ?? found.type}.`,
        }])
        setPendingWorkflow(null)
        setPanelMode('workflow')
        await startWorkflow({
          goal: `${pendingWorkflow.goal} — Expediente: ${found.title}`,
          workflow_type: pendingWorkflow.type,
          matter_id: found.id,
        })
      } else {
        const { data: suggestions } = await supabase.from('matters')
          .select('title, reference').order('updated_at', { ascending: false }).limit(3)
        const list = suggestions?.map(m => `• ${m.title}${m.reference ? ` (${m.reference})` : ''}`).join('\n') ?? ''
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `No encontré ese expediente. ¿Puedes confirmar el nombre exacto?\n\n${list ? `Expedientes recientes:\n${list}` : ''}`,
        }])
      }
      return
    }

    // ── CASE 2: Detect workflow intent ──
    const intent = detectWorkflowIntent(msg)
    const needsMatter: WorkflowType[] = ['oa_response', 'spider_analysis', 'renewal', 'infringement_analysis', 'full_matter_prep', 'due_diligence', 'competitor_analysis']

    if (intent.isWorkflow && intent.confidence >= 0.75 && intent.workflow_type) {
      const wfType = intent.workflow_type as WorkflowType
      setMessages(prev => [...prev, { role: 'user' as const, content: msg }])

      if (needsMatter.includes(wfType)) {
        setPendingWorkflow({ type: wfType, goal: msg })
        const { data: recentMatters } = await supabase.from('matters')
          .select('id, title, reference, type, status').order('updated_at', { ascending: false }).limit(4)
        const list = recentMatters?.map(m => `• ${m.title}${m.reference ? ` (${m.reference})` : ''}`).join('\n') ?? ''
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `Para preparar esto necesito saber el expediente concreto.\n\n${list ? `Expedientes recientes:\n${list}\n\n` : ''}¿Sobre cuál trabajamos? Escribe el nombre o la referencia.`,
        }])
        return
      }

      setPanelMode('workflow')
      await startWorkflow({ goal: msg, workflow_type: wfType })
      return
    }

    // ── CASE 3: Normal chat ──
    setMessages(m => [...m, { role: 'user' as const, content: msg }])
    setLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('genius-chat', {
        body: { message: msg, conversation_id: convId, context_page: location.pathname },
      })
      if (fnError) throw fnError
      if (data?.conversation_id) setConvId(data.conversation_id)
      const raw = data?.message ?? data?.response ?? 'No pude procesar tu mensaje.'
      const reply = typeof raw === 'object' && raw !== null ? (raw.content ?? JSON.stringify(raw)) : String(raw)

      // Light mode: check if response suggests upgrade
      if (!isGeniusFull && (reply.includes('documento') || reply.includes('borrador') || reply.includes('generar'))) {
        setMessages(m => [...m, { role: 'assistant' as const, content: reply + '\n\n💡 _Para generación de documentos, activa IP-GENIUS._' }])
      } else {
        setMessages(m => [...m, { role: 'assistant' as const, content: reply, isLegal: isGeniusFull }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant' as const, content: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const ACCENT_LIGHT = '#374151'
  const ACCENT_FULL = '#D97706'
  const ACCENT = isGeniusFull ? ACCENT_FULL : ACCENT_LIGHT
  const AVATAR = '/assets/copilot-nexus-avatar.jpeg'
  const panelWidth = isGeniusFull ? 480 : 380
  const pageName = getPageName(location.pathname)

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed', right: pos.right, bottom: pos.bottom,
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 12,
        userSelect: dragging.current ? 'none' : 'auto',
      }}
    >
      {/* ── DISCLAIMER MODAL (Full only) ──────────────── */}
      {disclaimerShown && !disclaimerAccepted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1F2937' }}>
              Aviso importante
            </h3>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16 }}>
              Entiendo que el contenido generado por IP-GENIUS requiere <strong>revisión profesional</strong> antes de su uso oficial. Los documentos y análisis son orientativos y no constituyen asesoramiento legal vinculante.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 16 }}>
              <input
                type="checkbox"
                id="disclaimer-check"
                style={{ marginTop: 2 }}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDisclaimerAccepted(true)
                    sessionStorage.setItem('genius_copilot_disclaimer', 'true')
                  }
                }}
              />
              He leído y acepto las condiciones de uso
            </label>
            <button
              onClick={() => {
                if (disclaimerAccepted) setDisclaimerShown(false)
              }}
              disabled={!disclaimerAccepted}
              style={{
                width: '100%', padding: '10px', borderRadius: 10,
                background: disclaimerAccepted ? ACCENT : '#E5E7EB',
                color: disclaimerAccepted ? 'white' : '#9CA3AF',
                border: 'none', fontSize: 14, fontWeight: 600,
                cursor: disclaimerAccepted ? 'pointer' : 'not-allowed',
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ── PANEL ABIERTO ─────────────────────────────── */}
      {panel === 'open' && (
        <div
          className="cp-panel"
          style={{
            width: Math.min(panelWidth, window.innerWidth - 32),
            background: 'white', borderRadius: 20,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: 'min(620px, calc(100vh - 120px))',
            border: `1px solid ${isGeniusFull ? 'rgba(217,119,6,0.15)' : 'rgba(30,41,59,0.08)'}`,
          }}
        >
          {/* Header */}
          <div style={{
            background: isGeniusFull
              ? 'linear-gradient(135deg, #D97706, #92400E)'
              : `linear-gradient(135deg, ${ACCENT_LIGHT}, #334155)`,
            padding: '14px 18px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0,
              }}>
                <img src={AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isGeniusFull ? '✦ IP-GENIUS' : '✦ GENIUS Light'}
                  {isGeniusFull && <span style={{
                    fontSize: 9, background: 'rgba(255,255,255,0.2)', padding: '1px 6px',
                    borderRadius: 4, fontWeight: 600,
                  }}>✓ PRO</span>}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                  Asistente de Propiedad Intelectual
                </div>
              </div>
            </div>
            <button onClick={() => setPanel('closed')} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
              color: 'white', cursor: 'pointer', width: 32, height: 32,
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          {/* Context chip */}
          <div style={{
            padding: '8px 18px', borderBottom: '1px solid #F1F5F9',
            fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            📍 Estás en: <strong style={{ color: '#374151' }}>{pageName}</strong>
          </div>

          {/* Panel content: workflow OR chat */}
          {panelMode === 'workflow' && (activeWorkflow || isStarting) ? (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FAFBFC' }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {messages.slice(-2).map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          background: m.role === 'user' ? ACCENT : 'white',
                          color: m.role === 'user' ? 'white' : '#1F2937',
                          borderRadius: 12, padding: '8px 12px', fontSize: 12, maxWidth: '85%', opacity: 0.7,
                        }}>{m.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                {isStarting && !activeWorkflow ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 24 }}>
                    <span className="cp-dot" /><span className="cp-dot" /><span className="cp-dot" />
                    <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>Iniciando...</span>
                  </div>
                ) : activeWorkflow ? (
                  <WorkflowPanel workflow={activeWorkflow} onApprove={approveWorkflow} onCancel={cancelWorkflow}
                    onClose={() => { setPanelMode('chat'); clearWorkflow() }} />
                ) : null}
              </div>
              {/* Approval area */}
              {activeWorkflow?.status === 'approval_needed' && activeWorkflow?.approval_payload && (
                <div style={{ borderTop: '2px solid #E2E8F0', background: 'white', padding: '12px 16px', flexShrink: 0 }}>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>✋ Confirma antes de continuar</div>
                    <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5, marginBottom: 6 }}>
                      {(activeWorkflow.approval_payload as Record<string, string>).description}
                    </div>
                    <div style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', borderRadius: 6, padding: '5px 8px' }}>
                      ⚠️ El borrador NO se enviará automáticamente.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approveWorkflow(activeWorkflow.id)} style={{
                      flex: 1, background: ACCENT, color: 'white', border: 'none', borderRadius: 10,
                      padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>✓ Aprobar y continuar</button>
                    <button onClick={() => cancelWorkflow(activeWorkflow.id)} style={{
                      background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0',
                      borderRadius: 10, padding: '10px 16px', fontSize: 13, cursor: 'pointer',
                    }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ── Chat normal ──────────────────────────────────
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#FAFBFC' }}>
              {messages.length === 0 && !activeWorkflow && !isStarting && (
                <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>
                    {isGeniusFull ? '✦' : '⚡'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937', marginBottom: 6 }}>
                    {isGeniusFull ? 'IP-GENIUS PRO' : 'GENIUS Light'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginBottom: 16 }}>
                    {isGeniusFull ? 'Tu asistente inteligente de PI con capacidades completas' : 'Pregúntame o pídeme que prepare algo'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['📋 Responder Office Action', '🔍 Analizar alerta Spider', '📊 Briefing del día'].map(q => (
                      <button key={q} onClick={() => setInput(q)} style={{
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
                        padding: '8px 14px', fontSize: 12, color: '#374151',
                        cursor: 'pointer', textAlign: 'left' as const, transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                      >{q}</button>
                    ))}
                  </div>
                  {!isGeniusFull && (
                    <a href="/app/settings/genius" style={{
                      display: 'inline-block', marginTop: 12, fontSize: 11,
                      color: '#D97706', textDecoration: 'none', fontWeight: 600,
                    }}>
                      Activar IP-GENIUS PRO →
                    </a>
                  )}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #E2E8F0' }}>
                      <img src={AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    </div>
                  )}
                  <div>
                    <div style={{
                      background: m.role === 'user' ? ACCENT : 'white',
                      color: m.role === 'user' ? 'white' : '#1F2937',
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px', fontSize: 13, lineHeight: 1.55, maxWidth: '82%',
                      boxShadow: m.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      border: m.role === 'assistant' ? '1px solid #F1F5F9' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}>{m.content}</div>
                    {/* AI disclaimer for Full mode */}
                    {m.role === 'assistant' && isGeniusFull && m.isLegal && (
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, paddingLeft: 4 }}>
                        🤖 Generado por IA — revisión profesional requerida
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #E2E8F0' }}>
                    <img src={AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  </div>
                  <div style={{ background: 'white', borderRadius: 16, padding: '12px 18px', display: 'flex', gap: 5, border: '1px solid #F1F5F9' }}>
                    <span className="cp-dot" /><span className="cp-dot" /><span className="cp-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Contextual suggestion chips (Full only) */}
          {isGeniusFull && contextualChips.length > 0 && panelMode === 'chat' && !loading && (
            <div style={{
              padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap',
              borderTop: '1px solid #F1F5F9', background: '#FAFBFC',
            }}>
              {contextualChips.map((chip) => (
                <button key={chip} onClick={() => { setInput(chip); }} style={{
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: 16,
                  padding: '4px 12px', fontSize: 11, color: '#6B7280',
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}
                >{chip}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 14px', display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', background: 'white' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={placeholder} rows={1}
              style={{
                flex: 1, border: '1px solid #E5E7EB', borderRadius: 12, padding: '9px 13px',
                fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4, background: '#F8FAFC', color: '#1F2937', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: !input.trim() || loading ? '#E5E7EB' : ACCENT,
                border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── TOOLTIP (estado bubble) ───────────────────── */}
      {panel === 'bubble' && (
        <div className="cp-tooltip" style={{
          background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '14px 16px', maxWidth: 260, border: '1px solid rgba(30,41,59,0.1)',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {greeting || '¿En qué puedo ayudarte? 👋'}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestion && suggestion.actionLabel ? (
              <>
                <button onClick={() => {
                  if (suggestion.actionType && suggestion.actionPayload) executeAction(suggestion.actionType, suggestion.actionPayload)
                  dismissSuggestion(); setPanel('closed')
                }} style={{
                  background: suggestion.type === 'urgent' ? '#EF4444' : suggestion.type === 'high' ? '#F59E0B' : ACCENT,
                  color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{suggestion.actionLabel}</button>
                <button onClick={() => { dismissSuggestion(); setGreeting(''); setPanel('closed') }} style={{
                  background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB',
                  borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                }}>Descartar</button>
              </>
            ) : (
              <>
                <button onClick={() => { setGreeting(''); setPanel('open') }} style={{
                  background: ACCENT, color: 'white', border: 'none', borderRadius: 8,
                  padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Abrir →</button>
                <button onClick={() => { setGreeting(''); setPanel('closed') }} style={{
                  background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB',
                  borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                }}>Más tarde</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PROACTIVE MINI-CARD (Full only) ───────────── */}
      {activeMiniCard && panel !== 'open' && isGeniusFull && (
        <div className="cp-minicard" style={{
          background: 'white', borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          padding: '12px 14px', width: 250, border: '1px solid rgba(217,119,6,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
              {activeMiniCard.emoji} {activeMiniCard.message}
            </span>
            <button onClick={() => {
              setMiniCardDismissed(prev => new Set([...prev, activeMiniCard.id]))
              setActiveMiniCard(null)
            }} style={{
              background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
              fontSize: 14, padding: 0, lineHeight: 1,
            }}>✕</button>
          </div>
          <button onClick={() => {
            if (activeMiniCard.actionPath) window.location.href = activeMiniCard.actionPath
            else { setPanel('open'); setInput(activeMiniCard.action) }
            setMiniCardDismissed(prev => new Set([...prev, activeMiniCard.id]))
            setActiveMiniCard(null)
          }} style={{
            background: ACCENT, color: 'white', border: 'none', borderRadius: 8,
            padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>{activeMiniCard.action}</button>
        </div>
      )}

      {/* ── PROGRESS INDICATOR ─────────────────────────── */}
      {executing && (
        <div className="cp-tooltip" style={{
          background: ACCENT, color: 'white', borderRadius: 12,
          padding: '10px 16px', fontSize: 12, display: 'flex',
          alignItems: 'center', gap: 8, maxWidth: 220,
        }}>
          {executing.startsWith('✓') ? (
            <span style={{ color: '#34D399', fontSize: 16 }}>✓</span>
          ) : (
            <div style={{ display: 'flex', gap: 3 }}>
              <span className="cp-dot" style={{ background: 'rgba(255,255,255,0.6)' }} />
              <span className="cp-dot" style={{ background: 'rgba(255,255,255,0.6)' }} />
              <span className="cp-dot" style={{ background: 'rgba(255,255,255,0.6)' }} />
            </div>
          )}
          <span>{executing}</span>
        </div>
      )}

      {/* ── BUBBLE ────────────────────────────────────── */}
      <div className="cp-bubble-wrapper">
        <div className="cp-ring" />
        <div className="cp-ring" />
        <div
          ref={bubbleRef}
          className={`cp-bubble ${isGeniusFull ? 'cp-bubble-full cp-glow' : 'cp-bubble-light'} state-${panel === 'open' ? 'speaking' : bubbleState}`}
          onClick={() => {
            if (moved.current) return
            if (panel === 'closed') setPanel('bubble')
            else if (panel === 'bubble') setPanel('open')
            else setPanel('closed')
          }}
        >
          {/* Icon ✦ */}
          <span style={{ color: 'white', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>✦</span>
          {isGeniusFull && <span className="cp-pro-badge">PRO</span>}
        </div>
      </div>
    </div>
  )
}

export default CoPilotWidget
