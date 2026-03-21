/**
 * Backoffice Spider Admin — /backoffice/spider
 * 4 tabs: Global Status, Tenants, Scan Queue, Jurisdictions
 * superadmin only — uses fromTable for spider_* tables
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radar, Building2, Search, Globe, Loader2, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { fromTable } from '@/lib/supabase';
import { toast } from 'sonner';

const SPIDER_VIOLET = '#8B5CF6';

// ─── GLOBAL STATUS TAB ───
function GlobalStatusTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['bo-spider-global'],
    queryFn: async () => {
      const [tenantsRes, watchesRes, todayAlertsRes, configsRes] = await Promise.all([
        fromTable('spider_tenant_config').select('id', { count: 'exact' }).eq('is_active', true),
        fromTable('spider_watches').select('id', { count: 'exact' }),
        fromTable('spider_alerts').select('id', { count: 'exact' }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        fromTable('spider_tenant_config').select('ai_tokens_used'),
      ]);

      const totalTokens = (configsRes.data || []).reduce((sum: number, c: any) => sum + (c.ai_tokens_used || 0), 0);

      return {
        activeTenants: tenantsRes.count || 0,
        totalWatches: watchesRes.count || 0,
        alertsToday: todayAlertsRes.count || 0,
        aiCostEstimate: (totalTokens * 0.00025).toFixed(2),
      };
    },
  });

  // Data source health — check recent scan runs for errors
  const { data: sources } = useQuery({
    queryKey: ['bo-spider-sources'],
    queryFn: async () => {
      const { data: runs } = await fromTable('spider_scan_runs')
        .select('source_api, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      const sourceHealth: Record<string, 'green' | 'yellow' | 'red'> = {
        TMView: 'green', EUIPO: 'green', USPTO: 'green', Perplexity: 'green',
      };

      const sourceMap: Record<string, string> = {
        tmview: 'TMView', euipo: 'EUIPO', uspto: 'USPTO', perplexity: 'Perplexity',
      };

      for (const run of (runs || []) as any[]) {
        const key = sourceMap[run.source_api?.toLowerCase()] || run.source_api;
        if (key && sourceHealth[key]) {
          if (run.status === 'failed') sourceHealth[key] = 'red';
          else if (run.status === 'partial' && sourceHealth[key] !== 'red') sourceHealth[key] = 'yellow';
        }
      }

      return sourceHealth;
    },
  });

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const statusEmoji = { green: '🟢', yellow: '🟡', red: '🔴' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Tenants activos" value={data?.activeTenants ?? 0} />
        <KPICard label="Watches totales" value={data?.totalWatches ?? 0} />
        <KPICard label="Alertas hoy" value={data?.alertsToday ?? 0} />
        <KPICard label="Coste IA (mes)" value={`€${data?.aiCostEstimate ?? '0'}`} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3">Estado de fuentes de datos</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(sources || { TMView: 'green', EUIPO: 'green', USPTO: 'green', Perplexity: 'green' }).map(([name, status]) => (
            <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30">
              <span>{statusEmoji[status as keyof typeof statusEmoji]}</span>
              <span className="text-sm font-medium text-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <NeoBadge value={value} color={SPIDER_VIOLET} size="md" />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </div>
  );
}

// ─── TENANTS TAB ───
function TenantsTab() {
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const qc = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['bo-spider-tenants'],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_tenant_config')
        .select('*, organization:organizations(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await fromTable('spider_tenant_config').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bo-spider-tenants'] });
      toast.success('Estado actualizado');
    },
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {['Organización', 'Plan', 'Watches', 'Alertas/mes', 'Estado', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants?.map((t: any) => (
              <tr key={t.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-foreground">{t.organization?.name || t.organization_id?.slice(0, 8)}</td>
                <td className="py-3 px-4"><Badge variant="secondary" className="text-[10px]">{t.plan_code}</Badge></td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{t.max_watches}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{t.alerts_this_month || 0} / {t.max_alerts_per_month}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${t.is_active ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-muted text-muted-foreground'}`}>
                    {t.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(t)}>Ver</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selectedTenant} onOpenChange={o => !o && setSelectedTenant(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tenant: {selectedTenant?.organization?.name}</SheetTitle>
          </SheetHeader>
          {selectedTenant && (
            <div className="space-y-4 mt-4">
              <InfoRow label="Plan" value={selectedTenant.plan_code} />
              <InfoRow label="Máx watches" value={selectedTenant.max_watches} />
              <InfoRow label="Máx jurisdicciones" value={selectedTenant.max_jurisdictions_per_watch} />
              <InfoRow label="Máx escaneos/mes" value={selectedTenant.max_scans_per_month} />
              <InfoRow label="Máx alertas/mes" value={selectedTenant.max_alerts_per_month} />
              <InfoRow label="Escaneos usados" value={selectedTenant.scans_this_month} />
              <InfoRow label="Alertas usadas" value={selectedTenant.alerts_this_month} />
              <InfoRow label="Visual" value={selectedTenant.feature_visual ? 'Sí' : 'No'} />
              <InfoRow label="Dominios" value={selectedTenant.domain_watch_enabled ? 'Sí' : 'No'} />
              <div className="pt-4 border-t border-border">
                <Button
                  variant={selectedTenant.is_active ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => toggleActive.mutate({ id: selectedTenant.id, is_active: !selectedTenant.is_active })}
                  disabled={toggleActive.isPending}
                >
                  {selectedTenant.is_active ? 'Desactivar módulo' : 'Activar módulo'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{String(value ?? '—')}</span>
    </div>
  );
}

// ─── SCAN QUEUE TAB ───
function ScanQueueTab() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: runs, isLoading } = useQuery({
    queryKey: ['bo-spider-scan-queue', statusFilter],
    queryFn: async () => {
      let q = fromTable('spider_scan_runs')
        .select('*, watch:spider_watches(id, watch_name, organization_id)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('spider_scan_runs').update({ status: 'cancelled' }).eq('id', id).in('status', ['pending', 'running']);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Job cancelado');
    },
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'pending', 'running', 'completed', 'failed'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s || 'Todos'}
          </Button>
        ))}
      </div>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {['Watch', 'Tipo', 'Estado', 'Iniciado', 'Duración', 'Alertas', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs?.map((r: any) => (
              <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-xs font-medium text-foreground">{r.watch?.watch_name || '—'}</td>
                <td className="py-3 px-4"><Badge variant="outline" className="text-[10px]">{r.scan_type}</Badge></td>
                <td className="py-3 px-4">
                  <Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {r.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  {r.started_at ? new Date(r.started_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  {r.started_at && r.completed_at ? `${Math.round((new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000)}s` : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{r.alerts_created ?? 0}</td>
                <td className="py-3 px-4">
                  {['pending', 'running'].includes(r.status) && (
                    <Button variant="ghost" size="sm" onClick={() => cancelMut.mutate(r.id)} disabled={cancelMut.isPending}>
                      Cancelar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!runs?.length && (
              <tr><td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Sin jobs en cola</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── JURISDICTIONS TAB ───
function JurisdictionsTab() {
  const qc = useQueryClient();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newJur, setNewJur] = useState({ jurisdiction_code: '', jurisdiction_name: '', opposition_days: 0, legal_notes: '' });

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['bo-spider-deadlines'],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_opposition_deadlines')
        .select('*')
        .order('jurisdiction_code');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await fromTable('spider_opposition_deadlines').update({ [field]: value }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bo-spider-deadlines'] });
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await fromTable('spider_opposition_deadlines').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bo-spider-deadlines'] });
      setShowNewDialog(false);
      setNewJur({ jurisdiction_code: '', jurisdiction_name: '', opposition_days: 0, legal_notes: '' });
      toast.success('Jurisdicción creada');
    },
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva jurisdicción
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {['Código', 'Nombre', 'Días oposición', 'Notas legales', 'Verificado'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deadlines?.map((d: any) => (
              <tr key={d.id} className="border-b border-border">
                <td className="py-3 px-4 text-xs font-medium text-foreground">{d.jurisdiction_code}</td>
                <td className="py-3 px-4 text-xs text-foreground">{d.jurisdiction_name}</td>
                <td className="py-3 px-4">
                  <Input
                    type="number"
                    className="h-7 w-20 text-xs"
                    defaultValue={d.opposition_days}
                    onBlur={e => {
                      const v = parseInt(e.target.value);
                      if (v !== d.opposition_days) updateMut.mutate({ id: d.id, field: 'opposition_days', value: v });
                    }}
                  />
                </td>
                <td className="py-3 px-4">
                  <Input
                    className="h-7 text-xs"
                    defaultValue={d.legal_notes || ''}
                    onBlur={e => {
                      if (e.target.value !== (d.legal_notes || '')) updateMut.mutate({ id: d.id, field: 'legal_notes', value: e.target.value });
                    }}
                  />
                </td>
                <td className="py-3 px-4 text-[10px] text-muted-foreground">
                  {d.last_verified_at ? new Date(d.last_verified_at).toLocaleDateString('es-ES') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva jurisdicción</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Código (ej: EM)" value={newJur.jurisdiction_code} onChange={e => setNewJur(p => ({ ...p, jurisdiction_code: e.target.value }))} />
            <Input placeholder="Nombre (ej: EUIPO)" value={newJur.jurisdiction_name} onChange={e => setNewJur(p => ({ ...p, jurisdiction_name: e.target.value }))} />
            <Input type="number" placeholder="Días de oposición" value={newJur.opposition_days || ''} onChange={e => setNewJur(p => ({ ...p, opposition_days: parseInt(e.target.value) || 0 }))} />
            <Input placeholder="Notas legales" value={newJur.legal_notes} onChange={e => setNewJur(p => ({ ...p, legal_notes: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate(newJur)} disabled={createMut.isPending || !newJur.jurisdiction_code}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function BackofficeSpiderPage() {
  const [tab, setTab] = useState('global');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${SPIDER_VIOLET}, #7C3AED)`, boxShadow: `0 4px 12px ${SPIDER_VIOLET}40` }}>
          <Radar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Spider — Backoffice</h1>
          <p className="text-sm text-muted-foreground">Administración global del módulo de vigilancia</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="global">📊 Estado Global</TabsTrigger>
          <TabsTrigger value="tenants">🏢 Tenants</TabsTrigger>
          <TabsTrigger value="queue">⏳ Cola de Scans</TabsTrigger>
          <TabsTrigger value="jurisdictions">🌍 Jurisdicciones</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4"><GlobalStatusTab /></TabsContent>
        <TabsContent value="tenants" className="mt-4"><TenantsTab /></TabsContent>
        <TabsContent value="queue" className="mt-4"><ScanQueueTab /></TabsContent>
        <TabsContent value="jurisdictions" className="mt-4"><JurisdictionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
