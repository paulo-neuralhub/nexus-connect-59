// ============================================================
// HOOK: useDocumentPreferences
// Preferencias de documento por tenant (datos empresa, estilo default, numeración)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface DocumentPreferences {
  id: string;
  organizationId: string;
  defaultStyleId: string | null;
  // Company data
  companyName: string | null;
  companyLegalName: string | null;
  companyCif: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyPostalCode: string | null;
  companyCountry: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  companyIban: string | null;
  companyBankName: string | null;
  companyLogoUrl: string | null;
  // Texts
  footerText: string | null;
  paymentTerms: string | null;
  legalNotice: string | null;
  // Numbering
  invoicePrefix: string;
  invoiceNextNumber: number;
  quotePrefix: string;
  quoteNextNumber: number;
  creditNotePrefix: string;
  creditNoteNextNumber: number;
  receiptPrefix: string;
  receiptNextNumber: number;
  // Tax
  defaultTaxRate: number;
  taxLabel: string;
}

interface RawPreferences {
  id: string;
  organization_id: string;
  default_style_id: string | null;
  company_name: string | null;
  company_legal_name: string | null;
  company_cif: string | null;
  company_address: string | null;
  company_city: string | null;
  company_postal_code: string | null;
  company_country: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_iban: string | null;
  company_bank_name: string | null;
  company_logo_url: string | null;
  footer_text: string | null;
  payment_terms: string | null;
  legal_notice: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  quote_prefix: string;
  quote_next_number: number;
  credit_note_prefix: string;
  credit_note_next_number: number;
  receipt_prefix: string;
  receipt_next_number: number;
  default_tax_rate: number;
  tax_label: string;
}

function mapToPreferences(raw: RawPreferences): DocumentPreferences {
  return {
    id: raw.id,
    organizationId: raw.organization_id,
    defaultStyleId: raw.default_style_id,
    companyName: raw.company_name,
    companyLegalName: raw.company_legal_name,
    companyCif: raw.company_cif,
    companyAddress: raw.company_address,
    companyCity: raw.company_city,
    companyPostalCode: raw.company_postal_code,
    companyCountry: raw.company_country,
    companyPhone: raw.company_phone,
    companyEmail: raw.company_email,
    companyWebsite: raw.company_website,
    companyIban: raw.company_iban,
    companyBankName: raw.company_bank_name,
    companyLogoUrl: raw.company_logo_url,
    footerText: raw.footer_text,
    paymentTerms: raw.payment_terms,
    legalNotice: raw.legal_notice,
    invoicePrefix: raw.invoice_prefix || 'INV',
    invoiceNextNumber: raw.invoice_next_number || 1,
    quotePrefix: raw.quote_prefix || 'PRE',
    quoteNextNumber: raw.quote_next_number || 1,
    creditNotePrefix: raw.credit_note_prefix || 'NC',
    creditNoteNextNumber: raw.credit_note_next_number || 1,
    receiptPrefix: raw.receipt_prefix || 'REC',
    receiptNextNumber: raw.receipt_next_number || 1,
    defaultTaxRate: raw.default_tax_rate || 21,
    taxLabel: raw.tax_label || 'IVA',
  };
}

