// ============================================================
// CDRs Tab — Call Detail Records
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, Headphones, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CDR {
  id: string;
  organization_id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  duration_seconds: number;
  retail_cost: number;
  provider_cost: number;
  provider_used: string;
  recording_stored_path: string | null;
  started_at: string;
  ended_at: string | null;
  org_name?: string;
}

export function CdrsTab() {
  const [dirFilter, setDirFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedCdr, setSelectedCdr] = useState<CDR | null>(null);

  const { data: cdrs = [], isLoading } = useQuery({
    queryKey: ['bo-telephony-cdrs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_cdrs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const orgIds = [...new Set((data || []).map((c: any) => c.organization_id))];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds.length ? orgIds : ['_']);
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));

      return (data || []).map((c: any): CDR => ({
        ...c,
        org_name: orgMap.get(c.organization_id) || c.organization_id?.slice(0, 8) || '—',
      }));
    },
  });

  const filtered = useMemo(() => {
    return cdrs.filter(c => {
      if (dirFilter !== 'all' && c.direction !== dirFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return c.from_number?.toLowerCase().includes(s) ||
          c.to_number?.toLowerCase().includes(s) ||
          c.org_name?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [cdrs, dirFilter, statusFilter, search]);

  const exportCsv = () => {
    const header = 'Fecha,Tenant,De,Para,Dirección,Duración,Coste,Estado,Proveedor,Grabación\n';
    const rows = filtered.map(c =>
      `${c.started_at},${c.org_name},${c.from_number},${c.to_number},${c.direction},${c.duration_seconds},${c.retail_cost},${c.status},${c.provider_used},${c.recording_stored_path || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdrs_export_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const fmtDuration = (s: number) => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o tenant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Dirección" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="outbound">Salientes</SelectItem>
            <SelectItem value="inbound">Entrantes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="no-answer">Sin respuesta</SelectItem>
            <SelectItem value="busy">Ocupado</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-right">Coste</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(c => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedCdr(c)}>
                  <TableCell className="text-xs">
                    {format(new Date(c.started_at), 'dd/MM HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell className="text-xs">{c.org_name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.from_number}</TableCell>
                  <TableCell className="font-mono text-xs">{c.to_number}</TableCell>
                  <TableCell className="text-xs">{fmtDuration(c.duration_seconds)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">€{Number(c.retail_cost).toFixed(4)}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{c.provider_used}</TableCell>
                  <TableCell>
                    {c.recording_stored_path && <Headphones className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No hay CDRs que coincidan con los filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 100 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Mostrando 100 de {filtered.length} resultados. Usa filtros para refinar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* CDR Detail Sheet */}
      <Sheet open={!!selectedCdr} onOpenChange={() => setSelectedCdr(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle del CDR</SheetTitle>
          </SheetHeader>
          {selectedCdr && (
            <div className="mt-6 space-y-4 text-sm">
              {[
                ['Call SID', selectedCdr.call_sid],
                ['Tenant', selectedCdr.org_name],
                ['De', selectedCdr.from_number],
                ['Para', selectedCdr.to_number],
                ['Dirección', selectedCdr.direction],
                ['Estado', selectedCdr.status],
                ['Duración', fmtDuration(selectedCdr.duration_seconds)],
                ['Coste retail', `€${Number(selectedCdr.retail_cost).toFixed(4)}`],
                ['Coste proveedor', `€${Number(selectedCdr.provider_cost).toFixed(4)}`],
                ['Margen', `€${(Number(selectedCdr.retail_cost) - Number(selectedCdr.provider_cost)).toFixed(4)}`],
                ['Proveedor', selectedCdr.provider_used],
                ['Inicio', format(new Date(selectedCdr.started_at), 'dd/MM/yyyy HH:mm:ss')],
                ['Fin', selectedCdr.ended_at ? format(new Date(selectedCdr.ended_at), 'dd/MM/yyyy HH:mm:ss') : '—'],
                ['Grabación', selectedCdr.recording_stored_path || 'No'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{val}</span>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
