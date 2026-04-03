import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

const PW_RULES = [
  { label: 'Mínimo 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Una mayúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un número', test: (v: string) => /\d/.test(v) },
  { label: 'Un carácter especial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const allPwValid = PW_RULES.every((r) => r.test(password))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!allPwValid || !gdprAccepted) return
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization_name: orgName.trim(),
        },
        emailRedirectTo: 'https://app.ip-nexus.app/auth/callback',
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <AuthLayout
        branding={{ mode: 'standard' }}
        title="Verifica tu email"
        subtitle="Te hemos enviado un enlace de confirmación"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald/10 flex items-center justify-center">
            <Check size={32} className="text-emerald" />
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Hemos enviado un email a <strong className="text-white">{email}</strong>.
            <br />Haz clic en el enlace para activar tu cuenta.
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
      title="Crear cuenta"
      subtitle="Comienza tu prueba gratuita de IP-NEXUS"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="label-mono text-white/40 mb-2">Nombre completo</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="María García López"
            className="auth-input"
          />
        </div>

        {/* Org */}
        <div>
          <label className="label-mono text-white/40 mb-2">Despacho / Empresa</label>
          <input
            type="text"
            required
            autoComplete="organization"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="García & Asociados IP"
            className="auth-input"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label-mono text-white/40 mb-2">Email profesional</label>
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
          {/* Password strength */}
          {password.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {PW_RULES.map((rule) => {
                const ok = rule.test(password)
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {ok ? (
                      <Check size={12} className="text-emerald" />
                    ) : (
                      <X size={12} className="text-white/30" />
                    )}
                    <span className={ok ? 'text-emerald' : 'text-white/30'}>{rule.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* GDPR */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={gdprAccepted}
            onChange={(e) => setGdprAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-gold"
          />
          <span className="text-xs text-white/40 leading-relaxed">
            Al registrarte, aceptas que IP-NEXUS procese tus datos seg&uacute;n nuestra{' '}
            <a href="/privacy" className="text-gold hover:text-amber underline">Pol&iacute;tica de Privacidad</a>{' '}
            y como plataforma tecnol&oacute;gica (no prestamos asesoramiento jur&iacute;dico).
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-danger text-sm animate-[fadeIn_0.2s_ease-out]">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !allPwValid || !gdprAccepted}
          className="btn-gold w-full !py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta gratuita'
          )}
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-white/40">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-gold hover:text-amber transition-colors font-medium">
            Acceder
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
