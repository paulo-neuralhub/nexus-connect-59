import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface VerifactuRecord {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  full_number: string | null;
  record_date: string;
  hash_chain: string | null;
  status: 'pending' | 'sent' | 'accepted' | 'error';
  aeat_response: any;
  error_message: string | null;
  created_at: string;
}

export function useVerifactuRecords() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['verifactu-records', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verifactu_records')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('record_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as VerifactuRecord[];
    },
    enabled: !!currentOrganization?.id,
  });
}
