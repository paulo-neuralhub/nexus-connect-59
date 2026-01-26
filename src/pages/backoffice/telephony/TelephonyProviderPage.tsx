// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Provider Configuration
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Copy,
  ExternalLink,
  Plus,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useTelephonyProviders,
  useTelephonyConfig,
  useUpdateTelephonyConfig,
  useVerifyTelephonyProvider,
  useSyncPhoneNumbers,
  TelephonyProvider,
} from '@/hooks/backoffice/useTelephonyConfig';

export default function TelephonyProviderPage() {
  const { data: providers, isLoading: loadingProviders } = useTelephonyProviders();
  const { data: config, isLoading: loadingConfig } = useTelephonyConfig();
  const updateConfig = useUpdateTelephonyConfig();
  const verifyProvider = useVerifyTelephonyProvider();
  const syncNumbers = useSyncPhoneNumbers();

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [markupPercentage, setMarkupPercentage] = useState(30);
  const [testMode, setTestMode] = useState(true);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Initialize form from config
  useEffect(() => {
    if (config) {
      setSelectedProviderId(config.active_provider_id);
      setCredentials(config.credentials_encrypted || {});
      setMarkupPercentage(Number(config.markup_percentage) || 30);
      setTestMode(config.test_mode ?? true);
    }
  }, [config]);

  const selectedProvider = providers?.find(p => p.id === selectedProviderId);

  const handleVerify = async () => {
    if (!selectedProvider) return;

    setVerifyStatus('verifying');
    setVerifyError(null);

    try {
      const result = await verifyProvider.mutateAsync({
        provider: selectedProvider.code,
        credentials,
      });

      if (result.success) {
        setVerifyStatus('success');
        toast.success('Conexión verificada correctamente');
      } else {
        setVerifyStatus('error');
        setVerifyError(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      setVerifyStatus('error');
      setVerifyError(error.message);
    }
  };

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      id: config?.id,
      active_provider_id: selectedProviderId,
      credentials_encrypted: credentials,
      markup_percentage: markupPercentage,
      test_mode: testMode,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const webhookBaseUrl = 'https://dcdbpmbzizzzzdfkvohl.supabase.co/functions/v1';

  if (loadingProviders || loadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/backoffice/telephony">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración de Proveedor</h1>
            <p className="text-muted-foreground">
              Configura las credenciales y opciones del proveedor de telefonía
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? (
            <Spinner className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar
        </Button>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Proveedor</CardTitle>
          <CardDescription>
            Elige el proveedor de telefonía para tu plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {providers?.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                selected={selectedProviderId === provider.id}
                onSelect={() => {
                  setSelectedProviderId(provider.id);
                  setCredentials({});
                  setVerifyStatus('idle');
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Credenciales {selectedProvider.name}</CardTitle>
            <CardDescription>
              {selectedProvider.setup_instructions && (
                <pre className="whitespace-pre-wrap text-xs mt-2 p-3 bg-muted rounded-lg">
                  {selectedProvider.setup_instructions}
                </pre>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(selectedProvider.required_credentials || []).map((field: string) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={field}
                      type={showSecrets[field] ? 'text' : 'password'}
                      value={credentials[field] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                      placeholder={`Ingresa ${field}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowSecrets({ ...showSecrets, [field]: !showSecrets[field] })}
                    >
                      {showSecrets[field] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifyProvider.isPending}
              >
                {verifyProvider.isPending ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Verificar conexión
              </Button>
              
              {verifyStatus === 'success' && (
                <span className="flex items-center gap-1 text-success">
                  <Check className="h-4 w-4" />
                  Conectado
                </span>
              )}
              
              {verifyStatus === 'error' && (
                <span className="flex items-center gap-1 text-destructive">
                  <X className="h-4 w-4" />
                  Error
                </span>
              )}
            </div>

            {verifyError && (
              <Alert variant="destructive">
                <AlertDescription>{verifyError}</AlertDescription>
              </Alert>
            )}

            {selectedProvider.api_docs_url && (
              <a
                href={selectedProvider.api_docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver documentación de {selectedProvider.name}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phone Numbers */}
      {config?.phone_numbers && config.phone_numbers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Números de Teléfono</CardTitle>
              <CardDescription>
                Números disponibles en tu cuenta
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => syncNumbers.mutate()}
              disabled={syncNumbers.isPending}
            >
              {syncNumbers.isPending ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Número</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">País</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Capacidades</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {config.phone_numbers.map((phone, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 font-mono">{phone.number}</td>
                      <td className="py-2">{phone.country}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {phone.capabilities?.map((cap: string) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2">
                        <Badge variant="default" className="bg-success">
                          Activo
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing & Markup */}
      <Card>
        <CardHeader>
          <CardTitle>Precios y Markup</CardTitle>
          <CardDescription>
            Configura el margen sobre el coste del proveedor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Markup sobre coste del proveedor</Label>
              <span className="text-2xl font-bold text-primary">{markupPercentage}%</span>
            </div>
            <Slider
              value={[markupPercentage]}
              onValueChange={([val]) => setMarkupPercentage(val)}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              Ejemplo: Si el proveedor cobra €0.013/min, cobrarás €{(0.013 * (1 + markupPercentage / 100)).toFixed(4)}/min al tenant
            </p>
          </div>

          {selectedProvider?.base_rates && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Tarifas resultantes (con {markupPercentage}% markup):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Destino</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Coste Proveedor</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Precio Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedProvider.base_rates).map(([key, cost]) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2">{key.replace(/_/g, ' ')}</td>
                        <td className="py-2 text-right font-mono">€{(cost as number).toFixed(4)}</td>
                        <td className="py-2 text-right font-mono text-primary">
                          €{((cost as number) * (1 + markupPercentage / 100)).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={testMode ? 'test' : 'production'} onValueChange={(v) => setTestMode(v === 'test')}>
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="test" id="test" />
              <div>
                <Label htmlFor="test" className="font-medium">Modo Test</Label>
                <p className="text-sm text-muted-foreground">
                  Llamadas de prueba, sin coste real
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="production" id="production" />
              <div>
                <Label htmlFor="production" className="font-medium">Modo Producción</Label>
                <p className="text-sm text-muted-foreground">
                  Llamadas reales, facturación activa
                </p>
              </div>
            </div>
          </RadioGroup>

          {!testMode && (
            <Alert className="mt-4">
              <AlertDescription>
                ⚠️ En modo producción se realizarán cargos reales al proveedor
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Configura estos webhooks en tu cuenta de {selectedProvider?.name || 'proveedor'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WebhookField
            label="Voice URL"
            value={`${webhookBaseUrl}/twilio-voice-webhook`}
            onCopy={copyToClipboard}
          />
          <WebhookField
            label="SMS URL"
            value={`${webhookBaseUrl}/twilio-sms-webhook`}
            onCopy={copyToClipboard}
          />
          <WebhookField
            label="Status Callback"
            value={`${webhookBaseUrl}/twilio-status-webhook`}
            onCopy={copyToClipboard}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderCard({ 
  provider, 
  selected, 
  onSelect 
}: { 
  provider: TelephonyProvider; 
  selected: boolean; 
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex flex-col items-center text-center">
        {provider.logo_url ? (
          <img 
            src={provider.logo_url} 
            alt={provider.name}
            className="h-10 w-10 object-contain mb-2"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2">
            <Phone className="h-5 w-5" />
          </div>
        )}
        <span className="font-medium text-sm">{provider.name}</span>
        <div className="flex items-center gap-1 mt-2">
          {selected && (
            <Badge variant="default" className="text-[10px]">Activo</Badge>
          )}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap justify-center">
          {provider.supports_voice && (
            <Badge variant="outline" className="text-[10px]">Voz</Badge>
          )}
          {provider.supports_sms && (
            <Badge variant="outline" className="text-[10px]">SMS</Badge>
          )}
          {provider.supports_whatsapp && (
            <Badge variant="outline" className="text-[10px]">WhatsApp</Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function WebhookField({ 
  label, 
  value, 
  onCopy 
}: { 
  label: string; 
  value: string; 
  onCopy: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
