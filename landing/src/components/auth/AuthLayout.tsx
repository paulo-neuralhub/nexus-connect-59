import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PortalBranding } from '../../hooks/usePortalBranding'

interface AuthBranding {
  mode: 'standard' | 'portal'
  branding?: PortalBranding | null
  slug?: string | null
}

interface AuthLayoutProps {
  children: ReactNode
  branding: AuthBranding
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, branding, title, subtitle }: AuthLayoutProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    card.style.opacity = '0'
    card.style.transform = 'translateY(30px)'
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)'
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
    })
  }, [])

  const isPortal = branding.mode === 'portal'
  const portalName = branding.branding?.portal_name
  const logoUrl = isPortal
    ? branding.branding?.portal_logo_dark_url || branding.branding?.logo_url
    : null
  const welcomeMsg = branding.branding?.portal_welcome_message

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0C1425' }}
    >
      {/* Left brand panel — desktop only */}
      <div className="hidden xl:flex flex-col justify-center items-center w-[60%] relative px-16">
        {/* Ambient gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isPortal
              ? `radial-gradient(ellipse at 30% 50%, var(--portal-primary, #1E40AF)15, transparent 70%)`
              : 'radial-gradient(ellipse at 30% 50%, rgba(252,163,17,0.06), transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          {isPortal && logoUrl ? (
            <img src={logoUrl} alt={portalName || 'Portal'} className="h-16 mx-auto mb-8 object-contain" />
          ) : isPortal && portalName ? (
            <h2 className="text-3xl font-semibold text-white mb-8">{portalName}</h2>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber flex items-center justify-center">
                <span className="text-ink font-bold text-lg">IP</span>
              </div>
              <span className="text-white font-bold text-3xl tracking-tight">IP-NEXUS</span>
            </div>
          )}

          {isPortal && welcomeMsg ? (
            <p className="text-white/50 text-lg leading-relaxed">{welcomeMsg}</p>
          ) : !isPortal ? (
            <>
              <p className="text-white/50 text-lg leading-relaxed mb-6">
                Plataforma inteligente para la gestión integral de Propiedad Intelectual.
              </p>
              <p className="text-white/30 text-sm">
                Gestiona 50,000+ activos IP con IA avanzada
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 xl:w-[40%]">
        {/* Mobile/tablet logo */}
        <div className="xl:hidden mb-10 text-center">
          {isPortal && logoUrl ? (
            <img src={logoUrl} alt={portalName || 'Portal'} className="h-10 mx-auto" />
          ) : isPortal && portalName ? (
            <h2 className="text-xl font-semibold text-white">{portalName}</h2>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-gold to-amber flex items-center justify-center">
                <span className="text-ink font-bold text-sm">IP</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">IP-NEXUS</span>
            </Link>
          )}
        </div>

        {/* Glass card */}
        <div
          ref={cardRef}
          className="w-full max-w-[420px] glass p-10 max-sm:p-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-white/40 text-sm mb-8">{subtitle}</p>}
          {!subtitle && <div className="mb-8" />}

          {children}

          {/* Powered by IP-NEXUS — portal only */}
          {isPortal && (branding.branding?.portal_show_ipnexus_branding !== false) && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <a
                href="https://ip-nexus.app"
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono text-white/20 hover:text-white/40 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded bg-gradient-to-br from-gold to-amber inline-flex items-center justify-center text-[7px] font-bold text-ink">IP</span>
                Powered by IP-NEXUS
              </a>
            </div>
          )}
        </div>

        {/* Legal footer */}
        <p className="mt-8 text-white/20 text-xs text-center max-w-[420px] leading-relaxed">
          IP-NEXUS es un servicio sujeto a la legislaci&oacute;n espa&ntilde;ola y al RGPD (UE 2016/679).
        </p>
      </div>
    </div>
  )
}
