// ============================================================
// HOOK: useDocumentData
// Carga datos REALES del tenant para popular el preview del documento
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useDocumentPreferences } from './useDocumentPreferences';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CompanyData {
  name: string;
  legalName: string;
  cif: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  phone: string;
  email: string;
  website: string;
  iban: string;
  bankName: string;
  logoUrl: string | null;
}

export interface ClientData {
  id: string | null;
  name: string;
  company: string;
  cif: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  phone: string;
  email: string;
}

export interface MatterData {
  id: string | null;
  reference: string;
  title: string;
  type: string;
  status: string;
  trademarkName: string | null;
  registrationNumber: string | null;
  applicationNumber: string | null;
  filingDate: string | null;
  registrationDate: string | null;
  expiryDate: string | null;
  classes: string[];
  jurisdiction: string;
  office: string;
}

export interface DocumentDataContext {
  company: CompanyData;
  client: ClientData;
  matter: MatterData | null;
  date: {
    today: string;
    todayFormal: string;
    dueDate: string;
    dueDateFormal: string;
  };
  numbers: {
    invoiceNumber: string;
    quoteNumber: string;
    creditNoteNumber: string;
    receiptNumber: string;
    documentNumber: string;
  };
  tax: {
    rate: number;
    label: string;
  };
  isLoading: boolean;
  hasRealData: boolean;
}

// Placeholder marker for missing data
const PLACEHOLDER = (field: string) => `[${field}]`;

export function useDocumentData(options?: {
  matterId?: string | null;
  contactId?: string | null;
  documentType?: string;
}) {
  const { organizationId, currentOrganization } = useOrganization();
  const { data: prefs } = useDocumentPreferences();

  // Fetch organization name
  const orgName = currentOrganization?.name || PLACEHOLDER('Nombre empresa');

  // Fetch first contact if no specific contact selected
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ['document-contact', organizationId, options?.contactId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      let query = supabase
        .from('contacts')
        .select('id, name, company_name, tax_id, email, phone, address_line1, city, postal_code, country')
        .eq('organization_id', organizationId);
      
      if (options?.contactId) {
        query = query.eq('id', options.contactId);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch matter if specified
  const { data: matter, isLoading: matterLoading } = useQuery({
    queryKey: ['document-matter', options?.matterId],
    queryFn: async () => {
      if (!options?.matterId) return null;
      
      const { data, error } = await supabase
        .from('matters')
        .select(`
          id, reference, title, type, status,
          mark_name, registration_number, application_number,
          filing_date, registration_date, expiry_date,
          nice_classes, jurisdiction
        `)
        .eq('id', options.matterId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!options?.matterId,
  });

  // Build company data from preferences
  const company: CompanyData = {
    name: prefs?.companyName || orgName,
    legalName: prefs?.companyLegalName || prefs?.companyName || orgName,
    cif: prefs?.companyCif || PLACEHOLDER('CIF'),
    address: prefs?.companyAddress || PLACEHOLDER('Dirección'),
    city: prefs?.companyCity || PLACEHOLDER('Ciudad'),
    postalCode: prefs?.companyPostalCode || PLACEHOLDER('CP'),
    country: prefs?.companyCountry || 'España',
    fullAddress: [
      prefs?.companyAddress || PLACEHOLDER('Dirección'),
      [prefs?.companyPostalCode, prefs?.companyCity].filter(Boolean).join(' ') || PLACEHOLDER('CP Ciudad'),
      prefs?.companyCountry || 'España',
    ].join(', '),
    phone: prefs?.companyPhone || PLACEHOLDER('Teléfono'),
    email: prefs?.companyEmail || PLACEHOLDER('Email'),
    website: prefs?.companyWebsite || PLACEHOLDER('Web'),
    iban: prefs?.companyIban || PLACEHOLDER('IBAN'),
    bankName: prefs?.companyBankName || PLACEHOLDER('Banco'),
    logoUrl: prefs?.companyLogoUrl || null,
  };

  // Build client data
  const client: ClientData = {
    id: contact?.id || null,
    name: contact?.name || PLACEHOLDER('Nombre cliente'),
    company: contact?.company_name || PLACEHOLDER('Empresa cliente'),
    cif: contact?.tax_id || PLACEHOLDER('CIF cliente'),
    address: contact?.address_line1 || PLACEHOLDER('Dirección cliente'),
    city: contact?.city || PLACEHOLDER('Ciudad'),
    postalCode: contact?.postal_code || PLACEHOLDER('CP'),
    country: contact?.country || 'España',
    fullAddress: contact ? [
      contact.address_line1,
      [contact.postal_code, contact.city].filter(Boolean).join(' '),
      contact.country,
    ].filter(Boolean).join(', ') : PLACEHOLDER('Dirección completa cliente'),
    phone: contact?.phone || PLACEHOLDER('Teléfono'),
    email: contact?.email || PLACEHOLDER('Email'),
  };

  // Build matter data
  const matterData: MatterData | null = matter ? {
    id: matter.id,
    reference: matter.reference || PLACEHOLDER('Ref'),
    title: matter.title || PLACEHOLDER('Título'),
    type: matter.type || 'trademark',
    status: matter.status || 'active',
    trademarkName: matter.mark_name,
    registrationNumber: matter.registration_number,
    applicationNumber: matter.application_number,
    filingDate: matter.filing_date,
    registrationDate: matter.registration_date,
    expiryDate: matter.expiry_date,
    classes: Array.isArray(matter.nice_classes) ? matter.nice_classes.map(String) : [],
    jurisdiction: matter.jurisdiction || 'ES',
    office: matter.jurisdiction === 'EU' ? 'EUIPO' : 'OEPM',
  } : null;

  // Build dates
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  const date = {
    today: format(today, 'dd/MM/yyyy'),
    todayFormal: format(today, "d 'de' MMMM 'de' yyyy", { locale: es }),
    dueDate: format(dueDate, 'dd/MM/yyyy'),
    dueDateFormal: format(dueDate, "d 'de' MMMM 'de' yyyy", { locale: es }),
  };

  // Build document numbers
  const year = today.getFullYear();
  const numbers = {
    invoiceNumber: `${prefs?.invoicePrefix || 'INV'}-${year}-${String(prefs?.invoiceNextNumber || 1).padStart(4, '0')}`,
    quoteNumber: `${prefs?.quotePrefix || 'PRE'}-${year}-${String(prefs?.quoteNextNumber || 1).padStart(4, '0')}`,
    creditNoteNumber: `${prefs?.creditNotePrefix || 'NC'}-${year}-${String(prefs?.creditNoteNextNumber || 1).padStart(4, '0')}`,
    receiptNumber: `${prefs?.receiptPrefix || 'REC'}-${year}-${String(prefs?.receiptNextNumber || 1).padStart(4, '0')}`,
    documentNumber: `DOC-${year}-${String(1).padStart(4, '0')}`,
  };

  // Tax settings
  const tax = {
    rate: prefs?.defaultTaxRate || 21,
    label: prefs?.taxLabel || 'IVA',
  };

  // Check if we have real data
  const hasRealData = !!(
    prefs?.companyName || 
    prefs?.companyCif || 
    contact?.name
  );

  return {
    company,
    client,
    matter: matterData,
    date,
    numbers,
    tax,
    isLoading: contactLoading || matterLoading,
    hasRealData,
  } as DocumentDataContext;
}
