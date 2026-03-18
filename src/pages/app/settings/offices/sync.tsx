import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Info } from "lucide-react";
import { useTenantSyncConfig } from "@/hooks/useTenantSyncConfig";

const MATTER_TYPES = [
  { value: 'trademark', label: 'Marcas' },
  { value: 'patent', label: 'Patentes' },
  { value: 'design', label: 'Diseños' },
  { value: 'utility_model', label: 'Modelos de utilidad' },
];

const MATTER_STATUSES = [
  { value: 'filed', label: 'Presentado' },
  { value: 'examination', label: 'En examen' },
  { value: 'published', label: 'Publicado' },
  { value: 'registered', label: 'Registrado' },
  { value: 'refused', label: 'Denegado' },
  { value: 'archived', label: 'Archivado' },
];

export default function SyncPreferencesPage() {
  const { config, isLoading, updateConfig, isUpdating } = useTenantSyncConfig();
  
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleToggle = (field: keyof typeof localConfig) => {
    setLocalConfig(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleArrayToggle = (field: 'sync_matter_types' | 'sync_matter_statuses', value: string) => {
    setLocalConfig(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSave = async () => {
    await updateConfig(localConfig);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preferencias de Sincronización</h1>
          <p className="text-muted-foreground mt-1">
            Configura cómo se sincronizan tus expedientes con las oficinas de PI
          </p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar preferencias
        </Button>
      </div>

      {/* What to Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Qué sincronizar</CardTitle>
          <CardDescription>
            Selecciona qué datos se actualizan automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync_status">Actualizar estado de expedientes</Label>
              <p className="text-sm text-muted-foreground">
                Consultar oficinas y actualizar estado en IP-NEXUS
              </p>
            </div>
            <Switch
              id="sync_status"
              checked={localConfig.sync_status}
              onCheckedChange={() => handleToggle('sync_status')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync_documents">Descargar documentos nuevos automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Descargar y adjuntar docs oficiales a expedientes
              </p>
            </div>
            <Switch
              id="sync_documents"
              checked={localConfig.sync_documents}
              onCheckedChange={() => handleToggle('sync_documents')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_create_deadlines">Crear plazos automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Generar alarmas según cambios de estado
              </p>
            </div>
            <Switch
              id="auto_create_deadlines"
              checked={localConfig.auto_create_deadlines}
              onCheckedChange={() => handleToggle('auto_create_deadlines')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Configura cuándo recibir alertas sobre cambios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_on_status_change">Notificar cuando cambie el estado de un expediente</Label>
            </div>
            <Switch
              id="notify_on_status_change"
              checked={localConfig.notify_on_status_change}
              onCheckedChange={() => handleToggle('notify_on_status_change')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_on_new_document">Notificar cuando haya documentos nuevos</Label>
            </div>
            <Switch
              id="notify_on_new_document"
              checked={localConfig.notify_on_new_document}
              onCheckedChange={() => handleToggle('notify_on_new_document')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="send_daily_summary">Enviar resumen diario por email</Label>
            </div>
            <Switch
              id="send_daily_summary"
              checked={localConfig.send_daily_summary}
              onCheckedChange={() => handleToggle('send_daily_summary')}
            />
          </div>

          {localConfig.send_daily_summary && (
            <div className="ml-4 border-l-2 pl-4">
              <Label htmlFor="notification_email">Email para resumen</Label>
              <Input
                id="notification_email"
                type="email"
                placeholder="admin@tuempresa.es"
                value={localConfig.notification_email || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, notification_email: e.target.value }))}
                className="mt-1 max-w-md"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Matters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar expedientes a sincronizar</CardTitle>
          <CardDescription>
            Selecciona qué tipos y estados de expedientes se sincronizan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Tipos de expediente:</Label>
            <div className="flex flex-wrap gap-4">
              {MATTER_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={localConfig.sync_matter_types?.includes(type.value) || false}
                    onCheckedChange={() => handleArrayToggle('sync_matter_types', type.value)}
                  />
                  <Label htmlFor={`type-${type.value}`} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Estados de expediente:</Label>
            <div className="flex flex-wrap gap-4">
              {MATTER_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={localConfig.sync_matter_statuses?.includes(status.value) || false}
                    onCheckedChange={() => handleArrayToggle('sync_matter_statuses', status.value)}
                  />
                  <Label htmlFor={`status-${status.value}`} className="font-normal cursor-pointer">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Solo se sincronizan expedientes activos con número de solicitud oficial asignado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
