import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isStrong) return
    setError(null)
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout
        branding={{ mode: 'standard' }}
        title="Contraseña actualizada"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald/10 flex items-center justify-center">
            <Check size={32} className="text-emerald" />
          </div>
          <p className="text-white/60 text-sm mb-6">
            Tu contraseña ha sido actualizada correctamente.
          </p>
          <Link to="/login" className="btn-gold inline-flex !py-3 !px-8">
            Acceder
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      branding={{ mode: 'standard' }}
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label-mono text-white/40 mb-2">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
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
          {password.length > 0 && !isStrong && (
            <p className="text-white/30 text-xs mt-2">
              Mínimo 8 caracteres, una mayúscula y un número
            </p>
          )}
        </div>

        {error && (
          <p className="text-danger text-sm animate-[fadeIn_0.2s_ease-out]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !isStrong}
          className="btn-gold w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Actualizando...
            </>
          ) : (
            'Actualizar contraseña'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
