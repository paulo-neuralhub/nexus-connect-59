import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FolderOpen, Sparkles, Radar, ShoppingBag, Wallet, Users, Globe, Database } from 'lucide-react'
import { colors, fonts, labelMono } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const modules = [
  { icon: FolderOpen, name: 'DOCKET', title: 'Gestión de Expedientes', desc: 'Ciclo de vida completo: marcas, patentes, diseños. Plazos, estados, documentos, historial.', color: '#429EBD', span: true },
  { icon: Sparkles, name: 'GENIUS', title: 'Copiloto IA Experto', desc: 'Multi-LLM con memoria contextual y RAG legal de 200 jurisdicciones.', color: '#FCA311' },
  { icon: Radar, name: 'SPIDER', title: 'Vigilancia Global', desc: 'Monitoreo 150+ jurisdicciones. Alertas con IA de similitud fonética y visual.', color: '#7BBDE8' },
  { icon: ShoppingBag, name: 'IP MARKET', title: 'Marketplace de Agentes IP', desc: 'Conecta con agentes locales. Contrata, gestiona milestones, paga. El primer marketplace IP integrado con inteligencia artificial.', color: '#10B981', span: true, badge: 'PRIMER MARKETPLACE IP CON IA' },
  { icon: Wallet, name: 'FINANCE', title: 'Facturación Inteligente', desc: 'Presupuestos, facturas, timesheet, VeriFactu.', color: '#F6AE2D' },
  { icon: Users, name: 'CRM', title: 'Clientes y Pipeline', desc: 'Contactos, oportunidades, segmentación avanzada.', color: '#429EBD' },
  { icon: Globe, name: 'COLLAB', title: 'Portal de Clientes', desc: 'Portal white-label con acceso a expedientes.', color: '#7BBDE8' },
  { icon: Database, name: 'DATA HUB', title: 'Importación y Sync', desc: 'CSV, Excel, API. Mapeo inteligente con IA.', color: '#10B981' },
]

export default function ModulesBento() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.reveal-child'), {
        y: 40, opacity: 0, duration: 0.8, stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })

      gsap.from(section.querySelectorAll('.module-card'), {
        y: 40, opacity: 0, scale: 0.9, duration: 0.6,
        stagger: { each: 0.1, from: 'start' },
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: section.querySelector('.modules-grid'), start: 'top 70%' },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section id="modulos" ref={sectionRef} style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.gold }}>MÓDULOS</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans,
          fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginTop: 12,
          marginBottom: 48,
        }}>
          Todo lo que necesitas.{' '}
          <span style={{ color: colors.white40 }}>Nada que no.</span>
        </h2>

        <div className="modules-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
        }}>
          {modules.map((m) => (
            <div
              key={m.name}
              className="module-card"
              style={{
                position: 'relative',
                background: colors.white05,
                border: `1px solid ${colors.white10}`,
                borderRadius: 16,
                padding: 24,
                gridColumn: m.span ? 'span 2' : 'span 1',
                transition: 'border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.backdropFilter = 'blur(24px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = colors.white10
                e.currentTarget.style.backdropFilter = 'none'
              }}
            >
              {/* Subtle glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 200,
                height: 200,
                borderRadius: '50%',
                opacity: 0.05,
                background: `radial-gradient(circle at top left, ${m.color}, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Badge */}
              {m.badge && (
                <span style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: 'rgba(16,185,129,0.15)',
                  color: colors.emerald,
                  letterSpacing: '0.05em',
                }}>
                  {m.badge}
                </span>
              )}

              <div style={{ position: 'relative' }}>
                <m.icon size={22} style={{ color: m.color, marginBottom: 16 }} strokeWidth={1.5} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: m.color }}>
                    {m.name}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.white80, marginBottom: 8 }}>{m.title}</h3>
                <p style={{ fontSize: 14, color: colors.white40, lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
