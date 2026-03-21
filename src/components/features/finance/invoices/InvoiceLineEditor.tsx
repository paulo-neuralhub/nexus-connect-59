// =============================================
// InvoiceLineEditor - Editor de líneas de factura
// Con tipos de línea IP: service/official_fee/expense/discount
// Subtotales separados por tipo (DIFERENCIADOR PI)
// =============================================

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Briefcase, Building2, Receipt, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/constants/finance';
import { ServiceSearchInput } from '../ServiceSearchInput';
import type { ServiceCatalogItem } from '@/types/service-catalog';
import { cn } from '@/lib/utils';

export type InvoiceLineType = 'service' | 'official_fee' | 'expense' | 'discount';

export interface InvoiceLine {
  id: string;
  line_type: InvoiceLineType;
  description: string;
  notes?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  matter_id?: string;
  time_entry_id?: string;
  expense_id?: string;
  service_id?: string;
  jurisdiction_code?: string;
  nice_class?: number;
}

interface InvoiceLineEditorProps {
  lines: InvoiceLine[];
  onChange: (lines: InvoiceLine[]) => void;
  currency?: string;
  readOnly?: boolean;
}

const VAT_RATES = [
  { value: 21, label: '21% (General)' },
  { value: 10, label: '10% (Reducido)' },
  { value: 4, label: '4% (Superreducido)' },
  { value: 0, label: '0% (Exento)' },
];

const LINE_TYPES: { value: InvoiceLineType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'service', label: 'Honorarios', icon: Briefcase, color: '#3B82F6' },
  { value: 'official_fee', label: 'Tasa oficial', icon: Building2, color: '#8B5CF6' },
  { value: 'expense', label: 'Gasto', icon: Receipt, color: '#F59E0B' },
  { value: 'discount', label: 'Descuento', icon: Tag, color: '#EF4444' },
];

function calculateLine(line: Partial<InvoiceLine>): InvoiceLine {
  const quantity = line.quantity || 1;
  const unitPrice = line.unit_price || 0;
  const discountPercent = line.discount_percent || 0;
  const vatRate = line.vat_rate ?? 21;
  const lineType = line.line_type || 'service';

  const grossAmount = quantity * unitPrice;
  const discountAmount = grossAmount * (discountPercent / 100);
  const subtotal = lineType === 'discount' ? -(Math.abs(grossAmount)) : grossAmount - discountAmount;
  const vatAmount = lineType === 'discount' ? 0 : subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return {
    id: line.id || crypto.randomUUID(),
    line_type: lineType,
    description: line.description || '',
    notes: line.notes,
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    vat_rate: vatRate,
    subtotal,
    vat_amount: vatAmount,
    total,
    matter_id: line.matter_id,
    time_entry_id: line.time_entry_id,
    expense_id: line.expense_id,
    jurisdiction_code: line.jurisdiction_code,
    nice_class: line.nice_class,
  };
}

