// src/hooks/finance/useFiscalSettings.ts
// REWRITTEN: Now uses fin_fiscal_configs (real table) instead of fiscal_settings (ghost)
// Maintains backward-compatible exports for existing components

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { FiscalSettings, InvoiceSeries, PaymentMethodCode, CorrectionReasonCode } from '@/types/finance';

// ===== FISCAL SETTINGS (mapped to fin_fiscal_configs) =====
export function useFiscalSettings() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['fiscal-settings', currentOrganization?.id],
    queryFn: async (): Promise<FiscalSettings | null> => {
      const { data, error } = await supabase
        .from('fin_fiscal_configs')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      // Map fin_fiscal_configs → FiscalSettings shape for backward compat
      return {
        id: data.id,
        organization_id: data.organization_id,
        tax_id: data.tax_id,
        tax_id_type: data.tax_id_type || 'NIF',
        legal_name: data.legal_name,
        trade_name: undefined,
        address_line1: (data.fiscal_address as any)?.street,
        postal_code: (data.fiscal_address as any)?.postal_code,
        city: (data.fiscal_address as any)?.city,
        province: (data.fiscal_address as any)?.state,
        country_code: data.country_code,
        vat_regime: data.vat_regime || 'general',
        default_vat_rate: (data as any).standard_vat_rate ?? 21,
        applies_surcharge: false,
        default_withholding: data.default_irpf_rate || 0,
        sii_enabled: data.sii_enabled || false,
        sii_test_mode: true,
        tbai_enabled: false,
        verifactu_enabled: data.verifactu_enabled || false,
        default_bank_account: data.bank_account_iban,
        default_bank_name: data.bank_name,
        default_bank_bic: data.bank_account_bic,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as FiscalSettings;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateFiscalSettings() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<FiscalSettings>) => {
      const insertData = {
        organization_id: currentOrganization!.id,
        tax_id: data.tax_id || '',
        legal_name: data.legal_name || '',
        country_code: data.country_code || 'ES',
        tax_id_type: data.tax_id_type || 'NIF',
        vat_regime: data.vat_regime || 'general',
        applies_irpf: (data.default_withholding ?? 0) > 0,
        default_irpf_rate: data.default_withholding || 0,
        fiscal_address: {
          street: data.address_line1 || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          state: data.province || '',
          country: data.country_code || 'ES',
        },
        sii_enabled: data.sii_enabled || false,
        verifactu_enabled: data.verifactu_enabled || false,
        bank_account_iban: data.default_bank_account,
        bank_name: data.default_bank_name,
        bank_account_bic: data.default_bank_bic,
      };
      
      const { data: settings, error } = await supabase
        .from('fin_fiscal_configs')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return settings as unknown as FiscalSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-settings'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
    },
  });
}

export function useUpdateFiscalSettings() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<FiscalSettings>) => {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.tax_id !== undefined) updateData.tax_id = data.tax_id;
      if (data.legal_name !== undefined) updateData.legal_name = data.legal_name;
      if (data.country_code !== undefined) updateData.country_code = data.country_code;
      if (data.vat_regime !== undefined) updateData.vat_regime = data.vat_regime;
      if (data.sii_enabled !== undefined) updateData.sii_enabled = data.sii_enabled;
      if (data.verifactu_enabled !== undefined) updateData.verifactu_enabled = data.verifactu_enabled;
      if (data.default_withholding !== undefined) {
        updateData.applies_irpf = data.default_withholding > 0;
        updateData.default_irpf_rate = data.default_withholding;
      }
      if (data.default_bank_account !== undefined) updateData.bank_account_iban = data.default_bank_account;
      if (data.default_bank_name !== undefined) updateData.bank_name = data.default_bank_name;
      if (data.default_bank_bic !== undefined) updateData.bank_account_bic = data.default_bank_bic;

      const { data: settings, error } = await supabase
        .from('fin_fiscal_configs')
        .update(updateData)
        .eq('organization_id', currentOrganization!.id)
        .select()
        .single();
      
      if (error) throw error;
      return settings as unknown as FiscalSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-settings'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
    },
  });
}

