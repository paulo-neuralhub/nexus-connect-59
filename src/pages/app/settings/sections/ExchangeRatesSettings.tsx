import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface ExchangeRate {
  target_currency: string;
  rate: number;
  previous_rate: number | null;
  change_pct: number | null;
  symbol: string | null;
  currency_name: string | null;
  region: string | null;
  fetched_at: string | null;
  expires_at: string | null;
  manual_override: boolean | null;
  source: string | null;
}

const REGION_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Americas' },
  { value: 'latam', label: 'LATAM' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
  { value: 'africa_mideast', label: 'Africa/Mideast' },
];

export default function ExchangeRatesSettings() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin, isOwner } = usePermissions();

  const { data: rates, isLoading, refetch } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await fromTable('exchange_rates')
        .select('target_currency, rate, previous_rate, change_pct, symbol, currency_name, region, fetched_at, expires_at, manual_override, source')
        .eq('base_currency', 'EUR')
        .order('target_currency');
      if (error) throw error;
      return data as ExchangeRate[];
    },
  });

  const usdRate = useMemo(() => {
    if (!rates) return 1;
    const usd = rates.find((r) => r.target_currency === 'USD');
    return usd?.rate ?? 1;
  }, [rates]);

  const lastFetched = useMemo(() => {
    if (!rates || rates.length === 0) return null;
    return rates[0].fetched_at;
  }, [rates]);

  const source = useMemo(() => {
    if (!rates || rates.length === 0) return null;
    return rates[0].source;
  }, [rates]);

  const filtered = useMemo(() => {
    if (!rates) return [];
    return rates.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.target_currency.toLowerCase().includes(q) ||
        (r.currency_name && r.currency_name.toLowerCase().includes(q));
      const matchRegion = region === 'all' || r.region === region;
      return matchSearch && matchRegion;
    });
  }, [rates, search, region]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL ?? 'https://uaqniahteuzhetuyzvak.supabase.co'}/functions/v1/update-exchange-rates`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      await refetch();
      toast.success('Tipos de cambio actualizados');
    } catch {
      toast.error('Error al actualizar tipos de cambio');
    } finally {
      setRefreshing(false);
    }
  };

  const formatChange = (pct: number | null) => {
    if (pct === null || pct === 0) return <span className="text-muted-foreground">—</span>;
    if (pct > 0)
      return <span className="text-emerald-600">▲ +{pct.toFixed(2)}%</span>;
    return <span className="text-red-500">▼ {pct.toFixed(2)}%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          💱 Tipos de Cambio
        </h2>
        {lastFetched && (
          <p className="text-sm text-muted-foreground mt-1">
            Última actualización: {formatDateTime(lastFetched)} UTC
          </p>
        )}
        {source && (
          <p className="text-xs text-muted-foreground">
            Fuente: {source} (European Central Bank)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar moneda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent>
            {REGION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(isAdmin || isOwner) && (
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar ahora
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Moneda</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">1 EUR =</TableHead>
              <TableHead className="text-right">1 USD =</TableHead>
              <TableHead className="text-right">Δ 24h</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Cargando tipos de cambio...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron monedas
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.target_currency}>
                  <TableCell className="font-mono font-medium">{r.target_currency}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.currency_name || r.target_currency}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.rate.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.target_currency === 'USD'
                      ? '—'
                      : (r.rate / usdRate).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatChange(r.change_pct)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border">
        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          ⚠️ Los tipos de cambio mostrados son tasas de referencia proporcionadas por Open Exchange Rates
          (European Central Bank). NO son tasas transaccionales. Para operaciones de facturación, pago de
          tasas oficiales o transferencias bancarias, consulte con su entidad bancaria. IP-NEXUS no se
          responsabiliza de diferencias entre las tasas mostradas y las tasas reales de transacción.
          Precisión estimada: ±2%. Actualización: diaria a las 06:00 UTC.
        </p>
      </div>
    </div>
  );
}
