import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Calendar } from 'lucide-react'
import { colors, fonts } from '../theme'

gsap.registerPlugin(ScrollTrigger)

export default function FinalCTA() {
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
    <section ref={sectionRef} style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 20,
        }}>
          Tu PI merece la{' '}
          <span style={{ background: 'linear-gradient(135deg, #429EBD, #7BBDE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            mejor tecnología
          </span>
        </h2>
        <p className="reveal-child" style={{ color: colors.white60, marginBottom: 40 }}>
          Únete a los profesionales que ya gestionan su propiedad intelectual con IP-NEXUS.
        </p>
        <div className="reveal-child" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
          <a href="#precios" className="btn-gold">Empezar Gratis →</a>
          <a href="#agendar-demo" className="btn-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} />
            Agendar Demo
          </a>
        </div>
        <p className="reveal-child" style={{ fontSize: 12, color: colors.white40 }}>
          Sin tarjeta de crédito · Cancela cuando quieras · Tus datos siempre tuyos
        </p>
      </div>
    </section>
  )
}
