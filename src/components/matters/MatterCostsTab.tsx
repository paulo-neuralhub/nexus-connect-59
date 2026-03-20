/**
 * MatterCostsTab - Cost tracking for a matter
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Euro, Receipt, Banknote } from 'lucide-react';
import { NeoBadge } from '@/components/ui/neo-badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface MatterCostsTabProps {
  matterId: string;
}

export function MatterCostsTab({ matterId }: MatterCostsTabProps) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCost, setNewCost] = useState({
    concept: '',
    cost_type: 'official_fee',
    amount: '',
    currency: 'EUR',
    date: new Date().toISOString().split('T')[0],
  });

  const { data: costs, isLoading } = useQuery({
    queryKey: ['matter-costs', matterId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from('matter_costs')
        .select('*')
        .eq('matter_id', matterId)
        .order('cost_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!matterId,
  });

  const addCost = useMutation({
    mutationFn: async () => {
      const client: any = supabase;
      const { error } = await client.from('matter_costs').insert({
        matter_id: matterId,
        organization_id: currentOrganization!.id,
        concept: newCost.concept,
        cost_type: newCost.cost_type,
        amount: parseFloat(newCost.amount),
        currency: newCost.currency,
        cost_date: newCost.date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-costs', matterId] });
      setShowAddModal(false);
      setNewCost({ concept: '', cost_type: 'official_fee', amount: '', currency: 'EUR', date: new Date().toISOString().split('T')[0] });
      toast.success('Coste añadido');
    },
    onError: () => toast.error('Error al añadir coste'),
  });

  const totalSpent = (costs || []).reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
  const officialFees = (costs || []).filter((c: any) => c.cost_type === 'official_fee').reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
  const professionalFees = (costs || []).filter((c: any) => c.cost_type === 'professional_fee').reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);

  const costTypeLabels: Record<string, string> = {
    official_fee: 'Tasa oficial',
    professional_fee: 'Honorarios',
    agent_fee: 'Agente local',
    translation: 'Traducción',
    other: 'Otro',
  };

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-3">
        <NeoBadge value={`€${totalSpent.toLocaleString()}`} label="Total" color="#3B82F6" size="lg" />
        <NeoBadge value={`€${officialFees.toLocaleString()}`} label="Tasas" color="#10B981" size="lg" />
        <NeoBadge value={`€${professionalFees.toLocaleString()}`} label="Honorarios" color="#8B5CF6" size="lg" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Costes del expediente</h3>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Añadir coste
        </Button>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : !costs?.length ? (
            <div className="text-center py-12">
              <Euro className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground">Sin costes registrados todavía</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Moneda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost: any) => (
                  <TableRow key={cost.id}>
                    <TableCell className="text-sm">
                      {cost.cost_date ? format(new Date(cost.cost_date), 'dd MMM yyyy', { locale: es }) : '—'}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{cost.concept}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {costTypeLabels[cost.cost_type] || cost.cost_type}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      €{parseFloat(cost.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{cost.currency || 'EUR'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Cost Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir coste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Concepto</Label>
              <Input
                value={newCost.concept}
                onChange={(e) => setNewCost(p => ({ ...p, concept: e.target.value }))}
                placeholder="Ej: Tasa de solicitud EUIPO"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={newCost.cost_type} onValueChange={(v) => setNewCost(p => ({ ...p, cost_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official_fee">Tasa oficial</SelectItem>
                    <SelectItem value="professional_fee">Honorarios</SelectItem>
                    <SelectItem value="agent_fee">Agente local</SelectItem>
                    <SelectItem value="translation">Traducción</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importe (€)</Label>
                <Input
                  type="number"
                  value={newCost.amount}
                  onChange={(e) => setNewCost(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newCost.date}
                onChange={(e) => setNewCost(p => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button
              onClick={() => addCost.mutate()}
              disabled={!newCost.concept || !newCost.amount || addCost.isPending}
            >
              Crear coste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
