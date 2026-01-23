import { useMemo, useState } from 'react';
import { FileDown, Wand2 } from 'lucide-react';

import { ProfessionalCard, CardHeader } from '@/components/ui/professional-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useAllVoipInvoices, useGenerateVoipInvoices } from '@/hooks/useVoipInvoices';
import { formatEur } from './format';

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return `"${s.split('"').join('""')}"`;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function VoipInvoicesTab() {
  const { data, isLoading } = useAllVoipInvoices();
  const generate = useGenerateVoipInvoices();

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return first.toISOString().slice(0, 10);
  });
  const [taxRate, setTaxRate] = useState<number>(0.21);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'__all__' | string>('__all__');

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    return list.filter((inv) => {
      const orgName = inv.organizations?.name ?? '';
      const okQ = !s || orgName.toLowerCase().includes(s) || (inv.invoice_number ?? '').toLowerCase().includes(s);
      const okStatus = status === '__all__' || inv.status === status;
      return okQ && okStatus;
    });
  }, [data, q, status]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, inv) => {
        acc.total_cents += inv.total_cents ?? 0;
        acc.calls += inv.total_calls ?? 0;
        acc.minutes += inv.total_minutes ?? 0;
        return acc;
      },
      { total_cents: 0, calls: 0, minutes: 0 },
    );
  }, [filtered]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((i) => set.add(i.status));
    return Array.from(set).sort();
  }, [data]);

  return (
    <div className="space-y-4">
      <ProfessionalCard>
        <CardHeader
          title="Generar facturas"
          subtitle="Ejecuta generate_voip_invoices_superadmin para un periodo"
          actions={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={generate.isPending}>
                  <Wand2 className="h-4 w-4" />
                  {generate.isPending ? 'Generando…' : 'Generar'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Generar facturas del periodo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Periodo inicio: {periodStart} · IVA: {(taxRate * 100).toFixed(0)}%
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => generate.mutate({ periodStart, taxRate })}
                    disabled={generate.isPending}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm text-foreground">Periodo inicio</label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-foreground">IVA (por defecto 21%)</label>
            <Input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Ej: 0.21 = 21%</p>
          </div>
        </div>
      </ProfessionalCard>

      <ProfessionalCard>
        <CardHeader
          title="Facturación"
          subtitle="Listado global (todos los tenants)"
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!filtered.length) return;
                const csv = toCsv(
                  filtered.map((inv) => ({
                    organization: inv.organizations?.name ?? '',
                    invoice_number: inv.invoice_number ?? '',
                    period_start: inv.billing_period_start,
                    period_end: inv.billing_period_end,
                    total_calls: inv.total_calls,
                    total_minutes: inv.total_minutes,
                    plan_amount_cents: inv.plan_amount_cents,
                    usage_amount_cents: inv.usage_amount_cents,
                    total_cents: inv.total_cents,
                    status: inv.status,
                    issued_at: inv.issued_at ?? '',
                    pdf_url: inv.pdf_url ?? '',
                  })),
                );
                downloadText(`voip_invoices_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
              }}
              disabled={!filtered.length}
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar organización o nº factura…"
            className="max-w-sm"
          />

          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground">
            {filtered.length} facturas · {totals.calls} llamadas · {totals.minutes} min · {formatEur(totals.total_cents)}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No hay facturas.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{inv.organizations?.name ?? '—'}</div>
                    </TableCell>
                    <TableCell>{inv.invoice_number ?? '—'}</TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{inv.billing_period_start} → {inv.billing_period_end}</div>
                      <div className="text-xs text-muted-foreground">Emitida: {inv.issued_at ?? '—'}</div>
                    </TableCell>
                    <TableCell className="text-right">{inv.total_minutes}</TableCell>
                    <TableCell className="text-right">{formatEur(inv.total_cents)}</TableCell>
                    <TableCell>{inv.status}</TableCell>
                    <TableCell className="text-right">
                      {inv.pdf_url ? (
                        <a className="text-sm text-primary underline" href={inv.pdf_url} target="_blank" rel="noreferrer">
                          Ver
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ProfessionalCard>
    </div>
  );
}
