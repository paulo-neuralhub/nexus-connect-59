// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, ArrowRight, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fromTable } from '@/lib/supabase';
import { getFeesForJurisdiction } from '@/hooks/use-instruction-actions';
import type { Instruction } from '@/hooks/use-instructions';

const JURISDICTION_FLAGS: Record<string, string> = {
  EU: '🇪🇺', ES: '🇪🇸', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', PT: '🇵🇹', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', CA: '🇨🇦', AR: '🇦🇷', WO: '🌍',
  EP: '🇪🇺', PCT: '🌍',
};

interface QuoteLine {
  id: string;
  jurisdiction: string;
  description: string;
  officialFees: number;
  professionalFees: number;
}

interface AccountInfo {
  name: string;
  discount_pct: number;
  tier: string | null;
  address_line1: string | null;
  city: string | null;
  country: string | null;
  billing_email: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  content: string;
  variables: any;
}

interface QuoteWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: Instruction;
  onSend: (data: { lines: QuoteLine[]; discount: number; taxRate: number; notes: string; quoteNumber: string; htmlContent: string; templateId: string; total: number }) => void;
  isLoading: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function QuoteWizardModal({ open, onOpenChange, instruction, onSend, isLoading }: QuoteWizardModalProps) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('e0100001-0000-0000-0000-000000000001');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState(30);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [includeVat, setIncludeVat] = useState(false);
  const [notes, setNotes] = useState('Los importes incluyen tasas oficiales y honorarios profesionales. No incluyen traducciones ni legalizaciones salvo indicación expresa.');
  const [lines, setLines] = useState<QuoteLine[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (!open) { setStep(1); return; }

    // Load templates
    (async () => {
      const { data } = await fromTable('doc_templates')
        .select('id, name, content, variables')
        .eq('category', 'quote')
        .eq('is_active', true);
      if (data) setTemplates(data);
    })();

    // Load account info
    if (instruction.crm_account_id) {
      (async () => {
        const { data } = await fromTable('crm_accounts')
          .select('name, discount_pct, tier, address_line1, city, country, billing_email')
          .eq('id', instruction.crm_account_id)
          .single();
        if (data) {
          setAccount(data);
          const d = data.discount_pct || 0;
          setDiscount(d);
          // Auto VAT: 0% for non-Spanish clients
          if (data.country && data.country !== 'ES' && data.country !== 'España') {
            setTaxRate(0);
            setIncludeVat(false);
          } else {
            setTaxRate(21);
            setIncludeVat(true);
          }
        }
      })();
    }

    // Generate quote number
    (async () => {
      const year = new Date().getFullYear();
      const { data } = await fromTable('generated_documents')
        .select('document_number')
        .eq('category', 'quote')
        .like('document_number', `PRES-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      let nextNum = 1;
      if (data && data.length > 0 && data[0].document_number) {
        const parts = data[0].document_number.split('-');
        const last = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(last)) nextNum = last + 1;
      }
      setQuoteNumber(`PRES-${year}-${String(nextNum).padStart(3, '0')}`);
    })();

    // Build lines from items
    const items = (instruction.items || []).filter(it => it.status === 'pending' || it.status === 'confirmed');
    setLines(items.map(item => {
      const code = (item.jurisdiction_code || '').toUpperCase();
      const fees = getFeesForJurisdiction(code);
      return {
        id: generateId(),
        jurisdiction: code,
        description: `${instruction.title} — ${code}`,
        officialFees: fees.official,
        professionalFees: fees.professional,
      };
    }));
  }, [open, instruction]);

  // Calculations
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.officialFees + l.professionalFees, 0), [lines]);
  const discountAmount = useMemo(() => subtotal * (discount / 100), [subtotal, discount]);
  const taxableBase = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const taxAmount = useMemo(() => includeVat ? taxableBase * (taxRate / 100) : 0, [taxableBase, taxRate, includeVat]);
  const total = useMemo(() => taxableBase + taxAmount, [taxableBase, taxAmount]);

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  const updateLine = (id: string, field: keyof QuoteLine, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
  const addLine = () => setLines(prev => [...prev, { id: generateId(), jurisdiction: '', description: '', officialFees: 0, professionalFees: 0 }]);

  const validityDate = useMemo(() => {
    const d = new Date(quoteDate);
    d.setDate(d.getDate() + validityDays);
    return d.toLocaleDateString('es-ES');
  }, [quoteDate, validityDays]);

  // Render template for preview
  const renderedHtml = useMemo(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    let html = tpl?.content || '';

    // Simple variable substitution
    const vars: Record<string, string> = {
      quote_number: quoteNumber,
      quote_date: new Date(quoteDate).toLocaleDateString('es-ES'),
      validity_date: validityDate,
      validity_days: String(validityDays),
      client_name: account?.name || instruction.account?.name || '',
      client_address: account?.address_line1 || '',
      client_city: account?.city || '',
      client_country: account?.country || '',
      client_email: account?.billing_email || '',
      instruction_title: instruction.title,
      subtotal: fmt(subtotal),
      discount_pct: `${discount}%`,
      discount_amount: fmt(discountAmount),
      taxable_base: fmt(taxableBase),
      tax_rate: includeVat ? `${taxRate}%` : '0%',
      tax_label: includeVat ? `IVA ${taxRate}%` : 'Operación intracomunitaria (0% IVA)',
      tax_amount: fmt(taxAmount),
      total: fmt(total),
      notes: notes,
      company_name: 'MERIDIAN IP CONSULTING S.L.',
    };

    // Replace {{variable}}
    for (const [key, val] of Object.entries(vars)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    }

    // Handle {{#items}}...{{/items}} block
    const itemsMatch = html.match(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/);
    if (itemsMatch) {
      const rowTpl = itemsMatch[1];
      const rowsHtml = lines.map(l => {
        let row = rowTpl;
        row = row.replace(/\{\{jurisdiction\}\}/g, `${JURISDICTION_FLAGS[l.jurisdiction] || ''} ${l.jurisdiction}`);
        row = row.replace(/\{\{description\}\}/g, l.description);
        row = row.replace(/\{\{official_fees\}\}/g, fmt(l.officialFees));
        row = row.replace(/\{\{professional_fees\}\}/g, fmt(l.professionalFees));
        row = row.replace(/\{\{line_total\}\}/g, fmt(l.officialFees + l.professionalFees));
        return row;
      }).join('');
      html = html.replace(/\{\{#items\}\}[\s\S]*?\{\{\/items\}\}/, rowsHtml);
    }

    // If template is empty, generate a basic one
    if (!html || html.trim().length < 50) {
      html = generateDefaultPreview();
    }

    return html;
  }, [templates, selectedTemplateId, lines, quoteNumber, quoteDate, validityDate, account, instruction, subtotal, discount, discountAmount, taxableBase, taxRate, taxAmount, total, notes, includeVat, validityDays]);

  function generateDefaultPreview() {
    const linesHtml = lines.map(l => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${JURISDICTION_FLAGS[l.jurisdiction] || ''} ${l.jurisdiction}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${l.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">${fmt(l.officialFees)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">${fmt(l.professionalFees)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600;">${fmt(l.officialFees + l.professionalFees)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;color:#1E293B;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:20px;font-weight:700;margin:0;color:#0F172A;">MERIDIAN IP CONSULTING S.L.</h1>
          <p style="font-size:16px;color:#64748B;margin:4px 0 0;">Presupuesto de Servicios IP</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:13px;">
          <div>
            <p style="margin:0;"><strong>Nº:</strong> ${quoteNumber}</p>
            <p style="margin:0;"><strong>Fecha:</strong> ${new Date(quoteDate).toLocaleDateString('es-ES')}</p>
            <p style="margin:0;"><strong>Válido hasta:</strong> ${validityDate}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-weight:700;">${account?.name || instruction.account?.name || ''}</p>
            ${account?.address_line1 ? `<p style="margin:0;">${account.address_line1}</p>` : ''}
            <p style="margin:0;">${[account?.city, account?.country].filter(Boolean).join(', ')}</p>
            ${account?.billing_email ? `<p style="margin:0;">${account.billing_email}</p>` : ''}
          </div>
        </div>
        <p style="font-size:14px;margin-bottom:16px;"><strong>Referencia:</strong> ${instruction.title}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <thead>
            <tr style="background:#F8FAFC;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Jurisd.</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Descripción</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #E2E8F0;">Tasas</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #E2E8F0;">Honorarios</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #E2E8F0;">Total</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>
        <div style="margin-left:auto;max-width:280px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal:</span><span>${fmt(subtotal)}</span></div>
          ${discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#15803D;"><span>Descuento ${discount}%:</span><span>-${fmt(discountAmount)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Base imponible:</span><span>${fmt(taxableBase)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${includeVat ? `IVA ${taxRate}%` : 'Operación intracomunitaria (0% IVA)'}:</span><span>${fmt(taxAmount)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:700;border-top:2px solid #0F172A;margin-top:4px;"><span>TOTAL:</span><span>${fmt(total)}</span></div>
        </div>
        ${notes ? `<div style="margin-top:24px;padding:16px;background:#F8FAFC;border-radius:8px;font-size:12px;color:#64748B;"><strong>Condiciones:</strong><br/>${notes}</div>` : ''}
      </div>
    `;
  }

  const handleSend = () => {
    onSend({
      lines,
      discount,
      taxRate: includeVat ? taxRate : 0,
      notes,
      quoteNumber,
      htmlContent: renderedHtml,
      templateId: selectedTemplateId,
      total,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              💶 {step === 1 ? 'Generar Presupuesto' : 'Preview Presupuesto'}
            </span>
            <Badge variant="outline" className="text-xs font-normal">
              Paso {step} de 2
            </Badge>
          </DialogTitle>
          <DialogDescription>{instruction.title}</DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-5">
            {/* Template selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* General data */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos generales</label>
              <div className="grid grid-cols-3 gap-3 mt-1.5">
                <div>
                  <label className="text-xs text-muted-foreground">Nº Presupuesto</label>
                  <Input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fecha</label>
                  <Input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Validez (días)</label>
                  <Input type="number" value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} className="mt-1 text-sm" />
                </div>
              </div>
            </div>

            {/* Client info */}
            {account && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</label>
                <div className="mt-1.5 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {(account.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[account.billing_email, account.city, account.country].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lines */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Líneas de presupuesto</label>
              <div className="mt-1.5 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[80px]">Juris.</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[100px]">Tasas</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[100px]">Honor.</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[90px]">Total</th>
                      <th className="w-[32px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(l => (
                      <tr key={l.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-base leading-none">{JURISDICTION_FLAGS[l.jurisdiction] || ''}</span>
                            <Input
                              value={l.jurisdiction}
                              onChange={e => updateLine(l.id, 'jurisdiction', e.target.value.toUpperCase())}
                              className="h-7 px-1.5 text-xs w-[48px] text-center font-semibold"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={l.description}
                            onChange={e => updateLine(l.id, 'description', e.target.value)}
                            className="h-7 px-1.5 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={l.officialFees}
                            onChange={e => updateLine(l.id, 'officialFees', Number(e.target.value))}
                            className="h-7 px-1.5 text-xs text-right tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={l.professionalFees}
                            onChange={e => updateLine(l.id, 'professionalFees', Number(e.target.value))}
                            className="h-7 px-1.5 text-xs text-right tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums text-foreground">
                          {fmt(l.officialFees + l.professionalFees)}
                        </td>
                        <td className="px-1">
                          <button onClick={() => removeLine(l.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={addLine}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir línea
                </button>
              </div>
            </div>

            {/* Discount */}
            <div>
              {discount > 0 ? (
                <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg px-4 py-3">
                  <Sparkles className="h-5 w-5 text-[#15803D] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#15803D]">
                      Descuento de cliente aplicado
                    </p>
                    <p className="text-xs text-[#166534]">
                      {account?.name} ({account?.tier || 'partner'}): {discount}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="h-8 w-[64px] text-xs text-center font-semibold"
                    />
                    <span className="text-sm text-[#15803D] font-medium">%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descuento</label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="h-8 w-[64px] text-xs text-center"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium tabular-nums">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-[#15803D]">
                  <span>Descuento {discount}%:</span>
                  <span className="font-medium tabular-nums">-{fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base imponible:</span>
                <span className="font-medium tabular-nums">{fmt(taxableBase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={e => setIncludeVat(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-muted-foreground">
                    {includeVat ? `IVA ${taxRate}%:` : 'Operación intracomunitaria (0% IVA):'}
                  </span>
                </label>
                <span className="font-medium tabular-nums">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>TOTAL:</span>
                <span className="tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas adicionales</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="mt-1.5 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={() => setStep(2)} className="gap-2">
                Ver preview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* ═══ STEP 2: PREVIEW ═══ */
          <div className="space-y-4">
            <div
              className="bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-10 mx-auto max-w-[700px]"
              style={{ fontFamily: 'Georgia, serif' }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver a editar
              </Button>
              <Button onClick={handleSend} disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" /> Enviar →
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
