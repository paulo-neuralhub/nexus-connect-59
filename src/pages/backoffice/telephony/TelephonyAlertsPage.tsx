// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Alerts Configuration
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Bell,
  Mail,
  AlertTriangle,
  Settings,
  Clock,
  Shield,
  Zap,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useTelephonyAlertConfig,
  useUpdateTelephonyAlertConfig,
  useActiveAlerts,
  useSendBulkReminder,
  type AlertConfig,
} from '@/hooks/backoffice/useTelephonyAlerts';
import { ActiveAlertsList } from '@/components/backoffice/telephony/ActiveAlertsList';

export default function TelephonyAlertsPage() {
  const { data: config, isLoading: loadingConfig } = useTelephonyAlertConfig();
  const updateConfig = useUpdateTelephonyAlertConfig();
  const { data: activeAlerts, isLoading: loadingAlerts } = useActiveAlerts();
  const sendBulkReminder = useSendBulkReminder();

  // Form state
  const [enableLowBalance, setEnableLowBalance] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(30);
  const [notifyTenant, setNotifyTenant] = useState(true);
  const [notifyBackoffice, setNotifyBackoffice] = useState(true);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertFrequency, setAlertFrequency] = useState<'once' | 'daily'>('daily');
  
  const [enableZeroBalance, setEnableZeroBalance] = useState(true);
  const [zeroBehavior, setZeroBehavior] = useState<'block' | 'payg' | 'invoice'>('payg');
  
  const [enableExpiration, setEnableExpiration] = useState(true);
  const [expirationDays, setExpirationDays] = useState({
    day30: true,
    day7: true,
    day1: true,
  });
  
  const [enableProviderAlerts, setEnableProviderAlerts] = useState(true);
  const [enableUsageSpike, setEnableUsageSpike] = useState(true);
  const [usageSpikeMinutes, setUsageSpikeMinutes] = useState(100);
  const [usageSpikeWindow, setUsageSpikeWindow] = useState(1);

  // Initialize from config
  useEffect(() => {
    if (config) {
      setEnableLowBalance(config.enableLowBalanceAlerts);
      setLowBalanceThreshold(config.lowBalanceThreshold);
      setNotifyTenant(config.lowBalanceNotifyTenant);
      setNotifyBackoffice(config.lowBalanceNotifyBackoffice);
      setAlertEmail(config.lowBalanceEmail);
      setAlertFrequency(config.lowBalanceFrequency);
      setEnableZeroBalance(config.enableZeroBalanceAlerts);
      setZeroBehavior(config.zeroBehavior);
      setEnableExpiration(config.enableExpirationAlerts);
      setEnableProviderAlerts(config.enableProviderAlerts);
      setEnableUsageSpike(config.enableUsageSpikeAlerts);
      setUsageSpikeMinutes(config.usageSpikeMinutes);
      setUsageSpikeWindow(config.usageSpikeWindow);
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      enableLowBalanceAlerts: enableLowBalance,
      lowBalanceThreshold,
      lowBalanceNotifyTenant: notifyTenant,
      lowBalanceNotifyBackoffice: notifyBackoffice,
      lowBalanceEmail: alertEmail,
      lowBalanceFrequency: alertFrequency,
      enableZeroBalanceAlerts: enableZeroBalance,
      zeroBehavior,
      enableExpirationAlerts: enableExpiration,
      enableProviderAlerts,
      enableUsageSpikeAlerts: enableUsageSpike,
      usageSpikeMinutes,
      usageSpikeWindow,
    });
  };

  const handleSendReminder = (tenantIds: string[]) => {
    sendBulkReminder.mutate(tenantIds);
  };

  if (loadingConfig) {
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
            <h1 className="text-2xl font-bold text-foreground">Configuración de Alertas</h1>
            <p className="text-muted-foreground">
              Configura notificaciones automáticas de telefonía
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Balance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas de Saldo Bajo
              </CardTitle>
              <CardDescription>
                Notifica cuando un tenant tiene pocos minutos restantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-low-balance">Activar alertas de saldo bajo</Label>
                <Switch
                  id="enable-low-balance"
                  checked={enableLowBalance}
                  onCheckedChange={setEnableLowBalance}
                />
              </div>

              {enableLowBalance && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Umbral de alerta (minutos restantes)</Label>
                      <span className="text-lg font-bold text-primary">{lowBalanceThreshold} min</span>
                    </div>
                    <Slider
                      value={[lowBalanceThreshold]}
                      onValueChange={([val]) => setLowBalanceThreshold(val)}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Notificar a:</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="notify-tenant"
                          checked={notifyTenant}
                          onCheckedChange={(v) => setNotifyTenant(!!v)}
                        />
                        <Label htmlFor="notify-tenant" className="font-normal cursor-pointer">
                          Administrador del tenant
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="notify-backoffice"
                          checked={notifyBackoffice}
                          onCheckedChange={(v) => setNotifyBackoffice(!!v)}
                        />
                        <Label htmlFor="notify-backoffice" className="font-normal cursor-pointer">
                          Email de backoffice
                        </Label>
                      </div>
                    </div>
                    
                    {notifyBackoffice && (
                      <Input
                        type="email"
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                        placeholder="alertas@ip-nexus.com"
                        className="mt-2"
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Frecuencia de notificación</Label>
                    <Select value={alertFrequency} onValueChange={(v: 'once' | 'daily') => setAlertFrequency(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Una vez (hasta que recarguen)</SelectItem>
                        <SelectItem value="daily">Diaria (mientras siga bajo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Zero Balance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-destructive" />
                Alertas de Saldo Agotado
              </CardTitle>
              <CardDescription>
                Configura qué sucede cuando se agota el saldo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-zero">Activar alertas cuando se agote el saldo</Label>
                <Switch
                  id="enable-zero"
                  checked={enableZeroBalance}
                  onCheckedChange={setEnableZeroBalance}
                />
              </div>

              {enableZeroBalance && (
                <>
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Comportamiento cuando no hay saldo</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id="zero-block"
                          name="zeroBehavior"
                          checked={zeroBehavior === 'block'}
                          onChange={() => setZeroBehavior('block')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="zero-block" className="font-normal cursor-pointer">
                          Bloquear llamadas salientes
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id="zero-payg"
                          name="zeroBehavior"
                          checked={zeroBehavior === 'payg'}
                          onChange={() => setZeroBehavior('payg')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="zero-payg" className="font-normal cursor-pointer">
                          Permitir con cargo por minuto (pay-as-you-go)
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id="zero-invoice"
                          name="zeroBehavior"
                          checked={zeroBehavior === 'invoice'}
                          onChange={() => setZeroBehavior('invoice')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="zero-invoice" className="font-normal cursor-pointer">
                          Permitir y facturar después
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Expiration Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-info" />
                Alertas de Expiración
              </CardTitle>
              <CardDescription>
                Notifica antes de que expiren los minutos de un pack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-expiration">Notificar antes de expiración</Label>
                <Switch
                  id="enable-expiration"
                  checked={enableExpiration}
                  onCheckedChange={setEnableExpiration}
                />
              </div>

              {enableExpiration && (
                <>
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Días antes de expiración:</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="exp-30"
                          checked={expirationDays.day30}
                          onCheckedChange={(v) => setExpirationDays({ ...expirationDays, day30: !!v })}
                        />
                        <Label htmlFor="exp-30" className="font-normal cursor-pointer">30 días</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="exp-7"
                          checked={expirationDays.day7}
                          onCheckedChange={(v) => setExpirationDays({ ...expirationDays, day7: !!v })}
                        />
                        <Label htmlFor="exp-7" className="font-normal cursor-pointer">7 días</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="exp-1"
                          checked={expirationDays.day1}
                          onCheckedChange={(v) => setExpirationDays({ ...expirationDays, day1: !!v })}
                        />
                        <Label htmlFor="exp-1" className="font-normal cursor-pointer">1 día</Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Operational Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Alertas Operativas
              </CardTitle>
              <CardDescription>
                Monitoreo de problemas y uso anómalo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-provider">Alertar si el proveedor tiene problemas</Label>
                  <p className="text-sm text-muted-foreground">Circuit breaker activado, errores 5xx</p>
                </div>
                <Switch
                  id="enable-provider"
                  checked={enableProviderAlerts}
                  onCheckedChange={setEnableProviderAlerts}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-spike">Alertar si hay consumo inusual</Label>
                    <p className="text-sm text-muted-foreground">Posible fraude o abuso</p>
                  </div>
                  <Switch
                    id="enable-spike"
                    checked={enableUsageSpike}
                    onCheckedChange={setEnableUsageSpike}
                  />
                </div>

                {enableUsageSpike && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="spike-minutes">Más de (minutos)</Label>
                      <Input
                        id="spike-minutes"
                        type="number"
                        min={10}
                        value={usageSpikeMinutes}
                        onChange={(e) => setUsageSpikeMinutes(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spike-window">En (horas)</Label>
                      <Input
                        id="spike-window"
                        type="number"
                        min={1}
                        max={24}
                        value={usageSpikeWindow}
                        onChange={(e) => setUsageSpikeWindow(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                Tenants con Alertas Activas
              </CardTitle>
              <CardDescription>
                Tenants que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveAlertsList
                alerts={activeAlerts || []}
                isLoading={loadingAlerts}
                onSendReminder={handleSendReminder}
                isSending={sendBulkReminder.isPending}
              />
            </CardContent>
          </Card>

          {/* Alert Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa de Alerta</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ Bajo saldo de telefonía</strong>
                  <br />
                  <span className="text-sm">
                    Tu saldo de telefonía es de solo <strong>{lowBalanceThreshold} minutos</strong>.
                    Recarga ahora para seguir realizando llamadas.
                  </span>
                  <br />
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Ejemplo de email/notificación enviada
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
