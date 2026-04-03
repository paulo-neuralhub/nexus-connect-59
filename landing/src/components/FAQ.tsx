import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronDown } from 'lucide-react'
import { colors, fonts, labelMono } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const faqs = [
  { q: '¿Qué pasa si supero el límite de expedientes?', a: 'Tu cuenta sigue funcionando. Te avisamos al 80% y puedes ampliar al plan siguiente en cualquier momento.' },
  { q: '¿Qué incluye el trial gratuito?', a: 'Acceso completo al plan superior durante 7 o 14 días según tu plan. Sin tarjeta de crédito. Si no actualizas, tu cuenta pasa al plan gratuito automáticamente.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Upgrade inmediato, downgrade al final del ciclo de facturación.' },
  { q: '¿Cómo funciona la facturación anual?', a: 'Un pago anual con 20% de descuento. Factura inmediata compatible con VeriFactu.' },
  { q: '¿Mis datos están seguros?', a: 'Cifrado AES-256, aislamiento multi-tenant con RLS, backups diarios. Cumplimiento GDPR desde el diseño.' },
  { q: '¿Puedo importar mis datos existentes?', a: 'Sí. DATA HUB soporta CSV, Excel y API. Mapeo inteligente con IA para migración asistida.' },
  { q: '¿Cómo funciona la IA de GENIUS?', a: 'GENIUS utiliza múltiples modelos de lenguaje (Multi-LLM) con acceso a una base de conocimiento legal mediante RAG. Minimiza alucinaciones citando fuentes verificables en cada respuesta. Revisión profesional siempre recomendada.' },
  { q: '¿Cómo funciona el marketplace de agentes?', a: 'IP MARKET conecta a profesionales IP con agentes locales en cualquier jurisdicción. Puedes solicitar presupuestos, gestionar milestones y pagar de forma segura desde la plataforma.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
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
    <section ref={sectionRef} style={{ padding: '72px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.cyan }}>PREGUNTAS FRECUENTES</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginTop: 12, marginBottom: 48,
        }}>
          Todo lo que necesitas saber
        </h2>

        <div className="reveal-child" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: colors.white05, border: `1px solid ${colors.white10}`, borderRadius: 12, overflow: 'hidden',
            }}>
              <button
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', textAlign: 'left', border: 'none', background: 'none',
                  cursor: 'pointer', color: colors.white80,
                }}
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span style={{ fontSize: 15, fontWeight: 500, paddingRight: 16 }}>{faq.q}</span>
                <ChevronDown size={18} style={{
                  color: colors.white20, flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
              </button>
              <div style={{
                maxHeight: open === i ? 300 : 0,
                opacity: open === i ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}>
                <p style={{ padding: '0 20px 16px', fontSize: 14, color: colors.white60, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
