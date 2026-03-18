/**
 * Phone/Telephony Settings Page
 * Configure IP-Nexus (included) or external providers (Twilio, Vonage, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, 
  Settings, 
  CheckCircle, 
  XCircle,
  Crown,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Mic,
  Voicemail,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { usePhoneSettings, PhoneProvider } from '@/hooks/use-phone-settings';
import { Link } from 'react-router-dom';

// Available providers
const PROVIDERS = [
  { 
    id: 'ip_nexus' as PhoneProvider, 
    name: 'IP-Nexus', 
    description: 'Incluido en tu suscripción',
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    requiresSubscription: true 
  },
  { 
    id: 'twilio' as PhoneProvider, 
    name: 'Twilio', 
    description: 'Proveedor VoIP popular',
    icon: Phone,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    requiresSubscription: false 
  },
  { 
    id: 'vonage' as PhoneProvider, 
    name: 'Vonage', 
    description: 'Antes conocido como Nexmo',
    icon: Phone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    requiresSubscription: false 
  },
  { 
    id: 'aircall' as PhoneProvider, 
    name: 'Aircall', 
    description: 'Sistema de call center',
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    requiresSubscription: false 
  },
  { 
    id: 'other' as PhoneProvider, 
    name: 'Otro proveedor', 
    description: 'Configuración personalizada',
    icon: Settings,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    requiresSubscription: false 
  },
];

export default function PhoneSettings() {
  const { 
    config, 
    balance,
    isLoading, 
    hasPhoneModule, 
    activateIPNexus,
    saveProviderConfig 
  } = usePhoneSettings();

  const [selectedProvider, setSelectedProvider] = useState<PhoneProvider>('none');
  const [formData, setFormData] = useState({
    // Twilio
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    // Vonage
    vonage_api_key: '',
    vonage_api_secret: '',
    vonage_phone_number: '',
    // Aircall
    aircall_api_id: '',
    aircall_api_token: '',
    // Other
    other_provider_name: '',
    // General
    default_country_code: '+34',
    recording_enabled: false,
    voicemail_enabled: true,
    voicemail_email: '',
  });

  // Load existing config
  useEffect(() => {
    if (config) {
      setSelectedProvider((config.provider as PhoneProvider) || 'none');
      setFormData({
        twilio_account_sid: config.account_sid || '',
        twilio_auth_token: '', // Don't show existing token
        twilio_phone_number: config.primary_number || '',
        vonage_api_key: config.vonage_api_key || '',
        vonage_api_secret: '', // Don't show existing secret
        vonage_phone_number: config.vonage_phone_number || '',
        aircall_api_id: config.aircall_api_id || '',
        aircall_api_token: '', // Don't show existing token
        other_provider_name: config.other_provider_name || '',
        default_country_code: config.default_country_code || '+34',
        recording_enabled: config.recording_enabled || false,
        voicemail_enabled: config.voicemail_enabled ?? true,
        voicemail_email: config.voicemail_email || '',
      });
    }
  }, [config]);

  const handleSaveProvider = async () => {
    const data: Parameters<typeof saveProviderConfig.mutate>[0] = {
      provider: selectedProvider,
      general: {
        default_country_code: formData.default_country_code,
        recording_enabled: formData.recording_enabled,
        voicemail_enabled: formData.voicemail_enabled,
        voicemail_email: formData.voicemail_email,
      },
    };

    if (selectedProvider === 'twilio' && formData.twilio_account_sid) {
      data.twilio = {
        account_sid: formData.twilio_account_sid,
        auth_token: formData.twilio_auth_token,
        phone_number: formData.twilio_phone_number,
      };
    }

    if (selectedProvider === 'vonage' && formData.vonage_api_key) {
      data.vonage = {
        api_key: formData.vonage_api_key,
        api_secret: formData.vonage_api_secret,
        phone_number: formData.vonage_phone_number,
      };
    }

    if (selectedProvider === 'aircall' && formData.aircall_api_id) {
      data.aircall = {
        api_id: formData.aircall_api_id,
        api_token: formData.aircall_api_token,
      };
    }

    if (selectedProvider === 'other' && formData.other_provider_name) {
      data.other = {
        name: formData.other_provider_name,
      };
    }

    saveProviderConfig.mutate(data);
  };

  const getProviderStatus = () => {
    if (!config || config.provider === 'none') {
      return { active: false, label: 'No configurado', variant: 'secondary' as const };
    }
    if (config.ip_nexus_enabled || config.provider === 'ip_nexus') {
      return { active: true, label: 'IP-Nexus Activo', variant: 'default' as const };
    }
    const provider = PROVIDERS.find(p => p.id === config.provider);
    return { active: true, label: `${provider?.name || config.provider} Activo`, variant: 'default' as const };
  };

  const status = getProviderStatus();
  const isSaving = activateIPNexus.isPending || saveProviderConfig.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuración de Teléfono</h1>
            <p className="text-muted-foreground">
              Configura la integración telefónica para llamadas
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className={status.active ? 'bg-green-600' : ''}>
          {status.label}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Zap className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="provider">
            <Settings className="h-4 w-4 mr-2" />
            Proveedor
          </TabsTrigger>
          <TabsTrigger value="options">
            <Mic className="h-4 w-4 mr-2" />
            Opciones
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current status card */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de la integración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status.active ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Telefonía</p>
                    <p className="text-sm text-muted-foreground">{status.label}</p>
                  </div>
                </div>
                <Badge variant={status.variant} className={status.active ? 'bg-green-600' : ''}>
                  {status.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {config?.ip_nexus_phone_number && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">Tu número IP-Nexus:</p>
                  <p className="text-xl font-semibold">{config.ip_nexus_phone_number}</p>
                </div>
              )}

              {balance && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{balance.minutes_balance || 0}</p>
                    <p className="text-xs text-muted-foreground">Minutos disponibles</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{balance.total_minutes_used || 0}</p>
                    <p className="text-xs text-muted-foreground">Minutos usados</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">€{Number(balance.total_spent || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Gasto total</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription info */}
          {hasPhoneModule() ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <Crown className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Módulo de Teléfono incluido
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Tu suscripción incluye IP-Nexus Phone. Puedes activarlo sin configuración adicional.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Módulo no incluido
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Tu suscripción actual no incluye el módulo de Teléfono. 
                Puedes configurar un proveedor externo o actualizar tu plan.
                <Button variant="link" asChild className="px-1 text-amber-700 dark:text-amber-300">
                  <Link to="/configuraciones/suscripcion">Ver planes →</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab: Provider */}
        <TabsContent value="provider">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar proveedor</CardTitle>
              <CardDescription>
                Elige el proveedor de telefonía que deseas usar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider list */}
              <div className="grid gap-3">
                {PROVIDERS.map((provider) => {
                  const isDisabled = provider.requiresSubscription && !hasPhoneModule();
                  const isSelected = selectedProvider === provider.id;
                  const ProviderIcon = provider.icon;

                  return (
                    <div
                      key={provider.id}
                      className={`
                        relative flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                        ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                    >
                      <div className={`h-10 w-10 rounded-lg ${provider.bgColor} flex items-center justify-center`}>
                        <ProviderIcon className={`h-5 w-5 ${provider.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{provider.name}</p>
                          {provider.id === 'ip_nexus' && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Incluido
                            </Badge>
                          )}
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                        {isDisabled && (
                          <p className="text-xs text-amber-600 mt-1">
                            Requiere módulo de Teléfono en tu suscripción
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Provider-specific config */}
              {selectedProvider === 'ip_nexus' && (
                <div className="space-y-4">
                  <h4 className="font-medium">IP-Nexus Phone</h4>
                  {config?.ip_nexus_enabled ? (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Activo</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Número: {config.ip_nexus_phone_number}
                        </p>
                        {config.ip_nexus_activated_at && (
                          <p className="text-xs text-green-600">
                            Activado: {new Date(config.ip_nexus_activated_at).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        IP-Nexus Phone está incluido en tu suscripción. 
                        Al activarlo se te asignará un número de teléfono automáticamente.
                      </p>
                      <Button 
                        onClick={() => activateIPNexus.mutate()} 
                        disabled={!hasPhoneModule() || isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4 mr-2" />
                        )}
                        Activar IP-Nexus Phone
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedProvider === 'twilio' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración de Twilio</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Account SID</Label>
                      <Input
                        value={formData.twilio_account_sid}
                        onChange={(e) => setFormData({...formData, twilio_account_sid: e.target.value})}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auth Token</Label>
                      <Input
                        type="password"
                        value={formData.twilio_auth_token}
                        onChange={(e) => setFormData({...formData, twilio_auth_token: e.target.value})}
                        placeholder={config?.account_sid ? '••••••••' : 'Tu auth token de Twilio'}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Número de teléfono</Label>
                      <Input
                        value={formData.twilio_phone_number}
                        onChange={(e) => setFormData({...formData, twilio_phone_number: e.target.value})}
                        placeholder="+34612345678"
                      />
                    </div>
                  </div>
                  <Button variant="link" asChild className="px-0">
                    <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                      Obtener credenciales en Twilio <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </div>
              )}

              {selectedProvider === 'vonage' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración de Vonage</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        value={formData.vonage_api_key}
                        onChange={(e) => setFormData({...formData, vonage_api_key: e.target.value})}
                        placeholder="Tu API key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret</Label>
                      <Input
                        type="password"
                        value={formData.vonage_api_secret}
                        onChange={(e) => setFormData({...formData, vonage_api_secret: e.target.value})}
                        placeholder={config?.vonage_api_key ? '••••••••' : 'Tu API secret'}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Número de teléfono</Label>
                      <Input
                        value={formData.vonage_phone_number}
                        onChange={(e) => setFormData({...formData, vonage_phone_number: e.target.value})}
                        placeholder="+34612345678"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedProvider === 'aircall' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración de Aircall</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>API ID</Label>
                      <Input
                        value={formData.aircall_api_id}
                        onChange={(e) => setFormData({...formData, aircall_api_id: e.target.value})}
                        placeholder="Tu API ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Token</Label>
                      <Input
                        type="password"
                        value={formData.aircall_api_token}
                        onChange={(e) => setFormData({...formData, aircall_api_token: e.target.value})}
                        placeholder={config?.aircall_api_id ? '••••••••' : 'Tu API token'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedProvider === 'other' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Otro proveedor</h4>
                  <div className="space-y-2">
                    <Label>Nombre del proveedor</Label>
                    <Input
                      value={formData.other_provider_name}
                      onChange={(e) => setFormData({...formData, other_provider_name: e.target.value})}
                      placeholder="Nombre del proveedor VoIP"
                    />
                  </div>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Para integrar otros proveedores, contacta con soporte técnico para 
                      configurar la integración personalizada.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {selectedProvider !== 'none' && selectedProvider !== 'ip_nexus' && (
                <Button onClick={handleSaveProvider} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Guardar configuración
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Options */}
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de llamadas</CardTitle>
              <CardDescription>
                Configura las opciones generales de telefonía
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Código de país por defecto</Label>
                <Select
                  value={formData.default_country_code}
                  onValueChange={(value) => setFormData({...formData, default_country_code: value})}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+34">🇪🇸 España (+34)</SelectItem>
                    <SelectItem value="+351">🇵🇹 Portugal (+351)</SelectItem>
                    <SelectItem value="+33">🇫🇷 Francia (+33)</SelectItem>
                    <SelectItem value="+44">🇬🇧 Reino Unido (+44)</SelectItem>
                    <SelectItem value="+49">🇩🇪 Alemania (+49)</SelectItem>
                    <SelectItem value="+1">🇺🇸 Estados Unidos (+1)</SelectItem>
                    <SelectItem value="+52">🇲🇽 México (+52)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <Label>Grabar llamadas</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Graba automáticamente todas las llamadas
                  </p>
                </div>
                <Switch
                  checked={formData.recording_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, recording_enabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Voicemail className="h-4 w-4 text-muted-foreground" />
                    <Label>Buzón de voz</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Activar buzón de voz cuando no se contesta
                  </p>
                </div>
                <Switch
                  checked={formData.voicemail_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, voicemail_enabled: checked})}
                />
              </div>

              {formData.voicemail_enabled && (
                <div className="space-y-2 pl-6">
                  <Label>Email para notificaciones de buzón</Label>
                  <Input
                    type="email"
                    value={formData.voicemail_email}
                    onChange={(e) => setFormData({...formData, voicemail_email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              )}

              <Separator />

              <Button onClick={handleSaveProvider} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Guardar opciones
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
