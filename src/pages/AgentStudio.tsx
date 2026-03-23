import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import ReactMarkdown from 'react-markdown'

// ─── Animaciones CSS ───────────────────────────────────────
const CSS = `
@keyframes land {
  0%   { opacity:0; transform:translateY(40px) scale(.7); }
  65%  { opacity:1; transform:translateY(-5px) scale(1.04); }
  82%  { transform:translateY(2px) scale(.98); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes bth  { 0%,100%{transform:scale(1);} 50%{transform:scale(1.07);} }
@keyframes ro1  { 0%{transform:scale(1);opacity:.9;} 100%{transform:scale(2.6);opacity:0;} }
@keyframes ro2  { 0%{transform:scale(1);opacity:.5;} 100%{transform:scale(1.9);opacity:0;} }
@keyframes pls  { 0%,100%{opacity:1;} 50%{opacity:.08;} }
@keyframes tgl  { 0%,100%{opacity:.5;} 50%{opacity:1;} }
@keyframes cf   { 0%{stroke-dashoffset:80;} 100%{stroke-dashoffset:0;} }
@keyframes ng   { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.28);} 50%{box-shadow:0 0 0 18px rgba(59,130,246,0);} }
@keyframes sUp  { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
@keyframes dF1  { 0%,100%{transform:translateY(0) rotate(-4deg);} 50%{transform:translateY(-10px) rotate(3deg);} }
@keyframes dF2  { 0%,100%{transform:translateY(0) rotate(5deg);} 50%{transform:translateY(-8px) rotate(-3deg);} }
@keyframes dF3  { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
@keyframes bal  { 0%,100%{transform:rotate(-7deg);} 50%{transform:rotate(7deg);} }
@keyframes ndp  { 0%,100%{transform:scale(1);} 50%{transform:scale(1.45);} }
@keyframes cur  { 0%,100%{opacity:1;} 50%{opacity:0;} }
@keyframes spn  { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes wv   { 0%{transform:scale(.15);opacity:1;} 100%{transform:scale(3);opacity:0;} }
@keyframes bp   { 0%,100%{opacity:.35;} 50%{opacity:1;} }
@keyframes wsIn { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
@keyframes dotBounce { 0%,80%,100%{transform:scale(0);} 40%{transform:scale(1);} }
`

// ─── Datos de agentes ──────────────────────────────────────
const NEXUS_DATA = {
  id: 'nexus', name: 'Nexus', ini: 'NX', role: 'Orquestador',
  c: '#3B82F6', bg: 'linear-gradient(135deg,#1D4ED8,#6D28D9)',
  tasks: 89,
  desc: 'Coordina todos los agentes. Descompone objetivos complejos en tareas accionables y sintetiza resultados.',
  caps: ['Interpretar objetivos del usuario', 'Planes de ejecución multi-paso', 'Coordinación en paralelo', 'Síntesis de resultados'],
  suggestedPrompts: [] as string[],
}

const AGENTS_DATA = [
  { id: 'lex', name: 'Lex', ini: 'LX', role: 'Jurisdicciones', c: '#8B5CF6', bg: 'linear-gradient(135deg,#5B21B6,#4C1D95)', tasks: 43, active: false, agentType: 'jurisdiction', desc: 'Experto en 200 oficinas PI del mundo. Plazos, tasas y jurisprudencia actualizada.', caps: ['EUIPO, USPTO, OEPM, WIPO', 'Plazos y tasas al día', 'Jurisprudencia por país', 'Estrategia internacional'], suggestedPrompts: ['¿Cuál es el plazo para responder en EUIPO?', 'Compara tasas USPTO vs OEPM para clase 9', '¿Qué cambios hubo en el reglamento RMUE?'] },
  { id: 'archie', name: 'Archie', ini: 'AR', role: 'Expedientes', c: '#0EA5E9', bg: 'linear-gradient(135deg,#0369A1,#0284C7)', tasks: 61, active: true, agentType: 'dossier', desc: 'Analiza expedientes en profundidad. Identifica riesgos y recomienda acciones.', caps: ['Análisis de OA', 'Detección de riesgos', 'Historial completo', 'Recomendaciones'], suggestedPrompts: ['¿Qué expedientes tienen riesgo de caducidad?', 'Analiza el Office Action más reciente', '¿Cuántos vencimientos hay este trimestre?'] },
  { id: 'draft', name: 'Draft', ini: 'DR', role: 'Documentos', c: '#F59E0B', bg: 'linear-gradient(135deg,#B45309,#DC2626)', tasks: 28, active: false, agentType: 'document', desc: 'Genera documentos legales con evaluación automática de calidad. Sonnet + Haiku en loop.', caps: ['Respuestas a OA', 'Escritos de oposición', 'Contratos de licencia', 'Cartas C&D'], suggestedPrompts: ['Redacta una respuesta a un Office Action', 'Genera un NDA para licencia de marca', 'Revisa este contrato de cesión'] },
  { id: 'scout', name: 'Scout', ini: 'SC', role: 'Inteligencia', c: '#10B981', bg: 'linear-gradient(135deg,#065F46,#059669)', tasks: 17, active: true, agentType: 'competitor', desc: 'Monitoriza el mercado y analiza similitud de marcas. Mapea cobertura territorial.', caps: ['Análisis de similitud', 'Vigilancia competidores', 'Detección infracciones', 'Mapas de cobertura'], suggestedPrompts: ['¿Hay marcas similares a la mía en Europa?', 'Analiza el portfolio de un competidor', '¿Qué infracciones detectaste esta semana?'] },
  { id: 'iris', name: 'Iris', ini: 'IR', role: 'Comunicaciones', c: '#6366F1', bg: 'linear-gradient(135deg,#3730A3,#4F46E5)', tasks: 34, active: false, agentType: 'communication', desc: 'Redacta comunicaciones en el estilo de cada abogado. Aprende con el uso.', caps: ['Emails en tu estilo', 'Instrucciones a agentes', 'Traducciones PI', 'Propuestas comerciales'], suggestedPrompts: ['Escribe un email al cliente sobre su marca', 'Traduce este OA de alemán con terminología PI', 'Propuesta de servicios para nuevo cliente'] },
  { id: 'sage', name: 'Sage', ini: 'SG', role: 'Cartera', c: '#14B8A6', bg: 'linear-gradient(135deg,#0F766E,#0D9488)', tasks: 12, active: false, agentType: 'portfolio', desc: 'Estratega de cartera PI. Maximiza el valor e identifica oportunidades de licencia.', caps: ['Valoración de activos', 'Gaps de cobertura', 'Estrategia de licencias', 'Due diligence'], suggestedPrompts: ['¿Cuál es el valor de mi portfolio actual?', '¿Dónde tengo gaps de cobertura geográfica?', 'Identifica marcas candidatas para licenciar'] },
]

