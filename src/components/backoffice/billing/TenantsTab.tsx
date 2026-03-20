import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit2, ChevronDown, AlertTriangle, Clock } from 'lucide-react';
import {
  useTenantFlagsList,
  useBillingPlans,
  useBillingAddons,
  useBillingHistory,
  useUpdateTenantFlags,
  useInsertBillingHistory,
  useOrganizations,
  type TenantFlags,
  type BillingHistory,
} from '@/hooks/useBillingData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PAGE_SIZE = 20;

export function TenantsTab() {
  const { data: tenants = [], isLoading } = useTenantFlagsList();
  const { data: orgs = [] } = useOrganizations();
  const { data: plans = [] } = useBillingPlans();
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [editTenant, setEditTenant] = useState<TenantFlags | null>(null);

  const enriched = useMemo(() => {
    return tenants.map(t => ({
      ...t,
      org: orgs.find(o => o.id === t.organization_id),
      plan: plans.find(p => p.code === t.current_plan_code),
    }));
  }, [tenants, orgs, plans]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (planFilter !== 'all') list = list.filter(t => t.current_plan_code === planFilter);
    if (statusFilter === 'active') list = list.filter(t => t.is_active && !t.is_in_trial);
    if (statusFilter === 'trial') list = list.filter(t => t.is_in_trial);
    if (statusFilter === 'suspended') list = list.filter(t => !t.is_active);
    if (searchTerm) list = list.filter(t => t.org?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [enriched, planFilter, statusFilter, searchTerm]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (isLoading) return <div className="animate-pulse h-48 bg-slate-100 rounded-xl" />;

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar organización..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={planFilter} onValueChange={v => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los planes</SelectItem>
            {plans.map(p => <SelectItem key={p.code} value={p.code}>{p.name_es}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Organización</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Ciclo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Trial</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Genius</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Spider</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{t.org?.name || t.organization_id.slice(0, 8)}</td>
                <td className="px-4 py-3"><Badge variant="outline">{t.plan?.name_es || t.current_plan_code}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{t.current_billing_cycle === 'annual' ? 'Anual' : 'Mensual'}</td>
                <td className="px-4 py-3">{t.is_in_trial ? <Badge className="bg-amber-100 text-amber-700">Trial</Badge> : '—'}</td>
                <td className="px-4 py-3">
                  {t.is_active
                    ? <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                    : <Badge className="bg-red-100 text-red-700">Suspendido</Badge>
                  }
                </td>
                <td className="px-4 py-3 text-slate-500">{t.effective_limit_genius_queries_monthly === -1 ? '∞' : t.effective_limit_genius_queries_monthly}</td>
                <td className="px-4 py-3 text-slate-500">{t.effective_limit_spider_alerts_monthly === -1 ? '∞' : t.effective_limit_spider_alerts_monthly}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => setEditTenant(t)}><Edit2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-500">{filtered.length} tenants</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} variant={page === i ? 'default' : 'outline'} size="sm" onClick={() => setPage(i)}>{i + 1}</Button>
            ))}
          </div>
        </div>
      )}

      {editTenant && (
        <TenantEditSheet
          tenant={editTenant}
          orgName={orgs.find(o => o.id === editTenant.organization_id)?.name || ''}
          open={!!editTenant}
          onClose={() => setEditTenant(null)}
        />
      )}
    </>
  );
}

function TenantEditSheet({ tenant, orgName, open, onClose }: { tenant: TenantFlags; orgName: string; open: boolean; onClose: () => void }) {
  const { data: plans = [] } = useBillingPlans();
  const { data: addons = [] } = useBillingAddons();
  const { data: history = [] } = useBillingHistory(tenant.organization_id);
  const updateFlags = useUpdateTenantFlags();
  const insertHistory = useInsertBillingHistory();

  const [form, setForm] = useState<Record<string, any>>({ ...tenant });
  const [notes, setNotes] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const recalculate = async () => {
    try {
      const { error } = await supabase.rpc('recalculate_tenant_flags', {
        p_org_id: tenant.organization_id,
        p_plan_code: form.current_plan_code,
        p_addons: JSON.stringify(form.current_addons || []),
        p_billing_cycle: form.current_billing_cycle,
      });
      if (error) throw error;
      toast.success('Flags recalculados');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const save = () => {
    const { id, org, plan, ...updates } = form;
    updateFlags.mutate({ id: tenant.id, ...updates }, {
      onSuccess: () => {
        insertHistory.mutate({
          organization_id: tenant.organization_id,
          changed_by_user_id: null,
          change_type: 'plan_changed',
          previous_state: tenant as any,
          new_state: form,
          notes: notes || null,
        });
        onClose();
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>Gestión: {orgName}</SheetTitle></SheetHeader>

        <div className="space-y-6 py-4">
          {/* Plan */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Plan actual</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan</Label>
                <Select value={form.current_plan_code} onValueChange={v => set('current_plan_code', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => <SelectItem key={p.code} value={p.code}>{p.name_es}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciclo facturación</Label>
                <Select value={form.current_billing_cycle} onValueChange={v => set('current_billing_cycle', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={recalculate}>Recalcular flags</Button>
          </section>

          <Separator />

          {/* Status */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Estado</h4>
            <div className="flex items-center gap-2">
              <Switch checked={!form.is_active} onCheckedChange={v => set('is_active', !v)} />
              <Label>Cuenta suspendida</Label>
            </div>
            {!form.is_active && (
              <div><Label>Razón de suspensión</Label><Input value={form.suspension_reason || ''} onChange={e => set('suspension_reason', e.target.value)} /></div>
            )}
            <div><Label>Notas internas</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre este cambio..." /></div>
          </section>

          <Separator />

          {/* Override */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ChevronDown className="w-4 h-4" /> Override de límites (avanzado)
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Override manual — ignora plan y add-ons</p>
              {[
                { key: 'effective_limit_matters', label: 'Expedientes' },
                { key: 'effective_limit_contacts', label: 'Contactos' },
                { key: 'effective_limit_users', label: 'Usuarios' },
                { key: 'effective_limit_storage_gb', label: 'Storage (GB)' },
                { key: 'effective_limit_genius_queries_monthly', label: 'Genius/mes' },
                { key: 'effective_limit_spider_alerts_monthly', label: 'Spider alertas/mes' },
                { key: 'effective_limit_jurisdictions_docket', label: 'Jurisdicciones' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Input type="number" className="w-28" value={form[key] ?? 0} onChange={e => set(key, parseInt(e.target.value))} />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* History */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ChevronDown className="w-4 h-4" /> Historial ({history.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {history.length === 0 && <p className="text-xs text-slate-400">Sin historial</p>}
              {history.map(h => (
                <div key={h.id} className="border-l-2 border-slate-200 pl-3 py-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{format(new Date(h.created_at), 'dd MMM yyyy HH:mm', { locale: es })}</span>
                    <Badge variant="outline" className="text-[10px]">{h.change_type}</Badge>
                  </div>
                  {h.notes && <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={updateFlags.isPending}>Guardar cambios</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
