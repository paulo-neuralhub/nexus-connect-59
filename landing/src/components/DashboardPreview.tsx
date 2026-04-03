import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LayoutDashboard, FolderOpen, Clock, Sparkles, Radar, ShoppingBag, Users, Wallet } from 'lucide-react'
import { colors, fonts, labelMono } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FolderOpen, label: 'Expedientes' },
  { icon: Clock, label: 'Plazos' },
  { icon: Sparkles, label: 'GENIUS', badge: 'IA', badgeColor: colors.gold, badgeBg: 'rgba(252,163,17,0.15)' },
  { icon: Radar, label: 'SPIDER' },
  { icon: ShoppingBag, label: 'Market', badge: 'Nuevo', badgeColor: colors.cyan, badgeBg: 'rgba(123,189,232,0.15)' },
  { icon: Users, label: 'CRM' },
  { icon: Wallet, label: 'Finance' },
]

const kpis = [
  { label: 'Plazos semana', value: '7', change: '+2', color: colors.amber, bg: 'rgba(246,174,45,0.1)' },
  { label: 'Alertas SPIDER', value: '12', change: '+5', color: colors.teal, bg: 'rgba(66,158,189,0.1)' },
  { label: 'Expedientes', value: '847', change: '+23', color: colors.emerald, bg: 'rgba(16,185,129,0.1)' },
  { label: 'Pendientes', value: '3', change: '-1', color: colors.gold, bg: 'rgba(252,163,17,0.1)' },
]

const deadlines = [
  { mark: 'NOVATECH', office: 'EUIPO · Cl.9', date: '04 Abr', status: 'Urgente', statusColor: colors.danger, statusBg: 'rgba(239,68,68,0.1)' },
  { mark: 'ZENITH PRO', office: 'OEPM · Cl.35', date: '07 Abr', status: 'Pendiente', statusColor: colors.amber, statusBg: 'rgba(246,174,45,0.1)' },
  { mark: 'AURORA LABS', office: 'USPTO · Cl.42', date: '12 Abr', status: 'Normal', statusColor: colors.emerald, statusBg: 'rgba(16,185,129,0.1)' },
  { mark: 'MERIDIAN', office: 'JPO · Cl.9,42', date: '18 Abr', status: 'Normal', statusColor: colors.emerald, statusBg: 'rgba(16,185,129,0.1)' },
]

export default function DashboardPreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const card = cardRef.current
    if (!section || !card) return

    const ctx = gsap.context(() => {
      // Label + heading reveal
      gsap.from(section.querySelectorAll('.reveal-child'), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })

      // Dashboard card 3D entrance
      gsap.from(card, {
        rotateX: 12,
        rotateY: -4,
        scale: 0.88,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section id="dashboard" ref={sectionRef} style={{ padding: '128px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.cyan }}>PLATAFORMA</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans,
          fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginTop: 12,
          marginBottom: 48,
          color: colors.white,
        }}>
          Tu centro de mando de{' '}
          <span style={{
            background: 'linear-gradient(135deg, #429EBD, #7BBDE8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Propiedad Intelectual
          </span>
        </h2>

        {/* Browser chrome wrapper */}
        <div style={{ perspective: 1200 }}>
          <div ref={cardRef} style={{
            background: colors.glass,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
            transformOrigin: 'center center',
          }}>
            {/* Browser bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderBottom: `1px solid ${colors.glassBorder}`,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 6,
                  background: colors.white05,
                  fontSize: 12,
                  color: colors.white20,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  app.ip-nexus.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div style={{ display: 'flex', minHeight: 420 }}>
              {/* Sidebar */}
              <div className="dashboard-sidebar" style={{
                display: 'flex',
                flexDirection: 'column',
                width: 200,
                borderRight: `1px solid ${colors.glassBorder}`,
                padding: 12,
                gap: 2,
                flexShrink: 0,
                boxShadow: '4px 0 12px rgba(0,0,0,0.2)',
              }}>
                {sidebarItems.map((item) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: item.active ? colors.teal : colors.white40,
                    background: item.active ? 'rgba(66,158,189,0.1)' : 'transparent',
                  }}>
                    <item.icon size={16} strokeWidth={1.5} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: item.badgeColor,
                        background: item.badgeBg,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div style={{ flex: 1, padding: 20 }}>
                {/* Greeting */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.white80 }}>Buenos días, Paulo</h3>
                    <p style={{ fontSize: 12, color: colors.white20, marginTop: 2 }}>Miércoles, 2 Abril 2026</p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'rgba(252,163,17,0.1)',
                  }}>
                    <Sparkles size={12} style={{ color: colors.gold }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.gold }}>GENIUS</span>
                  </div>
                </div>

                {/* KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="kpi-grid">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} style={{
                      background: kpi.bg,
                      borderRadius: 8,
                      padding: 12,
                      borderTop: `1px solid rgba(255,255,255,0.06)`,
                    }}>
                      <p style={{ fontSize: 11, color: colors.white40, marginBottom: 4 }}>{kpi.label}</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: colors.white }}>{kpi.value}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: kpi.color, marginBottom: 4 }}>{kpi.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deadlines table */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.white20, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Próximos plazos
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {deadlines.map((d) => (
                      <div key={d.mark} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 600, color: colors.white80, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.mark}</span>
                        <span style={{ color: colors.white20, flex: 1 }}>{d.office}</span>
                        <span style={{ color: colors.white40, fontFamily: fonts.mono, fontSize: 12 }}>{d.date}</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          color: d.statusColor,
                          background: d.statusBg,
                        }}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
