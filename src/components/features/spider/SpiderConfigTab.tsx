/**
 * Spider Config Tab — admin only
 */
import { useSpiderTenantConfig } from '@/hooks/use-spider-data';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function SpiderConfigTab() {
  const { data: config, isLoading } = useSpiderTenantConfig();

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Configuración no disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Configuración del tenant</h3>
        <div className="grid grid-cols-2 gap-4">
          <ConfigRow label="Plan" value={<Badge variant="secondary">{config.plan_code}</Badge>} />
          <ConfigRow label="Estado" value={<Badge variant={config.is_active ? 'default' : 'secondary'}>{config.is_active ? 'Activo' : 'Inactivo'}</Badge>} />
          <ConfigRow label="Máx. vigilancias" value={config.max_watches} />
          <ConfigRow label="Máx. jurisdicciones/vigilancia" value={config.max_jurisdictions_per_watch} />
          <ConfigRow label="Máx. escaneos/mes" value={config.max_scans_per_month} />
          <ConfigRow label="Máx. alertas/mes" value={config.max_alerts_per_month} />
          <ConfigRow label="Análisis visual" value={config.feature_visual ? '✅ Activo' : '❌ No disponible'} />
          <ConfigRow label="Vigilancia de dominios" value={config.domain_watch_enabled ? '✅ Activo' : '❌ No disponible'} />
          <ConfigRow label="Escaneo en tiempo real" value={config.realtime_scan_enabled ? '✅ Activo' : '❌ No disponible'} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Umbrales por defecto</h3>
        <div className="grid grid-cols-2 gap-4">
          <ConfigRow label="Umbral fonético" value={`${config.default_phonetic_threshold || 70}%`} />
          <ConfigRow label="Umbral visual" value={`${config.default_visual_threshold || 70}%`} />
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{typeof value === 'object' ? value : String(value)}</span>
    </div>
  );
}
