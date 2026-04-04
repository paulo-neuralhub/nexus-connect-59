import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setLoading(false)
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : authError.message,
      )
      return
    }

    // Transfer session to app subdomain via URL hash.
    // Supabase JS automatically detects access_token + refresh_token in the hash
    // and calls setSession() — same mechanism used for OAuth/magic-link callbacks.
    // We redirect to /app/dashboard (not /dashboard) because the main app's
    // protected routes live under /app/* with AuthGuard.
    const appBase = 'https://app.ip-nexus.app'
    const session = data.session
    if (session) {
      const hashParams = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: 'bearer',
        type: 'access_token',
      })
      window.location.href = `${appBase}/app/dashboard#${hashParams.toString()}`
    } else {
      window.location.href = appBase
    }
  }

  return (
    <AuthLayout
      branding={{ mode: 'standard' }}
      title="Acceder a tu cuenta"
      subtitle="Introduce tus credenciales para continuar"
    >
      {/* Back to landing */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-2 w-fit"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
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

        {/* Password */}
        <div>
          <label className="label-mono text-white/40 mb-2">Contraseña</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input pr-11"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs text-white/40 hover:text-gold transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-danger text-sm animate-[fadeIn_0.2s_ease-out]">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Accediendo...
            </>
          ) : (
            'Acceder'
          )}
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-white/40">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-gold hover:text-amber transition-colors font-medium">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
