/**
 * Spider tab for MatterDetailPage
 * Shows alerts linked to watches for this matter
 */
import { Radar, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpiderAlertsForMatter } from '@/hooks/use-spider-data';
import { useModuleAccess } from '@/hooks/use-module-access';

function getScoreColor(score: number): string {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F97316';
  if (score >= 40) return '#F59E0B';
  return '#22C55E';
}

export function MatterSpiderTab({ matterId }: { matterId: string }) {
  const { hasAccess } = useModuleAccess('spider');
  const { data: alerts, isLoading } = useSpiderAlertsForMatter(matterId);

  if (!hasAccess) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Radar className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Módulo Spider no activo</p>
        <p className="text-sm mt-1">Activa Spider para monitorizar este expediente</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>;
  }

  if (!alerts?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Sin alertas Spider</p>
        <p className="text-sm mt-1">No hay vigilancias vinculadas o no se han detectado conflictos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{alerts.length} alerta{alerts.length > 1 ? 's' : ''} detectada{alerts.length > 1 ? 's' : ''}</p>
      {alerts.map((alert: any) => {
        const score = alert.combined_score || alert.phonetic_score || 0;
        const color = getScoreColor(score);
        return (
          <div key={alert.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-[#8B5CF6]" />
                <span className="font-medium text-sm text-foreground">{alert.detected_mark_name || 'Marca detectada'}</span>
                <Badge variant="outline" className="text-[10px]">{alert.severity}</Badge>
              </div>
              <span className="text-xs font-bold" style={{ color }}>{score}%</span>
            </div>
            <Progress value={score} stateColor={color} className="h-1.5" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {alert.detected_jurisdiction && <span>{alert.detected_jurisdiction}</span>}
              {alert.detected_at && <span>{new Date(alert.detected_at).toLocaleDateString('es-ES')}</span>}
              {alert.watch?.watch_name && <span>Vigilancia: {alert.watch.watch_name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
