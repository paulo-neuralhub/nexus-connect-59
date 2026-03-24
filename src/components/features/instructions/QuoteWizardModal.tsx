// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, X, ArrowRight, ArrowLeft, Send, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fromTable } from '@/lib/supabase';
import { getFeesForJurisdiction } from '@/hooks/use-instruction-actions';
import { marked } from 'marked';
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
  id: string;
  name: string;
  discount_pct: number;
  tier: string | null;
  address_line1: string | null;
  city: string | null;
  country: string | null;
  billing_email: string | null;
  email: string | null;
  currency: string | null;
  payment_terms: string | null;
}

interface OrgInfo {
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
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
  onSend: (data: {
    lines: QuoteLine[];
    discount: number;
    taxRate: number;
    notes: string;
    quoteNumber: string;
    htmlContent: string;
    templateId: string;
    total: number;
  }) => void;
  isLoading: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

/* ── Stepper component ── */
function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-3">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300',
            step === 1
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#22C55E] text-white',
          )}
        >
          {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
        </div>
        <span
          className={cn(
            'text-xs font-medium transition-colors',
            step === 1 ? 'text-[#3B82F6]' : 'text-[#22C55E]',
          )}
        >
          Editor
        </span>
      </div>
      {/* Connector */}
      <div className="w-12 h-px bg-[#CBD5E1] mx-2" />
      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300',
            step === 2
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#CBD5E1] text-[#94A3B8]',
          )}
        >
          2
        </div>
        <span
          className={cn(
            'text-xs font-medium transition-colors',
            step === 2 ? 'text-[#3B82F6]' : 'text-[#94A3B8]',
          )}
        >
          Preview
        </span>
      </div>
    </div>
  );
}

