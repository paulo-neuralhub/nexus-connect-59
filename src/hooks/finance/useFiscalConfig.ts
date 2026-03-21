// src/hooks/finance/useFiscalConfig.ts
// Hook for fiscal configuration (fin_fiscal_configs + fin_countries_config)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface FiscalConfig {
  id: string;
  organization_id: string;
  legal_name: string;
  tax_id: string;
  tax_id_type: string;
  vat_number: string | null;
  country_code: string;
  fiscal_address: Record<string, string>;
  vat_regime: string;
  vat_registered: boolean;
  vat_registration_date: string | null;
  applies_irpf: boolean;
  default_irpf_rate: number;
  accounting_standard: string;
  sii_enabled: boolean;
  verifactu_enabled: boolean;
  saft_enabled: boolean;
  mtd_enabled: boolean;
  bank_account_iban: string | null;
  bank_account_bic: string | null;
  bank_name: string | null;
  digital_signature_enabled: boolean;
  digital_certificate_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface CountryConfig {
  id: string;
  country_code: string;
  country_name: string;
  default_accounting_standard: string | null;
  fiscal_year_start_month: number;
  has_vat: boolean;
  has_withholding_tax: boolean;
  standard_vat_rate: number | null;
  has_sii: boolean;
  has_verifactu: boolean;
  has_saft: boolean;
  has_mtd: boolean;
  has_fec: boolean;
  has_gobd: boolean;
  currency_code: string | null;
  date_format: string;
}

export interface FiscalConfigWithCountry extends FiscalConfig {
  country?: CountryConfig;
}

export function useFiscalConfig() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['fiscal-config', currentOrganization?.id],
    queryFn: async (): Promise<FiscalConfigWithCountry | null> => {
      const orgId = currentOrganization!.id;

      const { data, error } = await supabase
        .from('fin_fiscal_configs')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Get country config
      const { data: country } = await supabase
        .from('fin_countries_config')
        .select('*')
        .eq('country_code', data.country_code)
        .maybeSingle();

      return { ...data, country: country || undefined } as FiscalConfigWithCountry;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useUpsertFiscalConfig() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: Partial<FiscalConfig>) => {
      const upsertData = {
        organization_id: currentOrganization!.id,
        legal_name: data.legal_name || '',
        tax_id: data.tax_id || '',
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('fin_fiscal_configs')
        .upsert(upsertData as any, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;
      return result as FiscalConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
      toast.success('Configuración fiscal guardada');
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    },
  });
}

export function useCountriesConfig() {
  return useQuery({
    queryKey: ['countries-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_countries_config')
        .select('*')
        .order('country_name');

      if (error) throw error;
      return data as CountryConfig[];
    },
    staleTime: Infinity,
  });
}

export function useTaxRates(countryCode?: string) {
  return useQuery({
    queryKey: ['tax-rates', countryCode],
    queryFn: async () => {
      let query = supabase
        .from('fin_tax_rates')
        .select('*')
        .order('rate_pct', { ascending: false });

      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