function mapToRaw(prefs: Partial<DocumentPreferences>): Partial<RawPreferences> {
  const raw: Partial<RawPreferences> = {};
  
  if (prefs.defaultStyleId !== undefined) raw.default_style_id = prefs.defaultStyleId;
  if (prefs.companyName !== undefined) raw.company_name = prefs.companyName;
  if (prefs.companyLegalName !== undefined) raw.company_legal_name = prefs.companyLegalName;
  if (prefs.companyCif !== undefined) raw.company_cif = prefs.companyCif;
  if (prefs.companyAddress !== undefined) raw.company_address = prefs.companyAddress;
  if (prefs.companyCity !== undefined) raw.company_city = prefs.companyCity;
  if (prefs.companyPostalCode !== undefined) raw.company_postal_code = prefs.companyPostalCode;
  if (prefs.companyCountry !== undefined) raw.company_country = prefs.companyCountry;
  if (prefs.companyPhone !== undefined) raw.company_phone = prefs.companyPhone;
  if (prefs.companyEmail !== undefined) raw.company_email = prefs.companyEmail;
  if (prefs.companyWebsite !== undefined) raw.company_website = prefs.companyWebsite;
  if (prefs.companyIban !== undefined) raw.company_iban = prefs.companyIban;
  if (prefs.companyBankName !== undefined) raw.company_bank_name = prefs.companyBankName;
  if (prefs.companyLogoUrl !== undefined) raw.company_logo_url = prefs.companyLogoUrl;
  if (prefs.footerText !== undefined) raw.footer_text = prefs.footerText;
  if (prefs.paymentTerms !== undefined) raw.payment_terms = prefs.paymentTerms;
  if (prefs.legalNotice !== undefined) raw.legal_notice = prefs.legalNotice;
  if (prefs.invoicePrefix !== undefined) raw.invoice_prefix = prefs.invoicePrefix;
  if (prefs.invoiceNextNumber !== undefined) raw.invoice_next_number = prefs.invoiceNextNumber;
  if (prefs.quotePrefix !== undefined) raw.quote_prefix = prefs.quotePrefix;
  if (prefs.quoteNextNumber !== undefined) raw.quote_next_number = prefs.quoteNextNumber;
  if (prefs.creditNotePrefix !== undefined) raw.credit_note_prefix = prefs.creditNotePrefix;
  if (prefs.creditNoteNextNumber !== undefined) raw.credit_note_next_number = prefs.creditNoteNextNumber;
  if (prefs.receiptPrefix !== undefined) raw.receipt_prefix = prefs.receiptPrefix;
  if (prefs.receiptNextNumber !== undefined) raw.receipt_next_number = prefs.receiptNextNumber;
  if (prefs.defaultTaxRate !== undefined) raw.default_tax_rate = prefs.defaultTaxRate;
  if (prefs.taxLabel !== undefined) raw.tax_label = prefs.taxLabel;
  
  return raw;
}

export function useDocumentPreferences() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['document-preferences', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('tenant_document_preferences')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      
      // Return mapped data or default preferences
      if (data) {
        return mapToPreferences(data as unknown as RawPreferences);
      }
      
      // Return default preferences if none exist
      return {
        id: '',
        organizationId,
        defaultStyleId: null,
        companyName: null,
        companyLegalName: null,
        companyCif: null,
        companyAddress: null,
        companyCity: null,
        companyPostalCode: null,
        companyCountry: null,
        companyPhone: null,
        companyEmail: null,
        companyWebsite: null,
        companyIban: null,
        companyBankName: null,
        companyLogoUrl: null,
        footerText: null,
        paymentTerms: 'Pago a 30 días desde la fecha de emisión',
        legalNotice: null,
        invoicePrefix: 'INV',
        invoiceNextNumber: 1,
        quotePrefix: 'PRE',
        quoteNextNumber: 1,
        creditNotePrefix: 'NC',
        creditNoteNextNumber: 1,
        receiptPrefix: 'REC',
        receiptNextNumber: 1,
        defaultTaxRate: 21,
        taxLabel: 'IVA',
      } as DocumentPreferences;
    },
    enabled: !!organizationId,
  });
}

export function useUpdateDocumentPreferences() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (updates: Partial<DocumentPreferences>) => {
      if (!organizationId) throw new Error('No organization selected');
      
      const rawUpdates = mapToRaw(updates);
      
      // Check if preferences exist
      const { data: existing } = await supabase
        .from('tenant_document_preferences')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('tenant_document_preferences')
          .update({ ...rawUpdates, updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('tenant_document_preferences')
          .insert({ organization_id: organizationId, ...rawUpdates });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-preferences', organizationId] });
      toast.success('Preferencias guardadas');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Error al guardar preferencias');
    },
  });
}
