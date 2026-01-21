import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlertConfigurations, useUpdateAlertConfiguration } from '@/hooks/usePredictiveAlerts';
import { ALERT_TYPE_LABELS, SEVERITY_LABELS } from '@/types/predictive-alerts';
import type { AlertType, AlertSeverity } from '@/types/predictive-alerts';
import { toast } from 'sonner';

const ALERT_TYPES: AlertType[] = [
  'deadline_risk',
  'payment_risk',
  'workload_imbalance',
  'client_churn',
  'cost_overrun',
  'renewal_upcoming',
  'conflict_detected',
  'anomaly_detected',
  'opportunity',
  'compliance_risk',
];

const SEVERITIES: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

const FREQUENCIES = [
  { value: 'hourly', label: 'Cada hora' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
];

export default function AlertsSettingsPage() {
  const { data: configurations, isLoading } = useAlertConfigurations();
  const updateMutation = useUpdateAlertConfiguration();

  const handleUpdate = async (alertType: AlertType, field: string, value: unknown) => {
    try {
      await updateMutation.mutateAsync({
        alert_type: alertType,
        [field]: value,
      });
      toast.success('Configuración actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const getConfig = (alertType: AlertType) => {
    return configurations?.find(c => c.alert_type === alertType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/alerts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Configuración de Alertas
          </h1>
          <p className="text-muted-foreground">
            Personaliza qué alertas recibir y cómo notificarte
          </p>
        </div>
      </div>

      {/* Alert Type Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          ALERT_TYPES.map((alertType) => {
            const config = getConfig(alertType);
            const isEnabled = config?.is_enabled ?? true;

            return (
              <Card key={alertType} className={!isEnabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {ALERT_TYPE_LABELS[alertType]}
                      </CardTitle>
                      <CardDescription>
                        {getAlertDescription(alertType)}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleUpdate(alertType, 'is_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                
                {isEnabled && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Min Severity */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Severidad mínima
                        </Label>
                        <Select
                          value={config?.min_severity || 'low'}
                          onValueChange={(v) => handleUpdate(alertType, 'min_severity', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITIES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {SEVERITY_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notifications */}
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">
                          Notificaciones
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`${alertType}-email`}
                              checked={config?.notify_email ?? true}
                              onCheckedChange={(v) => handleUpdate(alertType, 'notify_email', v)}
                            />
                            <Label htmlFor={`${alertType}-email`} className="text-sm">
                              Email
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`${alertType}-inapp`}
                              checked={config?.notify_in_app ?? true}
                              onCheckedChange={(v) => handleUpdate(alertType, 'notify_in_app', v)}
                            />
                            <Label htmlFor={`${alertType}-inapp`} className="text-sm">
                              In-App
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Auto Analyze */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Análisis automático
                        </Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${alertType}-auto`}
                            checked={config?.auto_analyze_enabled ?? false}
                            onCheckedChange={(v) => handleUpdate(alertType, 'auto_analyze_enabled', v)}
                          />
                          <Label htmlFor={`${alertType}-auto`} className="text-sm">
                            Activar
                          </Label>
                        </div>
                      </div>

                      {/* Frequency */}
                      {config?.auto_analyze_enabled && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Frecuencia
                          </Label>
                          <Select
                            value={config?.analyze_frequency || 'daily'}
                            onValueChange={(v) => handleUpdate(alertType, 'analyze_frequency', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCIES.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function getAlertDescription(alertType: AlertType): string {
  const descriptions: Record<AlertType, string> = {
    deadline_risk: 'Detecta expedientes con plazos próximos a vencer',
    payment_risk: 'Identifica facturas con riesgo de impago',
    workload_imbalance: 'Alerta sobre desequilibrios en la carga de trabajo',
    client_churn: 'Predice clientes con riesgo de abandono',
    cost_overrun: 'Detecta sobrecostes en expedientes',
    renewal_upcoming: 'Notifica renovaciones próximas',
    conflict_detected: 'Identifica conflictos potenciales',
    anomaly_detected: 'Detecta patrones anómalos',
    opportunity: 'Sugiere oportunidades de negocio',
    compliance_risk: 'Alerta sobre riesgos de cumplimiento',
  };
  return descriptions[alertType];
}
