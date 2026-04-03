import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Users, FileText, Bell, Clock, MessageSquare, BarChart3, Lock, Eye, CheckCircle2, ArrowRight } from 'lucide-react'
import { colors, fonts, glassStyle } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const portalFeatures = [
  { icon: Eye, title: 'Visibilidad total de expedientes', desc: 'Tu cliente ve el estado de cada marca, patente o diseño en tiempo real. Sin llamadas, sin emails de seguimiento.', highlight: true },
  { icon: FileText, title: 'Documentos centralizados', desc: 'Certificados, poderes, facturas, informes — todo accesible desde un único punto.', highlight: false },
  { icon: Bell, title: 'Notificaciones inteligentes', desc: 'Alertas automáticas de vencimientos, cambios de estado y acciones requeridas.', highlight: false },
  { icon: MessageSquare, title: 'Comunicación contextual', desc: 'Mensajes vinculados directamente al expediente. Sin hilos perdidos.', highlight: false },
  { icon: CheckCircle2, title: 'Aprobaciones digitales', desc: 'Presupuestos, instrucciones, renovaciones — el cliente aprueba con un click.', highlight: true },
  { icon: BarChart3, title: 'Dashboards ejecutivos', desc: 'Resumen visual del portfolio: activos por jurisdicción, vencimientos, costes.', highlight: false },
]

const portalStats = [
  { value: '-80%', label: 'Emails de seguimiento', icon: MessageSquare },
  { value: '24/7', label: 'Acceso del cliente', icon: Clock },
  { value: '100%', label: 'Trazabilidad', icon: Lock },
]

export default function ClientPortal() {
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
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} style={{ padding: '128px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div className="reveal-child" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            border: `1px solid rgba(66,158,189,0.2)`, background: 'rgba(66,158,189,0.05)',
            marginBottom: 24,
          }}>
            <Users size={14} style={{ color: colors.teal }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, color: colors.teal, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Portal del cliente COLLAB
            </span>
          </div>

          <h2 style={{
            fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
            fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 20,
          }}>
            Tu cliente informado,{' '}
            <span style={{ background: 'linear-gradient(135deg, #429EBD, #7BBDE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              tú liberado
            </span>
          </h2>

          <p style={{ color: colors.white40, lineHeight: 1.6 }}>
            El portal más completo del sector. Tus clientes acceden a expedientes, documentos,
            plazos y comunicaciones — sin que tú tengas que hacer nada.
          </p>
        </div>

        {/* Stats bar */}
        <div className="reveal-child" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          {portalStats.map((s) => (
            <div key={s.label} style={{
              background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
              textAlign: 'center', padding: '20px 16px',
            }}>
              <s.icon size={16} style={{ color: colors.teal, margin: '0 auto 8px' }} strokeWidth={1.5} />
              <span style={{ display: 'block', fontSize: 24, fontWeight: 800, color: colors.white }}>{s.value}</span>
              <span style={{ fontSize: 12, color: colors.white40 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Portal mockup + features */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }} className="portal-grid">
          {/* Left: mini portal mockup */}
          <div className="reveal-child" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(66,158,189,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={12} style={{ color: colors.teal }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.white60 }}>Portal Cliente</span>
              <span style={{ marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 10, color: colors.white20 }}>ACME Corp.</span>
            </div>

            <div style={{ padding: 20, borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <p style={{ fontSize: 11, color: colors.white20, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Portfolio activo</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                {[{ n: '47', l: 'Marcas' }, { n: '12', l: 'Patentes' }, { n: '8', l: 'Diseños' }].map(i => (
                  <div key={i.l}>
                    <span style={{ display: 'block', fontSize: 18, fontWeight: 700, color: colors.white }}>{i.n}</span>
                    <span style={{ fontSize: 10, color: colors.white20 }}>{i.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, color: colors.white20, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actividad reciente</p>
              {[
                { text: 'Marca "ACME Pro" registrada en EUIPO', time: 'Hace 2h', dot: colors.emerald },
                { text: 'Presupuesto renovación pendiente', time: 'Hace 1d', dot: colors.gold },
                { text: 'Oposición resuelta favorablemente', time: 'Hace 3d', dot: colors.teal },
              ].map((a) => (
                <div key={a.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.dot, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, color: colors.white40 }}>{a.text}</p>
                    <p style={{ fontSize: 10, color: colors.white20 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                borderRadius: 8, background: 'rgba(252,163,17,0.05)', border: '1px solid rgba(252,163,17,0.15)',
                padding: 12, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <CheckCircle2 size={16} style={{ color: colors.gold, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: colors.white60 }}>2 acciones pendientes</p>
                  <p style={{ fontSize: 10, color: colors.white20 }}>Aprobar presupuesto, firmar poder</p>
                </div>
                <ArrowRight size={14} style={{ color: 'rgba(252,163,17,0.5)' }} />
              </div>
            </div>
          </div>

          {/* Right: feature cards */}
          <div className="reveal-child" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {portalFeatures.map((f) => (
              <div key={f.title} style={{
                background: colors.white05, border: `1px solid ${f.highlight ? 'rgba(66,158,189,0.15)' : colors.white10}`,
                borderRadius: 16, padding: 20, transition: 'border-color 0.3s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <f.icon size={16} style={{ color: f.highlight ? colors.teal : colors.white40 }} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.white80, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: colors.white40, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
