import { useState } from 'react';
import { useChartOfAccounts, useLoadChartTemplate, useCreateAccount } from '@/hooks/finance/useChartOfAccounts';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Download, Lock, FileSpreadsheet } from 'lucide-react';

export default function ChartOfAccountsPage() {
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_accounting');
  const { data: accounts, isLoading } = useChartOfAccounts();
  const loadTemplate = useLoadChartTemplate();
  const createAccount = useCreateAccount();
  const [showNew, setShowNew] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_code: '', account_name: '', account_type: 'expense', group_number: 6, group_name: '' });

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Plan de Cuentas</h2>
            <p className="text-muted-foreground">El plan de cuentas está disponible en el plan Advanced.</p>
            <Button variant="outline">Ver planes →</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const isEmpty = !accounts || accounts.length === 0;

  // Group accounts by group_number
  const grouped = (accounts || []).reduce((acc, a) => {
    const g = a.group_number || 0;
    if (!acc[g]) acc[g] = { name: a.group_name || `Grupo ${g}`, accounts: [] };
    acc[g].accounts.push(a);
    return acc;
  }, {} as Record<number, { name: string; accounts: typeof accounts }>);

  const handleExportCSV = () => {
    if (!accounts?.length) return;
    const header = 'Código;Nombre;Tipo;Grupo\n';
    const rows = accounts.map(a => `${a.account_code};${a.account_name};${a.account_type};${a.group_number || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'plan_cuentas.csv'; link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Plan de Cuentas</h1>
        </div>
        <div className="flex gap-2">
          {!isEmpty && <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV para asesor</Button>}
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Nueva cuenta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva cuenta contable</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Código (ej: 431)" value={newAccount.account_code} onChange={e => setNewAccount(p => ({ ...p, account_code: e.target.value }))} />
                <Input placeholder="Nombre de la cuenta" value={newAccount.account_name} onChange={e => setNewAccount(p => ({ ...p, account_name: e.target.value }))} />
                <Select value={newAccount.account_type} onValueChange={v => setNewAccount(p => ({ ...p, account_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Activo</SelectItem>
                    <SelectItem value="liability">Pasivo</SelectItem>
                    <SelectItem value="equity">Patrimonio</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full" disabled={!newAccount.account_code || !newAccount.account_name} onClick={() => {
                  createAccount.mutate(newAccount, { onSuccess: () => setShowNew(false) });
                }}>Crear cuenta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Tu plan de cuentas está vacío</h3>
              <p className="text-muted-foreground mt-1">Selecciona una plantilla para comenzar:</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => loadTemplate.mutate('PGC_ES')} disabled={loadTemplate.isPending}>📋 PGC España</Button>
              <Button variant="outline" onClick={() => loadTemplate.mutate('PCG_FR')} disabled={loadTemplate.isPending}>📋 PCG Francia</Button>
              <Button variant="outline" onClick={() => loadTemplate.mutate('GAAP_US')} disabled={loadTemplate.isPending}>📋 GAAP US</Button>
              <Button variant="outline" onClick={() => loadTemplate.mutate('IFRS')} disabled={loadTemplate.isPending}>📋 IFRS</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([gNum, group]) => (
            <Card key={gNum}>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Grupo [{gNum}] — {group.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-28">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.accounts.map(acc => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-mono font-semibold">{acc.account_code}</TableCell>
                        <TableCell>{acc.account_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{acc.account_type}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
