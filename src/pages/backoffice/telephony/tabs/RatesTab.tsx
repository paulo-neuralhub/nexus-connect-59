// ============================================================
// Rates Tab — Pricing rate management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Rate {
  id: string;
  destination_prefix: string;
  destination_country: string;
  number_type: string;
  provider_cost_per_min: number;
  retail_price_per_min: number;
  currency: string;
  is_active: boolean;
}

export function RatesTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newRate, setNewRate] = useState({
    destination_prefix: '',
    destination_country: '',
    number_type: 'landline',
    provider_cost_per_min: '',
    retail_price_per_min: '',
    currency: 'EUR',
  });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['bo-telephony-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_pricing_rates')
        .select('*')
        .order('destination_country', { ascending: true });
      if (error) throw error;
      return (data || []) as Rate[];
    },
  });

  const updatePrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase
        .from('telephony_pricing_rates')
        .update({ retail_price_per_min: price })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-rates'] });
      setEditingId(null);
      toast.success('Precio actualizado');
    },
  });

  const addRate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('telephony_pricing_rates').insert({
        destination_prefix: newRate.destination_prefix,
        destination_country: newRate.destination_country,
        number_type: newRate.number_type,
        provider_cost_per_min: parseFloat(newRate.provider_cost_per_min),
        retail_price_per_min: parseFloat(newRate.retail_price_per_min),
        currency: newRate.currency,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-rates'] });
      setShowAdd(false);
      setNewRate({ destination_prefix: '', destination_country: '', number_type: 'landline', provider_cost_per_min: '', retail_price_per_min: '', currency: 'EUR' });
      toast.success('Tarifa añadida');
    },
    onError: () => toast.error('Error al añadir tarifa'),
  });

  const calcMargin = (cost: number, retail: number) => {
    if (retail <= 0) return 0;
    return ((retail - cost) / retail * 100).toFixed(1);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rates.length} tarifas configuradas</p>
        <Button onClick={() => setShowAdd(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Nueva tarifa
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prefijo</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Coste proveedor</TableHead>
                <TableHead className="text-right">Precio cliente</TableHead>
                <TableHead className="text-right">Margen %</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(r => {
                const margin = calcMargin(Number(r.provider_cost_per_min), Number(r.retail_price_per_min));
                const isEditing = editingId === r.id;

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.destination_prefix}</TableCell>
                    <TableCell>{r.destination_country}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.number_type}</Badge></TableCell>
                    <TableCell className="text-right font-mono">€{Number(r.provider_cost_per_min).toFixed(4)}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number"
                            step="0.0001"
                            className="w-24 h-7 text-xs text-right"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') updatePrice.mutate({ id: r.id, price: parseFloat(editPrice) });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => updatePrice.mutate({ id: r.id, price: parseFloat(editPrice) })}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="font-mono cursor-pointer hover:underline"
                          onClick={() => {
                            setEditingId(r.id);
                            setEditPrice(String(r.retail_price_per_min));
                          }}
                        >
                          €{Number(r.retail_price_per_min).toFixed(4)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={Number(margin) > 30 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {margin}%
                      </Badge>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Rate Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva tarifa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prefijo destino</Label>
                <Input placeholder="+34" value={newRate.destination_prefix} onChange={e => setNewRate(p => ({ ...p, destination_prefix: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input placeholder="España" value={newRate.destination_country} onChange={e => setNewRate(p => ({ ...p, destination_country: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newRate.number_type} onValueChange={v => setNewRate(p => ({ ...p, number_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="landline">Fijo</SelectItem>
                  <SelectItem value="mobile">Móvil</SelectItem>
                  <SelectItem value="tollfree">Toll-free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coste proveedor (€/min)</Label>
                <Input type="number" step="0.0001" value={newRate.provider_cost_per_min} onChange={e => setNewRate(p => ({ ...p, provider_cost_per_min: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Precio cliente (€/min)</Label>
                <Input type="number" step="0.0001" value={newRate.retail_price_per_min} onChange={e => setNewRate(p => ({ ...p, retail_price_per_min: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => addRate.mutate()}
              disabled={!newRate.destination_prefix || !newRate.destination_country || addRate.isPending}
            >
              Crear tarifa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
