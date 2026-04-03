import { Globe, Shield, Cpu, Sparkles } from 'lucide-react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useCountUp } from '../hooks/useCountUp'
import { colors, fonts } from '../theme'

const metrics = [
  { icon: Globe, value: 150, suffix: '+', label: 'Oficinas IP conectadas', color: colors.teal },
  { icon: Shield, value: 200, suffix: '+', label: 'Jurisdicciones cubiertas', color: colors.cyan },
  { icon: Cpu, value: 8, suffix: '', label: 'Módulos integrados', color: colors.gold },
  { icon: Sparkles, value: 0, suffix: 'Multi-LLM', label: 'IA con RAG legal', isText: true, color: colors.emerald },
]

function MetricItem({ icon: Icon, value, suffix, label, color, isText, start }: {
  icon: typeof Globe; value: number; suffix: string; label: string; color: string; isText?: boolean; start: boolean
}) {
  const count = useCountUp(value, 2000, start)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <Icon size={18} style={{ color }} strokeWidth={1.5} />
      <span style={{
        fontSize: 36,
        fontWeight: 800,
        color: colors.white,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {isText ? suffix : `${count}${suffix}`}
      </span>
      <span style={{ fontSize: 13, color: colors.white60, fontFamily: fonts.sans }}>{label}</span>
    </div>
  )
}

export default function MetricsBar() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} style={{
      background: colors.inkMid,
      borderTop: `1px solid ${colors.glassBorder}`,
      borderBottom: `1px solid ${colors.glassBorder}`,
      padding: '40px 24px',
    }}>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 32,
      }} className="metrics-grid">
        {metrics.map((m) => (
          <MetricItem key={m.label} {...m} start={isVisible} />
        ))}
      </div>
    </section>
  )
}
