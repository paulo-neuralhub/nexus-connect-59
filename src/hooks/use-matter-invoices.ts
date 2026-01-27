/**
 * use-matter-invoices - Hook para facturas del expediente
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MatterInvoice {
  id: string;
  invoice_number: string;
  matter_id?: string;
  client_name?: string;
  status: string;
  total?: number;
  currency?: string;
  invoice_date?: string;
  due_date?: string;
  paid_amount?: number;
  created_at: string;
}

export function useMatterInvoices(matterId: string) {
  return useQuery({
    queryKey: ['matter-invoices', matterId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from('invoices')
        .select('id, invoice_number, matter_id, client_name, status, total, currency, invoice_date, due_date, paid_amount, created_at')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as MatterInvoice[];
    },
    enabled: !!matterId,
  });
}
