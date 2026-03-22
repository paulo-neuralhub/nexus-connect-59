import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useBankAccounts, useBankTransactions } from '@/hooks/finance/useBankAccounts';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lock, Link2, Upload, Check, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BankImportWizard from '@/components/finance/bank/BankImportWizard';
import FintocConnect from '@/components/finance/bank/FintocConnect';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BankReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_bank_reconciliation');
  const { data: accounts } = useBankAccounts();
  const account = accounts?.find(a => a.id === id);
  const [tab, setTab] = useState('unmatched');
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: transactions, isLoading } = useBankTransactions(id, tab === 'matched' ? 'matched' : tab === 'unmatched' ? 'unmatched' : 'all');
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const [selectedTxn, setSelectedTxn] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Fetch unmatched invoices
  const { data: unmatchedInvoices } = useQuery({
    queryKey: ['unmatched-invoices', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, full_number, client_name, total, invoice_date')
        .eq('organization_id', currentOrganization!.id)
        .is('paid_date', null)
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && tab === 'unmatched',
  });

  // Auto-match suggestions
  const suggestions = useMemo(() => {
    if (!transactions || !unmatchedInvoices) return [];
    return transactions
      .filter(t => t.reconciliation_status === 'unmatched' && t.amount > 0)
      .map(txn => {
        const match = unmatchedInvoices.find(inv => Math.abs(txn.amount - inv.total) < inv.total * 0.01);
        return match ? { txnId: txn.id, invoiceId: match.id, invoiceNumber: match.full_number, amount: txn.amount } : null;
      })
      .filter(Boolean) as { txnId: string; invoiceId: string; invoiceNumber: string; amount: number }[];
  }, [transactions, unmatchedInvoices]);

  const handleLink = async () => {
    if (!selectedTxn || !selectedInvoice) return;
    const { error } = await supabase
      .from('fin_bank_transactions')
      .update({ reconciliation_status: 'matched', matched_invoice_id: selectedInvoice, matched_at: new Date().toISOString() } as any)
      .eq('id', selectedTxn);
    if (error) { toast.error('Error: ' + error.message); return; }
    toast.success('Movimiento conciliado');
    setSelectedTxn(null); setSelectedInvoice(null);
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['unmatched-invoices'] });
  };

  const handleAcceptSuggestion = async (s: { txnId: string; invoiceId: string }) => {
    const { error } = await supabase
      .from('fin_bank_transactions')
      .update({ reconciliation_status: 'matched', matched_invoice_id: s.invoiceId, matched_at: new Date().toISOString() } as any)
      .eq('id', s.txnId);
    if (error) { toast.error('Error'); return; }
    toast.success('Sugerencia aceptada');
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['unmatched-invoices'] });
  };

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center"><CardContent className="pt-8 pb-8 space-y-4"><Lock className="w-12 h-12 mx-auto text-muted-foreground" /><h2 className="text-xl font-semibold">Conciliación Bancaria</h2><p className="text-muted-foreground">Disponible en el plan Advanced.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{account?.account_name || 'Cuenta bancaria'}</h1>
        <p className="text-muted-foreground">{account?.bank_name} · {account?.iban ? `···${account.iban.slice(-4)}` : ''} · Saldo: {fmt(account?.current_balance || 0)} €</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Movimientos</TabsTrigger>
          <TabsTrigger value="unmatched">Sin conciliar</TabsTrigger>
          <TabsTrigger value="matched">Conciliados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <TransactionsTable transactions={transactions} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="unmatched" className="mt-4">
          {suggestions.length > 0 && (
            <Card className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
              <CardHeader className="py-3"><CardTitle className="text-sm">Sugerencias de conciliación automática</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {suggestions.map(s => (
                  <div key={s.txnId} className="flex items-center justify-between text-sm">
                    <span>{fmt(s.amount)} € ↔ {s.invoiceNumber}</span>
                    <Button size="sm" variant="outline" onClick={() => handleAcceptSuggestion(s)}><Check className="w-3 h-3 mr-1" />Aceptar</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Movimientos bancarios</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-96 overflow-auto">
                <Table>
                  <TableBody>
                    {transactions?.filter(t => t.reconciliation_status === 'unmatched').map(t => (
                      <TableRow key={t.id} className={`cursor-pointer ${selectedTxn === t.id ? 'bg-primary/10' : ''}`} onClick={() => setSelectedTxn(t.id)}>
                        <TableCell className="text-xs">{t.transaction_date}</TableCell>
                        <TableCell className="text-xs truncate max-w-40">{t.description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(t.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Facturas sin vincular</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-96 overflow-auto">
                <Table>
                  <TableBody>
                    {unmatchedInvoices?.map(inv => (
                      <TableRow key={inv.id} className={`cursor-pointer ${selectedInvoice === inv.id ? 'bg-primary/10' : ''}`} onClick={() => setSelectedInvoice(inv.id)}>
                        <TableCell className="text-xs">{inv.full_number}</TableCell>
                        <TableCell className="text-xs truncate max-w-40">{inv.client_name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(inv.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          {selectedTxn && selectedInvoice && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleLink}><ArrowLeftRight className="w-4 h-4 mr-2" />Vincular</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="matched" className="mt-4">
          <TransactionsTable transactions={transactions} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransactionsTable({ transactions, isLoading }: { transactions: any[] | undefined; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!transactions?.length) return <Card><CardContent className="py-12 text-center text-muted-foreground">Sin movimientos</CardContent></Card>;
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(t => (
            <TableRow key={t.id}>
              <TableCell>{t.transaction_date}</TableCell>
              <TableCell className="truncate max-w-60">{t.description}</TableCell>
              <TableCell className={`text-right font-mono ${t.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>{fmt(t.amount)}</TableCell>
              <TableCell>
                <Badge variant={t.reconciliation_status === 'matched' ? 'default' : 'outline'} className="text-xs">
                  {t.reconciliation_status === 'matched' ? 'Conciliado' : t.reconciliation_status === 'excluded' ? 'Excluido' : 'Pendiente'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
