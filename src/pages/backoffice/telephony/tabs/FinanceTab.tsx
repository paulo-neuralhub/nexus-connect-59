// ============================================================
// Finance Tab — Telephony financial KPIs
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock, Phone, AlertTriangle } from 'lucide-react';

export function FinanceTab() {
  // KPIs from ledger + CDRs for current month
  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['bo-telephony-finance-kpis'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Total billed (call_charge from ledger)
      const { data: charges } = await supabase
        .from('telephony_ledger')
        .select('amount')
        .eq('transaction_type', 'call_charge')
        .gte('created_at', monthStart);

      const totalBilled = (charges || []).reduce((sum: number, c: any) => sum + Math.abs(Number(c.amount)), 0);

      // CDRs this month
      const { data: cdrs } = await supabase
        .from('telephony_cdrs')
        .select('provider_cost, duration_seconds, retail_cost')
        .gte('started_at', monthStart);

      const totalProviderCost = (cdrs || []).reduce((sum: number, c: any) => sum + Number(c.provider_cost || 0), 0);
      const totalMinutes = (cdrs || []).reduce((sum: number, c: any) => sum + Number(c.duration_seconds || 0), 0);
      const totalCalls = (cdrs || []).length;

      return {
        totalBilled,
        totalProviderCost,
        grossMargin: totalBilled - totalProviderCost,
        totalMinutes: Math.round(totalMinutes / 60),
        totalCalls,
      };
    },
  });

  // Wallets overview
  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['bo-telephony-finance-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_wallets')
        .select('*')
        .order('current_balance', { ascending: true });
      if (error) throw error;

      const orgIds = (data || []).map((w: any) => w.organization_id);
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds.length ? orgIds : ['_']);
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));

      return (data || []).map((w: any) => ({
        ...w,
        org_name: orgMap.get(w.organization_id) || w.organization_id?.slice(0, 8),
      }));
    },
  });

  const lowBalanceWallets = wallets.filter((w: any) => Number(w.current_balance) < 2);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {loadingKpis ? (
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Facturado tenants
              </div>
              <p className="text-2xl font-bold mt-1">€{kpis?.totalBilled.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Coste proveedor
              </div>
              <p className="text-2xl font-bold mt-1">€{kpis?.totalProviderCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Margen bruto
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-600">€{kpis?.grossMargin.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Minutos totales
              </div>
              <p className="text-2xl font-bold mt-1">{kpis?.totalMinutes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> Llamadas
              </div>
              <p className="text-2xl font-bold mt-1">{kpis?.totalCalls}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low balance alert */}
      {lowBalanceWallets.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Wallets con saldo bajo ({lowBalanceWallets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowBalanceWallets.map((w: any) => (
                <Badge key={w.id} variant="destructive" className="gap-1">
                  {w.org_name}: €{Number(w.current_balance).toFixed(2)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallets table */}
      {loadingWallets ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wallets por tenant ({wallets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead className="text-right">Saldo actual</TableHead>
                  <TableHead className="text-right">Umbral bajo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.org_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={Number(w.current_balance) < 2 ? 'text-destructive font-bold' : ''}>
                        €{Number(w.current_balance).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">€{Number(w.low_balance_threshold).toFixed(2)}</TableCell>
                    <TableCell>{w.currency}</TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'active' ? 'default' : 'destructive'}>
                        {w.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
