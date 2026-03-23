import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'

const AGENTS = [
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Orquestador',
    specialty: 'Coordina todos los agentes y descompone objetivos complejos en tareas accionables.',
    color: '#3B82F6',
    colorDark: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    initials: 'NX',
    agentType: 'orchestrator',
    demoTasks: 89,
    capabilities: [
      'Interpretar objetivos del usuario',
      'Crear planes de ejecución multi-paso',
      'Coordinar sub-agentes en paralelo',
      'Sintetizar resultados finales',
    ],
  },
  {
    id: 'lex',
    name: 'Lex',
    role: 'Experto jurisdiccional',
    specialty: 'Conocimiento profundo de procedimientos, plazos y tasas en 200 oficinas PI del mundo.',
    color: '#8B5CF6',
    colorDark: '#6D28D9',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    initials: 'LX',
    agentType: 'jurisdiction',
    demoTasks: 43,
    capabilities: [
      'Procedimientos EUIPO, USPTO, OEPM, WIPO',
      'Plazos y tasas actualizados',
      'Jurisprudencia por jurisdicción',
      'Estrategia internacional',
    ],
  },
  {
    id: 'archie',
    name: 'Archie',
    role: 'Analista de expedientes',
    specialty: 'Analiza en profundidad cada expediente, identifica riesgos y recomienda acciones.',
    color: '#0EA5E9',
    colorDark: '#0284C7',
    gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    initials: 'AR',
    agentType: 'dossier',
    demoTasks: 61,
    capabilities: [
      'Análisis de Office Actions',
      'Detección de riesgos de caducidad',
      'Historial completo del expediente',
      'Recomendaciones estratégicas',
    ],
  },
  {
    id: 'draft',
    name: 'Draft',
    role: 'Redactor legal',
    specialty: 'Genera documentos legales PI con evaluación automática de calidad antes de presentar.',
    color: '#F59E0B',
    colorDark: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    initials: 'DR',
    agentType: 'document',
    demoTasks: 28,
    capabilities: [
      'Respuestas a Office Actions',
      'Escritos de oposición',
      'Contratos de licencia y cesión',
      'Cartas Cease & Desist',
    ],
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Inteligencia competitiva',
    specialty: 'Monitoriza el mercado, analiza amenazas y encuentra oportunidades de protección.',
    color: '#10B981',
    colorDark: '#059669',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    initials: 'SC',
    agentType: 'competitor',
    demoTasks: 17,
    capabilities: [
      'Análisis de similitud de marcas',
      'Vigilancia de competidores',
      'Detección de infracciones',
      'Mapas de cobertura territorial',
    ],
  },
  {
    id: 'iris',
    name: 'Iris',
    role: 'Comunicaciones',
    specialty: 'Redacta emails, cartas y traducciones adaptados al estilo de cada abogado.',
    color: '#6366F1',
    colorDark: '#4F46E5',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    initials: 'IR',
    agentType: 'communication',
    demoTasks: 34,
    capabilities: [
      'Emails al cliente en tu estilo',
      'Instrucciones a agentes locales',
      'Traducciones especializadas PI',
      'Propuestas de nuevos servicios',
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Estratega de cartera',
    specialty: 'Analiza el valor PI, identifica gaps de cobertura y maximiza el ROI de la cartera.',
    color: '#14B8A6',
    colorDark: '#0D9488',
    gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)',
    initials: 'SG',
    agentType: 'portfolio',
    demoTasks: 12,
    capabilities: [
      'Valoración de activos PI',
      'Gaps de cobertura geográfica',
      'Estrategia de licencias',
      'Due diligence de carteras',
    ],
  },
]

interface AgentStats {
  agent_type: string
  calls_count: number
  success_count: number
  avg_latency_ms: number
  total_cost_eur: number
}

interface ActiveWorkflow {
  id: string
  workflow_type: string
  status: string
  goal_text: string
  current_step: number
  total_steps: number
}

type AgentDef = typeof AGENTS[0]

