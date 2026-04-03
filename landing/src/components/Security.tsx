import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Shield, Lock, Database, Eye, Globe, Activity } from 'lucide-react'
import { colors, fonts, labelMono } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const features = [
  { icon: Shield, title: 'Cifrado AES-256 + TLS 1.3', desc: 'Datos cifrados en reposo y en tránsito con los estándares más exigentes de la industria.' },
  { icon: Lock, title: 'Aislamiento Multi-Tenant RLS', desc: 'Cada organización tiene sus datos completamente aislados a nivel de base de datos con Row Level Security.' },
  { icon: Database, title: 'Backups Automáticos', desc: 'Copias de seguridad automáticas diarias con retención y plan de recuperación ante desastres.' },
  { icon: Eye, title: 'Audit Trail Completo', desc: 'Registro inmutable de cada acción para cumplimiento normativo y trazabilidad total.' },
  { icon: Globe, title: 'GDPR & LGPD Compliant', desc: 'Diseñado desde el primer día para cumplir con la normativa europea y brasileña de protección de datos.' },
  { icon: Activity, title: 'Monitoreo 24/7', desc: 'Infraestructura monitorizada en tiempo real con alertas automáticas y respuesta inmediata a incidentes.' },
]

export default function Security() {
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
      gsap.from(section.querySelectorAll('.security-card'), {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: section.querySelector('.security-grid'), start: 'top 70%' },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section id="seguridad" ref={sectionRef} style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.emerald }}>SEGURIDAD</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginTop: 12, marginBottom: 48,
        }}>
          Construido para datos{' '}
          <span style={{ background: 'linear-gradient(135deg, #10B981, #429EBD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            que importan
          </span>
        </h2>

        <div className="security-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {features.map((f) => (
            <div key={f.title} className="security-card" style={{
              background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <f.icon size={20} style={{ color: colors.emerald }} strokeWidth={1.5} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: colors.emerald, letterSpacing: '0.05em' }}>ACTIVO</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: colors.white80, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: colors.white40, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
