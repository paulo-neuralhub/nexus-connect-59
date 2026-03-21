/**
 * Expense Dialog — Enhanced
 * Create/Edit expense with receipt upload to Supabase Storage
 * IP-specific categories: Tasa oficial, Traducción, Mensajería, etc.
 * PHASE 3: Finance Module
 */

import { useState, useEffect, useCallback } from 'react';
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
import { CalendarIcon, Receipt, Loader2, Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCreateExpense,
  useUpdateExpense,
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '@/hooks/finance/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
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
  const { currentOrganization } = useOrganization();
  const [selectedMatter, setSelectedMatter] = useState<{ id: string; reference: string; title: string } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState('21');
  const [isBillable, setIsBillable] = useState(true);
  const [markupPercent, setMarkupPercent] = useState('0');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [uploading, setUploading] = useState(false);

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
        setReceiptFileName(expense.receipt_file_name || '');
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
        setReceiptFileName('');
      }
    }
  }, [open, expense, defaultMatter]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization?.id) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${currentOrganization.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL (signed since bucket is private)
      const { data: urlData } = await supabase.storage
        .from('expense-receipts')
        .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year

      if (urlData?.signedUrl) {
        setReceiptUrl(urlData.signedUrl);
        setReceiptFileName(file.name);
        toast.success('Justificante subido');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }, [currentOrganization?.id]);

  const handleRemoveReceipt = () => {
    setReceiptUrl('');
    setReceiptFileName('');
  };

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
          receipt_file_name: receiptFileName || undefined,
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
          receipt_file_name: receiptFileName || undefined,
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
          {/* Date + Category */}
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

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Justificante / Recibo</Label>
            {receiptUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">
                  {receiptFileName || 'Archivo adjunto'}
                </span>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Ver
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleRemoveReceipt}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className={cn(
                  'flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30',
                  uploading && 'opacity-50 pointer-events-none'
                )}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Arrastra o haz clic para subir justificante
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || uploading}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar' : 'Crear gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
