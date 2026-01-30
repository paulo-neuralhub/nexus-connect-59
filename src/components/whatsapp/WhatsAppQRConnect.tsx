/**
 * WhatsApp QR Connection Component
 * 
 * Placeholder funcional que muestra UI completa para conexión vía QR.
 * Requiere backend externo (whatsapp-web.js en Node.js) para funcionar.
 * 
 * Estados:
 * - not_configured: Sin backend configurado (whatsapp_backend_url vacío)
 * - idle: Listo para generar QR (backend configurado)
 * - loading: Generando QR
 * - qr_ready: QR visible, esperando escaneo
 * - connected: WhatsApp vinculado
 * - error: Error de conexión
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

type ConnectionStatus = 'idle' | 'loading' | 'qr_ready' | 'connected' | 'error' | 'not_configured';

interface WhatsAppSession {
  id: string;
  phone_number?: string;
  status: string;
  last_seen_at?: string;
  device_name?: string;
}

interface WhatsAppQRConnectProps {
  onConnected?: () => void;
  onRequestImplementation?: () => void;
}

export function WhatsAppQRConnect({ onConnected, onRequestImplementation }: WhatsAppQRConnectProps) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<ConnectionStatus>('not_configured');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check configuration on mount
  useEffect(() => {
    if (currentOrganization?.id) {
      checkConfiguration();
    }
  }, [currentOrganization?.id]);

  const checkConfiguration = async () => {
    if (!currentOrganization?.id) return;
    
    setIsChecking(true);
    try {
      // Check tenant config for backend URL
      const { data: config } = await supabase
        .from('whatsapp_tenant_config')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (config) {
        // Use type assertion for new fields
        const backendUrlValue = (config as any).whatsapp_backend_url;
        const connectedPhone = (config as any).connected_phone;
        
        if (backendUrlValue) {
          setBackendUrl(backendUrlValue);
          
          // Check if already connected via QR
          if (config.integration_type === 'qr_web' && config.meta_status === 'active') {
            setStatus('connected');
            setSession({
              id: config.id,
              phone_number: connectedPhone || 'Conectado',
              status: 'connected',
              last_seen_at: config.updated_at,
            });
          } else {
            setStatus('idle');
          }
        } else {
          setStatus('not_configured');
        }
      } else {
        setStatus('not_configured');
      }

      // Also check for existing QR session
      if (user?.id) {
        const { data: sessionData } = await supabase
          .from('whatsapp_qr_sessions')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .maybeSingle();

        if (sessionData) {
          setSession(sessionData as WhatsAppSession);
          setStatus('connected');
        }
      }
    } catch (err) {
      console.error('Error checking config:', err);
      setStatus('not_configured');
    } finally {
      setIsChecking(false);
    }
  };

  const startQRSession = async () => {
    if (!backendUrl) {
      // Try edge function as fallback
      return startQRSessionViaEdgeFunction();
    }

    setStatus('loading');
    setError(null);
    
    try {
      // Call external backend to start WhatsApp session
      const response = await fetch(`${backendUrl}/api/whatsapp/qr/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: currentOrganization?.id,
          user_id: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error iniciando sesión de WhatsApp');
      }

      const data = await response.json();
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setStatus('qr_ready');
        pollSessionStatus(data.sessionId);
      } else {
        throw new Error('No se recibió código QR');
      }
    } catch (err: any) {
      console.error('Error starting QR session:', err);
      setError(err.message || 'No se pudo conectar con el servidor de WhatsApp. Verifica que el servicio esté activo.');
      setStatus('error');
    }
  };

  const startQRSessionViaEdgeFunction = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-qr-start', {
        body: { 
          organization_id: currentOrganization?.id,
          user_id: user?.id 
        }
      });

      if (fnError) throw fnError;

      if (data?.error === 'not_available') {
        setStatus('not_configured');
        setError('El servicio de conexión QR no está disponible. Requiere configuración de backend externo.');
        return;
      }

      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setStatus('qr_ready');
        pollSessionStatusViaEdgeFunction(data.sessionId);
      } else {
        throw new Error('No se recibió código QR');
      }
    } catch (err: any) {
      console.error('Error starting QR session:', err);
      setError(err.message || 'No se pudo iniciar la sesión. Intenta de nuevo.');
      setStatus('error');
    }
  };

  const pollSessionStatus = useCallback(async (sessionId: string) => {
    if (isPolling || !backendUrl) return;
    setIsPolling(true);

    const checkStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${backendUrl}/api/whatsapp/qr/status/${sessionId}`);
        const data = await response.json();

        if (data.status === 'connected') {
          setStatus('connected');
          setSession(data.session);
          
          // Save to database
          await supabase
            .from('whatsapp_tenant_config')
            .update({
              integration_type: 'qr_web',
              meta_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', currentOrganization?.id);
          
          onConnected?.();
          toast.success('¡WhatsApp conectado!', {
            description: 'Tu WhatsApp está ahora vinculado a IP-NEXUS'
          });
          return true;
        } else if (data.qrCode && data.qrCode !== qrCode) {
          setQrCode(data.qrCode);
        }
        return false;
      } catch (err) {
        console.error('Error polling status:', err);
        return false;
      }
    };

    // Poll every 3 seconds for 2 minutes
    for (let i = 0; i < 40; i++) {
      const connected = await checkStatus();
      if (connected) {
        setIsPolling(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setError('El código QR ha expirado. Genera uno nuevo.');
    setStatus('error');
    setIsPolling(false);
  }, [qrCode, isPolling, onConnected, backendUrl, currentOrganization?.id]);

  const pollSessionStatusViaEdgeFunction = useCallback(async (sessionId: string) => {
    if (isPolling) return;
    setIsPolling(true);

    const checkStatus = async (): Promise<boolean> => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('whatsapp-qr-status', {
          body: { session_id: sessionId }
        });

        if (fnError) throw fnError;

        if (data?.status === 'connected') {
          setStatus('connected');
          setSession(data.session);
          onConnected?.();
          toast.success('¡WhatsApp conectado!', {
            description: 'Tu WhatsApp está ahora conectado a IP-NEXUS'
          });
          return true;
        } else if (data?.qrCode && data.qrCode !== qrCode) {
          setQrCode(data.qrCode);
        }
        return false;
      } catch (err) {
        console.error('Error polling status:', err);
        return false;
      }
    };

    for (let i = 0; i < 40; i++) {
      const connected = await checkStatus();
      if (connected) {
        setIsPolling(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setError('El código QR ha expirado. Genera uno nuevo.');
    setStatus('error');
    setIsPolling(false);
  }, [qrCode, isPolling, onConnected]);

  const disconnectSession = async () => {
    try {
      // Try external backend first
      if (backendUrl) {
        await fetch(`${backendUrl}/api/whatsapp/qr/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: session?.id }),
        }).catch(() => {});
      } else {
        // Use edge function
        await supabase.functions.invoke('whatsapp-qr-disconnect', {
          body: { 
            session_id: session?.id,
            organization_id: currentOrganization?.id,
            user_id: user?.id
          }
        }).catch(() => {});
      }

      // Update database
      if (currentOrganization?.id) {
        await supabase
          .from('whatsapp_tenant_config')
          .update({
            integration_type: 'none',
            meta_status: 'disconnected',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', currentOrganization.id);
      }

      if (session?.id) {
        await supabase
          .from('whatsapp_qr_sessions')
          .update({ status: 'disconnected' })
          .eq('id', session.id);
      }

      setSession(null);
      setStatus('idle');
      setQrCode(null);

      toast.success('WhatsApp desconectado', {
        description: 'Tu sesión de WhatsApp ha sido cerrada'
      });
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      toast.error('Error al desconectar', {
        description: err.message
      });
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Conexión vía código QR</CardTitle>
        </div>
        <CardDescription>
          Conecta tu WhatsApp personal escaneando un código QR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Important notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Al conectar tu WhatsApp, todos los mensajes 
            (personales y de trabajo) llegarán a IP-NEXUS. Recomendamos usar un 
            número dedicado para el negocio.
          </AlertDescription>
        </Alert>

        {/* Status: Not configured */}
        {status === 'not_configured' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-lg font-medium text-foreground">
              Servicio no configurado
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              La conexión vía QR requiere un servicio backend externo que debe ser 
              configurado por el equipo de IP-NEXUS.
            </p>
            <Alert className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Para activar esta función:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Solicita la implementación en la pestaña "API Profesional"</li>
                  <li>O contacta a soporte para configurar un servidor WhatsApp dedicado</li>
                </ul>
              </AlertDescription>
            </Alert>
            {onRequestImplementation && (
              <Button 
                variant="outline" 
                onClick={onRequestImplementation}
                className="mt-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Solicitar implementación
              </Button>
            )}
          </div>
        )}

        {/* Status: Connected */}
        {status === 'connected' && session && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-lg font-medium text-foreground">
              WhatsApp conectado
            </div>
            <p className="text-sm text-muted-foreground">
              Número: {session.phone_number || 'Conectado'}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                En línea
              </Badge>
              {session.last_seen_at && (
                <span className="text-xs text-muted-foreground">
                  Última actividad: {new Date(session.last_seen_at).toLocaleString('es-ES')}
                </span>
              )}
            </div>
            <Button variant="destructive" onClick={disconnectSession} className="mt-4">
              <XCircle className="h-4 w-4 mr-2" />
              Desconectar WhatsApp
            </Button>
          </div>
        )}

        {/* Status: Idle (ready to connect) */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <div className="text-lg font-medium text-foreground">
              Conecta tu WhatsApp
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Escanea el código QR con tu teléfono para vincular tu WhatsApp con IP-NEXUS
            </p>
            <Button onClick={startQRSession} className="mt-4">
              <QrCode className="h-4 w-4 mr-2" />
              Generar código QR
            </Button>
          </div>
        )}

        {/* Status: Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Generando código QR...</p>
            <p className="text-sm text-muted-foreground">Conectando con el servidor de WhatsApp</p>
          </div>
        )}

        {/* Status: QR Ready */}
        {status === 'qr_ready' && qrCode && (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-6">
            <div className="text-lg font-medium text-foreground">
              Escanea este código QR
            </div>
            
            {/* QR Code display */}
            <div className="p-4 bg-white rounded-xl shadow-lg">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64"
              />
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-1 gap-3 text-left max-w-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span className="text-sm text-muted-foreground">Abre WhatsApp en tu teléfono</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-sm text-muted-foreground">Ve a Configuración → Dispositivos vinculados</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-sm text-muted-foreground">Toca "Vincular un dispositivo"</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-sm text-muted-foreground">Escanea este código QR</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Esperando escaneo...</span>
            </div>

            <Button variant="outline" onClick={startQRSession}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar QR
            </Button>

            <p className="text-xs text-muted-foreground">
              El código expira en 2 minutos
            </p>
          </div>
        )}

        {/* Status: Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-lg font-medium text-foreground">
              Error de conexión
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || 'No se pudo establecer la conexión con WhatsApp'}
            </p>
            <Button onClick={startQRSession} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WhatsAppQRConnect;
