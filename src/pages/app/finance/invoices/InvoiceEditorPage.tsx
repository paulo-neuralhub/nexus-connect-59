// =============================================
// InvoiceEditorPage - Editor completo de facturas
// Con líneas tipadas IP, vinculación PI, importar horas/gastos
// =============================================

import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Loader2, FileText, Clock, Receipt, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { InvoiceType, InvoiceStatus } from '@/types/finance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useInvoice, useCreateInvoice, useUpdateInvoice, useBillingClients } from '@/hooks/use-finance';
import { useInvoiceSeries, useFiscalSettings } from '@/hooks/finance/useFiscalSettings';
import { InvoiceLineEditor, calculateTotals, type InvoiceLine, type InvoiceLineType } from '@/components/features/finance/invoices';
import { formatCurrency } from '@/lib/constants/finance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useQuery } from '@tanstack/react-query';

export default function InvoiceEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const isEditing = !!id;
  
  const rectifyId = searchParams.get('rectify');
  const correctionReason = searchParams.get('reason');
  const correctionDescription = searchParams.get('description');
  const isRectificative = !!rectifyId;

  // Queries
  const invoiceQuery = useInvoice(id || '');
  const { data: clients = [] } = useBillingClients();
  const { data: series = [] } = useInvoiceSeries();
  const { data: fiscalSettings } = useFiscalSettings();
  
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('F');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [withholdingPercent, setWithholdingPercent] = useState(0);

  // IP Linkage state
  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Matters query for the selected client's org
  const { data: matters = [] } = useQuery({
    queryKey: ['matters-for-invoice', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select('id, reference, title, type')
        .eq('organization_id', currentOrganization!.id)
        .order('reference', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  // CRM Deals query
  const { data: deals = [] } = useQuery({
    queryKey: ['deals-for-invoice', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('id, name, value')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  // Unbilled time entries
  const { data: unbilledTime = [] } = useQuery({
    queryKey: ['unbilled-time', currentOrganization?.id, selectedMatterId],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select('id, description, date, duration_minutes, hourly_rate, total_amount, activity_type, matter_id')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_billable', true)
        .eq('is_billed', false)
        .order('date', { ascending: false });
      if (selectedMatterId) query = query.eq('matter_id', selectedMatterId);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && showImportModal,
  });

  // Unbilled expenses
  const { data: unbilledExpenses = [] } = useQuery({
    queryKey: ['unbilled-expenses', currentOrganization?.id, selectedMatterId],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('id, description, category, amount, expense_date, matter_id')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_billable', true)
        .eq('is_billed', false)
        .order('expense_date', { ascending: false });
      if (selectedMatterId) query = query.eq('matter_id', selectedMatterId);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && showImportModal,
  });

  // Import selection state
  const [selectedTimeIds, setSelectedTimeIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());

  // Load existing invoice data
  useEffect(() => {
    if (invoiceQuery.data && isEditing) {
      const inv = invoiceQuery.data;
      setSelectedClientId(inv.billing_client_id);
      setSelectedSeries(inv.invoice_series || 'F');
      setInvoiceDate(new Date(inv.invoice_date));
      setDueDate(inv.due_date ? new Date(inv.due_date) : undefined);
      setNotes(inv.notes || '');
      setInternalNotes(inv.internal_notes || '');
      setWithholdingPercent(inv.withholding_percent || 0);
      
      if (inv.items && inv.items.length > 0) {
        const loadedLines: InvoiceLine[] = inv.items.map((item) => ({
          id: item.id,
          line_type: 'service' as InvoiceLineType,
          description: item.description,
          notes: item.notes,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          vat_rate: item.tax_rate ?? 21,
          subtotal: item.subtotal || 0,
          vat_amount: item.tax_amount || 0,
          total: item.total || item.subtotal || 0,
          matter_id: item.matter_id,
        }));
        setLines(loadedLines);
      }
    }
  }, [invoiceQuery.data, isEditing]);

  useEffect(() => {
    if (fiscalSettings && !isEditing) {
      setWithholdingPercent(fiscalSettings.default_withholding || 0);
    }
  }, [fiscalSettings, isEditing]);

  const totals = useMemo(() => calculateTotals(lines, withholdingPercent), [lines, withholdingPercent]);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleImportSelected = () => {
    const newLines: InvoiceLine[] = [];

    unbilledTime.filter(t => selectedTimeIds.has(t.id)).forEach(t => {
      const hours = (t.duration_minutes || 0) / 60;
      const rate = t.hourly_rate || 0;
      newLines.push({
        id: crypto.randomUUID(),
        line_type: 'service',
        description: t.description || `Tiempo: ${t.activity_type}`,
        quantity: parseFloat(hours.toFixed(2)),
        unit_price: rate,
        discount_percent: 0,
        vat_rate: 21,
        subtotal: parseFloat((hours * rate).toFixed(2)),
        vat_amount: parseFloat((hours * rate * 0.21).toFixed(2)),
        total: parseFloat((hours * rate * 1.21).toFixed(2)),
        matter_id: t.matter_id || undefined,
        time_entry_id: t.id,
      });
    });

    unbilledExpenses.filter(e => selectedExpenseIds.has(e.id)).forEach(e => {
      const lineType: InvoiceLineType = e.category === 'official_fee' ? 'official_fee' : 'expense';
      newLines.push({
        id: crypto.randomUUID(),
        line_type: lineType,
        description: e.description || `Gasto: ${e.category}`,
        quantity: 1,
        unit_price: e.amount || 0,
        discount_percent: 0,
        vat_rate: lineType === 'official_fee' ? 0 : 21,
        subtotal: e.amount || 0,
        vat_amount: lineType === 'official_fee' ? 0 : parseFloat(((e.amount || 0) * 0.21).toFixed(2)),
        total: lineType === 'official_fee' ? (e.amount || 0) : parseFloat(((e.amount || 0) * 1.21).toFixed(2)),
        matter_id: e.matter_id || undefined,
        expense_id: e.id,
      });
    });

    setLines(prev => [...prev, ...newLines]);
    setShowImportModal(false);
    setSelectedTimeIds(new Set());
    setSelectedExpenseIds(new Set());
    toast.success(`Importadas ${newLines.length} líneas`);
  };

  const handleSave = async (send = false) => {
    if (!selectedClientId) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (lines.length === 0) {
      toast.error('Añade al menos una línea a la factura');
      return;
    }

    const invoiceData = {
      billing_client_id: selectedClientId,
      client_name: selectedClient?.legal_name || '',
      client_tax_id: selectedClient?.tax_id,
      client_address: [
        selectedClient?.billing_address,
        selectedClient?.billing_postal_code,
        selectedClient?.billing_city,
      ].filter(Boolean).join(', '),
      invoice_series: selectedSeries,
      invoice_date: format(invoiceDate, 'yyyy-MM-dd'),
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      subtotal: totals.subtotal,
      tax_amount: totals.totalVat,
      total: totals.total,
      tax_rate: 21,
      notes,
      internal_notes: internalNotes,
      withholding_percent: withholdingPercent,
      total_withholding: totals.withholdingAmount,
      status: (send ? 'sent' : 'draft') as InvoiceStatus,
      invoice_type: (isRectificative ? 'FR' : 'FC') as InvoiceType,
      corrected_invoice_id: rectifyId || undefined,
      correction_reason: correctionReason || undefined,
      correction_description: correctionDescription || undefined,
      // IP-specific fields
      matter_id: selectedMatterId || undefined,
      crm_deal_id: selectedDealId || undefined,
      official_fees_subtotal: totals.officialFeesSubtotal,
      professional_fees_subtotal: totals.serviceSubtotal,
      expenses_subtotal: totals.expensesSubtotal,
    };

    const itemsData = lines.map((line, index) => ({
      line_number: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent,
      subtotal: line.subtotal,
      tax_rate: line.vat_rate,
      tax_amount: line.vat_amount,
      total: line.total,
      matter_id: line.matter_id,
      notes: line.notes,
    }));

    try {
      if (isEditing && id) {
        await updateInvoice.mutateAsync({ id, data: invoiceData });
        toast.success('Factura actualizada');
      } else {
        await createInvoice.mutateAsync({ invoice: invoiceData, items: itemsData });
        toast.success(send ? 'Factura creada y enviada' : 'Factura guardada como borrador');
      }
      navigate('/app/finance/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error al guardar la factura');
    }
  };

  const isLoading = createInvoice.isPending || updateInvoice.isPending;

  if (isEditing && invoiceQuery.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" asChild className="-ml-2">
            <Link to="/app/finance/invoices" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar factura' : isRectificative ? 'Nueva factura rectificativa' : 'Nueva factura'}
          </h1>
          {isRectificative && (
            <p className="text-sm text-muted-foreground">
              Rectificando factura original. Motivo: {correctionReason}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar borrador
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Guardar y enviar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* General data */}
          <Card>
            <CardHeader>
              <CardTitle>Datos generales</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serie</Label>
                <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona serie" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.length > 0 ? (
                      series.map((s) => (
                        <SelectItem key={s.id} value={s.code}>
                          {s.code} - {s.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="F">F - Facturas</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.legal_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha emisión</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !invoiceDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, 'PPP', { locale: es }) : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha vencimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP', { locale: es }) : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* IP Linkage section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Vinculación PI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expediente relacionado</Label>
                  <Select value={selectedMatterId} onValueChange={setSelectedMatterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona expediente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Sin expediente —</SelectItem>
                      {matters.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.reference} — {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deal CRM relacionado</Label>
                  <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona deal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Sin deal —</SelectItem>
                      {deals.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Importar horas y gastos del expediente
              </Button>
            </CardContent>
          </Card>

          {/* Invoice lines */}
          <Card>
            <CardHeader>
              <CardTitle>Líneas de factura</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceLineEditor lines={lines} onChange={setLines} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Condiciones y notas</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notas para el cliente</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Estas notas aparecerán en la factura"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Solo visibles internamente"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Totals and preview */}
        <div className="space-y-6">
          {/* Totals card with IP breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Type-separated subtotals (IP differentiator) */}
              {totals.serviceSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Honorarios profesionales</span>
                  <span className="font-medium">{formatCurrency(totals.serviceSubtotal)}</span>
                </div>
              )}
              {totals.officialFeesSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasas oficiales</span>
                  <span className="font-medium">{formatCurrency(totals.officialFeesSubtotal)}</span>
                </div>
              )}
              {totals.expensesSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos suplidos</span>
                  <span className="font-medium">{formatCurrency(totals.expensesSubtotal)}</span>
                </div>
              )}
              {totals.discountsSubtotal < 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuentos</span>
                  <span className="font-medium text-destructive">{formatCurrency(totals.discountsSubtotal)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              
              {totals.vatBreakdown.map((vat) => (
                <div key={vat.rate} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA {vat.rate}%</span>
                  <span className="font-medium">{formatCurrency(vat.amount)}</span>
                </div>
              ))}

              {withholdingPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IRPF -{withholdingPercent}% (s/ honorarios)</span>
                  <span className="font-medium text-destructive">-{formatCurrency(totals.withholdingAmount)}</span>
                </div>
              )}

              <Separator />
              
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
              </div>

              {/* Withholding input */}
              <div className="pt-4 space-y-2">
                <Label>Retención IRPF (%)</Label>
                <Select
                  value={String(withholdingPercent)}
                  onValueChange={(v) => setWithholdingPercent(parseFloat(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="2">2%</SelectItem>
                    <SelectItem value="7">7%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Se aplica solo sobre honorarios profesionales
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Client info card */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Datos del cliente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{selectedClient.legal_name}</p>
                {selectedClient.tax_id && (
                  <p className="text-muted-foreground">{selectedClient.tax_id}</p>
                )}
                {selectedClient.billing_address && (
                  <p className="text-muted-foreground">{selectedClient.billing_address}</p>
                )}
                {(selectedClient.billing_postal_code || selectedClient.billing_city) && (
                  <p className="text-muted-foreground">
                    {[selectedClient.billing_postal_code, selectedClient.billing_city].filter(Boolean).join(' ')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar horas y gastos</DialogTitle>
            <DialogDescription>
              Selecciona las horas y gastos no facturados para añadirlos como líneas.
            </DialogDescription>
          </DialogHeader>

          {/* Time entries */}
          {unbilledTime.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Horas no facturadas ({unbilledTime.length})
              </h4>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {unbilledTime.map((t: any) => (
                  <label key={t.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedTimeIds.has(t.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedTimeIds);
                        checked ? next.add(t.id) : next.delete(t.id);
                        setSelectedTimeIds(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.activity_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.date} · {Math.round((t.duration_minutes || 0) / 60 * 10) / 10}h
                        {t.hourly_rate ? ` · €${t.hourly_rate}/h` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(t.total_amount || ((t.duration_minutes || 0) / 60 * (t.hourly_rate || 0)))}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {unbilledExpenses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                Gastos no facturados ({unbilledExpenses.length})
              </h4>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {unbilledExpenses.map((e: any) => (
                  <label key={e.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedExpenseIds.has(e.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedExpenseIds);
                        checked ? next.add(e.id) : next.delete(e.id);
                        setSelectedExpenseIds(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.expense_date} · {e.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(e.amount)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {unbilledTime.length === 0 && unbilledExpenses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay horas ni gastos pendientes de facturar
              {selectedMatterId ? ' para este expediente' : ''}.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImportSelected}
              disabled={selectedTimeIds.size === 0 && selectedExpenseIds.size === 0}
            >
              Importar {selectedTimeIds.size + selectedExpenseIds.size} elementos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
