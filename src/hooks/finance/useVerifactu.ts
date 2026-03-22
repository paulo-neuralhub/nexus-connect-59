import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface VerifactuRecord {
  id: string;
  organization_id: string;
  invoice_id: string;
  chain_hash: string;
  previous_hash: string | null;
  submission_status: string | null;
  submission_timestamp: string | null;
  aeat_response: any;
  error_code: string | null;
  error_description: string | null;
  verifactu_qr_data: string | null;
  verifactu_id: string | null;
  verification_code: string | null;
  retry_count: number | null;
  created_at: string | null;
  // Joined
  full_number?: string;
  record_date?: string;
}

export function useVerifactuRecords() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['verifactu-records', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verifactu_records')
        .select('*, invoices!verifactu_records_invoice_id_fkey(full_number, invoice_date)')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        full_number: r.invoices?.full_number || null,
        record_date: r.invoices?.invoice_date || r.submission_timestamp?.slice(0, 10) || '',
      })) as VerifactuRecord[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useRetryFailedVerifactu() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: failed } = await supabase
        .from('verifactu_records')
        .select('invoice_id')
        .eq('organization_id', currentOrganization!.id)
        .eq('submission_status', 'error');

      if (!failed?.length) return { retried: 0 };

      let retried = 0;
      for (const record of failed) {
        try {
          await supabase.functions.invoke('finance-verifactu', {
            body: { invoice_id: record.invoice_id },
          });
          retried++;
        } catch {
          // continue
        }
      }
      return { retried };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['verifactu-records'] });
      toast.success(`${result.retried} facturas reenviadas a Verifactu`);
    },
    onError: (err: Error) => {
      toast.error('Error: ' + err.message);
    },
  });
}