export function useUpsertFiscalSettings() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<FiscalSettings>) => {
      const upsertData = {
        organization_id: currentOrganization!.id,
        tax_id: data.tax_id || '',
        legal_name: data.legal_name || '',
        country_code: data.country_code || 'ES',
        tax_id_type: data.tax_id_type || 'NIF',
        vat_regime: data.vat_regime || 'general',
        applies_irpf: (data.default_withholding ?? 0) > 0,
        default_irpf_rate: data.default_withholding || 0,
        fiscal_address: {
          street: data.address_line1 || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          state: data.province || '',
          country: data.country_code || 'ES',
        },
        sii_enabled: data.sii_enabled || false,
        verifactu_enabled: data.verifactu_enabled || false,
        bank_account_iban: data.default_bank_account,
        bank_name: data.default_bank_name,
        bank_account_bic: data.default_bank_bic,
        updated_at: new Date().toISOString(),
      };
      
      const { data: settings, error } = await supabase
        .from('fin_fiscal_configs')
        .upsert(upsertData as any, { onConflict: 'organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return settings as unknown as FiscalSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-settings'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
    },
  });
}

// ===== INVOICE SERIES (mapped to invoice_sequences) =====
export function useInvoiceSeries() {
  const { currentOrganization } = useOrganization();
  const currentYear = new Date().getFullYear();
  
  return useQuery({
    queryKey: ['invoice-series', currentOrganization?.id, currentYear],
    queryFn: async (): Promise<InvoiceSeries[]> => {
      const { data, error } = await supabase
        .from('invoice_sequences')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('year', { ascending: false });
      
      if (error) throw error;
      
      // Map invoice_sequences → InvoiceSeries shape
      return (data || []).map((seq: any) => ({
        id: seq.id,
        organization_id: seq.organization_id,
        code: seq.series,
        name: `Serie ${seq.series}`,
        fiscal_year: seq.year,
        current_number: seq.last_number,
        is_active: true,
        created_at: seq.created_at,
        updated_at: seq.updated_at || seq.created_at,
      })) as InvoiceSeries[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateInvoiceSeries() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<InvoiceSeries>) => {
      const { data: series, error } = await supabase
        .from('invoice_sequences')
        .insert({
          organization_id: currentOrganization!.id,
          series: data.code || 'F',
          year: data.fiscal_year || new Date().getFullYear(),
          last_number: 0,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return series as unknown as InvoiceSeries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-series'] });
    },
  });
}

export function useUpdateInvoiceSeries() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceSeries> }) => {
      const updateData: Record<string, any> = {};
      if (data.code !== undefined) updateData.series = data.code;
      
      const { data: series, error } = await supabase
        .from('invoice_sequences')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return series as unknown as InvoiceSeries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-series'] });
    },
  });
}

export function useDeleteInvoiceSeries() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoice_sequences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-series'] });
    },
  });
}

// ===== PAYMENT METHOD CODES =====
export function usePaymentMethodCodes() {
  return useQuery({
    queryKey: ['payment-method-codes'],
    queryFn: async (): Promise<PaymentMethodCode[]> => {
      const { data, error } = await supabase
        .from('correction_reason_codes')
        .select('*')
        .limit(0); // Table may not exist — return empty
      
      // Return hardcoded payment methods since the table doesn't exist
      return [
        { code: '01', description: 'Transferencia' },
        { code: '02', description: 'Cheque' },
        { code: '03', description: 'No se requiere pago' },
        { code: '04', description: 'Domiciliación bancaria' },
        { code: '05', description: 'Confirmación bancaria' },
      ] as PaymentMethodCode[];
    },
    staleTime: Infinity,
  });
}

// ===== CORRECTION REASON CODES =====
export function useCorrectionReasonCodes() {
  return useQuery({
    queryKey: ['correction-reason-codes'],
    queryFn: async (): Promise<CorrectionReasonCode[]> => {
      const { data, error } = await supabase
        .from('correction_reason_codes')
        .select('*')
        .order('code');
      
      if (error) {
        // Fallback if table doesn't exist
        return [
          { code: '01', description: 'Número de factura' },
          { code: '02', description: 'Serie de factura' },
          { code: '03', description: 'Fecha de expedición' },
          { code: '04', description: 'Nombre y apellidos/Razón social' },
        ] as CorrectionReasonCode[];
      }
      return (data as CorrectionReasonCode[]) ?? [];
    },
    staleTime: Infinity,
  });
}

// ===== HELPER: Get next invoice number =====
export function useGetNextInvoiceNumber() {
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (seriesCode?: string): Promise<string> => {
      const { data, error } = await supabase
        .rpc('get_next_invoice_number', {
          p_org_id: currentOrganization!.id,
          p_series: seriesCode || 'F',
        });
      
      if (error) throw error;
      return data as string;
    },
  });
}