export function QuoteWizardModal({
  open,
  onOpenChange,
  instruction,
  onSend,
  isLoading,
}: QuoteWizardModalProps) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState(30);
  const [validityWarning, setValidityWarning] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [includeVat, setIncludeVat] = useState(false);
  const [includeIrpf, setIncludeIrpf] = useState(false);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (!open) {
      setStep(1);
      setDataLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      // Parallel loads
      const [templatesRes, accountRes, orgRes, quoteNumRes] = await Promise.all([
        fromTable('doc_templates')
          .select('id, name, content, variables')
          .eq('category', 'quote')
          .eq('is_active', true)
          .order('name'),
        instruction.crm_account_id
          ? fromTable('crm_accounts')
              .select('id, name, discount_pct, tier, address_line1, city, country, billing_email, email, currency, payment_terms')
              .eq('id', instruction.crm_account_id)
              .single()
          : Promise.resolve({ data: null }),
        fromTable('organizations')
          .select('name, address, email, phone')
          .limit(1)
          .single(),
        (async () => {
          const year = new Date().getFullYear();
          const { data } = await fromTable('generated_documents')
            .select('document_number')
            .eq('category', 'quote')
            .like('document_number', `PRES-${year}-%`)
            .order('created_at', { ascending: false })
            .limit(1);
          let nextNum = 1;
          if (data?.[0]?.document_number) {
            const parts = data[0].document_number.split('-');
            const last = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(last)) nextNum = last + 1;
          }
          return `PRES-${year}-${String(nextNum).padStart(3, '0')}`;
        })(),
      ]);

      if (cancelled) return;

      // Templates
      if (templatesRes.data) {
        setTemplates(templatesRes.data);
        if (templatesRes.data.length > 0) {
          setSelectedTemplateId(templatesRes.data[0].id);
        }
      }

      // Account + discount + VAT
      if (accountRes.data) {
        const acc = accountRes.data;
        setAccount(acc);
        const d = acc.discount_pct || 0;
        setDiscount(d);
        const isSpanish = acc.country && ['ES', 'España', 'Spain'].includes(acc.country);
        setIncludeVat(!!isSpanish);
        setTaxRate(isSpanish ? 21 : 0);
        setIncludeIrpf(false);
      }

      // Org
      if (orgRes.data) setOrg(orgRes.data);

      // Quote number
      setQuoteNumber(quoteNumRes);

      // Validity warning based on deadline
      if (instruction.deadline_date) {
        const deadline = new Date(instruction.deadline_date);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
        if (daysUntil < 35) {
          const adj = Math.max(7, daysUntil - 5);
          setValidityDays(adj);
          setValidityWarning('⚠️ Ajustado al plazo del encargo');
        } else {
          setValidityDays(30);
          setValidityWarning('');
        }
      } else {
        setValidityDays(30);
        setValidityWarning('');
      }

      // Default notes
      setNotes(
        'Las tasas oficiales son estimadas y pueden variar según la oficina de destino. ' +
        'Los honorarios incluyen gestión completa del trámite. ' +
        'No incluyen traducciones ni legalizaciones salvo indicación expresa. ' +
        `Presupuesto válido ${30} días desde la fecha de emisión.`
      );

      // Lines from items
      const items = (instruction.items || []).filter(
        (it) => it.status === 'pending' || it.status === 'confirmed'
      );
      setLines(
        items.map((item) => {
          const code = (item.jurisdiction_code || '').toUpperCase();
          const fees = getFeesForJurisdiction(code);
          return {
            id: generateId(),
            jurisdiction: code,
            description: `${instruction.title} — ${code}`,
            officialFees: fees.official,
            professionalFees: fees.professional,
          };
        })
      );

      setDataLoaded(true);
    }

    loadAll();
    return () => { cancelled = true; };
  }, [open, instruction]);

  // Calculations
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.officialFees + l.professionalFees, 0),
    [lines]
  );
  const discountAmount = useMemo(
    () => subtotal * (discount / 100),
    [subtotal, discount]
  );
  const taxableBase = useMemo(
    () => subtotal - discountAmount,
    [subtotal, discountAmount]
  );
  const taxAmount = useMemo(
    () => (includeVat ? taxableBase * (taxRate / 100) : 0),
    [taxableBase, taxRate, includeVat]
  );
  const totalProfessionalFees = useMemo(
    () => lines.reduce((s, l) => s + l.professionalFees, 0),
    [lines]
  );
  const irpfAmount = useMemo(
    () => (includeVat && includeIrpf ? totalProfessionalFees * 0.15 : 0),
    [includeVat, includeIrpf, totalProfessionalFees]
  );
  const total = useMemo(
    () => taxableBase + taxAmount - irpfAmount,
    [taxableBase, taxAmount, irpfAmount]
  );

  const validityDate = useMemo(() => {
    const d = new Date(quoteDate);
    d.setDate(d.getDate() + validityDays);
    return d.toLocaleDateString('es-ES');
  }, [quoteDate, validityDays]);

  const updateLine = (id: string, field: keyof QuoteLine, value: any) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { id: generateId(), jurisdiction: '', description: '', officialFees: 0, professionalFees: 0 },
    ]);

  const isSpanish = account?.country && ['ES', 'España', 'Spain'].includes(account.country);

  // Render template for preview
  const renderedHtml = useMemo(() => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    let html = tpl?.content || '';

    const vars: Record<string, string> = {
      firm_name: org?.name || 'MERIDIAN IP CONSULTING S.L.',
      firm_address: org?.address || '',
      firm_contact: org?.email || '',
      firm_phone: org?.phone || '',
      client_name: account?.name || instruction.account?.name || '',
      client_address: [account?.address_line1, account?.city, account?.country].filter(Boolean).join(', '),
      client_email: account?.billing_email || account?.email || '',
      quote_number: quoteNumber,
      quote_date: new Date(quoteDate).toLocaleDateString('es-ES'),
      validity_date: validityDate,
      validity_days: String(validityDays),
      instruction_title: instruction.title,
      subtotal: fmt(subtotal),
      discount_pct: discount > 0 ? `${discount}` : '',
      discount_amount: fmt(discountAmount),
      taxable_base: fmt(taxableBase),
      tax_rate: includeVat ? `${taxRate}` : '0',
      tax_label: includeVat ? `IVA ${taxRate}%` : 'Operación intracomunitaria (0% IVA)',
      tax_amount: fmt(taxAmount),
      irpf_amount: fmt(irpfAmount),
      total: fmt(total),
      notes,
      company_name: org?.name || 'MERIDIAN IP CONSULTING S.L.',
    };

    for (const [key, val] of Object.entries(vars)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    }

    // Handle {{#items}}...{{/items}}
    const itemsMatch = html.match(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/);
    if (itemsMatch) {
      const rowTpl = itemsMatch[1];
      const rowsHtml = lines
        .map((l) => {
          let row = rowTpl;
          row = row.replace(/\{\{jurisdiction\}\}/g, `${JURISDICTION_FLAGS[l.jurisdiction] || ''} ${l.jurisdiction}`);
          row = row.replace(/\{\{description\}\}/g, l.description);
          row = row.replace(/\{\{official_fees\}\}/g, fmt(l.officialFees));
          row = row.replace(/\{\{professional_fees\}\}/g, fmt(l.professionalFees));
          row = row.replace(/\{\{line_total\}\}/g, fmt(l.officialFees + l.professionalFees));
          return row;
        })
        .join('');
      html = html.replace(/\{\{#items\}\}[\s\S]*?\{\{\/items\}\}/, rowsHtml);
    }

    // Handle {{#discount_pct}}...{{/discount_pct}}
    if (discount > 0) {
      html = html.replace(/\{\{#discount_pct\}\}/g, '').replace(/\{\{\/discount_pct\}\}/g, '');
    } else {
      html = html.replace(/\{\{#discount_pct\}\}[\s\S]*?\{\{\/discount_pct\}\}/g, '');
    }

    // If template is empty, generate default
    if (!html || html.trim().length < 50) {
      html = generateDefaultPreview();
    }

    return html;
  }, [templates, selectedTemplateId, lines, quoteNumber, quoteDate, validityDate, account, org, instruction, subtotal, discount, discountAmount, taxableBase, taxRate, taxAmount, irpfAmount, total, notes, includeVat, validityDays]);

  function generateDefaultPreview() {
    const linesHtml = lines
      .map(
        (l) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;">${JURISDICTION_FLAGS[l.jurisdiction] || ''} ${l.jurisdiction}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;">${l.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${fmt(l.officialFees)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${fmt(l.professionalFees)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-weight:600;">${fmt(l.officialFees + l.professionalFees)}</td>
      </tr>`
      )
      .join('');

    return `
      <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;color:#1E293B;line-height:1.6;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:20px;font-weight:700;margin:0;color:#0F172A;">${org?.name || 'MERIDIAN IP CONSULTING S.L.'}</h1>
          <p style="font-size:14px;color:#64748B;margin:4px 0 0;">Presupuesto de Servicios IP</p>
          ${org?.address ? `<p style="font-size:12px;color:#94A3B8;margin:2px 0 0;">${org.address}</p>` : ''}
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
            ${(account?.billing_email || account?.email) ? `<p style="margin:0;">${account.billing_email || account.email}</p>` : ''}
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
        <div style="margin-left:auto;max-width:300px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal:</span><span>${fmt(subtotal)}</span></div>
          ${discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#15803D;"><span>Descuento ${discount}%:</span><span>-${fmt(discountAmount)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Base imponible:</span><span>${fmt(taxableBase)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${includeVat ? `IVA ${taxRate}%` : 'Operación intracomunitaria (0% IVA)'}:</span><span>${fmt(taxAmount)}</span></div>
          ${irpfAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#B91C1C;"><span>Retención IRPF 15%:</span><span>-${fmt(irpfAmount)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:18px;font-weight:700;border-top:2px solid #0F172A;margin-top:4px;color:#0F172A;"><span>TOTAL:</span><span>${fmt(total)}</span></div>
        </div>
        ${notes ? `<div style="margin-top:24px;padding:16px;background:#F8FAFC;border-radius:8px;font-size:12px;color:#64748B;line-height:1.5;"><strong>Condiciones:</strong><br/>${notes}</div>` : ''}
      </div>
    `;
  }

  const goToPreview = useCallback(() => {
    setShowSkeleton(true);
    setStep(2);
    setTimeout(() => setShowSkeleton(false), 300);
  }, []);

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
      <DialogContent
        className={cn(
          'overflow-y-auto transition-all duration-300 ease-in-out',
          step === 1 ? 'max-w-[560px] max-h-[90vh]' : 'max-w-[860px] max-h-[90vh]',
        )}
      >
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            💶 {step === 1 ? 'Generar Presupuesto' : 'Preview Presupuesto'}
          </DialogTitle>
          <DialogDescription className="text-xs">{instruction.title}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <Stepper step={step} />

        {/* ═══ STEP 1: EDITOR ═══ */}
        <div
          className={cn(
            'transition-all duration-250',
            step === 1 ? 'block animate-fade-in' : 'hidden',
          )}
        >
          <div className="space-y-5">
            {/* Template selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference data */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Referencia
              </label>
              <div className="grid grid-cols-3 gap-3 mt-1.5">
                <div>
                  <label className="text-[10px] text-muted-foreground">Nº Presupuesto</label>
                  <Input
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="mt-0.5 text-sm h-9"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fecha</label>
                  <Input
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="mt-0.5 text-sm h-9"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Validez (días)</label>
                  <Input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="mt-0.5 text-sm h-9"
                  />
                  {validityWarning && (
                    <p className="text-[10px] text-amber-600 mt-0.5">{validityWarning}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Client info */}
            {account && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cliente
                </label>
                <div className="mt-1.5 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {(account.name || '')
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{account.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[account.billing_email || account.email, account.city, account.country]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lines */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Líneas de presupuesto
              </label>
              <div className="mt-1.5 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground w-[80px]">
                        Juris.
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">
                        Descripción
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground w-[100px]">
                        Tasas (€)
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground w-[100px]">
                        Honor. (€)
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground w-[90px]">
                        Total
                      </th>
                      <th className="w-[32px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-base leading-none">
                              {JURISDICTION_FLAGS[l.jurisdiction] || '🌍'}
                            </span>
                            <Input
                              value={l.jurisdiction}
                              onChange={(e) =>
                                updateLine(l.id, 'jurisdiction', e.target.value.toUpperCase())
                              }
                              className="h-7 px-1.5 text-xs w-[48px] text-center font-semibold"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={l.description}
                            onChange={(e) => updateLine(l.id, 'description', e.target.value)}
                            className="h-7 px-1.5 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={l.officialFees}
                            onChange={(e) =>
                              updateLine(l.id, 'officialFees', Number(e.target.value))
                            }
                            className="h-7 px-1.5 text-xs text-right tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={l.professionalFees}
                            onChange={(e) =>
                              updateLine(l.id, 'professionalFees', Number(e.target.value))
                            }
                            className="h-7 px-1.5 text-xs text-right tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums text-foreground">
                          {fmt(l.officialFees + l.professionalFees)}
                        </td>
                        <td className="px-1">
                          <button
                            onClick={() => removeLine(l.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
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
                <div
                  className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                  }}
                >
                  <Sparkles className="h-5 w-5 shrink-0" style={{ color: '#15803D' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: '#15803D' }}>
                      ✨ Descuento {account?.tier || 'partner'} aplicado
                    </p>
                    <p className="text-[11px]" style={{ color: '#166534' }}>
                      {account?.name}: {discount}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="h-8 w-[64px] text-xs text-center font-semibold"
                    />
                    <span className="text-sm font-medium" style={{ color: '#15803D' }}>
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Descuento
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="h-8 w-[64px] text-xs text-center"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* VAT + IRPF */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  IVA
                </label>
                <div className="flex items-center gap-2">
                  <Switch checked={includeVat} onCheckedChange={setIncludeVat} />
                  <span className="text-xs text-muted-foreground">
                    {includeVat
                      ? `IVA ${taxRate}%`
                      : 'Operación intracomunitaria (0%)'}
                  </span>
                  {includeVat && (
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="h-7 w-[56px] text-xs text-center ml-1"
                    />
                  )}
                </div>
              </div>
              {isSpanish && includeVat && (
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground">
                    Retención IRPF 15%
                  </label>
                  <Switch checked={includeIrpf} onCheckedChange={setIncludeIrpf} />
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
                <div className="flex justify-between text-sm" style={{ color: '#15803D' }}>
                  <span>Descuento {discount}%:</span>
                  <span className="font-medium tabular-nums">-{fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base imponible:</span>
                <span className="font-medium tabular-nums">{fmt(taxableBase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {includeVat ? `IVA ${taxRate}%:` : 'Operación intracomunitaria (0% IVA):'}
                </span>
                <span className="font-medium tabular-nums">{fmt(taxAmount)}</span>
              </div>
              {irpfAmount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Retención IRPF 15%:</span>
                  <span className="font-medium tabular-nums">-{fmt(irpfAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>TOTAL:</span>
                <span className="tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Notas adicionales
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 text-sm"
              />
            </div>

            {/* Footer step 1 */}
            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={goToPreview} className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB]">
                Ver preview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ STEP 2: PREVIEW ═══ */}
        <div
          className={cn(
            'transition-all duration-250',
            step === 2 ? 'block animate-fade-in' : 'hidden',
          )}
        >
          <div className="space-y-4">
            {showSkeleton ? (
              <div className="space-y-4 py-8">
                <div className="h-6 w-48 bg-muted rounded animate-pulse mx-auto" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
                <div className="h-px bg-muted mx-8 my-4" />
                <div className="space-y-2 px-12">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${90 - i * 8}%` }} />
                  ))}
                </div>
                <div className="h-24 bg-muted rounded animate-pulse mx-12 mt-4" />
                <div className="space-y-2 px-12 ml-auto" style={{ maxWidth: 200 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="overflow-y-auto"
                style={{ maxHeight: '65vh' }}
              >
                <div
                  className="bg-white rounded shadow-[0_4px_24px_rgba(0,0,0,0.10)] mx-auto"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    maxWidth: '700px',
                    padding: '48px',
                    borderRadius: '4px',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            )}

            {/* Footer step 2 */}
            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver a editar
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                📤 Enviar presupuesto
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
