import { useState } from 'react';
import { CostsList } from '@/components/features/finance/costs-list';
import { useMatterCostsByMatter } from '@/hooks/use-finance';
import { formatCurrency } from '@/lib/constants/finance';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { GenerateInvoiceFromCostsDialog } from './GenerateInvoiceFromCostsDialog';

interface MatterCostsTabProps {
  matterId: string;
  matterReference?: string;
  accountId?: string;
  accountName?: string;
}

export function MatterCostsTab({ matterId, matterReference, accountId, accountName }: MatterCostsTabProps) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const { data: costs = [] } = useMatterCostsByMatter(matterId);
  
  const totals = {
    total: costs.reduce((sum, c) => sum + (c.total_amount || 0), 0),
    pending: costs.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.total_amount || 0), 0),
    billable: costs.filter(c => c.is_billable && !c.invoice_id && c.status !== 'invoiced').reduce((sum, c) => sum + (c.total_amount || 0), 0),
  };

  const hasBillableCosts = totals.billable > 0;
  
  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total costes</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400">Pendiente pago</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Facturable</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totals.billable)}</p>
          </div>
          {hasBillableCosts && (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-2"
              onClick={() => setInvoiceDialogOpen(true)}
            >
              <Receipt className="h-4 w-4 mr-1" />
              Facturar
            </Button>
          )}
        </div>
      </div>
      
      {/* Lista de costes */}
      <CostsList matterId={matterId} showMatterColumn={false} />

      {/* Dialog para generar factura */}
      <GenerateInvoiceFromCostsDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        matterId={matterId}
        matterReference={matterReference}
        accountId={accountId}
        accountName={accountName}
      />
    </div>
  );
}
