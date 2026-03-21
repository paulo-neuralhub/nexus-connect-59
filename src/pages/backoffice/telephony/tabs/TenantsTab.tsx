// ============================================================
// Tenants Tab — Telephony tenant management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  organization_id: string;
  is_active: boolean;
  telephony_plan: string;
  max_concurrent_calls: number;
  minutes_used_this_month: number;
  created_at: string;
  wallet_balance?: number;
  wallet_status?: string;
  org_name?: string;
  number_count?: number;
}

export function TenantsTab() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['bo-telephony-tenants'],
    queryFn: async () => {
      const { data: tData, error } = await supabase
        .from('telephony_tenants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch wallets
      const orgIds = (tData || []).map((t: any) => t.organization_id);
      const { data: wallets } = await supabase
        .from('telephony_wallets')
        .select('organization_id, current_balance, status')
        .in('organization_id', orgIds);

      // Fetch org names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      // Fetch number counts
      const { data: numbers } = await supabase
        .from('telephony_numbers')
        .select('organization_id')
        .in('organization_id', orgIds);

      const walletMap = new Map((wallets || []).map((w: any) => [w.organization_id, w]));
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));
      const numberCounts = new Map<string, number>();
      (numbers || []).forEach((n: any) => {
        numberCounts.set(n.organization_id, (numberCounts.get(n.organization_id) || 0) + 1);
      });

      return (tData || []).map((t: any): Tenant => ({
        ...t,
        wallet_balance: (walletMap.get(t.organization_id) as any)?.current_balance ?? 0,
        wallet_status: (walletMap.get(t.organization_id) as any)?.status ?? 'unknown',
        org_name: orgMap.get(t.organization_id) || t.organization_id.slice(0, 8),
        number_count: numberCounts.get(t.organization_id) || 0,
      }));
    },
  });

  const adjustBalance = useMutation({
    mutationFn: async ({ orgId, amount, reason }: { orgId: string; amount: number; reason: string }) => {
      // Get wallet
      const { data: wallet } = await supabase
        .from('telephony_wallets')
        .select('id, current_balance, currency')
        .eq('organization_id', orgId)
        .single();
      if (!wallet) throw new Error('Wallet not found');

      const newBalance = Number(wallet.current_balance) + amount;
      await supabase.from('telephony_wallets')
        .update({ current_balance: newBalance })
        .eq('id', wallet.id);

      await supabase.from('telephony_ledger').insert({
        wallet_id: wallet.id,
        organization_id: orgId,
        amount,
        balance_after: newBalance,
        currency: wallet.currency,
        transaction_type: 'adjustment',
        description: `Ajuste manual: ${reason}`,
        reference_type: 'adjustment',
      });
    },
    onSuccess: () => {
      toast.success('Saldo ajustado');
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-tenants'] });
      setAdjustAmount('');
      setAdjustReason('');
    },
    onError: () => toast.error('Error al ajustar saldo'),
  });

  const toggleTenant = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('telephony_tenants').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-tenants'] });
      toast.success('Tenant actualizado');
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants con telefonía ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Números</TableHead>
                <TableHead className="text-right">Min. este mes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                  <TableCell className="font-medium">{t.org_name}</TableCell>
                  <TableCell><Badge variant="outline">{t.telephony_plan}</Badge></TableCell>
                  <TableCell className="text-right font-mono">
                    €{Number(t.wallet_balance).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{t.number_count}</TableCell>
                  <TableCell className="text-right">{t.minutes_used_this_month}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Gestionar</Button>
                  </TableCell>
                </TableRow>
              ))}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay tenants con telefonía configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Management Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Gestionar: {selected?.org_name}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label>Telefonía activa</Label>
                <Switch
                  checked={selected.is_active}
                  onCheckedChange={(checked) => {
                    toggleTenant.mutate({ id: selected.id, is_active: checked });
                    setSelected({ ...selected, is_active: checked });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Saldo actual</Label>
                <p className="text-2xl font-bold">€{Number(selected.wallet_balance).toFixed(2)}</p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="font-medium">Ajustar saldo manualmente</Label>
                <div className="space-y-2">
                  <Label className="text-xs">Cantidad (positiva para añadir, negativa para restar)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Razón del ajuste</Label>
                  <Textarea
                    placeholder="Recarga manual, compensación, corrección..."
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!adjustAmount || !adjustReason || adjustBalance.isPending}
                  onClick={() =>
                    adjustBalance.mutate({
                      orgId: selected.organization_id,
                      amount: parseFloat(adjustAmount),
                      reason: adjustReason,
                    })
                  }
                >
                  Aplicar ajuste
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Plan: <strong>{selected.telephony_plan}</strong></p>
                <p>Max llamadas simultáneas: <strong>{selected.max_concurrent_calls}</strong></p>
                <p>Min. usados este mes: <strong>{selected.minutes_used_this_month}</strong></p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
