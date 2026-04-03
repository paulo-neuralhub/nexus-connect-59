import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Radar, Eye, Globe, Share2, FileSearch, Bell, Shield, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { colors, fonts } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const channels = [
  { icon: Globe, label: 'Oficinas de PI', desc: '150+ oficinas monitorizadas 24/7', color: colors.teal },
  { icon: Share2, label: 'Redes sociales', desc: 'Instagram, TikTok, Amazon, eBay...', color: colors.cyan },
  { icon: FileSearch, label: 'Dominios web', desc: 'Nuevos registros, typosquatting', color: colors.emerald },
  { icon: Shield, label: 'Nombres comerciales', desc: 'Registros mercantiles, licencias', color: colors.gold },
]

const features = [
  { icon: Zap, title: 'Detección en tiempo real', desc: 'SPIDER rastrea continuamente y alerta en el momento en que aparece una nueva solicitud similar o un uso infractor.' },
  { icon: AlertTriangle, title: 'Análisis de riesgo automático', desc: 'Cada alerta llega con análisis de similitud, clase, jurisdicción y nivel de riesgo. Tú decides, con datos.' },
  { icon: Bell, title: 'Alertas personalizables', desc: 'Configura umbrales de similitud, jurisdicciones, clases y canales. Solo recibes lo relevante.' },
  { icon: CheckCircle2, title: 'De alerta a acción en 1 click', desc: 'Detecta infracción → abre oposición en DOCKET o instruye a agente en IP MARKET. Todo conectado.' },
]

export default function Surveillance() {
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
        <div className="reveal-child" style={{ maxWidth: 700, marginBottom: 64 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            border: `1px solid rgba(252,163,17,0.2)`, background: 'rgba(252,163,17,0.05)',
            marginBottom: 24,
          }}>
            <Radar size={14} style={{ color: colors.gold }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, color: colors.gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Sistema autónomo SPIDER
            </span>
          </div>

          <h2 style={{
            fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
            fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 20,
          }}>
            Vigilancia que{' '}
            <span style={{ background: 'linear-gradient(135deg, #FCA311, #F6AE2D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              nunca duerme
            </span>
          </h2>

          <p style={{ color: colors.white40, lineHeight: 1.6 }}>
            SPIDER monitoriza oficinas de propiedad intelectual, redes sociales, marketplaces y dominios
            en tiempo real. Detecta amenazas antes de que se conviertan en problemas.
          </p>
        </div>

        {/* 3 columns: channels + radar + features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }} className="surveillance-grid">
          {/* Left: channels */}
          <div className="reveal-child" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.white20, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Canales monitorizados</p>
            {channels.map((c) => (
              <div key={c.label} style={{
                background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
                padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <c.icon size={16} style={{ color: c.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.white80 }}>{c.label}</h4>
                  <p style={{ fontSize: 12, color: colors.white40 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Center: radar */}
          <div className="reveal-child" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '1' }}>
              {[1, 0.75, 0.5, 0.25].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', borderRadius: '50%',
                  border: `1px solid rgba(252,163,17,0.1)`,
                  width: `${s * 100}%`, height: `${s * 100}%`,
                }} />
              ))}
              {/* Sweep line */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '50%', height: 1, transformOrigin: 'left center',
                background: 'linear-gradient(90deg, rgba(252,163,17,0.6), transparent)',
                animation: 'radar-sweep 4s linear infinite',
              }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12, height: 12, borderRadius: '50%',
                background: 'rgba(252,163,17,0.6)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(252,163,17,0.3)',
                  animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                }} />
              </div>
              {/* Alert dots */}
              {[
                { top: '20%', left: '65%' },
                { top: '35%', left: '25%' },
                { top: '70%', left: '72%' },
                { top: '55%', left: '18%' },
                { top: '15%', left: '40%' },
              ].map((dot, i) => (
                <div key={i} style={{
                  position: 'absolute', ...dot,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'rgba(252,163,17,0.7)',
                  animation: `pulse-dot ${2 + i * 0.3}s ease-in-out infinite`,
                }} />
              ))}
              {/* Labels */}
              <span style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontFamily: fonts.mono, fontSize: 10, color: colors.white20 }}>EUIPO</span>
              <span style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', fontFamily: fonts.mono, fontSize: 10, color: colors.white20 }}>USPTO</span>
              <span style={{ position: 'absolute', top: '50%', left: -32, transform: 'translateY(-50%)', fontFamily: fonts.mono, fontSize: 10, color: colors.white20 }}>WIPO</span>
              <span style={{ position: 'absolute', top: '50%', right: -24, transform: 'translateY(-50%)', fontFamily: fonts.mono, fontSize: 10, color: colors.white20 }}>JPO</span>
            </div>
          </div>

          {/* Right: features */}
          <div className="reveal-child" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.white20, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Capacidades</p>
            {features.map((f) => (
              <div key={f.title} style={{
                background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
                padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <f.icon size={16} style={{ color: colors.gold }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.white80 }}>{f.title}</h4>
                    <p style={{ fontSize: 12, color: colors.white40, lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat line */}
        <div className="reveal-child" style={{
          marginTop: 48,
          background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 16,
          padding: '20px 32px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 32, textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} style={{ color: colors.gold }} />
            <span style={{ fontSize: 14, color: colors.white60 }}><strong style={{ color: colors.white }}>24/7</strong> monitorización continua</span>
          </div>
          <div style={{ width: 1, height: 16, background: colors.white10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} style={{ color: colors.teal }} />
            <span style={{ fontSize: 14, color: colors.white60 }}><strong style={{ color: colors.white }}>150+</strong> oficinas rastreadas</span>
          </div>
          <div style={{ width: 1, height: 16, background: colors.white10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} style={{ color: colors.emerald }} />
            <span style={{ fontSize: 14, color: colors.white60 }}>Alerta en <strong style={{ color: colors.white }}>&lt;30 min</strong></span>
          </div>
        </div>
      </div>
    </section>
  )
}
