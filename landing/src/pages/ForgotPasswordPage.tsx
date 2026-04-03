import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: 'https://app.ip-nexus.app/reset-password' },
    )

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        branding={{ mode: 'standard' }}
        title="Revisa tu email"
        subtitle="Te hemos enviado instrucciones para restablecer tu contraseña"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
            <Mail size={28} className="text-gold" />
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Si existe una cuenta con <strong className="text-white">{email}</strong>,
            recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className="text-gold hover:text-amber text-sm font-medium transition-colors">
            ← Volver al login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      branding={{ mode: 'standard' }}
      title="Restablecer contraseña"
      subtitle="Introduce tu email y te enviaremos un enlace"
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
            placeholder="tu@despacho.com"
            className="auth-input"
          />
        </div>

        {error && (
          <p className="text-danger text-sm animate-[fadeIn_0.2s_ease-out]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar enlace'
          )}
        </button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al login
        </Link>
      </form>
    </AuthLayout>
  )
}
