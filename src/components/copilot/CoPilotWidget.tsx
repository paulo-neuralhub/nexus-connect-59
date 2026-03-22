import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAgentBrain } from '@/hooks/use-agent-brain'

// ── Inyectar CSS en el <head> del documento ──────────────
const CSS_ID = 'copilot-widget-styles'
const CSS_CONTENT = `
  .cp-bubble {
    width: 64px; height: 64px; border-radius: 50%;
    overflow: hidden; cursor: pointer; background: #E2E8F0;
    display: block; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;
  }
  .cp-bubble:hover { transform: scale(1.08); }
  .cp-bubble.state-standby {
    border: 2.5px solid #1E293B;
    box-shadow: 0 4px 20px rgba(30,41,59,0.30);
    animation: cpBreath 3.5s ease-in-out infinite;
  }
  .cp-bubble.state-attentive {
    border: 2.5px solid #1E293B;
    box-shadow: 0 4px 24px rgba(30,41,59,0.50);
    animation: cpAttentive 2s ease-in-out infinite;
  }
  .cp-bubble.state-urgent {
    border: 2.5px solid #EF4444;
    box-shadow: 0 0 0 0 rgba(239,68,68,0.4);
    animation: cpUrgent 1.5s ease-in-out infinite;
  }
  .cp-bubble.state-speaking {
    border: 2.5px solid #F59E0B;
    box-shadow: 0 4px 24px rgba(245,158,11,0.45);
    animation: cpBreath 2s ease-in-out infinite;
  }
  .cp-panel {
    animation: cpSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cp-tooltip {
    animation: cpSlideUp 0.3s ease-out;
  }
  .cp-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9CA3AF;
    display: inline-block;
    animation: cpDot 1.2s ease-in-out infinite;
  }
  .cp-dot:nth-child(2) { animation-delay: 0.2s; }
  .cp-dot:nth-child(3) { animation-delay: 0.4s; }
  .cp-bubble-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .cp-ring {
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(30,41,59,0.4);
    animation: cpRing 2.5s ease-out infinite;
    pointer-events: none;
  }
  .cp-ring:nth-child(2) {
    animation-delay: 0.8s;
    border-color: rgba(30,41,59,0.2);
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

// ── Tipos ─────────────────────────────────────────────────
type PanelState = 'closed' | 'bubble' | 'open'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ── Componente ────────────────────────────────────────────
export function CoPilotWidget() {
  const location = useLocation()

  useEffect(() => { injectCSS() }, [])

  const [panel, setPanel] = useState<PanelState>('closed')
  const [messages, setMessages] = useState<Message[]>([])
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
        .then(({ data: p }: any) => {
          if (p) setOrgId(p.organization_id)
        })
    })
  }, [])

  const { suggestion, bubbleState, dismissSuggestion } = useAgentBrain(orgId)

  // Show urgent suggestions automatically
  useEffect(() => {
    if (!suggestion) return
    if (panel === 'open') return
    if (suggestion.type === 'urgent' || suggestion.type === 'high') {
      setGreeting(suggestion.emoji + ' ' + suggestion.title + '\n' + suggestion.body)
      setPanel('bubble')
    }
  }, [suggestion])

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
      el.addEventListener('animationend', () => {
        el.style.animation = ''
        setBreathing(true)
      }, { once: true })
    }, 400)

    const t2 = setTimeout(() => {
      const today = new Date().toDateString()
      if (localStorage.getItem('cp_greeted_v3') === today) return
      localStorage.setItem('cp_greeted_v3', today)
      const h = new Date().getHours()
      const sal = h < 12 ? 'Buenos días ☀️'
                : h < 20 ? 'Buenas tardes 🌤️'
                : 'Buenas noches 🌙'
      setGreeting(`${sal} Soy tu asistente de PI. ¿En qué puedo ayudarte?`)
      setPanel('bubble')
    }, 1800)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // ── Drag ──────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return
    dragging.current = true
    moved.current = false
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      right: pos.right, bottom: pos.bottom
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = Math.abs(e.clientX - dragStart.current.x)
      const dy = Math.abs(e.clientY - dragStart.current.y)
      if (dx > 5 || dy > 5) {
        moved.current = true
        setPos({
          right: Math.max(8, Math.min(
            window.innerWidth - 80,
            dragStart.current.right + (dragStart.current.x - e.clientX)
          )),
          bottom: Math.max(8, Math.min(
            window.innerHeight - 80,
            dragStart.current.bottom + (dragStart.current.y - e.clientY)
          ))
        })
      }
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      if (moved.current) {
        setPos(p => {
          localStorage.setItem('cp_pos_v3', JSON.stringify(p))
          return p
        })
      }
      setTimeout(() => { moved.current = false }, 50)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const placeholder = (() => {
    const p = location.pathname
    if (p.match(/\/matters\/[^/]+/)) return 'Pregunta sobre este expediente...'
    if (p.includes('/spider')) return 'Analiza esta alerta...'
    if (p.includes('/crm')) return 'Pregúntame sobre este cliente...'
    if (p.includes('/calendar')) return 'Pregunta sobre plazos...'
    if (p.includes('/dashboard')) return '¿En qué puedo ayudarte hoy?'
    return 'Pregúntame lo que necesites...'
  })()

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('genius-chat', {
        body: {
          message: msg,
          conversation_id: convId,
          context_page: location.pathname,
        }
      })
      if (error) throw error
      if (data?.conversation_id) setConvId(data.conversation_id)
      const reply = data?.message ?? data?.response ?? 'Sin respuesta del asistente.'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Error de conexión. Intenta de nuevo.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const ACCENT = '#1E293B'
  const AVATAR = '/assets/copilot-nexus-avatar.jpeg'

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        userSelect: dragging.current ? 'none' : 'auto',
      }}
    >
      {/* ── PANEL ABIERTO ─────────────────────────────── */}
      {panel === 'open' && (
        <div
          className="cp-panel"
          style={{
            width: 380,
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(580px, calc(100vh - 120px))',
            border: '1px solid rgba(30,41,59,0.08)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #334155)`,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.25)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={AVATAR}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
                  CoPilot Nexus
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                  Asistente de Propiedad Intelectual
                </div>
              </div>
            </div>
            <button
              onClick={() => setPanel('closed')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                width: 32,
                height: 32,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#FAFBFC',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937', marginBottom: 6 }}>
                  Soy tu asistente de PI
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginBottom: 16 }}>
                  Pregúntame sobre expedientes, plazos, alertas Spider o jurisdicciones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    '📊 Analizar mi cartera',
                    '⏰ ¿Qué plazos tengo esta semana?',
                    '🔍 Explicar una alerta Spider',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q) }}
                      style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        padding: '8px 14px',
                        fontSize: 12,
                        color: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = ACCENT
                        e.currentTarget.style.background = '#F8FAFC'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E5E7EB'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                }}
              >
                {m.role === 'assistant' && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1.5px solid #E2E8F0',
                    }}
                  >
                    <img
                      src={AVATAR}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                )}
                <div
                  style={{
                    background: m.role === 'user' ? ACCENT : 'white',
                    color: m.role === 'user' ? 'white' : '#1F2937',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.55,
                    maxWidth: '82%',
                    boxShadow: m.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    border: m.role === 'assistant' ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1.5px solid #E2E8F0',
                  }}
                >
                  <img
                    src={AVATAR}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '12px 18px',
                    display: 'flex',
                    gap: 5,
                    border: '1px solid #F1F5F9',
                  }}
                >
                  <span className="cp-dot" />
                  <span className="cp-dot" />
                  <span className="cp-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              gap: 8,
              borderTop: '1px solid #F1F5F9',
              background: 'white',
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={placeholder}
              rows={1}
              style={{
                flex: 1,
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '9px 13px',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4,
                background: '#F8FAFC',
                color: '#1F2937',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: !input.trim() || loading ? '#E5E7EB' : ACCENT,
                border: 'none',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => {
                if (input.trim() && !loading)
                  e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── TOOLTIP (estado bubble) ───────────────────── */}
      {panel === 'bubble' && (
        <div
          className="cp-tooltip"
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '14px 16px',
            maxWidth: 260,
            border: '1px solid rgba(30,41,59,0.1)',
          }}
        >
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 13,
              color: '#374151',
              lineHeight: 1.5,
            }}
          >
            {greeting || '¿En qué puedo ayudarte? 👋'}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { setGreeting(''); setPanel('open') }}
              style={{
                background: ACCENT,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Abrir →
            </button>
            <button
              onClick={() => { setGreeting(''); setPanel('closed') }}
              style={{
                background: 'transparent',
                color: '#9CA3AF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

      {/* ── CÍRCULO DEL AVATAR ────────────────────────── */}
      <div className="cp-bubble-wrapper">
        <div className="cp-ring" />
        <div className="cp-ring" />
        <div
          ref={bubbleRef}
          className={`cp-bubble${breathing ? ' breathing' : ''}`}
          onClick={() => {
            if (moved.current) return
            if (panel === 'closed') setPanel('bubble')
            else if (panel === 'bubble') setPanel('open')
            else setPanel('closed')
          }}
        >
          <img
            src={AVATAR}
            alt="CoPilot Nexus"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

export default CoPilotWidget
