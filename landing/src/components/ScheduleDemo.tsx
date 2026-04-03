import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Calendar, Video, Phone } from 'lucide-react'
import { colors, fonts, labelMono, btnGold, glassStyle } from '../theme'

gsap.registerPlugin(ScrollTrigger)

function getNextBusinessDays(count: number) {
  const days: { label: string; date: string; day: string }[] = []
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push({
        label: `${d.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]}`,
        date: d.toISOString().slice(0, 10),
        day: names[d.getDay()],
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00']

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: colors.white05,
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 14,
  color: colors.white,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: fonts.sans,
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
}

export default function ScheduleDemo() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [callType, setCallType] = useState<'video' | 'phone'>('video')
  const [gdprConsent, setGdprConsent] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const days = getNextBusinessDays(7)

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
    <section id="agendar-demo" ref={sectionRef} style={{
      padding: '96px 24px',
      background: colors.inkMid,
      borderTop: `1px solid ${colors.glassBorder}`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="reveal-child" style={{ ...labelMono, color: colors.gold }}>AGENDA UNA DEMO</span>
        <h2 className="reveal-child" style={{
          fontFamily: fonts.sans, fontSize: 'clamp(32px, 4.5vw, 44px)',
          fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', marginTop: 12, marginBottom: 12,
        }}>
          Hablemos de tu{' '}
          <span style={{ background: 'linear-gradient(135deg, #FCA311, #F6AE2D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            portfolio IP
          </span>
        </h2>
        <p className="reveal-child" style={{ color: colors.white40, marginBottom: 48 }}>
          30 minutos con un especialista. Te mostramos cómo IP-NEXUS se adapta a tu operativa.
        </p>

        <div className="reveal-child" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left: Calendar */}
          <div style={{ ...glassStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Calendar size={18} style={{ color: colors.gold }} />
              <span style={{ fontWeight: 600, color: colors.white80 }}>Selecciona día</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 }}>
              {days.map((d) => (
                <button
                  key={d.date}
                  onClick={() => { setSelectedDay(d.date); setSelectedTime(null) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '12px 8px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer',
                    background: selectedDay === d.date ? 'linear-gradient(135deg, #FCA311, #F6AE2D)' : colors.white05,
                    color: selectedDay === d.date ? colors.ink : colors.white40,
                    fontWeight: selectedDay === d.date ? 600 : 400,
                    fontFamily: fonts.sans,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.day}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>

            {selectedDay && (
              <>
                <p style={{ fontSize: 14, color: colors.white40, marginBottom: 12 }}>Horarios disponibles (CET)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {times.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      style={{
                        padding: '8px 4px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer',
                        fontFamily: fonts.mono,
                        background: selectedTime === t ? colors.gold : colors.white05,
                        color: selectedTime === t ? colors.ink : colors.white40,
                        fontWeight: selectedTime === t ? 600 : 400,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Nombre" placeholder="Tu nombre completo" required />
            <FormField label="Email profesional" placeholder="nombre@empresa.com" type="email" required />
            <FormField label="Empresa / Despacho" placeholder="Nombre de tu organización" />

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.white40, marginBottom: 6 }}>
                Expedientes gestionados
              </label>
              <select style={selectStyle} defaultValue="">
                <option value="" disabled>Selecciona rango</option>
                <option value="<50">&lt;50</option>
                <option value="50-200">50-200</option>
                <option value="200-1000">200-1,000</option>
                <option value="1000+">1,000+</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              {(['video', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCallType(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8, fontSize: 14,
                    border: 'none', cursor: 'pointer', fontFamily: fonts.sans,
                    background: callType === type ? colors.white10 : 'transparent',
                    color: callType === type ? colors.white : colors.white20,
                  }}
                >
                  {type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                  {type === 'video' ? 'Videollamada' : 'Llamada'}
                </button>
              ))}
            </div>

            {/* GDPR checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: colors.white40, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={() => setGdprConsent(!gdprConsent)}
                required
                style={{ marginTop: 2, accentColor: colors.gold }}
              />
              <span>Consiento que IP-NEXUS contacte conmigo para la demo solicitada. <a href="#" style={{ color: colors.teal, textDecoration: 'underline' }}>Política de Privacidad</a></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: colors.white40, cursor: 'pointer' }}>
              <input type="checkbox" style={{ marginTop: 2, accentColor: colors.gold }} />
              <span>Deseo recibir novedades de IP-NEXUS</span>
            </label>

            <button
              style={{ ...btnGold, width: '100%', justifyContent: 'center', marginTop: 'auto', opacity: (!selectedDay || !selectedTime || !gdprConsent) ? 0.5 : 1 }}
              disabled={!selectedDay || !selectedTime || !gdprConsent}
            >
              Confirmar Demo {selectedTime && selectedDay ? `— ${selectedTime}` : ''} →
            </button>

            <p style={{ fontSize: 12, color: colors.white20, textAlign: 'center' }}>
              Un especialista confirmará tu reserva en menos de 2 horas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FormField({ label, placeholder, type = 'text', required = false }: { label: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.white40, marginBottom: 6 }}>{label}</label>
      <input type={type} placeholder={placeholder} required={required} style={inputStyle} />
    </div>
  )
}
