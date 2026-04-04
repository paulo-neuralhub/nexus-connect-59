/**
 * Auth Callback Handler
 *
 * Handles Supabase auth redirects (email confirmation, OAuth, magic links).
 * Supabase appends tokens to the URL hash (#access_token=...&refresh_token=...).
 * The Supabase JS client automatically detects these and calls setSession().
 *
 * This page just shows a loading spinner while the session is established,
 * then redirects to onboarding (new user) or dashboard (existing user).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Give Supabase client time to process the hash tokens
        // The onAuthStateChange listener in auth-context will pick up the session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Session error:', error.message);
          setStatus('error');
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          // Small delay so user sees the success state
          setTimeout(() => {
            // Check if user needs onboarding (no organization yet)
            navigate('/app/dashboard', { replace: true });
          }, 1500);
        } else {
          // No session yet — might be processing. Wait a bit and retry.
          await new Promise((r) => setTimeout(r, 2000));
          const { data: retry } = await supabase.auth.getSession();
          if (retry.session) {
            setStatus('success');
            setTimeout(() => navigate('/app/dashboard', { replace: true }), 1000);
          } else {
            // Check if there's a hash with error
            const hash = window.location.hash;
            if (hash.includes('error')) {
              const params = new URLSearchParams(hash.replace('#', ''));
              setErrorMsg(params.get('error_description') || 'Error de autenticación');
              setStatus('error');
            } else {
              // Redirect to login — token might have expired
              setErrorMsg('El enlace ha expirado. Por favor, inicia sesión.');
              setStatus('error');
            }
          }
        }
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Error inesperado');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Verificando tu cuenta...</h1>
            <p className="text-muted-foreground text-sm">
              Estamos confirmando tu email. Un momento por favor.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold">¡Cuenta verificada!</h1>
            <p className="text-muted-foreground text-sm">
              Redirigiendo a IP-NEXUS...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold">Error de verificación</h1>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
            <div className="pt-4 flex gap-3 justify-center">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Ir al Login
              </button>
              <button
                onClick={() => navigate('/register', { replace: true })}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                Registrarse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
