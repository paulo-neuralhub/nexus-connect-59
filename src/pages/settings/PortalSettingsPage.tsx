/**
 * Portal Settings Page - Configuración del portal de clientes
 */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Palette, Settings, Shield, Bell, 
  Upload, ExternalLink, Copy, Check, Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PortalSettings {
  id?: string;
  organization_id: string;
  is_enabled: boolean;
  default_portal_name: string | null;
  welcome_message: string | null;
  default_logo_url: string | null;
  default_primary_color: string;
  custom_domain: string | null;
  features: {
    show_matters: boolean;
    show_documents: boolean;
    show_deadlines: boolean;
    show_invoices: boolean;
    show_catalog: boolean;
    allow_messages: boolean;
    allow_document_upload: boolean;
    allow_payments: boolean;
  };
  notify_on_new_message: boolean;
  notify_on_document_shared: boolean;
  notify_email: string | null;
}

const DEFAULT_FEATURES = {
  show_matters: true,
  show_documents: true,
  show_deadlines: true,
  show_invoices: true,
  show_catalog: true,
  allow_messages: true,
  allow_document_upload: false,
  allow_payments: false,
};

export default function PortalSettingsPage() {
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [settings, setSettings] = useState<PortalSettings>({
    organization_id: '',
    is_enabled: false,
    default_portal_name: '',
    welcome_message: '',
    default_logo_url: null,
    default_primary_color: '#3B82F6',
    custom_domain: null,
    features: DEFAULT_FEATURES,
    notify_on_new_message: true,
    notify_on_document_shared: true,
    notify_email: null,
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      loadSettings();
    }
  }, [currentOrganization?.id]);

  const loadSettings = async () => {
    if (!currentOrganization?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          ...data,
          features: { ...DEFAULT_FEATURES, ...(data.features as object) },
        });
      } else {
        setSettings(prev => ({
          ...prev,
          organization_id: currentOrganization.id,
        }));
      }
    } catch (error) {
      console.error('Error loading portal settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization?.id) return;

    setIsSaving(true);
    try {
      const payload = {
        organization_id: currentOrganization.id,
        is_enabled: settings.is_enabled,
        default_portal_name: settings.default_portal_name || null,
        welcome_message: settings.welcome_message || null,
        default_logo_url: settings.default_logo_url,
        default_primary_color: settings.default_primary_color,
        custom_domain: settings.custom_domain || null,
        features: settings.features,
        notify_on_new_message: settings.notify_on_new_message,
        notify_on_document_shared: settings.notify_on_document_shared,
        notify_email: settings.notify_email || null,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('portal_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('portal_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast.success('Configuración guardada');
    } catch (error) {
      console.error('Error saving portal settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (key: keyof typeof DEFAULT_FEATURES, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const portalUrl = settings.custom_domain 
    ? `https://${settings.custom_domain}`
    : `${window.location.origin}/portal/${currentOrganization?.slug || 'tu-empresa'}`;

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copiada');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portal de Clientes</h1>
          <p className="text-muted-foreground">
            Configura el portal donde tus clientes pueden ver sus expedientes y documentos
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Activación
            </CardTitle>
            <CardDescription>
              Activa o desactiva el portal de clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Portal activo</Label>
                <p className="text-sm text-muted-foreground">
                  Permite a tus clientes acceder al portal
                </p>
              </div>
              <Switch
                checked={settings.is_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, is_enabled: checked }))
                }
              />
            </div>

            {settings.is_enabled && (
              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">URL del portal</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm truncate">
                    {portalUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyPortalUrl}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalización
            </CardTitle>
            <CardDescription>
              Personaliza la apariencia del portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portal-name">Nombre del portal</Label>
              <Input
                id="portal-name"
                placeholder="Portal de Clientes"
                value={settings.default_portal_name || ''}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, default_portal_name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message">Mensaje de bienvenida</Label>
              <Textarea
                id="welcome-message"
                placeholder="Bienvenido al portal de clientes..."
                value={settings.welcome_message || ''}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, welcome_message: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Color principal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={settings.default_primary_color}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, default_primary_color: e.target.value }))
                  }
                  className="w-12 h-10 rounded cursor-pointer border"
                />
                <Input
                  value={settings.default_primary_color}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, default_primary_color: e.target.value }))
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Funcionalidades
            </CardTitle>
            <CardDescription>
              Controla qué pueden ver y hacer los clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { key: 'show_matters' as const, label: 'Mostrar expedientes', desc: 'Ver lista de expedientes' },
                { key: 'show_documents' as const, label: 'Mostrar documentos', desc: 'Ver documentos compartidos' },
                { key: 'show_deadlines' as const, label: 'Mostrar plazos', desc: 'Ver calendario de plazos' },
                { key: 'allow_messages' as const, label: 'Permitir mensajes', desc: 'Enviar mensajes al despacho' },
                { key: 'allow_document_upload' as const, label: 'Permitir subir documentos', desc: 'Subir archivos al portal' },
                { key: 'show_invoices' as const, label: 'Mostrar facturas', desc: 'Ver facturas y pagos' },
                { key: 'allow_payments' as const, label: 'Permitir pagos online', desc: 'Pagar facturas desde el portal' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={settings.features[key]}
                    onCheckedChange={(checked) => updateFeature(key, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura las notificaciones del portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Nuevo mensaje</Label>
                <p className="text-xs text-muted-foreground">
                  Notificar cuando un cliente envíe un mensaje
                </p>
              </div>
              <Switch
                checked={settings.notify_on_new_message}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, notify_on_new_message: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Documento compartido</Label>
                <p className="text-xs text-muted-foreground">
                  Notificar al cliente cuando se comparta un documento
                </p>
              </div>
              <Switch
                checked={settings.notify_on_document_shared}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, notify_on_document_shared: checked }))
                }
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="notify-email">Email de notificaciones</Label>
              <Input
                id="notify-email"
                type="email"
                placeholder="portal@tuempresa.com"
                value={settings.notify_email || ''}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, notify_email: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Email donde recibirás las notificaciones del portal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dominio personalizado */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Dominio Personalizado
              <Badge variant="secondary">Avanzado</Badge>
            </CardTitle>
            <CardDescription>
              Usa tu propio dominio para el portal de clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Dominio</Label>
              <Input
                id="custom-domain"
                placeholder="portal.tuempresa.com"
                value={settings.custom_domain || ''}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, custom_domain: e.target.value }))
                }
              />
            </div>

            {settings.custom_domain && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Configuración DNS requerida
                </p>
                <p className="text-sm text-muted-foreground">
                  Añade un registro CNAME en tu DNS apuntando a:
                </p>
                <code className="block px-3 py-2 bg-background rounded text-sm">
                  portal.ip-nexus.app
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