export function AgentStudio() {
  const [stats, setStats] = useState<Record<string, AgentStats>>({})
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null)
  const [useDemoData, setUseDemoData] = useState(true)
  const [totalTasks, setTotalTasks] = useState(284)
  const breathRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await (supabase as any)
        .from('genius_agent_performance')
        .select('*')
        .eq('period_date', today)

      if (data && data.length > 0) {
        const map: Record<string, AgentStats> = {}
        data.forEach((s: AgentStats) => { map[s.agent_type] = s })
        setStats(map)
        setUseDemoData(false)
      }
    }

    const loadWorkflows = async () => {
      const { data } = await (supabase as any)
        .from('genius_workflow_runs')
        .select('id, workflow_type, status, goal_text, current_step, total_steps')
        .in('status', ['planning', 'running', 'approval_needed'])
        .order('started_at', { ascending: false })
        .limit(3)
      if (data) setActiveWorkflows(data)
    }

    loadStats()
    loadWorkflows()

    const channel = supabase
      .channel('studio-workflows')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'genius_workflow_runs',
      }, () => loadWorkflows())
      .subscribe()

    const interval = setInterval(loadStats, 30000)

    breathRef.current = setInterval(() => {
      setTotalTasks(t => t + (Math.random() > 0.7 ? 1 : 0))
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      if (breathRef.current) clearInterval(breathRef.current)
    }
  }, [])

  const getAgentTasks = (agent: AgentDef) => {
    if (!useDemoData && stats[agent.agentType]) {
      return stats[agent.agentType].calls_count
    }
    return agent.demoTasks
  }

  const getSuccessRate = (agent: AgentDef) => {
    if (!useDemoData && stats[agent.agentType]) {
      const s = stats[agent.agentType]
      if (s.calls_count === 0) return '—'
      return `${Math.round((s.success_count / s.calls_count) * 100)}%`
    }
    return '98%'
  }

  const isActive = (agent: AgentDef) => {
    return activeWorkflows.some(w =>
      w.status === 'running' && (
        w.workflow_type?.includes(agent.id) ||
        agent.id === 'nexus'
      )
    )
  }

  const CSS = `
    @keyframes studioBreath {
      0%,100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.05); opacity: 1; }
    }
    @keyframes studioRing {
      0% { transform: scale(1); opacity: 0.7; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes studioSlide {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes studioPulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .sa-card {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 18px 14px 14px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      animation: studioSlide 0.5s ease-out backwards;
      position: relative;
      overflow: hidden;
    }
    .sa-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      border-radius: 16px 16px 0 0;
      background: var(--ac);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .sa-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    }
    .sa-card:hover::before { opacity: 1; }
    .sa-card.sa-active {
      border-color: var(--ac);
      box-shadow: 0 0 20px rgba(var(--ac-rgb), 0.2);
    }
    .sa-card.sa-active::before { opacity: 1; }
    .sa-avatar {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800;
      color: white;
      margin: 0 auto 6px;
      position: relative; z-index: 1;
      font-family: Inter, sans-serif;
    }
    .sa-idle .sa-avatar {
      animation: studioBreath 4s ease-in-out infinite;
    }
    .sa-ring {
      position: absolute;
      top: -4px; left: 50%; transform: translateX(-50%);
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 2px solid var(--ac);
      pointer-events: none;
    }
    .sa-active .sa-ring {
      animation: studioRing 2s ease-out infinite;
    }
    .sa-idle .sa-ring { display: none; }
    .sa-name {
      font-size: 13px; font-weight: 700;
      color: white; margin-bottom: 2px;
      font-family: Inter, sans-serif;
    }
    .sa-role {
      font-size: 10px; color: #64748B;
      margin-bottom: 10px; line-height: 1.3;
      font-family: Inter, sans-serif;
    }
    .sa-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 600;
      padding: 3px 8px; border-radius: 20px;
      font-family: Inter, sans-serif;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .sa-badge-idle {
      background: #0F172A; color: #475569;
      border: 1px solid #334155;
    }
    .sa-badge-active {
      background: rgba(34,197,94,0.1); color: #22C55E;
      border: 1px solid rgba(34,197,94,0.2);
    }
    .sa-badge-dot {
      width: 5px; height: 5px;
      border-radius: 50%; background: currentColor;
    }
    .sa-active .sa-badge-dot {
      animation: studioPulse 1.5s ease-in-out infinite;
    }
    .sa-stat {
      margin-top: 10px; padding-top: 10px;
      border-top: 1px solid #0F172A;
    }
    .sa-stat-val {
      font-size: 18px; font-weight: 700;
      font-family: Inter, sans-serif;
    }
    .sa-stat-lbl {
      font-size: 9px; color: #475569;
      text-transform: uppercase; letter-spacing: 0.05em;
      font-family: Inter, sans-serif;
    }
    .sa-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: studioSlide 0.2s ease-out;
    }
    .sa-modal {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
      width: 420px; max-width: 90vw;
      position: relative;
    }
  `

  const workflowTypeLabels: Record<string, string> = {
    oa_response: 'Respuesta OA',
    spider_analysis: 'Análisis Spider',
    morning_briefing: 'Briefing',
    renewal: 'Renovación',
    communication: 'Comunicación',
    portfolio_report: 'Informe cartera',
  }

  const realTotal = useDemoData
    ? totalTasks
    : Object.values(stats).reduce((s, a) => s + a.calls_count, 0) || totalTasks

  const globalSuccess = useDemoData ? '98%' : (() => {
    const total = Object.values(stats).reduce((s, a) => s + a.calls_count, 0)
    const success = Object.values(stats).reduce((s, a) => s + a.success_count, 0)
    return total > 0 ? `${Math.round((success / total) * 100)}%` : '—'
  })()

  return (
    <>
      <style>{CSS}</style>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🤖</div>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 800, margin: 0,
                fontFamily: 'Inter, sans-serif', color: 'hsl(var(--foreground))',
              }}>
                El Estudio
              </h1>
              <p style={{
                fontSize: 13, margin: 0,
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'Inter, sans-serif',
              }}>
                7 agentes de IA especializados en propiedad intelectual
              </p>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={() => setUseDemoData(d => !d)}
            style={{
              background: useDemoData ? '#F1F5F9' : '#F0FDF4',
              border: `1px solid ${useDemoData ? '#E2E8F0' : '#BBF7D0'}`,
              borderRadius: 8, padding: '6px 12px',
              fontSize: 11, fontWeight: 600,
              color: useDemoData ? '#64748B' : '#166534',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            {useDemoData ? '● Demo' : '● Datos reales'}
          </button>
        </div>
      </div>

      {/* DARK STUDIO AREA */}
      <div style={{
        background: '#0F172A', borderRadius: 20, padding: 28,
        minHeight: 480,
      }}>
        {/* Studio header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: 'Tareas hoy', value: realTotal.toString(), color: 'white' },
              { label: 'Tasa de éxito', value: globalSuccess, color: '#22C55E' },
              { label: 'Agentes activos', value: activeWorkflows.length > 0 ? '2' : '0', color: '#F59E0B' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontSize: 26, fontWeight: 800, color: s.color,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 10, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {activeWorkflows.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 20, padding: '4px 12px',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
                animation: 'studioPulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                {activeWorkflows.length} workflow{activeWorkflows.length > 1 ? 's' : ''} activo{activeWorkflows.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Agents grid 4+3 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 16,
        }}>
          {AGENTS.slice(0, 4).map((agent, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              tasks={getAgentTasks(agent)}
              successRate={getSuccessRate(agent)}
              active={isActive(agent)}
              delay={i * 0.08}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, maxWidth: '75%', margin: '0 auto',
        }}>
          {AGENTS.slice(4).map((agent, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              tasks={getAgentTasks(agent)}
              successRate={getSuccessRate(agent)}
              active={isActive(agent)}
              delay={(i + 4) * 0.08}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </div>

      {/* MODAL de agente */}
      {selectedAgent && (
        <div
          className="sa-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAgent(null) }}
        >
          <div className="sa-modal">
            <button
              onClick={() => setSelectedAgent(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 'none',
                color: '#64748B', cursor: 'pointer', fontSize: 20,
                lineHeight: 1, fontFamily: 'Inter, sans-serif',
              }}
            >×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: selectedAgent.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: 'white',
                fontFamily: 'Inter, sans-serif',
              }}>
                {selectedAgent.initials}
              </div>
              <div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: 'white',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {selectedAgent.name}
                </div>
                <div style={{
                  fontSize: 12, color: selectedAgent.color,
                  fontWeight: 600, fontFamily: 'Inter, sans-serif',
                }}>
                  {selectedAgent.role}
                </div>
              </div>
            </div>

            <p style={{
              fontSize: 13, color: '#94A3B8', lineHeight: 1.6,
              marginBottom: 20, fontFamily: 'Inter, sans-serif',
            }}>
              {selectedAgent.specialty}
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 8, fontFamily: 'Inter, sans-serif',
              }}>
                Capacidades
              </div>
              {selectedAgent.capabilities.map((cap, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: '#CBD5E1', marginBottom: 6,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: selectedAgent.color,
                  }} />
                  {cap}
                </div>
              ))}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 12, marginBottom: 20,
            }}>
              {[
                { label: 'Tareas', value: getAgentTasks(selectedAgent).toString() },
                { label: 'Éxito', value: getSuccessRate(selectedAgent) },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#0F172A', borderRadius: 12,
                  padding: 12, textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: 'white',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#64748B',
                    textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedAgent(null)
                window.dispatchEvent(new CustomEvent('open-copilot-with-agent', {
                  detail: { agent: selectedAgent.id, name: selectedAgent.name }
                }))
              }}
              style={{
                width: '100%', background: selectedAgent.gradient,
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 13, fontWeight: 700,
                padding: '12px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Pedir a {selectedAgent.name} que trabaje →
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── AgentCard component ───────────────────────────────────
interface AgentCardProps {
  agent: typeof AGENTS[0]
  tasks: number
  successRate: string
  active: boolean
  delay: number
  onClick: () => void
}

function AgentCard({ agent, tasks, successRate, active, delay, onClick }: AgentCardProps) {
  return (
    <div
      className={`sa-card ${active ? 'sa-active' : 'sa-idle'}`}
      style={{ '--ac': agent.color, animationDelay: `${delay}s` } as React.CSSProperties}
      onClick={onClick}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className="sa-avatar" style={{ background: agent.gradient }}>
          {agent.initials}
        </div>
        <div className="sa-ring" />
      </div>

      <div className="sa-name">{agent.name}</div>
      <div className="sa-role">{agent.role}</div>

      <div className={`sa-badge ${active ? 'sa-badge-active' : 'sa-badge-idle'}`}>
        <div className="sa-badge-dot" />
        {active ? 'Activo' : 'En espera'}
      </div>

      <div className="sa-stat">
        <div className="sa-stat-val" style={{ color: agent.color }}>{tasks}</div>
        <div className="sa-stat-lbl">tareas hoy</div>
      </div>
    </div>
  )
}

export default AgentStudio
