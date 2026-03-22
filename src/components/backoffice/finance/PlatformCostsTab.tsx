import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { usePlatformCosts, useCreateManualCost } from '@/hooks/backoffice/usePlatformFinance';
import { Spinner } from '@/components/ui/spinner';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_review: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  posted: { label: 'Contabilizado', variant: 'outline' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

const CATEGORY_OPTIONS = [
  { value: 'ai_inference', label: 'AI Inference' },
  { value: 'telephony', label: 'Telefonía' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'communications', label: 'Comunicaciones' },
  { value: 'stripe_fees', label: 'Comisiones Stripe' },
  { value: 'third_party_apis', label: 'APIs externas' },
  { value: 'personnel', label: 'Personal' },
  { value: 'legal_compliance', label: 'Legal/Compliance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Otros' },
];

export function PlatformCostsTab() {
  const { data: costs = [], isLoading } = usePlatformCosts();
  const createCost = useCreateManualCost();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    cost_category: 'other',
    description: '',
    amount: '',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    vendor_name: '',
    notes: '',
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const totalConfirmed = costs.filter(c => c.status === 'confirmed' || c.status === 'posted')
    .reduce((s, c) => s + (c.amount_eur || c.amount), 0);

  const handleCreate = () => {
    createCost.mutate({
      cost_category: form.cost_category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      period_start: form.period_start,
      period_end: form.period_end,
      vendor_name: form.vendor_name || undefined,
      notes: form.notes || undefined,
    } as any, {
      onSuccess: () => {
        setOpen(false);
        setForm({ cost_category: 'other', description: '', amount: '', period_start: new Date().toISOString().slice(0, 10), period_end: new Date().toISOString().slice(0, 10), vendor_name: '', notes: '' });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total costes confirmados</p>
              <p className="text-2xl font-bold">€{totalConfirmed.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Registros</p>
              <p className="text-2xl font-bold">{costs.length}</p>
            </CardContent>
          </Card>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Coste manual</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar coste manual</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Categoría</Label>
                <Select value={form.cost_category} onValueChange={v => setForm(f => ({ ...f, cost_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Importe (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><Label>Proveedor</Label><Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Inicio periodo</Label><Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} /></div>
                <div><Label>Fin periodo</Label><Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={!form.description || !form.amount} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Todos los costes</CardTitle></CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Sin costes registrados</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Descripción</th>
                    <th className="text-left p-3">Periodo</th>
                    <th className="text-left p-3">Origen</th>
                    <th className="text-right p-3">Importe</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map(c => {
                    const catLabel = CATEGORY_OPTIONS.find(o => o.value === c.cost_category)?.label || c.cost_category;
                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending_review;
                    return (
                      <tr key={c.id} className="border-t">
                        <td className="p-3">{catLabel}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{c.description}</td>
                        <td className="p-3">{c.period_start}</td>
                        <td className="p-3">
                          <Badge variant={c.source_type === 'manual' ? 'outline' : 'secondary'}>
                            {c.source_type === 'manual' ? 'Manual' : 'Auto'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono">€{(c.amount_eur || c.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-center">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
