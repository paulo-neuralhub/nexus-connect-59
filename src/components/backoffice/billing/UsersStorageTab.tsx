import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Edit2 } from 'lucide-react';
import { useBillingAddons, useUpdateBillingAddon, type BillingAddon } from '@/hooks/useBillingData';

export function UsersStorageTab() {
  const { data: allAddons = [] } = useBillingAddons();
  const [editAddon, setEditAddon] = useState<BillingAddon | null>(null);

  const addons = allAddons.filter(a => ['users', 'storage', 'accounting'].includes(a.category));

  return (
    <>
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Add-on</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Precio/mes</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Precio anual/mes</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Detalle</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Activo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {addons.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{a.name_es}</td>
                <td className="px-4 py-3"><Badge variant="outline">{a.category}</Badge></td>
                <td className="px-4 py-3">€{Number(a.price_monthly_eur)}</td>
                <td className="px-4 py-3">€{Number(a.price_annual_eur)}</td>
                <td className="px-4 py-3 text-slate-500">
                  {a.adds_users > 0 && `+${a.adds_users} usuario`}
                  {a.adds_storage_gb > 0 && `+${a.adds_storage_gb} GB`}
                  {a.category === 'accounting' && a.description_es}
                </td>
                <td className="px-4 py-3">{a.is_active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => setEditAddon(a)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editAddon && <ResourceEditSheet addon={editAddon} open={!!editAddon} onClose={() => setEditAddon(null)} />}
    </>
  );
}

function ResourceEditSheet({ addon, open, onClose }: { addon: BillingAddon; open: boolean; onClose: () => void }) {
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
          <div><Label>Nombre</Label><Input value={form.name_es || ''} onChange={e => set('name_es', e.target.value)} /></div>
          <div><Label>Descripción</Label><Input value={form.description_es || ''} onChange={e => set('description_es', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Precio/mes (€)</Label><Input type="number" value={form.price_monthly_eur ?? 0} onChange={e => set('price_monthly_eur', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Precio anual/mes (€)</Label><Input type="number" value={form.price_annual_eur ?? 0} onChange={e => set('price_annual_eur', parseFloat(e.target.value) || 0)} /></div>
          </div>
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