// ─── System prompts por agente ─────────────────────────────
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  lex: `Eres Lex, especialista en jurisdicciones de propiedad intelectual en IP-NEXUS. Conoces en profundidad los procedimientos, plazos, tasas y jurisprudencia de 200 oficinas PI del mundo (EUIPO, USPTO, OEPM, WIPO, CNIPA y más). Respondes con precisión técnica pero de forma clara. NUNCA menciones modelos de IA ni que eres un sistema automatizado. Eres Lex, el experto jurisdiccional del equipo.`,
  archie: `Eres Archie, analista experto de expedientes de propiedad intelectual en IP-NEXUS. Analizas expedientes en profundidad, detectas riesgos de caducidad, interpretas Office Actions y recomiendas acciones estratégicas. Respondes con criterio profesional. NUNCA menciones modelos de IA ni que eres un sistema automatizado. Eres Archie, el analista del equipo.`,
  draft: `Eres Draft, redactor legal especializado en propiedad intelectual en IP-NEXUS. Generas documentos legales de alta calidad: respuestas a Office Actions, escritos de oposición, contratos de licencia, cartas Cease & Desist. Tu prioridad es la precisión legal y la claridad. NUNCA menciones modelos de IA. Eres Draft, el redactor del equipo.`,
  scout: `Eres Scout, especialista en inteligencia competitiva de propiedad intelectual en IP-NEXUS. Analizas similitud de marcas, monitorizas el mercado, detectas infracciones y mapeas coberturas territoriales. Eres analítico y preciso. NUNCA menciones modelos de IA. Eres Scout, el investigador del equipo.`,
  iris: `Eres Iris, especialista en comunicaciones de propiedad intelectual en IP-NEXUS. Redactas emails, cartas, propuestas y traducciones especializadas adaptadas al estilo de cada despacho. Tu prioridad es la claridad, el tono profesional y la precisión terminológica en PI. NUNCA menciones modelos de IA. Eres Iris, la especialista en comunicaciones.`,
  sage: `Eres Sage, estratega de cartera de propiedad intelectual en IP-NEXUS. Analizas el valor de activos PI, identificas gaps de cobertura geográfica, evalúas oportunidades de licencia y apoyas en due diligence de carteras. Piensas en términos de ROI y estrategia empresarial. NUNCA menciones modelos de IA. Eres Sage, el estratega del equipo.`,
}

