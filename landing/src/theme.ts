// Design tokens — IP-NEXUS Navy & Gold Premium
export const colors = {
  ink: '#0C1425',
  inkMid: '#14213D',
  inkLight: '#1B2D4F',
  gold: '#FCA311',
  goldMuted: 'rgba(252, 163, 17, 0.15)',
  teal: '#429EBD',
  cyan: '#7BBDE8',
  ice: '#BDD8E9',
  emerald: '#10B981',
  amber: '#F6AE2D',
  danger: '#EF4444',
  white: '#FFFFFF',
  white80: 'rgba(255,255,255,0.8)',
  white60: 'rgba(255,255,255,0.6)',
  white40: 'rgba(255,255,255,0.4)',
  white20: 'rgba(255,255,255,0.2)',
  white10: 'rgba(255,255,255,0.1)',
  white05: 'rgba(255,255,255,0.05)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHover: 'rgba(255,255,255,0.07)',
} as const

export const gradients = {
  gold: 'linear-gradient(135deg, #FCA311, #F6AE2D)',
  teal: 'linear-gradient(135deg, #429EBD, #7BBDE8)',
  mixed: 'linear-gradient(135deg, #FCA311, #429EBD)',
} as const

export const fonts = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const

export const breakpoints = {
  mobile: 768,
  tablet: 1200,
} as const

// Shared style patterns
export const glassStyle: React.CSSProperties = {
  background: colors.glass,
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: 16,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
}

export const labelMono: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
}

export const btnGold: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '16px 32px',
  background: gradients.gold,
  color: colors.ink,
  fontWeight: 700,
  fontSize: 15,
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 16px rgba(252, 163, 17, 0.15)',
}

export const btnGlass: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '16px 32px',
  background: colors.glass,
  border: `1px solid ${colors.white10}`,
  color: colors.white80,
  fontWeight: 600,
  fontSize: 15,
  borderRadius: 12,
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.2s ease',
}
