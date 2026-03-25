/**
 * useIpoDocuments — Hook for IPO incoming documents
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface IpoDocument {
  id: string;
  source_type: string;
  source_email_from: string | null;
  source_ipo_code: string | null;
  raw_email_content: string | null;
  parsed_data: any;
  parsing_confidence: number | null;
  parsing_status: string | null;
  matched_matter_id: string | null;
  match_confidence: number | null;
  auto_matched: boolean | null;
  matched_at: string | null;
  deadlines_created: any;
  processing_status: string | null;
  received_at: string | null;
  processed_at: string | null;
  file_storage_path: string | null;
  matter?: {
    id: string;
    reference: string;
    title: string;
    type: string;
    status: string;
  } | null;
}

export function useIpoDocuments() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['ipo-documents', orgId],
    queryFn: async (): Promise<IpoDocument[]> => {
      const client: any = supabase;
      const { data, error } = await client
        .from('ipo_incoming_documents')
        .select(`
          *,
          matter:matters(id, reference, title, type, status)
        `)
        .eq('organization_id', orgId)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return (data || []) as IpoDocument[];
    },
    enabled: !!orgId,
  });
}

export function useIpoDocumentCounts() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['ipo-document-counts', orgId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from('ipo_incoming_documents')
        .select('processing_status, parsing_status')
        .eq('organization_id', orgId);

      if (error) throw error;
      const docs = data || [];
      return {
        pending: docs.filter((d: any) => d.processing_status === 'unprocessed' && d.parsing_status === 'pending').length,
        manualReview: docs.filter((d: any) => d.processing_status === 'unprocessed' && d.parsing_status !== 'pending').length,
        processed: docs.filter((d: any) => d.processing_status === 'processed').length,
        total: docs.length,
        actionRequired: docs.filter((d: any) => d.processing_status === 'unprocessed').length,
      };
    },
    enabled: !!orgId,
  });
}
