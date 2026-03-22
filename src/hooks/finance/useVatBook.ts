import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export function useVatBookIssued(from: string, to: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['vat-book-issued', currentOrganization?.id, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, full_number, invoice_date, client_name, client_tax_id, subtotal, vat_rate, vat_amount, total')
        .eq('organization_id', currentOrganization!.id)
        .gte('invoice_date', from)
        .lte('invoice_date', to)
        .order('invoice_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && !!from && !!to,
  });
}

export function useVatBookReceived(from: string, to: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['vat-book-received', currentOrganization?.id, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_date, description, vendor_name, amount, vat_amount')
        .eq('organization_id', currentOrganization!.id)
        .gte('expense_date', from)
        .lte('expense_date', to)
        .order('expense_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && !!from && !!to,
  });
}
