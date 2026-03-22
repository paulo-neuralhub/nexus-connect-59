import { useState, useMemo } from 'react';
import { useVatBookIssued, useVatBookReceived } from '@/hooks/finance/useVatBook';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableFooter } from '@/components/ui/table';
import { Lock, Download, FileText } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getQuarterDates(year: number, q: number): [string, string] {
  const startMonth = (q - 1) * 3;
  const from = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
  const endMonth = startMonth + 3;
  const to = endMonth > 12 ? `${year + 1}-01-01` : `${year}-${String(endMonth + 1).padStart(2, '0')}-01`;
  // last day of quarter
  const lastDay = new Date(Number(to.split('-')[0]), Number(to.split('-')[1]) - 1, 0);
  return [from, `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`];
}

export default function VatBookPage() {
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_accounting');
  const now = new Date();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(currentQ);
  const [from, to] = useMemo(() => getQuarterDates(year, quarter), [year, quarter]);
  const [tab, setTab] = useState('issued');

  const { data: issued, isLoading: loadingIssued } = useVatBookIssued(from, to);
  const { data: received, isLoading: loadingReceived } = useVatBookReceived(from, to);

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center"><CardContent className="pt-8 pb-8 space-y-4"><Lock className="w-12 h-12 mx-auto text-muted-foreground" /><h2 className="text-xl font-semibold">Libro de IVA</h2><p className="text-muted-foreground">Disponible en el plan Advanced.</p></CardContent></Card>
      </div>
    );
  }

  const issuedTotals = {
    base: (issued || []).reduce((s, i) => s + (i.subtotal || 0), 0),
    vat: (issued || []).reduce((s, i) => s + (i.vat_amount || 0), 0),
    total: (issued || []).reduce((s, i) => s + (i.total || 0), 0),
  };
  const receivedTotals = {
    base: (received || []).reduce((s, e) => s + (e.amount || 0), 0),
    vat: (received || []).reduce((s, e) => s + (e.vat_amount || 0), 0),
  };

  const exportCSV = (type: 'issued' | 'received') => {
    let csv = '';
    if (type === 'issued') {
      csv = 'Nº Factura;Fecha;Cliente;NIF;Base;Tipo IVA;Cuota IVA;Total\n';
      (issued || []).forEach(i => { csv += `${i.full_number};${i.invoice_date};${i.client_name};${i.client_tax_id || ''};${i.subtotal};${i.vat_rate || ''};${i.vat_amount || 0};${i.total}\n`; });
    } else {
      csv = 'Fecha;Descripción;Proveedor;Base;Cuota IVA\n';
      (received || []).forEach(e => { csv += `${e.expense_date};${e.description};${e.vendor_name || ''};${e.amount};${e.vat_amount || 0}\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `libro_iva_${type}_${year}_T${quarter}.csv`; link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Libro de IVA</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[now.getFullYear(), now.getFullYear() - 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(quarter)} onValueChange={v => setQuarter(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4].map(q => <SelectItem key={q} value={String(q)}>T{q}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportCSV(tab as any)}><Download className="w-4 h-4 mr-2" />CSV</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="issued">Emitidas</TabsTrigger><TabsTrigger value="received">Recibidas</TabsTrigger></TabsList>

        <TabsContent value="issued" className="mt-4">
          {loadingIssued ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>NIF</TableHead>
                    <TableHead className="text-right">Base</TableHead><TableHead className="text-right">% IVA</TableHead><TableHead className="text-right">Cuota IVA</TableHead><TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(issued || []).map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.full_number}</TableCell><TableCell>{i.invoice_date}</TableCell><TableCell>{i.client_name}</TableCell><TableCell>{i.client_tax_id || ''}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(i.subtotal || 0)}</TableCell><TableCell className="text-right">{i.vat_rate || 0}%</TableCell><TableCell className="text-right font-mono">{fmt(i.vat_amount || 0)}</TableCell><TableCell className="text-right font-mono font-semibold">{fmt(i.total || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold">Totales</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(issuedTotals.base)}</TableCell><TableCell /><TableCell className="text-right font-mono font-bold">{fmt(issuedTotals.vat)}</TableCell><TableCell className="text-right font-mono font-bold">{fmt(issuedTotals.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          {loadingReceived ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right">Base</TableHead><TableHead className="text-right">Cuota IVA</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {(received || []).map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{e.expense_date}</TableCell><TableCell>{e.description}</TableCell><TableCell>{e.vendor_name || ''}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(e.amount || 0)}</TableCell><TableCell className="text-right font-mono">{fmt(e.vat_amount || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">Totales</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(receivedTotals.base)}</TableCell><TableCell className="text-right font-mono font-bold">{fmt(receivedTotals.vat)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
