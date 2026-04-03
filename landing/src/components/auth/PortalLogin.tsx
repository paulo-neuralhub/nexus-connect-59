import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from './AuthLayout'
import { usePortalBranding } from '../../hooks/usePortalBranding'

interface PortalLoginProps {
  slug: string
}

export default function PortalLogin({ slug }: PortalLoginProps) {
  const { branding, loading: brandingLoading, error: brandingError } = usePortalBranding(slug)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Send magic link — Supabase handles OTP verification via callback
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `https://${slug}.ip-nexus.app/auth/callback`,
      },
    })

    setLoading(false)

    if (otpError) {
      if (otpError.message.includes('rate')) {
        setError('Demasiados intentos. Espera unos minutos.')
      } else {
        setError('No se pudo enviar el enlace. Verifica tu email.')
      }
      return
    }

    setSent(true)
  }

  // Loading branding
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1425' }}>
        <div className="glass p-10 text-center animate-pulse">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5" />
          <div className="h-4 w-32 mx-auto bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  // Portal not found / inactive
  if (brandingError || !branding) {
    return (
      <AuthLayout
        branding={{ mode: 'portal', slug }}
        title="Portal no disponible"
      >
        <div className="text-center py-4">
          <p className="text-white/50 text-sm mb-6">
            {brandingError || 'Este portal no existe o está desactivado.'}
          </p>
          <p className="text-white/30 text-xs leading-relaxed mb-4">
            Si crees que deberías tener acceso, solicita a tu despacho
            que te invite al portal o contacta con soporte.
          </p>
          <a
            href={`mailto:soporte@ip-nexus.app?subject=Acceso%20portal%20${slug}`}
            className="btn-glass inline-flex !py-2.5 !px-6 !text-sm"
          >
            Contactar soporte
          </a>
        </div>
      </AuthLayout>
    )
  }

  // Magic link sent
  if (sent) {
    return (
      <AuthLayout
        branding={{ mode: 'portal', branding, slug }}
        title="Revisa tu email"
        subtitle="Te hemos enviado un enlace de acceso"
      >
        <div className="text-center py-4">
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Hemos enviado un enlace m&aacute;gico a{' '}
            <strong className="text-white">{email}</strong>.
            <br />Haz clic en el enlace para acceder al portal.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            ← Usar otro email
          </button>
        </div>
      </AuthLayout>
    )
  }

  // Main portal login form
  return (
    <AuthLayout
      branding={{ mode: 'portal', branding, slug }}
      title={branding.portal_welcome_title || 'Acceder al portal'}
      subtitle={branding.portal_welcome_message || 'Introduce tu email para recibir un enlace de acceso'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label-mono text-white/40 mb-2">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="auth-input"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          />
        </div>

        {error && (
          <p className="text-danger text-sm animate-[fadeIn_0.2s_ease-out]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, var(--portal-primary, #1E40AF), var(--portal-secondary, #3B82F6))`,
          }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Enviando enlace...
            </span>
          ) : (
            'Acceder'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
