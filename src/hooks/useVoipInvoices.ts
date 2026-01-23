import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export type VoipInvoice = {
  id: string;
  organization_id: string;
  invoice_number: string | null;
  billing_period_start: string;
  billing_period_end: string;
  total_calls: number;
  total_minutes: number;
  plan_amount_cents: number;
  usage_amount_cents: number;
  total_cents: number;
  status: string;
  issued_at: string | null;
  pdf_url: string | null;
  created_at: string;
};

export function useVoipInvoices() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['voip-invoices', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('voip_invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('billing_period_start', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as VoipInvoice[];
    },
  });
}

// SUPERADMIN: generate invoices (calls edge function proxy or Supabase RPC)
export function useGenerateVoipInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ periodStart, taxRate }: { periodStart: string; taxRate?: number }) => {
      const { data, error } = await supabase.rpc('generate_voip_invoices_superadmin', {
        p_period_start: periodStart,
        p_tax_rate: taxRate ?? 0,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['backoffice-voip-orgs'] });
      toast.success('Facturas generadas');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// SUPERADMIN: list all invoices (across tenants)
export function useAllVoipInvoices() {
  return useQuery({
    queryKey: ['voip-all-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_invoices')
        .select('*, organizations(name)')
        .order('billing_period_start', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as (VoipInvoice & { organizations: { name: string } | null })[];
    },
  });
}
