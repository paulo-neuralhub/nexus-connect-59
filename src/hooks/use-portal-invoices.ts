/**
 * Hook para facturas del Portal Cliente — V2
 * Uses invoices with billing_client_id = crm_account_id
 */

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { usePortalAuth } from './usePortalAuth';
import type { Invoice } from '@/types/finance';

export function usePortalInvoices(statusFilter?: string) {
  const { user } = usePortalAuth();
  const contactId = user?.contactId;

  return useQuery({
    queryKey: ['portal-invoices', contactId, statusFilter],
    queryFn: async (): Promise<Invoice[]> => {
      if (!contactId) return [];

      let query = fromTable('invoices')
        .select('*')
        .or(`billing_client_id.eq.${contactId},client_id.eq.${contactId}`)
        .order('invoice_date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Invoice[]) ?? [];
    },
    enabled: !!contactId,
  });
}
