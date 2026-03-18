/**
 * Generate Invoice From Costs Dialog
 * L96: Allows generating a Finance invoice from unbilled matter costs
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Receipt, Euro, Loader2, FileText } from 'lucide-react';
import { useMatterCostsByMatter, useBillingClients, useCreateInvoice, useUpdateMatterCost } from '@/hooks/use-finance';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GenerateInvoiceFromCostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matterId: string;
  matterReference?: string;
  accountId?: string;
  accountName?: string;
  preSelectedCosts?: string[];
}

const COST_TYPE_LABELS: Record<string, string> = {
  official_fee: 'Tasa Oficial',
  service_fee: 'Honorario',
  expense: 'Gasto',
  third_party: 'Terceros',
  other: 'Otro',
};

export function GenerateInvoiceFromCostsDialog({
  open,
  onOpenChange,
  matterId,
  matterReference,
  accountId,
  accountName,
  preSelectedCosts = [],
}: GenerateInvoiceFromCostsDialogProps) {
  const navigate = useNavigate();
  const [selectedCosts, setSelectedCosts] = useState<Set<string>>(
    new Set(preSelectedCosts)
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(accountId || '');
  const [taxRate, setTaxRate] = useState<number>(21);

  // Fetch unbilled costs for this matter
  const { data: allCosts = [], isLoading: loadingCosts } = useMatterCostsByMatter(matterId);

  // Filter only billable and not yet invoiced
  const billableCosts = useMemo(
    () => allCosts.filter((c) => c.is_billable && !c.invoice_id && c.status !== 'invoiced'),
    [allCosts]
  );

  const { data: billingClients = [], isLoading: loadingClients } = useBillingClients();
  const createInvoiceMutation = useCreateInvoice();
  const updateCostMutation = useUpdateMatterCost();

  // Calculate totals
  const selectedCostsData = useMemo(
    () => billableCosts.filter((c) => selectedCosts.has(c.id)),
    [billableCosts, selectedCosts]
  );

  const subtotal = selectedCostsData.reduce((sum, c) => sum + (c.total_amount || c.amount || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const toggleCost = (costId: string) => {
    const newSelected = new Set(selectedCosts);
    if (newSelected.has(costId)) {
      newSelected.delete(costId);
    } else {
      newSelected.add(costId);
    }
    setSelectedCosts(newSelected);
  };

  const toggleAll = () => {
    if (selectedCosts.size === billableCosts.length) {
      setSelectedCosts(new Set());
    } else {
      setSelectedCosts(new Set(billableCosts.map((c) => c.id)));
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedCosts.size === 0) {
      toast.error('Selecciona al menos un coste');
      return;
    }

    if (!selectedClientId) {
      toast.error('Selecciona un cliente de facturación');
      return;
    }

    try {
      const client = billingClients.find((c) => c.id === selectedClientId);
      
      // Create invoice items from costs
      const items = selectedCostsData.map((cost) => ({
        description: `${COST_TYPE_LABELS[cost.cost_type] || cost.cost_type}: ${cost.description}`,
        quantity: cost.quantity || 1,
        unit_price: cost.amount || 0,
        subtotal: cost.total_amount || cost.amount || 0,
        matter_id: matterId,
        matter_cost_id: cost.id,
      }));

      // Create the invoice
      const invoice = await createInvoiceMutation.mutateAsync({
        invoice: {
          billing_client_id: selectedClientId,
          client_name: client?.legal_name || accountName || '',
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          status: 'draft',
          notes: matterReference 
            ? `Servicios profesionales - Expediente ${matterReference}. ${selectedCostsData.length} conceptos.`
            : `Servicios profesionales. ${selectedCostsData.length} conceptos.`,
        },
        items,
      });

      // Mark costs as invoiced
      for (const costId of selectedCosts) {
        await updateCostMutation.mutateAsync({
          id: costId,
          data: { 
            status: 'invoiced',
            invoice_id: invoice.id,
          },
        });
      }

      toast.success(`Factura ${invoice.invoice_number} creada correctamente`);
      onOpenChange(false);
      
      // Navigate to the invoice
      navigate(`/app/finance/invoices/${invoice.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la factura');
    }
  };

  const isLoading = loadingCosts || loadingClients;
  const isPending = createInvoiceMutation.isPending || updateCostMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Generar Factura desde Costes
          </DialogTitle>
          <DialogDescription>
            Selecciona los costes a incluir en la factura
            {matterReference && ` para ${matterReference}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Cliente de facturación</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente..." />
              </SelectTrigger>
              <SelectContent>
                {billingClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Costs List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Costes facturables</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} disabled={billableCosts.length === 0}>
                {selectedCosts.size === billableCosts.length
                  ? 'Deseleccionar todo'
                  : 'Seleccionar todo'}
              </Button>
            </div>

            <ScrollArea className="h-[280px] border rounded-lg">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Cargando costes...
                </div>
              ) : billableCosts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay costes pendientes de facturar</p>
                  <p className="text-sm mt-1">Los costes deben estar marcados como facturables</p>
                </div>
              ) : (
                <div className="divide-y">
                  {billableCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleCost(cost.id)}
                    >
                      <Checkbox
                        checked={selectedCosts.has(cost.id)}
                        onCheckedChange={() => toggleCost(cost.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {format(new Date(cost.cost_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {COST_TYPE_LABELS[cost.cost_type] || cost.cost_type}
                          </Badge>
                          {cost.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              Pendiente pago
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {cost.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium">
                          {formatCurrency(cost.total_amount || cost.amount || 0)}
                        </div>
                        {cost.quantity && cost.quantity > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {cost.quantity} x {formatCurrency(cost.amount || 0)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Tax Rate */}
          <div className="flex items-center gap-4">
            <Label htmlFor="tax-rate">IVA (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-20"
              min={0}
              max={100}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conceptos seleccionados</span>
              <span className="font-medium">{selectedCosts.size}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>+ IVA ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary pt-1">
              <span className="flex items-center gap-1">
                <Euro className="h-4 w-4" />
                Total
              </span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateInvoice}
            disabled={selectedCosts.size === 0 || !selectedClientId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Generar Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
