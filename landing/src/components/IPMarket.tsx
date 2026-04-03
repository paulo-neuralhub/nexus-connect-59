import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ShoppingBag, Globe, Star, Shield, CreditCard, Users, TrendingUp, Award } from 'lucide-react'
import { colors, fonts } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const advantages = [
  { icon: Globe, title: 'Expansión global instantánea', desc: 'Accede a agentes locales verificados en 200+ jurisdicciones. Registra marcas en cualquier país sin necesidad de contactos previos.', color: colors.teal },
  { icon: Users, title: 'Potenciales clientes para agentes', desc: 'Si eres agente local, recibe solicitudes de profesionales IP de todo el mundo. Tu jurisdicción, tu expertise, nuestro alcance.', color: colors.cyan },
  { icon: CreditCard, title: 'Garantía de pago', desc: 'Pagos escrow protegidos. El agente cobra al completar milestones, el cliente paga con garantía. Sin sorpresas ni impagos.', color: colors.gold },
  { icon: Star, title: 'Clasificación de agentes', desc: 'Sistema de ratings con métricas reales: tiempo de respuesta, tasa de éxito, volumen gestionado. Elige con datos, no con suerte.', color: colors.amber },
  { icon: Shield, title: 'Agentes verificados', desc: 'Verificación de licencia profesional, seguro de responsabilidad y referencias. Solo agentes cualificados entran en el marketplace.', color: colors.emerald },
  { icon: TrendingUp, title: 'Gestión de milestones', desc: 'Seguimiento transparente de cada fase: filing, examen, publicación, registro. Sin necesidad de emails o llamadas de seguimiento.', color: colors.teal },
]

export default function IPMarket() {
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
      gsap.from(section.querySelectorAll('.advantage-card'), {
        y: 30, opacity: 0, scale: 0.95, duration: 0.6,
        stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: section.querySelector('.advantages-grid'), start: 'top 70%' },
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
            border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)',
            marginBottom: 24,
          }}>
            <ShoppingBag size={14} style={{ color: colors.emerald }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, color: colors.emerald, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Primer marketplace IP con IA
            </span>
          </div>

          <h2 style={{
            fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
            fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 20,
          }}>
            Tu red global de{' '}
            <span style={{ background: 'linear-gradient(135deg, #429EBD, #7BBDE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              agentes IP
            </span>
            , integrada
          </h2>

          <p style={{ color: colors.white40, lineHeight: 1.6 }}>
            IP MARKET conecta a profesionales de propiedad intelectual con agentes locales
            en cualquier jurisdicción del mundo. Contrata, gestiona y paga — todo sin salir
            de la plataforma.
          </p>
        </div>

        {/* Advantage cards */}
        <div className="advantages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {advantages.map((a) => (
            <div key={a.title} className="advantage-card" style={{
              position: 'relative', padding: 24,
              background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
              transition: 'border-color 0.3s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <a.icon size={18} style={{ color: a.color }} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: colors.white80, marginBottom: 8 }}>{a.title}</h3>
              <p style={{ fontSize: 14, color: colors.white40, lineHeight: 1.6 }}>{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="reveal-child" style={{ textAlign: 'center', marginTop: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
            padding: '16px 24px',
          }}>
            <Award size={20} style={{ color: colors.gold }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.white80 }}>¿Eres agente IP local?</p>
              <p style={{ fontSize: 12, color: colors.white40 }}>Únete al marketplace y recibe solicitudes de clientes globales</p>
            </div>
            <a href="#agendar-demo" className="btn-gold" style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>Registrarme →</a>
          </div>
        </div>
      </div>
    </section>
  )
}
