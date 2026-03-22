import { useState } from 'react';
import { useBankAccounts, useCreateBankAccount } from '@/hooks/finance/useBankAccounts';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Plus, Landmark, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BankAccountsPage() {
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_bank_reconciliation');
  const { data: accounts, isLoading } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ account_name: '', bank_name: '', iban: '', bic_swift: '', currency: 'EUR', is_default: false });

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Cuentas Bancarias</h2>
            <p className="text-muted-foreground">La conciliación bancaria está disponible en el plan Advanced.</p>
            <Button variant="outline">Ver planes →</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Cuentas Bancarias</h1>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Nueva cuenta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva cuenta bancaria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nombre de la cuenta" value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} />
              <Input placeholder="Banco" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
              <Input placeholder="IBAN" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
              <Input placeholder="BIC/SWIFT" value={form.bic_swift} onChange={e => setForm(p => ({ ...p, bic_swift: e.target.value }))} />
              <div className="flex items-center gap-2">
                <Switch checked={form.is_default} onCheckedChange={v => setForm(p => ({ ...p, is_default: v }))} id="default" />
                <Label htmlFor="default">Cuenta por defecto</Label>
              </div>
              <Button className="w-full" disabled={!form.account_name || createAccount.isPending}
                onClick={() => createAccount.mutate(form, { onSuccess: () => { setShowNew(false); setForm({ account_name: '', bank_name: '', iban: '', bic_swift: '', currency: 'EUR', is_default: false }); } })}>
                Crear cuenta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : !accounts?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay cuentas bancarias configuradas</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(acc => (
            <Card key={acc.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/app/finance/bank/${acc.id}`)}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{acc.account_name}</h3>
                  <div className="flex gap-1">
                    {acc.is_default && <Badge>Default</Badge>}
                    <Badge variant="outline">{acc.currency}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{acc.bank_name || 'Sin banco'} · {acc.iban ? `···${acc.iban.slice(-4)}` : 'Sin IBAN'}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo actual</p>
                    <p className="text-lg font-bold">{fmt(acc.current_balance)} €</p>
                  </div>
                  <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button>
                </div>
                {acc.last_reconciled_at && <p className="text-xs text-muted-foreground">Última conciliación: {new Date(acc.last_reconciled_at).toLocaleDateString('es-ES')}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
