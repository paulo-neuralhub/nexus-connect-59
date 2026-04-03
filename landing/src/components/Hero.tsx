import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTypedText } from '../hooks/useTypedText'
import { ChevronDown } from 'lucide-react'
import ParticleField from './ParticleField'
import Globe3D from './Globe3D'
import { colors, gradients, fonts } from '../theme'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const typedText = useTypedText()
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    const content = contentRef.current
    if (!el || !content) return

    const ctx = gsap.context(() => {
      // Staggered entrance
      const children = content.querySelectorAll('.hero-animate')
      gsap.from(children, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.3,
      })

      // Parallax fade on scroll
      gsap.to(content, {
        y: -80,
        opacity: 0,
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: 72,
      }}
    >
      {/* Particle field background — desktop only */}
      <ParticleField />

      {/* Content */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        {/* Left column — Text */}
        <div>
          {/* Badge */}
          <div className="hero-animate" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 999,
            border: `1px solid ${colors.goldMuted}`,
            background: 'rgba(252, 163, 17, 0.05)',
            marginBottom: 32,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: colors.gold,
              boxShadow: `0 0 8px ${colors.gold}`,
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: fonts.mono,
              fontSize: 12,
              fontWeight: 600,
              color: colors.gold,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Nueva generación de gestión IP
            </span>
          </div>

          {/* H1 */}
          <h1 className="hero-animate" style={{
            fontFamily: fonts.sans,
            fontSize: 'clamp(40px, 5vw, 60px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: colors.white,
            marginBottom: 24,
          }}>
            Protege tu{' '}
            <span style={{
              background: gradients.gold,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {typedText}
              <span style={{
                WebkitTextFillColor: colors.gold,
                animation: 'blink 1s step-end infinite',
              }}>|</span>
            </span>
            <br />
            como nunca antes.
          </h1>

          {/* Paragraph */}
          <p className="hero-animate" style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: colors.white60,
            maxWidth: 480,
            marginBottom: 12,
          }}>
            8 módulos integrados. IA experta en PI. El primer marketplace de agentes IP con IA integrada.
            Todo en una plataforma construida para profesionales exigentes.
          </p>

          <p className="hero-animate" style={{
            fontSize: 16,
            color: colors.white40,
            marginBottom: 32,
          }}>
            Desde tu escritorio. Para todas tus jurisdicciones.
          </p>

          {/* CTAs */}
          <div className="hero-animate" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <a href="#precios" className="btn-gold" style={{ position: 'relative', overflow: 'hidden' }}>
              Empezar Gratis — 7 días →
            </a>
            <a href="#agendar-demo" className="btn-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              Ver Demo
            </a>
          </div>

          {/* Trust line */}
          <p className="hero-animate" style={{ fontSize: 12, color: colors.white20 }}>
            Sin tarjeta de crédito · Setup en 2 minutos · Tus datos siempre tuyos
          </p>
        </div>

        {/* Right column — Globe 3D */}
        <div className="hero-animate" style={{ position: 'relative' }}>
          <Globe3D />

          {/* Floating glass cards around globe */}
          <div style={{
            position: 'absolute',
            top: '8%',
            left: '-10%',
            ...glassCardStyle,
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: colors.white }}>150+</span>
            <span style={{ fontSize: 11, color: colors.white40, display: 'block' }}>Oficinas conectadas</span>
          </div>

          <div style={{
            position: 'absolute',
            top: '50%',
            right: '-5%',
            ...glassCardStyle,
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: colors.teal }}>200+</span>
            <span style={{ fontSize: 11, color: colors.white40, display: 'block' }}>Jurisdicciones</span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '8%',
            left: '5%',
            ...glassCardStyle,
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: colors.gold }}>8</span>
            <span style={{ fontSize: 11, color: colors.white40, display: 'block' }}>Módulos integrados</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-animate" style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
      }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.white20, letterSpacing: '0.2em' }}>SCROLL</span>
        <ChevronDown size={16} style={{ color: colors.white20, animation: 'float-bounce 2s ease-in-out infinite' }} />
      </div>
    </section>
  )
}

const glassCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  padding: '10px 16px',
  zIndex: 10,
}
