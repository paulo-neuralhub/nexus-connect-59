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
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTelephonyConfig, useUpdateTelephonyConfig } from '@/hooks/backoffice/useTelephonyConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TelephonyAlertsPage() {
  const { data: config, isLoading: loadingConfig } = useTelephonyConfig();
  const updateConfig = useUpdateTelephonyConfig();

  const [alertThreshold, setAlertThreshold] = useState(30);
  const [alertEmail, setAlertEmail] = useState('');
  const [enableLowBalanceAlerts, setEnableLowBalanceAlerts] = useState(true);
  const [enableUsageSpikes, setEnableUsageSpikes] = useState(true);
  const [enableDailyReport, setEnableDailyReport] = useState(false);

  // Get recent alerts
  const { data: recentAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['telephony-recent-alerts'],
    queryFn: async () => {
      // Get tenants that have low balance
      const { data } = await supabase
        .from('tenant_telephony_balance')
        .select('*, organizations!inner(name)')
        .eq('is_enabled', true)
        .eq('low_balance_alert_sent', true)
        .order('updated_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
  });

  // Initialize from config
  useEffect(() => {
    if (config) {
      setAlertThreshold(config.alert_low_balance_threshold || 30);
      setAlertEmail(config.alert_email || '');
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      id: config?.id,
      alert_low_balance_threshold: alertThreshold,
      alert_email: alertEmail || null,
    });
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
              Configura notificaciones y alertas de telefonía
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Configuration */}
        <div className="space-y-6">
          {/* Low Balance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas de Bajo Saldo
              </CardTitle>
              <CardDescription>
                Notifica cuando un tenant tiene pocos minutos restantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-low-balance">Activar alertas</Label>
                <Switch
                  id="enable-low-balance"
                  checked={enableLowBalanceAlerts}
                  onCheckedChange={setEnableLowBalanceAlerts}
                />
              </div>

              {enableLowBalanceAlerts && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Umbral de alerta</Label>
                      <span className="text-lg font-bold text-primary">{alertThreshold} min</span>
                    </div>
                    <Slider
                      value={[alertThreshold]}
                      onValueChange={([val]) => setAlertThreshold(val)}
                      min={10}
                      max={100}
                      step={5}
                    />
                    <p className="text-sm text-muted-foreground">
                      Se enviará alerta cuando el saldo sea menor a {alertThreshold} minutos
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Usage Spikes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alertas de Uso Anómalo
              </CardTitle>
              <CardDescription>
                Detecta picos inusuales de consumo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-spikes">Activar detección</Label>
                <Switch
                  id="enable-spikes"
                  checked={enableUsageSpikes}
                  onCheckedChange={setEnableUsageSpikes}
                />
              </div>
              
              {enableUsageSpikes && (
                <p className="text-sm text-muted-foreground">
                  Se alertará cuando el consumo sea 3x superior al promedio diario
                </p>
              )}
            </CardContent>
          </Card>

          {/* Daily Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-info" />
                Informe Diario
              </CardTitle>
              <CardDescription>
                Recibe un resumen diario de actividad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-daily">Activar informe</Label>
                <Switch
                  id="enable-daily"
                  checked={enableDailyReport}
                  onCheckedChange={setEnableDailyReport}
                />
              </div>
              
              {enableDailyReport && (
                <p className="text-sm text-muted-foreground">
                  Se enviará a las 9:00 AM cada día
                </p>
              )}
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-email">Email para alertas</Label>
                <Input
                  id="alert-email"
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                />
                <p className="text-sm text-muted-foreground">
                  Todas las alertas se enviarán a este email
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
              <CardDescription>
                Últimas alertas enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentAlerts && recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {recentAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium text-sm">
                            {alert.organizations?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {alert.minutes_balance} min
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Enviada</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay alertas recientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Alerta</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Bajo saldo de telefonía</strong>
                  <br />
                  El tenant "Ejemplo Corp" tiene solo {alertThreshold} minutos restantes.
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Este es un ejemplo de cómo se verá la alerta
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
