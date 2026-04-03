import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
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

    const { error: authError } = await supabase.auth.signInWithPassword({
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

    // Supabase persists the session via PKCE + storageKey.
    // Redirect to app — session is read by supabase.auth.getSession() on app.ip-nexus.app
    window.location.href =
      import.meta.env.VITE_APP_URL || 'https://app.ip-nexus.app/dashboard'
  }

  return (
    <AuthLayout
      branding={{ mode: 'standard' }}
      title="Acceder a tu cuenta"
      subtitle="Introduce tus credenciales para continuar"
    >
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
