import { useState } from 'react';
import { useJournalEntries, useCreateJournalEntry, JournalEntryLine } from '@/hooks/finance/useJournalEntries';
import { useChartOfAccounts } from '@/hooks/finance/useChartOfAccounts';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, Plus, Lock, ChevronDown, Check, AlertCircle } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function JournalPage() {
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_accounting');
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data: entries, isLoading } = useJournalEntries(period);
  const { data: accounts } = useChartOfAccounts();
  const createEntry = useCreateJournalEntry();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New entry form state
  const [entryDate, setEntryDate] = useState(now.toISOString().slice(0, 10));
  const [entryDesc, setEntryDesc] = useState('');
  const [entryType, setEntryType] = useState('manual');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
    { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
  ]);

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Libro Diario</h2>
            <p className="text-muted-foreground">La contabilidad está disponible en el plan Advanced.</p>
            <Button variant="outline">Ver planes →</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDebit = entries?.reduce((s, e) => s + (e.total_debit || 0), 0) || 0;
  const totalEntries = entries?.length || 0;

  const lineDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const lineCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = Math.abs(lineDebit - lineCredit) < 0.01 && lineDebit > 0;

  const updateLine = (i: number, field: keyof JournalEntryLine, value: any) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const handleSelectAccount = (i: number, code: string) => {
    const acc = accounts?.find(a => a.account_code === code);
    if (acc) updateLine(i, 'account_code', acc.account_code);
    if (acc) updateLine(i, 'account_name', acc.account_name);
  };

  const handleCreate = () => {
    createEntry.mutate({ entry_date: entryDate, description: entryDesc, entry_type: entryType, lines }, {
      onSuccess: () => {
        setShowNew(false);
        setLines([
          { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
          { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
        ]);
        setEntryDesc('');
      }
    });
  };

  // Generate period options
  const periods: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Libro Diario</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Asiento manual</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nuevo asiento contable</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                  <Input placeholder="Descripción" value={entryDesc} onChange={e => setEntryDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-2 items-center">
                      <Select value={line.account_code} onValueChange={v => handleSelectAccount(i, v)}>
                        <SelectTrigger><SelectValue placeholder="Cuenta" /></SelectTrigger>
                        <SelectContent>{(accounts || []).map(a => <SelectItem key={a.account_code} value={a.account_code}>{a.account_code} {a.account_name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="Descripción" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} />
                      <Input type="number" placeholder="Debe" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} />
                      <Input type="number" placeholder="Haber" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} />
                      {lines.length > 2 && <Button variant="ghost" size="sm" onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}>×</Button>}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setLines(prev => [...prev, { account_code: '', account_name: '', debit: 0, credit: 0, description: '' }])}>+ Línea</Button>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex gap-4 text-sm">
                    <span>Debe: <strong>{fmt(lineDebit)}</strong></span>
                    <span>Haber: <strong>{fmt(lineCredit)}</strong></span>
                    {isBalanced ? <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Cuadrado</Badge> : <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />No cuadra</Badge>}
                  </div>
                  <Button disabled={!isBalanced || !entryDesc || createEntry.isPending} onClick={handleCreate}>Registrar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Asientos del período</p><p className="text-2xl font-bold">{totalEntries}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total movimiento</p><p className="text-2xl font-bold">{fmt(totalDebit)} €</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : !entries?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay asientos en este período</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Nº</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <Collapsible key={entry.id} asChild open={expanded === entry.id} onOpenChange={o => setExpanded(o ? entry.id : null)}>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer">
                        <TableCell><ChevronDown className={`w-4 h-4 transition-transform ${expanded === entry.id ? 'rotate-180' : ''}`} /></TableCell>
                        <TableCell className="font-mono text-xs">{entry.entry_number}</TableCell>
                        <TableCell>{entry.entry_date}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {entry.is_balanced && <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>}
                            <Badge variant="outline" className="text-xs">{entry.source_type === 'invoice' ? 'Automático' : 'Manual'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(entry.total_debit)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(entry.total_credit)}</TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="space-y-1 font-mono text-sm">
                            {(entry.lines as JournalEntryLine[])?.map((l, i) => (
                              <div key={i} className="grid grid-cols-3 gap-4">
                                <span className={l.credit > 0 ? 'pl-6' : ''}>{l.account_code} {l.account_name}</span>
                                <span className="text-right">{l.debit > 0 ? fmt(l.debit) : '—'}</span>
                                <span className="text-right">{l.credit > 0 ? fmt(l.credit) : '—'}</span>
                              </div>
                            ))}
                            <div className="grid grid-cols-3 gap-4 border-t pt-1 font-bold">
                              <span>TOTAL</span>
                              <span className="text-right">{fmt(entry.total_debit)}</span>
                              <span className="text-right">{fmt(entry.total_credit)} {entry.is_balanced ? '✓' : '✗'}</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