// ─── SVG símbolos por agente ───────────────────────────────
function AgentSymbol({ agentId, color, size }: { agentId: string; color: string; size?: number }) {
  const c = color
  const style: React.CSSProperties = size
    ? { position: 'relative' as const, width: size, height: size }
    : { position: 'absolute' as const, inset: 0 }
  const h = size || 106
  const w = size ? Math.round(size * 126 / 106) : undefined

  if (agentId === 'lex') return (
    <div style={style}>
      <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
        <g style={{ animation: 'dF1 3s ease-in-out infinite', transformOrigin: '31px 52px' }}>
          <rect x="7" y="17" width="48" height="64" rx="3" fill={c} opacity=".2" stroke={c} strokeWidth="1.4" />
          <line x1="15" y1="30" x2="47" y2="30" stroke={c} strokeWidth="1.9" opacity=".78" />
          <line x1="15" y1="39" x2="47" y2="39" stroke={c} strokeWidth="1.3" opacity=".56" />
          <line x1="15" y1="48" x2="39" y2="48" stroke={c} strokeWidth="1.1" opacity=".38" />
          <line x1="15" y1="57" x2="44" y2="57" stroke={c} strokeWidth="1" opacity=".26" />
          <line x1="15" y1="66" x2="33" y2="66" stroke={c} strokeWidth=".9" opacity=".18" />
        </g>
        <g style={{ animation: 'dF2 3.8s ease-in-out infinite', animationDelay: '-.9s', transformOrigin: '102px 48px' }}>
          <rect x="78" y="13" width="46" height="58" rx="3" fill={c} opacity=".14" stroke={c} strokeWidth="1.1" />
          <line x1="85" y1="24" x2="116" y2="24" stroke={c} strokeWidth="1.6" opacity=".62" />
          <line x1="85" y1="33" x2="116" y2="33" stroke={c} strokeWidth="1.1" opacity=".42" />
          <line x1="85" y1="42" x2="106" y2="42" stroke={c} strokeWidth=".9" opacity=".3" />
        </g>
        <g style={{ animation: 'dF3 3.4s ease-in-out infinite', animationDelay: '-1.6s', transformOrigin: '63px 86px' }}>
          <rect x="40" y="74" width="46" height="28" rx="2.5" fill={c} opacity=".1" stroke={c} strokeWidth=".9" />
          <line x1="47" y1="84" x2="78" y2="84" stroke={c} strokeWidth="1.2" opacity=".48" />
          <line x1="47" y1="92" x2="78" y2="92" stroke={c} strokeWidth=".9" opacity=".28" />
        </g>
        <g transform="translate(42,1)" style={{ animation: 'bal 3.5s ease-in-out infinite' }}>
          <line x1="21" y1="2" x2="21" y2="18" stroke={c} strokeWidth="2.4" opacity=".92" />
          <line x1="5" y1="18" x2="37" y2="18" stroke={c} strokeWidth="2.4" opacity=".92" />
          <circle cx="8" cy="28" r="7.5" fill="none" stroke={c} strokeWidth="2" opacity=".82" />
          <circle cx="34" cy="28" r="7.5" fill="none" stroke={c} strokeWidth="2" opacity=".72" />
          <line x1="5" y1="18" x2="8" y2="28" stroke={c} strokeWidth="1.4" opacity=".6" />
          <line x1="37" y1="18" x2="34" y2="28" stroke={c} strokeWidth="1.4" opacity=".6" />
        </g>
      </svg>
    </div>
  )
  if (agentId === 'archie') return (
    <div style={style}>
      <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
        <line x1="8" y1="50" x2="118" y2="50" stroke={c} strokeWidth=".8" opacity=".2" />
        <circle cx="16" cy="50" r="8" fill={c} opacity=".82" style={{ animation: 'ndp 2s ease-in-out infinite' }} />
        <circle cx="42" cy="50" r="7" fill={c} opacity=".58" style={{ animation: 'ndp 2s ease-in-out infinite', animationDelay: '-.4s' }} />
        <circle cx="74" cy="50" r="9.5" fill={c} opacity=".96" style={{ animation: 'ndp 2s ease-in-out infinite', animationDelay: '-.8s' }} />
        <circle cx="108" cy="50" r="6" fill={c} opacity=".36" style={{ animation: 'ndp 2s ease-in-out infinite', animationDelay: '-1.2s' }} />
        <rect x="64" y="66" width="20" height="32" rx="2.5" fill={c} opacity=".28" stroke={c} strokeWidth="1.2" />
        <text x="74" y="84" fontSize="10" fill={c} opacity=".95" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="800">⚠</text>
        <text x="74" y="93" fontSize="7" fill={c} opacity=".72" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700">OA</text>
        <line x1="74" y1="12" x2="74" y2="40" stroke={c} strokeWidth="1.1" opacity=".56" strokeDasharray="3 2.5" />
        <rect x="58" y="5" width="32" height="11" rx="2.5" fill={c} opacity=".26" stroke={c} strokeWidth="1" />
        <text x="74" y="13.5" fontSize="6.5" fill={c} opacity=".92" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700">URGENTE</text>
        <rect x="6" y="66" width="26" height="30" rx="2.5" fill={c} opacity=".12" stroke={c} strokeWidth=".9" />
        <text x="19" y="84" fontSize="9" fill={c} opacity=".62" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="600">TM</text>
        <rect x="92" y="66" width="26" height="30" rx="2.5" fill={c} opacity=".1" stroke={c} strokeWidth=".8" />
        <text x="105" y="84" fontSize="9" fill={c} opacity=".42" textAnchor="middle" fontFamily="Inter,sans-serif">PAT</text>
      </svg>
    </div>
  )
  if (agentId === 'draft') return (
    <div style={style}>
      <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
        <rect x="6" y="5" width="114" height="92" rx="5" fill={c} opacity=".07" stroke={c} strokeWidth="1" />
        <text x="13" y="22" fontSize="10" fill={c} opacity=".9" fontFamily="monospace" fontWeight="600">Art. 8(1)(b) RMUE</text>
        <text x="13" y="36" fontSize="9" fill={c} opacity=".7" fontFamily="monospace">La marca solicitada</text>
        <text x="13" y="49" fontSize="9" fill={c} opacity=".48" fontFamily="monospace">presenta similitud</text>
        <text x="13" y="62" fontSize="9" fill={c} opacity=".28" fontFamily="monospace">conceptual con la</text>
        <text x="13" y="75" fontSize="9" fill={c} opacity=".14" fontFamily="monospace">marca anterior reg.</text>
        <rect x="12" y="78" width="2.5" height="11" rx="1.2" fill={c} opacity=".96" style={{ animation: 'cur 1.1s ease-in-out infinite' }} />
        <text x="13" y="97" fontSize="6.5" fill={c} opacity=".3" fontFamily="monospace">score: 0.82 ✓</text>
      </svg>
    </div>
  )
  if (agentId === 'scout') return (
    <div style={style}>
      <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
        <circle cx="63" cy="56" r="44" stroke={c} strokeWidth=".6" opacity=".1" />
        <circle cx="63" cy="56" r="30" stroke={c} strokeWidth=".8" opacity=".17" />
        <circle cx="63" cy="56" r="16" stroke={c} strokeWidth="1.1" opacity=".3" />
        <circle cx="63" cy="56" r="5" fill={c} opacity=".96" />
        <circle cx="63" cy="56" r="5" fill="none" stroke={c} strokeWidth="1.2">
          <animate attributeName="r" from="5" to="44" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from=".85" to="0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <g style={{ transformOrigin: '63px 56px', animation: 'spn 3.5s linear infinite' }}>
          <line x1="63" y1="56" x2="63" y2="12" stroke={c} strokeWidth="3" opacity=".72" strokeLinecap="round" />
          <line x1="63" y1="56" x2="97" y2="90" stroke={c} strokeWidth="1" opacity=".2" />
        </g>
        <circle cx="31" cy="24" r="5.5" fill={c} opacity=".72" />
        <circle cx="31" cy="24" r="5.5" fill="none" stroke={c} strokeWidth="1.3">
          <animate attributeName="r" from="5.5" to="17" dur="2.2s" begin=".6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from=".65" to="0" dur="2.2s" begin=".6s" repeatCount="indefinite" />
        </circle>
        <circle cx="97" cy="32" r="4.5" fill={c} opacity=".56" />
        <circle cx="85" cy="86" r="3.5" fill={c} opacity=".38" />
      </svg>
    </div>
  )
  if (agentId === 'iris') return (
    <div style={style}>
      <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
        <circle cx="63" cy="54" r="5.5" fill={c} opacity=".96" />
        {[0, -0.55, -1.1, -1.65].map((d, i) => (
          <circle key={i} cx="63" cy="54" r="5.5" fill="none" stroke={c} strokeWidth={2.6 - i * 0.5} opacity={0.9 - i * 0.25}
            style={{ animation: 'wv 2.2s ease-out infinite', animationDelay: `${d}s` }} />
        ))}
        {[['ES', '6', '24', '.9'], ['EN', '6', '48', '.56'], ['FR', '6', '72', '.28']].map(([t, x, y, o]) => (
          <text key={t} x={x} y={y} fontSize="16" fill={c} opacity={o} fontFamily="Inter,sans-serif" fontWeight="700">{t}</text>
        ))}
        {[['DE', '98', '24', '.74'], ['JP', '98', '48', '.44'], ['ZH', '98', '72', '.2']].map(([t, x, y, o]) => (
          <text key={t} x={x} y={y} fontSize="16" fill={c} opacity={o} fontFamily="Inter,sans-serif">{t}</text>
        ))}
        <line x1="28" y1="18" x2="54" y2="48" stroke={c} strokeWidth="1" opacity=".3" strokeDasharray="3 2.5" />
        <line x1="96" y1="18" x2="74" y2="48" stroke={c} strokeWidth="1" opacity=".26" strokeDasharray="3 2.5" />
        <rect x="6" y="80" width="50" height="20" rx="3.5" fill={c} opacity=".1" stroke={c} strokeWidth=".8" />
        <text x="31" y="92.5" fontSize="8" fill={c} opacity=".55" textAnchor="middle" fontFamily="Inter,sans-serif">@despacho.es</text>
      </svg>
    </div>
  )
  if (agentId === 'sage') {
    const hs = [16, 26, 20, 46, 34, 58, 42, 52, 36, 60]
    return (
      <div style={style}>
        <svg width={w || '100%'} height={h} viewBox="0 0 126 106" fill="none">
          {hs.map((hh, i) => (
            <rect key={i} x={8 + i * 11.5} y={96 - hh} width="8" height={hh} rx="2" fill={c} opacity={0.2 + (hh / 60) * 0.7}
              style={{ animation: `bp ${1.5 + i * 0.2}s ease-in-out infinite`, animationDelay: `${-i * 0.3}s` }} />
          ))}
          <line x1="8" y1="38" x2="118" y2="18" stroke={c} strokeWidth="1.5" opacity=".6" strokeDasharray="5 3" />
          <circle cx="118" cy="18" r="4" fill={c} opacity=".9" />
          <text x="100" y="14" fontSize="11" fill={c} opacity=".85" fontFamily="Inter,sans-serif" fontWeight="800">+18%</text>
        </svg>
      </div>
    )
  }
  return null
}

