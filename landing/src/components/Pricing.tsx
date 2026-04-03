import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Zap } from 'lucide-react'
import { colors, fonts, labelMono, btnGold, btnGlass } from '../theme'

gsap.registerPlugin(ScrollTrigger)

const plans = [
  { name: 'Free', monthly: 0, annual: 0, users: '2', cases: '50', jurisdictions: '3', ai: '25 queries/mes', extras: 'Chat interno', trial: '7 días Professional', cta: 'Empezar Gratis', popular: false },
  { name: 'Starter', monthly: 69, annual: 55, users: '3', cases: '150', jurisdictions: '5', ai: '200 queries/mes', extras: 'Portal 5 clientes, 10GB', trial: '14 días Professional', cta: 'Probar 14 días', popular: false },
  { name: 'Professional', monthly: 399, annual: 319, users: '10', cases: '3,000', jurisdictions: '15', ai: 'GENIUS Pro (Opus)', extras: 'Marketing + Analytics, Portal 20 clientes, 50GB', trial: '14 días Enterprise', cta: 'Probar 14 días', popular: true },
  { name: 'Enterprise', monthly: 999, annual: 799, users: 'Ilimitados', cases: 'Ilimitados', jurisdictions: '200+', ai: 'GENIUS + SPIDER full', extras: 'Data Hub + API, White Label, 500GB', trial: '', cta: 'Contactar Ventas', popular: false },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
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
      gsap.from(section.querySelectorAll('.pricing-card'), {
        y: 100, opacity: 0, duration: 1, stagger: 0.2,
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: { trigger: section.querySelector('.pricing-grid'), start: 'top 75%' },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    background: active ? colors.white10 : 'transparent',
    color: active ? colors.white : colors.white40,
    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 8,
  })

  return (
    <section id="precios" ref={sectionRef} style={{ padding: '72px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.emerald }}>PRECIOS</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginTop: 12, marginBottom: 12,
        }}>
          Transparencia total.{' '}
          <span style={{ color: colors.white40 }}>Sin letra pequeña.</span>
        </h2>
        <p className="reveal-child" style={{ color: colors.white60, marginBottom: 40 }}>
          Suscripción mensual o anual, sin costes ocultos. Precios sin IVA.
        </p>

        {/* Toggle */}
        <div className="reveal-child" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
          <button style={toggleStyle(!annual)} onClick={() => setAnnual(false)}>Mensual</button>
          <button style={toggleStyle(annual)} onClick={() => setAnnual(true)}>
            Anual
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: colors.emerald }}>-20%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {plans.map((plan) => (
            <div key={plan.name} className="pricing-card" style={{
              position: 'relative',
              background: plan.popular ? 'linear-gradient(180deg, rgba(252,163,17,0.06), transparent)' : colors.white05,
              border: `1px solid ${plan.popular ? 'rgba(252,163,17,0.5)' : colors.white10}`,
              borderRadius: 16, padding: 24,
              display: 'flex', flexDirection: 'column',
              transform: plan.popular ? 'scale(1.04)' : 'none',
              zIndex: plan.popular ? 10 : 1,
              boxShadow: plan.popular ? '0 0 60px rgba(252,163,17,0.15)' : 'none',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: colors.gold, color: colors.ink }}>MÁS POPULAR</span>
                </div>
              )}

              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.white80, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: plan.popular ? colors.gold : colors.white }}>
                  €{annual ? plan.annual : plan.monthly}
                </span>
                <span style={{ fontSize: 14, color: colors.white20 }}>/mes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, flex: 1, fontSize: 14 }}>
                <PlanRow label="Usuarios" value={plan.users} />
                <PlanRow label="Expedientes" value={plan.cases} />
                <PlanRow label="Jurisdicciones" value={plan.jurisdictions} />
                <PlanRow label="IA" value={plan.ai} />
                <PlanRow label="Extras" value={plan.extras} />
              </div>

              {plan.trial && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 6,
                  background: 'rgba(66,158,189,0.1)', color: colors.teal,
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                }}>
                  <Zap size={12} /> {plan.trial}
                </div>
              )}

              <button style={{
                ...(plan.popular ? btnGold : btnGlass),
                width: '100%', textAlign: 'center', justifyContent: 'center',
                padding: '12px 24px',
              }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: colors.white20 }}>{label}</span>
      <span style={{ color: colors.white60, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
