import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Brain, BookOpen, MessageCircle } from 'lucide-react'
import { colors, fonts, labelMono, glassStyle } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const capabilities = [
  { icon: Brain, title: 'Multi-LLM', desc: 'Selecciona el modelo óptimo para cada tarea' },
  { icon: BookOpen, title: 'RAG Legal', desc: '200 jurisdicciones de conocimiento indexado' },
  { icon: MessageCircle, title: 'Memoria Contextual', desc: 'Recuerda tu portfolio y tus preferencias' },
]

const results = [
  { name: 'NOVATEK', cls: 'Clase 9', status: 'Activa', sim: '87%', risk: 'Alto', riskColor: colors.danger, riskBg: 'rgba(239,68,68,0.1)' },
  { name: 'NOVA TECH SYSTEMS', cls: 'Clase 9, 42', status: 'Activa', sim: '72%', risk: 'Medio', riskColor: colors.amber, riskBg: 'rgba(246,174,45,0.1)' },
  { name: 'NOVATEC', cls: 'Clase 7', status: 'Caducada', sim: '45%', risk: 'Bajo', riskColor: colors.emerald, riskBg: 'rgba(16,185,129,0.1)' },
]

export default function GeniusDemo() {
  const sectionRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(0)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.reveal-child'), {
        y: 40, opacity: 0, duration: 0.8, stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        onEnter: () => setTriggered(true),
        once: true,
      })
    }, section)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!triggered) return
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 2200)
    const t3 = setTimeout(() => setPhase(3), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [triggered])

  return (
    <section ref={sectionRef} style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.gold }}>IP-GENIUS</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans,
          fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginTop: 12,
          marginBottom: 48,
        }}>
          Inteligencia artificial que{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FCA311, #F6AE2D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            entiende de PI
          </span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="genius-grid">
          {/* Left: capabilities */}
          <div className="reveal-child" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
            {capabilities.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(252,163,17,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} style={{ color: colors.gold }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, color: colors.white80, marginBottom: 4 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: colors.white40 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: chat demo */}
          <div className="reveal-child" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px',
              borderBottom: `1px solid ${colors.glassBorder}`,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colors.gold,
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: colors.white80 }}>IP-GENIUS</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.white20, marginLeft: 'auto' }}>
                Multi-LLM · RAG Legal · 200 jurisdicciones
              </span>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 380 }}>
              {/* Phase 1: User message */}
              {phase >= 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{
                    maxWidth: '85%', padding: '12px 16px', borderRadius: '16px 16px 4px 16px',
                    background: 'linear-gradient(135deg, rgba(66,158,189,0.2), rgba(123,189,232,0.2))',
                    fontSize: 14, color: colors.white80,
                  }}>
                    Analiza registrabilidad de 'NovaTech' en clase 9 para la Unión Europea
                  </div>
                </div>
              )}

              {/* Phase 2: Thinking */}
              {phase === 2 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(252,163,17,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: colors.gold, fontSize: 12, fontWeight: 700 }}>G</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: colors.white40, marginBottom: 8 }}>Analizando 23,847 marcas en clase 9 ante EUIPO...</p>
                    <div style={{ height: 6, background: colors.white05, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: '100%', borderRadius: 3,
                        background: 'linear-gradient(90deg, #FCA311, #F6AE2D)',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 3: Results */}
              {phase >= 3 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(252,163,17,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: colors.gold, fontSize: 12, fontWeight: 700 }}>G</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 14, color: colors.white60 }}>
                      He identificado <strong style={{ color: colors.white }}>3 marcas con riesgo de conflicto</strong>:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {results.map((r) => (
                        <div key={r.name} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', fontSize: 12,
                        }}>
                          <span style={{ fontWeight: 600, color: colors.white60, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                          <span style={{ color: colors.white20 }}>{r.cls}</span>
                          <span style={{ fontFamily: fonts.mono, color: colors.white40, marginLeft: 'auto' }}>{r.sim}</span>
                          <span style={{
                            fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            fontSize: 10, color: r.riskColor, background: r.riskBg,
                          }}>{r.risk}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(246,174,45,0.1)',
                      border: '1px solid rgba(246,174,45,0.2)',
                    }}>
                      <p style={{ fontSize: 12, color: colors.amber }}>
                        <strong>Riesgo global: MEDIO-ALTO.</strong> Recomiendo análisis de coexistencia antes de solicitar registro.
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: colors.white20, fontStyle: 'italic' }}>
                      IA como herramienta de apoyo — revisión profesional siempre recomendada.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
