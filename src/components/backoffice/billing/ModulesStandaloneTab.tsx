import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Edit2 } from 'lucide-react';
import { useBillingAddons, useUpdateBillingAddon, type BillingAddon } from '@/hooks/useBillingData';

export function ModulesStandaloneTab() {
  const { data: addons = [], isLoading } = useBillingAddons('module_standalone');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [editAddon, setEditAddon] = useState<BillingAddon | null>(null);

  const filtered = moduleFilter === 'all' ? addons : addons.filter(a => a.module_code === moduleFilter);

  if (isLoading) return <div className="animate-pulse h-48 bg-slate-100 rounded-xl" />;

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="spider">IP-SPIDER</SelectItem>
            <SelectItem value="genius">IP-GENIUS</SelectItem>
            <SelectItem value="market">IP-MARKET</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Módulo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tier</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Precio/mes</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Precio/año</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Standalone</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Activo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(addon => (
              <tr key={addon.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{addon.name_es}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" style={{ borderColor: addon.color_hex || undefined, color: addon.color_hex || undefined }}>
                    {addon.module_code?.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">€{Number(addon.price_monthly_eur)}</td>
                <td className="px-4 py-3">€{Number(addon.price_annual_eur)}</td>
                <td className="px-4 py-3">{addon.is_standalone ? '✓' : '—'}</td>
                <td className="px-4 py-3">{addon.is_active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => setEditAddon(addon)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editAddon && <AddonEditSheet addon={editAddon} open={!!editAddon} onClose={() => setEditAddon(null)} />}
    </>
  );
}

function AddonEditSheet({ addon, open, onClose }: { addon: BillingAddon; open: boolean; onClose: () => void }) {
  const update = useUpdateBillingAddon();
  const [form, setForm] = useState<Record<string, any>>({ ...addon });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    const { id, created_at, ...updates } = form;
    update.mutate({ id: addon.id, ...updates }, { onSuccess: onClose });
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Editar: {addon.name_es}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div><Label>Nombre (ES)</Label><Input value={form.name_es || ''} onChange={e => set('name_es', e.target.value)} /></div>
          <div><Label>Descripción</Label><Input value={form.description_es || ''} onChange={e => set('description_es', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Precio/mes (€)</Label><Input type="number" value={form.price_monthly_eur ?? 0} onChange={e => set('price_monthly_eur', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Precio anual/mes (€)</Label><Input type="number" value={form.price_annual_eur ?? 0} onChange={e => set('price_annual_eur', parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_standalone ?? false} onCheckedChange={v => set('is_standalone', v)} />
            <Label>Puede comprarse sin plan base</Label>
          </div>
          <Separator />
          {addon.module_code === 'spider' && (
            <div><Label>Alertas/mes que incluye</Label><Input type="number" value={form.adds_spider_alerts_monthly ?? 0} onChange={e => set('adds_spider_alerts_monthly', parseInt(e.target.value))} /></div>
          )}
          {addon.module_code === 'genius' && (
            <div><Label>Consultas/mes que incluye</Label><Input type="number" value={form.adds_genius_queries_monthly ?? 0} onChange={e => set('adds_genius_queries_monthly', parseInt(e.target.value))} /></div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active ?? true} onCheckedChange={v => set('is_active', v)} />
            <Label>Activo</Label>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={update.isPending}>Guardar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
