import { colors, fonts } from '../theme'

const footerLinks = {
  Plataforma: ['Módulos', 'Precios', 'Demo', 'API Docs', 'Changelog'],
  Empresa: ['Nosotros', 'Blog', 'Contacto', 'Carreras'],
  Legal: ['Términos', 'Privacidad', 'Cookies', 'DPA', 'SLA'],
  Idiomas: ['Español', 'English', 'Português', 'Français', 'Deutsch'],
}

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${colors.glassBorder}`, padding: '64px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #FCA311, #F6AE2D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: colors.ink, fontWeight: 700, fontSize: 13 }}>IP</span>
              </div>
              <span style={{ color: colors.white, fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>IP-NEXUS</span>
            </div>
            <p style={{ fontSize: 14, color: colors.white20, lineHeight: 1.6 }}>
              La plataforma integral de gestión de Propiedad Intelectual.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.white40, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                {title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" style={{ fontSize: 14, color: colors.white20, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = colors.white60)}
                      onMouseLeave={e => (e.currentTarget.style.color = colors.white20)}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 32,
          borderTop: `1px solid ${colors.glassBorder}`,
          flexWrap: 'wrap', gap: 16,
        }}>
          <p style={{ fontSize: 12, color: colors.white20 }}>© 2026 IP-NEXUS. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {['GDPR', 'RLS', 'TLS 1.3'].map(badge => (
              <span key={badge} style={{
                fontFamily: fonts.mono, fontSize: 10, color: colors.white20,
                letterSpacing: '0.05em', padding: '4px 10px', borderRadius: 4,
                border: `1px solid ${colors.white10}`,
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
