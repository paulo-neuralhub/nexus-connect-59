/**
 * Expense Dialog
 * Create/Edit expense form
 * L62-D: Finance Module
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MatterSelect } from '@/components/features/docket/MatterSelect';
import { CalendarIcon, Receipt, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useCreateExpense, 
  useUpdateExpense, 
  Expense, 
  ExpenseCategory,
  EXPENSE_CATEGORIES 
} from '@/hooks/finance/useExpenses';
import { toast } from 'sonner';

const VAT_RATES = [
  { value: '21', label: '21% (General)' },
  { value: '10', label: '10% (Reducido)' },
  { value: '4', label: '4% (Superreducido)' },
  { value: '0', label: '0% (Exento)' },
];

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  defaultMatter?: { id: string; reference: string; title: string } | null;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  defaultMatter,
}: ExpenseDialogProps) {
  const [selectedMatter, setSelectedMatter] = useState<{ id: string; reference: string; title: string } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState('21');
  const [isBillable, setIsBillable] = useState(true);
  const [markupPercent, setMarkupPercent] = useState('0');
  const [receiptUrl, setReceiptUrl] = useState('');

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const isEditing = !!expense;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (expense) {
        setSelectedMatter(expense.matter || null);
        setDate(new Date(expense.date));
        setCategory(expense.category);
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setVatRate(expense.vat_rate.toString());
        setIsBillable(expense.is_billable);
        setMarkupPercent(expense.markup_percent.toString());
        setReceiptUrl(expense.receipt_url || '');
      } else {
        setSelectedMatter(defaultMatter || null);
        setDate(new Date());
        setCategory('other');
        setDescription('');
        setAmount('');
        setVatRate('21');
        setIsBillable(true);
        setMarkupPercent('0');
        setReceiptUrl('');
      }
    }
  }, [open, expense, defaultMatter]);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('El importe debe ser mayor a 0');
      return;
    }

    if (!description.trim()) {
      toast.error('Añade una descripción');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: expense.id,
          date: format(date, 'yyyy-MM-dd'),
          category,
          description: description.trim(),
          amount: amountNum,
          vat_rate: parseFloat(vatRate),
          matter_id: selectedMatter?.id || undefined,
          is_billable: isBillable,
          markup_percent: parseFloat(markupPercent) || 0,
          receipt_url: receiptUrl || undefined,
        });
        toast.success('Gasto actualizado');
      } else {
        await createMutation.mutateAsync({
          date: format(date, 'yyyy-MM-dd'),
          category,
          description: description.trim(),
          amount: amountNum,
          vat_rate: parseFloat(vatRate),
          matter_id: selectedMatter?.id,
          is_billable: isBillable,
          markup_percent: parseFloat(markupPercent) || 0,
          receipt_url: receiptUrl || undefined,
        });
        toast.success('Gasto registrado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al guardar el gasto');
    }
  };

  // Calculate totals
  const amountNum = parseFloat(amount) || 0;
  const vatRateNum = parseFloat(vatRate) || 0;
  const vatAmount = amountNum * (vatRateNum / 100);
  const total = amountNum + vatAmount;
  const markupNum = parseFloat(markupPercent) || 0;
  const billableAmount = total * (1 + markupNum / 100);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isEditing ? 'Editar gasto' : 'Nuevo gasto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={es}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Describe el gasto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Matter */}
          <div className="space-y-2">
            <Label>Expediente (opcional)</Label>
            <MatterSelect
              value={selectedMatter}
              onChange={setSelectedMatter}
              placeholder="Asociar a expediente..."
            />
          </div>

          {/* Amount and VAT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Importe base *</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>IVA</Label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Totals summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base imponible:</span>
              <span>{amountNum.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA ({vatRateNum}%):</span>
              <span>{vatAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total:</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          {/* Billable options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="billable"
                checked={isBillable}
                onCheckedChange={(checked) => setIsBillable(checked as boolean)}
              />
              <Label htmlFor="billable">Facturable al cliente</Label>
            </div>

            {isBillable && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm text-muted-foreground">Margen (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    → {billableAmount.toFixed(2)} € facturable
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">URL del justificante (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
              />
              <Button variant="outline" size="icon" disabled>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar' : 'Crear gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