function LineTypeBadge({ type }: { type: InvoiceLineType }) {
  const config = LINE_TYPES.find(t => t.value === type) || LINE_TYPES[0];
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function InvoiceLineEditor({
  lines,
  onChange,
  currency = 'EUR',
  readOnly = false,
}: InvoiceLineEditorProps) {
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  const addLine = (type: InvoiceLineType = 'service') => {
    const newLine = calculateLine({
      id: crypto.randomUUID(),
      line_type: type,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      vat_rate: type === 'official_fee' ? 0 : 21,
    });
    onChange([...lines, newLine]);
  };

  const updateLine = (id: string, updates: Partial<InvoiceLine>) => {
    onChange(
      lines.map(line =>
        line.id === id ? calculateLine({ ...line, ...updates }) : line
      )
    );
  };

  const handleServiceSelect = (lineId: string, service: ServiceCatalogItem) => {
    updateLine(lineId, {
      unit_price: service.base_price,
      vat_rate: (service as any).tax_rate ?? 21,
      service_id: service.id,
    });
  };

  const removeLine = (id: string) => {
    onChange(lines.filter(line => line.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-[110px]">Tipo</TableHead>
              <TableHead className="min-w-[200px]">Concepto</TableHead>
              <TableHead className="w-20 text-center">Cant.</TableHead>
              <TableHead className="w-28 text-right">Precio</TableHead>
              <TableHead className="w-20 text-center">Dto.%</TableHead>
              <TableHead className="w-28 text-center">IVA</TableHead>
              <TableHead className="w-28 text-right">Subtotal</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay líneas. Añade la primera línea a la factura.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => (
                <>
                  <TableRow key={line.id} className={cn(
                    line.line_type === 'discount' && 'bg-red-50/50 dark:bg-red-950/20'
                  )}>
                    <TableCell className="text-center">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <LineTypeBadge type={line.line_type} />
                      ) : (
                        <Select
                          value={line.line_type}
                          onValueChange={(v) => updateLine(line.id, {
                            line_type: v as InvoiceLineType,
                            vat_rate: v === 'official_fee' ? 0 : line.vat_rate,
                          })}
                        >
                          <SelectTrigger className="border-0 shadow-none focus:ring-0 h-auto py-1 px-1">
                            <LineTypeBadge type={line.line_type} />
                          </SelectTrigger>
                          <SelectContent>
                            {LINE_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                <span className="flex items-center gap-2">
                                  <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                                  {t.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm">{line.description}</span>
                      ) : (
                        <ServiceSearchInput
                          value={line.description}
                          onChange={(value) => updateLine(line.id, { description: value })}
                          onServiceSelect={(service) => handleServiceSelect(line.id, service)}
                          placeholder="Escriba o busque un servicio..."
                          className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm text-center block">{line.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="text-center border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm text-right block">{formatCurrency(line.unit_price, currency)}</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="text-right border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm text-center block">{line.discount_percent}%</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={line.discount_percent}
                          onChange={(e) => updateLine(line.id, { discount_percent: parseFloat(e.target.value) || 0 })}
                          className="text-center border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm text-center block">{line.vat_rate}%</span>
                      ) : (
                        <Select
                          value={String(line.vat_rate)}
                          onValueChange={(v) => updateLine(line.id, { vat_rate: parseFloat(v) })}
                        >
                          <SelectTrigger className="border-0 shadow-none focus:ring-0 h-auto py-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VAT_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={String(rate.value)}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={cn(line.line_type === 'discount' && 'text-destructive')}>
                        {formatCurrency(line.subtotal, currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLine(line.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedLine === line.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 py-3">
                        <Textarea
                          placeholder="Notas adicionales para esta línea..."
                          value={line.notes || ''}
                          onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                          rows={2}
                          className="text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {LINE_TYPES.map((t) => (
            <Button
              key={t.value}
              variant="outline"
              size="sm"
              onClick={() => addLine(t.value)}
              className="gap-1.5"
            >
              <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />
              + {t.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function calculateTotals(lines: InvoiceLine[], withholdingPercent = 0) {
  const serviceSubtotal = lines.filter(l => l.line_type === 'service').reduce((sum, l) => sum + l.subtotal, 0);
  const officialFeesSubtotal = lines.filter(l => l.line_type === 'official_fee').reduce((sum, l) => sum + l.subtotal, 0);
  const expensesSubtotal = lines.filter(l => l.line_type === 'expense').reduce((sum, l) => sum + l.subtotal, 0);
  const discountsSubtotal = lines.filter(l => l.line_type === 'discount').reduce((sum, l) => sum + l.subtotal, 0);

  const subtotal = serviceSubtotal + officialFeesSubtotal + expensesSubtotal + discountsSubtotal;
  const totalVat = lines.reduce((sum, line) => sum + line.vat_amount, 0);
  const withholdingAmount = serviceSubtotal * (withholdingPercent / 100); // IRPF only on professional fees
  const total = subtotal + totalVat - withholdingAmount;

  // Group VAT by rate
  const vatBreakdown = lines.reduce((acc, line) => {
    const rate = line.vat_rate;
    if (!acc[rate]) {
      acc[rate] = { rate, base: 0, amount: 0 };
    }
    acc[rate].base += line.subtotal;
    acc[rate].amount += line.vat_amount;
    return acc;
  }, {} as Record<number, { rate: number; base: number; amount: number }>);

  return {
    subtotal,
    serviceSubtotal,
    officialFeesSubtotal,
    expensesSubtotal,
    discountsSubtotal,
    totalVat,
    withholdingAmount,
    total,
    vatBreakdown: Object.values(vatBreakdown).filter(v => v.amount !== 0),
  };
}