// ─── Types ─────────────────────────────────────────────────
interface AgentData {
  id: string; name: string; ini: string; role: string;
  c: string; bg: string; tasks: number; active: boolean;
  agentType: string; desc: string; caps: string[];
  suggestedPrompts: string[];
}

interface AgentStats {
  agent_type: string; calls_count: number;
  success_count: number; avg_latency_ms: number;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

// ─── useAgentChat hook ─────────────────────────────────────
function useAgentChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (text: string, agentId: string) => {
    const userMsg: ChatMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('genius-chat', {
        body: {
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          agent_type: agentId as any,
          context: { agent_id: agentId, source: 'agent_ops' },
          stream: false,
          system_prompt: AGENT_SYSTEM_PROMPTS[agentId],
        },
      })

      if (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.' }])
      } else {
        const content = data?.choices?.[0]?.message?.content || data?.content || data?.message || 'Sin respuesta.'
        setMessages(prev => [...prev, { role: 'assistant', content }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Verifica tu sesión e inténtalo de nuevo.' }])
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setIsLoading(false)
  }, [])

  return { messages, isLoading, sendMessage, clearChat }
}

// ─── AgentWorkspace ────────────────────────────────────────
function AgentWorkspace({
  agent, messages, isLoading, onSend, onClose,
}: {
  agent: AgentData; messages: ChatMsg[]; isLoading: boolean;
  onSend: (text: string) => void; onClose: () => void;
}) {
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    const t = input.trim()
    if (!t || isLoading) return
    setInput('')
    onSend(t)
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      display: 'flex', borderRadius: 18, overflow: 'hidden',
      border: '1px solid #E2E8F0', animation: 'wsIn .3s ease-out',
      height: 480,
    }}>
      {/* LEFT — Agent profile */}
      <div style={{
        width: '38%', background: '#060C18', padding: 24,
        borderRight: '1px solid #1A2E4A', display: 'flex', flexDirection: 'column',
        alignItems: 'center', color: '#E2E8F0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', width: 86, height: 72, marginBottom: 16 }}>
          <AgentSymbol agentId={agent.id} color={agent.c} size={72} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{agent.name}</div>
        <div style={{
          fontSize: 10, fontWeight: 600, color: agent.c,
          background: `${agent.c}22`, padding: '3px 12px', borderRadius: 20, marginBottom: 16,
        }}>{agent.role}</div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, width: '100%', justifyContent: 'center' }}>
          {[
            { v: agent.tasks, l: 'tareas', c: agent.c },
            { v: '98%', l: 'éxito', c: '#22C55E' },
            { v: '<2s', l: 'latencia', c: '#F59E0B' },
          ].map(({ v, l, c: kc }) => (
            <div key={l} style={{
              background: '#0A1628', borderRadius: 10, padding: '8px 10px',
              textAlign: 'center', flex: 1,
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: kc }}>{v}</div>
              <div style={{ fontSize: 8, color: '#475569' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 8, alignSelf: 'flex-start' }}>Capacidades</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {agent.caps.map((cap, i) => (
            <div key={i} style={{
              fontSize: 10, padding: '4px 10px', borderRadius: 20,
              background: `${agent.c}18`, color: agent.c,
              border: `1px solid ${agent.c}33`,
            }}>{cap}</div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.6, marginTop: 'auto' }}>
          {agent.desc}
        </div>
      </div>

      {/* RIGHT — Chat */}
      <div style={{
        flex: 1, background: '#F8FAFC', display: 'flex', flexDirection: 'column',
      }}>
        {/* Chat header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: agent.c,
              animation: 'pls 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
              Conectado con {agent.name}
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 24, height: 24, borderRadius: '50%', border: '1px solid #E2E8F0',
            background: '#fff', cursor: 'pointer', fontSize: 11, color: '#94A3B8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isEmpty && !isLoading ? (
            <div style={{ textAlign: 'center', paddingTop: 32 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: agent.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 auto 12px',
              }}>{agent.ini}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                Hola, soy {agent.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>
                {agent.desc}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400, margin: '0 auto' }}>
                {agent.suggestedPrompts.map((p, i) => (
                  <button key={i} onClick={() => onSend(p)} style={{
                    padding: '10px 12px', borderRadius: 10, border: `1px solid ${agent.c}4D`,
                    background: '#fff', cursor: 'pointer', textAlign: 'left',
                    fontSize: 11, color: agent.c, fontFamily: 'inherit',
                    transition: 'background .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${agent.c}14`)}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >{p}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: agent.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0, marginRight: 8, marginTop: 2,
                    }}>{agent.ini}</div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                    ...(msg.role === 'user' ? {
                      background: `${agent.c}22`, border: `1px solid ${agent.c}40`,
                      borderRadius: '12px 12px 4px 12px', color: '#1E293B',
                    } : {
                      background: '#fff', border: '1px solid #E2E8F0',
                      borderRadius: '12px 12px 12px 4px', color: '#1E293B',
                    }),
                  }}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: agent.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>{agent.ini}</div>
                  <div style={{
                    background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px 12px 12px 4px',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: agent.c,
                        animation: `dotBounce 1.4s ease-in-out infinite`,
                        animationDelay: `${d}s`,
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                      {agent.name} está pensando...
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{
          borderTop: '1px solid #E2E8F0', padding: '12px 16px',
          display: 'flex', gap: 8,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Pregunta a ${agent.name}…`}
            disabled={isLoading}
            style={{
              flex: 1, border: '1px solid #E2E8F0', borderRadius: 10,
              padding: '10px 14px', fontSize: 13, outline: 'none',
              fontFamily: 'inherit', background: '#fff', color: '#1E293B',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: input.trim() && !isLoading ? agent.c : '#E2E8F0',
              color: input.trim() && !isLoading ? '#fff' : '#94A3B8',
              fontSize: 12, fontWeight: 700, cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background .2s',
            }}
          >Enviar</button>
        </div>
      </div>
    </div>
  )
}

// ─── AgentCard ─────────────────────────────────────────────
function AgentCard({
  agent, tasks, active, delay, selected, anySelected, onClick,
}: {
  agent: AgentData; tasks: number; active: boolean;
  delay: number; selected: boolean; anySelected: boolean; onClick: () => void;
}) {
  const [sparks, setSparks] = useState(
    Array.from({ length: 7 }, () => active ? Math.floor(Math.random() * 12) + 3 : 2)
  )
  useEffect(() => {
    const t = setInterval(() => {
      setSparks(Array.from({ length: 7 }, () =>
        active ? Math.floor(Math.random() * 13) + 3 : Math.floor(Math.random() * 4) + 1
      ))
    }, 500)
    return () => clearInterval(t)
  }, [active])

  return (
    <div
      onClick={onClick}
      style={{
        background: '#07112A',
        border: `${selected ? '2px' : '1.5px'} solid ${selected ? agent.c : active ? agent.c : '#0D1C35'}`,
        borderRadius: 14,
        padding: 0,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        animation: `land .7s cubic-bezier(.22,1,.36,1) ${delay}s backwards`,
        transition: 'border-color .3s, box-shadow .3s, transform .3s, opacity .3s',
        boxShadow: selected ? `0 0 32px -4px ${agent.c}55` : active ? `0 0 28px -6px ${agent.c}33` : 'none',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        opacity: anySelected && !selected ? 0.65 : 1,
        zIndex: selected ? 10 : 1,
      }}
      onMouseEnter={e => { if (!active && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = agent.c }}
      onMouseLeave={e => { if (!active && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = '#0D1C35' }}
    >
      {/* Top glow */}
      {(active || selected) && (
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: `linear-gradient(90deg,transparent,${agent.c},transparent)`,
        }} />
      )}
      {/* Ring pulse */}
      {active && (
        <div style={{ position: 'absolute', top: -30, right: -30, width: 60, height: 60 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%', background: agent.c,
            position: 'absolute', top: 24, left: 24, animation: 'ro1 2.2s ease-out infinite',
          }} />
          <div style={{
            width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${agent.c}`,
            position: 'absolute', top: 25, left: 25, animation: 'ro2 2.2s ease-out infinite .6s',
          }} />
        </div>
      )}
      {/* Workspace — símbolo grande */}
      <div style={{ position: 'relative', height: 106, overflow: 'hidden' }}>
        <AgentSymbol agentId={agent.id} color={agent.c} />
        {/* Avatar badge pequeño bottom-right */}
        <div style={{
          position: 'absolute', bottom: 6, right: 8, zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: agent.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.5px',
            border: `2px solid ${active || selected ? agent.c : '#0D1C35'}`,
            boxShadow: active || selected ? `0 0 10px ${agent.c}44` : 'none',
            position: 'relative',
          }}>
            {agent.ini}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 7, height: 7, borderRadius: '50%',
              background: active ? '#22C55E' : '#334155',
              border: '1.5px solid #07112A',
            }} />
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        padding: '8px 12px 10px', borderTop: `1px solid ${active ? agent.c + '22' : '#0D1C3522'}`,
        background: '#050D1E',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 1 }}>{agent.name}</div>
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>{agent.role}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: active ? '#22C55E' : '#334155',
            animation: active ? 'pls 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 9, color: active ? '#22C55E' : '#475569', fontWeight: 600 }}>
            {active ? 'Activo' : 'En espera'}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: active ? agent.c : '#1E293B' }}>{tasks}</div>
        <div style={{ fontSize: 9, color: '#475569', marginBottom: 6 }}>tareas hoy</div>
        <div style={{ display: 'flex', gap: 2, height: 16, alignItems: 'flex-end' }}>
          {sparks.map((h, i) => (
            <div key={i} style={{
              width: 4, height: h, borderRadius: 2,
              background: active ? agent.c : '#172840',
              opacity: active ? 0.7 : 0.3,
              transition: 'height .4s ease, background .3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ───────────────────────────────────
export function AgentStudio() {
  const [agents, setAgents] = useState<AgentData[]>(
    AGENTS_DATA.map(a => ({ ...a }))
  )
  const [nexusTasks, setNexusTasks] = useState(89)
  const [totalTasks, setTotalTasks] = useState(284)
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null)
  const labRef = useRef<HTMLDivElement>(null)
  const nexusRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  const { messages, isLoading, sendMessage, clearChat } = useAgentChat()

  // Cargar stats reales
  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('genius_agent_performance')
        .select('*').eq('period_date', today)
      if (data && data.length > 0) {
        const map: Record<string, AgentStats> = {}
        data.forEach((s: any) => { map[s.agent_type] = s })
        setAgents(prev => prev.map(a => {
          const s = map[a.agentType]
          return s ? { ...a, tasks: s.calls_count } : a
        }))
      }
    }
    load()
    const ch = supabase.channel('studio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'genius_workflow_runs' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Dibujar conexiones SVG
  const drawConns = useCallback(() => {
    const svg = svgRef.current
    const lab = labRef.current
    const nc = nexusRef.current
    const row = rowRef.current
    if (!svg || !lab || !nc || !row) return
    const lb = lab.getBoundingClientRect()
    const nb = nc.getBoundingClientRect()
    const nx = nb.left + nb.width / 2 - lb.left
    const ny = nb.bottom - lb.top
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    agents.forEach((a, i) => {
      if (!a.active && selectedAgent?.id !== a.id) return
      const cr = (row.children[i] as HTMLElement)?.getBoundingClientRect()
      if (!cr) return
      const cx = cr.left + cr.width / 2 - lb.left
      const cy = cr.top - lb.top
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      g.id = `g${i}`; g.setAttribute('gradientUnits', 'userSpaceOnUse')
      g.setAttribute('x1', String(nx)); g.setAttribute('y1', String(ny))
      g.setAttribute('x2', String(cx)); g.setAttribute('y2', String(cy))
      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#3B82F6')
      const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', a.c)
      g.appendChild(s1); g.appendChild(s2); defs.appendChild(g)
    })
    svg.appendChild(defs)

    agents.forEach((a, i) => {
      const cr = (row.children[i] as HTMLElement)?.getBoundingClientRect()
      if (!cr) return
      const cx = cr.left + cr.width / 2 - lb.left
      const cy = cr.top - lb.top

      const isSelected = selectedAgent?.id === a.id
      const isActive = a.active || isSelected

      if (isActive) {
        const motionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        motionPath.setAttribute('id', `path${i}`)
        motionPath.setAttribute('d', `M ${nx} ${ny} L ${cx} ${cy}`)
        motionPath.setAttribute('fill', 'none')
        motionPath.setAttribute('stroke', 'none')
        svg.appendChild(motionPath)

        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        ln.setAttribute('x1', String(nx)); ln.setAttribute('y1', String(ny))
        ln.setAttribute('x2', String(cx)); ln.setAttribute('y2', String(cy))
        ln.setAttribute('stroke', `url(#g${i})`); ln.setAttribute('stroke-width', isSelected ? '3' : '2.5')
        ln.setAttribute('stroke-dasharray', isSelected ? '12 6' : '9 5'); ln.setAttribute('opacity', '1')
        ln.style.animation = `cf ${isSelected ? '2s' : '1.1s'} linear infinite`
        svg.appendChild(ln)

        const d1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        d1.setAttribute('cx', String(nx)); d1.setAttribute('cy', String(ny))
        d1.setAttribute('r', '5'); d1.setAttribute('fill', '#3B82F6'); d1.setAttribute('opacity', '.8')
        svg.appendChild(d1)
        const d2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        d2.setAttribute('cx', String(cx)); d2.setAttribute('cy', String(cy))
        d2.setAttribute('r', '5'); d2.setAttribute('fill', a.c); d2.setAttribute('opacity', '.9')
        svg.appendChild(d2)

        const pg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        pg.setAttribute('cx', String(cx)); pg.setAttribute('cy', String(cy))
        pg.setAttribute('fill', 'none'); pg.setAttribute('stroke', a.c); pg.setAttribute('stroke-width', '1.8')
        const anR = document.createElementNS('http://www.w3.org/2000/svg', 'animate')
        anR.setAttribute('attributeName', 'r'); anR.setAttribute('from', '5'); anR.setAttribute('to', '18')
        anR.setAttribute('dur', '1.8s'); anR.setAttribute('repeatCount', 'indefinite')
        const anO = document.createElementNS('http://www.w3.org/2000/svg', 'animate')
        anO.setAttribute('attributeName', 'opacity'); anO.setAttribute('from', '.7'); anO.setAttribute('to', '0')
        anO.setAttribute('dur', '1.8s'); anO.setAttribute('repeatCount', 'indefinite')
        pg.appendChild(anR); pg.appendChild(anO)
        svg.appendChild(pg)

        // Traveler dot 1
        const traveler = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        traveler.setAttribute('r', '4')
        traveler.setAttribute('fill', a.c)
        traveler.setAttribute('opacity', '0.9')
        const am1 = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        am1.setAttribute('dur', '1.8s')
        am1.setAttribute('repeatCount', 'indefinite')
        am1.setAttribute('calcMode', 'linear')
        const mp1 = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mp1.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#path${i}`)
        mp1.setAttribute('href', `#path${i}`)
        am1.appendChild(mp1)
        traveler.appendChild(am1)
        svg.appendChild(traveler)

        // Traveler dot 2
        const traveler2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        traveler2.setAttribute('r', '3')
        traveler2.setAttribute('fill', a.c)
        traveler2.setAttribute('opacity', '0.45')
        const am2 = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        am2.setAttribute('dur', '1.8s')
        am2.setAttribute('repeatCount', 'indefinite')
        am2.setAttribute('calcMode', 'linear')
        am2.setAttribute('begin', '-0.9s')
        const mp2 = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mp2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#path${i}`)
        mp2.setAttribute('href', `#path${i}`)
        am2.appendChild(mp2)
        traveler2.appendChild(am2)
        svg.appendChild(traveler2)

        // If selected, add reverse traveler (user→agent)
        if (isSelected) {
          const revPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          revPath.setAttribute('id', `rpath${i}`)
          revPath.setAttribute('d', `M ${cx} ${cy} L ${nx} ${ny}`)
          revPath.setAttribute('fill', 'none'); revPath.setAttribute('stroke', 'none')
          svg.appendChild(revPath)

          const revTraveler = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          revTraveler.setAttribute('r', '3')
          revTraveler.setAttribute('fill', '#93C5FD')
          revTraveler.setAttribute('opacity', '0.7')
          const ram = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
          ram.setAttribute('dur', '2.2s')
          ram.setAttribute('repeatCount', 'indefinite')
          ram.setAttribute('calcMode', 'linear')
          const rmp = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
          rmp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#rpath${i}`)
          rmp.setAttribute('href', `#rpath${i}`)
          ram.appendChild(rmp)
          revTraveler.appendChild(ram)
          svg.appendChild(revTraveler)
        }
      } else {
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        ln.setAttribute('x1', String(nx)); ln.setAttribute('y1', String(ny))
        ln.setAttribute('x2', String(cx)); ln.setAttribute('y2', String(cy))
        ln.setAttribute('stroke', '#172840'); ln.setAttribute('stroke-width', '.8')
        ln.setAttribute('stroke-dasharray', '4 4'); ln.setAttribute('opacity', '.22')
        svg.appendChild(ln)
        const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        d.setAttribute('cx', String(cx)); d.setAttribute('cy', String(cy))
        d.setAttribute('r', '2.5'); d.setAttribute('fill', '#172840'); d.setAttribute('opacity', '.28')
        svg.appendChild(d)
      }
    })
  }, [agents, selectedAgent])

  useEffect(() => {
    const t = setTimeout(drawConns, 350)
    window.addEventListener('resize', drawConns)
    return () => { clearTimeout(t); window.removeEventListener('resize', drawConns) }
  }, [drawConns])

  // Contadores live
  useEffect(() => {
    const t = setInterval(() => {
      setAgents(prev => prev.map(a => {
        if (!a.active || Math.random() > 0.55) return a
        return { ...a, tasks: a.tasks + 1 }
      }))
      setTotalTasks(n => n + 1)
      setNexusTasks(n => n + 1)
    }, 2600)
    return () => clearInterval(t)
  }, [])

  // Toggle de agentes para demo
  useEffect(() => {
    const t = setInterval(() => {
      setAgents(prev => {
        const idle = prev.filter(a => !a.active)
        if (!idle.length || Math.random() > 0.62) return prev
        const pick = idle[Math.floor(Math.random() * idle.length)]
        setTimeout(() => {
          setAgents(p => p.map(a => a.id === pick.id ? { ...a, active: false } : a))
        }, 5500 + Math.random() * 4000)
        return prev.map(a => a.id === pick.id ? { ...a, active: true } : a)
      })
    }, 3800)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        background: '#F8FAFC', minHeight: '100%', padding: '24px',
        fontFamily: "'Inter','SF Pro Display',sans-serif",
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', marginBottom: 4, margin: 0 }}>Agent Ops</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Operations Room · 7 agentes de IA especializados en propiedad intelectual</p>
        </div>

        {/* Dark panel */}
        <div ref={labRef} style={{
          position: 'relative', background: '#060C18', borderRadius: 22,
          padding: '22px 18px 18px', color: '#E2E8F0',
        }}>
          {/* Fondo grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04, borderRadius: 22, overflow: 'hidden',
            backgroundImage: 'linear-gradient(#3B82F6 1px,transparent 1px),linear-gradient(90deg,#3B82F6 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div style={{
            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(59,130,246,.06) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Stats bar */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            marginBottom: 16, position: 'relative', zIndex: 1,
            animation: 'sUp .5s ease-out backwards',
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#3B82F6' }}>{totalTasks}</span>
                <span style={{ fontSize: 10, color: '#475569', display: 'block' }}>tareas hoy</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#22C55E' }}>98%</span>
                <span style={{ fontSize: 10, color: '#475569', display: 'block' }}>éxito</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, background: '#0F1D32',
                borderRadius: 20, padding: '5px 12px', border: '1px solid #172840',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
                  animation: 'pls 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E' }}>VIVO</span>
              </div>
            </div>
          </div>

          {/* Nexus líder */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0, position: 'relative', zIndex: 2 }}>
            <div ref={nexusRef} style={{
              background: '#07112A', border: '2px solid #3B82F6', borderRadius: 17,
              padding: '16px 20px 12px', textAlign: 'center', cursor: 'pointer',
              position: 'relative', overflow: 'hidden', width: 190,
              animation: 'ng 3s ease-in-out infinite,land .7s cubic-bezier(.22,1,.36,1) backwards',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                background: 'linear-gradient(90deg,transparent,#3B82F6,transparent)',
              }} />
              <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 8px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1D4ED8,#6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: '#fff',
                  animation: 'bth 3s ease-in-out infinite',
                }}>
                  NX
                </div>
                {['-3px', '-8px'].map((inset, i) => (
                  <div key={i} style={{
                    position: 'absolute', inset, borderRadius: '50%',
                    border: '1.5px solid #3B82F6',
                    animation: `ro${i + 1} 2.5s ease-out infinite ${i * 0.5}s`,
                    pointerEvents: 'none',
                  }} />
                ))}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                  borderRadius: '50%', background: '#22C55E', border: '2px solid #07112A',
                }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#E2E8F0', marginBottom: 1 }}>Nexus</div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>Orquestador Principal</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#22C55E',
                  animation: 'pls 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 9, color: '#22C55E', fontWeight: 600 }}>Coordinando</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[
                  { v: nexusTasks, l: 'tareas', c: undefined },
                  { v: 7, l: 'agentes', c: undefined },
                  { v: '100%', l: 'uptime', c: '#22C55E' },
                ].map(({ v, l, c }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c || '#3B82F6' }}>{v}</div>
                    <div style={{ fontSize: 8, color: '#475569' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de 6 agentes */}
          <div ref={rowRef} style={{
            display: 'grid', gridTemplateColumns: 'repeat(6,1fr)',
            gap: 14, marginTop: 48, position: 'relative', zIndex: 2,
          }}>
            {agents.map((a, i) => (
              <AgentCard
                key={a.id}
                agent={a}
                tasks={a.tasks}
                active={a.active}
                delay={0.1 + i * 0.08}
                selected={selectedAgent?.id === a.id}
                anySelected={selectedAgent !== null}
                onClick={() => {
                  if (selectedAgent?.id === a.id) {
                    setSelectedAgent(null)
                    clearChat()
                  } else {
                    setSelectedAgent(a)
                    clearChat()
                  }
                }}
              />
            ))}
          </div>

          {/* SVG Conexiones */}
          <svg ref={svgRef} style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 1,
          }}>
            <defs />
          </svg>
        </div>{/* end dark panel */}

        {/* Workspace panel — below dark panel */}
        {selectedAgent && selectedAgent.id !== 'nexus' && (
          <div ref={workspaceRef} style={{ marginTop: 16 }}>
            <AgentWorkspace
              agent={selectedAgent}
              messages={messages}
              isLoading={isLoading}
              onSend={(text) => sendMessage(text, selectedAgent.id)}
              onClose={() => { setSelectedAgent(null); clearChat() }}
            />
          </div>
        )}
      </div>{/* end light wrapper */}
    </>
  )
}

export default AgentStudio
