/**
 * SP01-C — Spider Watches Panel (right 30% column)
 * Real DB data, toggle is_active, Sheet form for create/edit.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Plus, Settings, Pause, Play, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { SpiderWatchSheet } from './SpiderWatchSheet';

const SPIDER_VIOLET = '#8B5CF6';

export function SpiderWatchesPanel() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<any>(null);

  const { data: watches, isLoading: watchesLoading } = useQuery({
    queryKey: ['spider-watches-panel', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_watches')
        .select(`
          id, watch_name, watch_type, jurisdictions,
          nice_classes, similarity_threshold, is_active,
          scan_frequency, last_scanned_at,
          total_alerts_generated, active_alerts_count,
          weight_phonetic, weight_semantic, weight_visual,
          mark_image_url, brand_authorized_handles
        `)
        .eq('organization_id', orgId!)
        .order('active_alerts_count', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const { data: config } = useQuery({
    queryKey: ['spider-watch-config', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_tenant_config')
        .select('max_watches, plan_code, domain_watch_enabled, realtime_scan_enabled')
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('spider_watches' as any)
        .update({ is_active: !is_active } as any)
        .eq('id', id)
        .eq('organization_id', orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spider-watches-panel'] });
      qc.invalidateQueries({ queryKey: ['spider-kpis'] });
      qc.invalidateQueries({ queryKey: ['spider-badge-counts'] });
    },
  });

  const activeCount = watches?.filter(w => w.is_active).length ?? 0;
  const maxWatches = config?.max_watches ?? 0;
  const usagePct = maxWatches > 0 ? Math.round((activeCount / maxWatches) * 100) : 0;
  const usageColor = usagePct >= 100 ? '#EF4444' : usagePct >= 80 ? '#F59E0B' : SPIDER_VIOLET;

  const openNew = () => { setEditingWatch(null); setSheetOpen(true); };
  const openEdit = (w: any) => { setEditingWatch(w); setSheetOpen(true); };

  if (watchesLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[120px] rounded-[14px]" />
        <Skeleton className="h-[120px] rounded-[14px]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* ── Panel header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              {activeCount} / {maxWatches === 0 ? '∞' : maxWatches}
            </span>
          </div>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={openNew}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Watch cards ── */}
        {(!watches || watches.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Eye className="w-10 h-10 opacity-40" />
            <p className="font-semibold text-sm">Sin vigilancias activas</p>
            <p className="text-xs text-center">Añade tu primera marca para protegerla</p>
            <Button variant="outline" size="sm" className="gap-1" onClick={openNew}>
              <Plus className="w-3 h-3" /> Añadir
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {watches.map(w => (
              <WatchCard
                key={w.id}
                watch={w}
                orgId={orgId!}
                onEdit={() => openEdit(w)}
                onToggle={() => toggleActive.mutate({ id: w.id, is_active: w.is_active })}
                toggling={toggleActive.isPending}
              />
            ))}
          </div>
        )}

        {/* ── Footer usage bar ── */}
        {watches && watches.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <Progress
              value={maxWatches > 0 ? Math.min(usagePct, 100) : 0}
              stateColor={usageColor}
              className="h-1.5"
            />
            <p className="text-[10px] text-muted-foreground text-center">
              {activeCount} activas de {maxWatches === 0 ? '∞' : maxWatches} disponibles en tu plan
            </p>
          </div>
        )}
      </div>

      <SpiderWatchSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        watch={editingWatch}
        config={config}
      />
    </>
  );
}

// ════════════════════════════════════════════
// Watch Card
// ════════════════════════════════════════════

function WatchCard({
  watch,
  orgId,
  onEdit,
  onToggle,
  toggling,
}: {
  watch: any;
  orgId: string;
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const [domainScanning, setDomainScanning] = useState(false);
  const jurisdictions: string[] = Array.isArray(watch.jurisdictions) ? watch.jurisdictions : [];
  const niceClasses: number[] = Array.isArray(watch.nice_classes) ? watch.nice_classes : [];
  const visibleJurisdictions = jurisdictions.slice(0, 4);
  const extraJurisdictions = jurisdictions.length - 4;
  const threshold = watch.similarity_threshold ?? 70;

  const scannedAgo = watch.last_scanned_at
    ? formatDistanceToNow(new Date(watch.last_scanned_at), { addSuffix: false, locale: es })
    : null;

  return (
    <div className="rounded-[14px] border border-border bg-card p-3 space-y-2">
      {/* Row 1: status + name + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: watch.is_active ? '#22C55E' : '#cbd5e1' }}
          />
          <span className="text-sm font-bold text-foreground truncate">{watch.watch_name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Editar vigilancia</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  setDomainScanning(true);
                  try {
                    const { error } = await supabase.functions.invoke('spider-domain-scan', {
                      body: { organization_id: orgId },
                    });
                    if (error) throw error;
                    toast.success('Escaneando dominios... Los resultados aparecerán en breve');
                  } catch {
                    toast.error('No se pudo iniciar el escaneo de dominios');
                  } finally {
                    setTimeout(() => setDomainScanning(false), 60000);
                  }
                }}
                disabled={domainScanning}
              >
                {domainScanning ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Escaneando...</>
                ) : (
                  <><Globe className="w-3 h-3 mr-1" /> Escanear dominios ahora</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            disabled={toggling}
          >
            {watch.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Row 2: type + frequency */}
      <p className="text-xs text-muted-foreground">
        {watch.watch_type || 'trademark'} · {watch.scan_frequency || 'daily'}
      </p>

      {/* Row 3: jurisdictions */}
      {jurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleJurisdictions.map(j => (
            <Badge key={j} variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">{j}</Badge>
          ))}
          {extraJurisdictions > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">+{extraJurisdictions}</Badge>
          )}
        </div>
      )}

      {/* Row 4: nice classes */}
      {niceClasses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {niceClasses.map(c => (
            <span
              key={c}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: `${SPIDER_VIOLET}15`, color: SPIDER_VIOLET }}
            >
              Cl. {c}
            </span>
          ))}
        </div>
      )}

      {/* Row 5: threshold bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Umbral</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${threshold}%`, background: SPIDER_VIOLET }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: SPIDER_VIOLET }}>
          {threshold}%
        </span>
      </div>

      {/* Row 6: metrics */}
      <p className="text-[10px] text-muted-foreground">
        {watch.total_alerts_generated ?? 0} alertas
        {scannedAgo && <> · escaneado hace {scannedAgo}</>}
      </p>
    </div>
  );
}
