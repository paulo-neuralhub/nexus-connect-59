/**
 * Hook para documentos del Portal Cliente — V2
 * Uses matter_documents.portal_visible + signature fields
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase';
import { usePortalAuth } from './usePortalAuth';
import { toast } from 'sonner';

export interface PortalDocument {
  id: string;
  document_id: string;
  name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  matter_id: string | null;
  matter_reference: string | null;
  matter_title: string | null;
  category: string | null;
  can_download: boolean;
  expires_at: string | null;
  shared_at: string;
  viewed_at: string | null;
  downloaded_at: string | null;
  download_count: number;
  // Signature fields
  portal_requires_signature: boolean;
  portal_signature_level: string;
  portal_signature_status: string;
  portal_signed_at: string | null;
  portal_signed_by: string | null;
}

export function usePortalDocuments(categoryFilter?: string) {
  const { user } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-documents', user?.contactId, categoryFilter],
    queryFn: async (): Promise<PortalDocument[]> => {
      if (!user?.contactId) return [];

      // Get matters for this client
      const { data: matterIds } = await fromTable('matters')
        .select('id')
        .eq('client_id', user.contactId)
        .eq('portal_visible', true);

      if (!matterIds || matterIds.length === 0) return [];

      const ids = matterIds.map((m: any) => m.id);

      let query = fromTable('matter_documents')
        .select(`
          id, name, mime_type, file_size, file_path,
          matter_id, category, created_at,
          portal_requires_signature, portal_signature_level,
          portal_signature_status, portal_signed_at, portal_signed_by,
          matter:matters(reference, title)
        `)
        .in('matter_id', ids)
        .eq('portal_visible', true)
        .order('created_at', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((doc: any) => {
        const matter = doc.matter as { reference: string; title: string } | null;
        return {
          id: doc.id,
          document_id: doc.id,
          name: doc.name || '',
          mime_type: doc.mime_type || 'application/octet-stream',
          file_size: doc.file_size || 0,
          file_path: doc.file_path || '',
          matter_id: doc.matter_id,
          matter_reference: matter?.reference || null,
          matter_title: matter?.title || null,
          category: doc.category,
          can_download: true,
          expires_at: null,
          shared_at: doc.created_at,
          viewed_at: null,
          downloaded_at: null,
          download_count: 0,
          portal_requires_signature: doc.portal_requires_signature || false,
          portal_signature_level: doc.portal_signature_level || 'simple',
          portal_signature_status: doc.portal_signature_status || 'not_required',
          portal_signed_at: doc.portal_signed_at || null,
          portal_signed_by: doc.portal_signed_by || null,
        };
      });
    },
    enabled: !!user?.contactId,
    staleTime: 60000,
  });
}

export function useSignDocument() {
  const queryClient = useQueryClient();
  const { user } = usePortalAuth();

  return useMutation({
    mutationFn: async ({ documentId, signerName }: { documentId: string; signerName: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await fromTable('matter_documents')
        .update({
          portal_signature_status: 'signed',
          portal_signed_at: new Date().toISOString(),
          portal_signed_by: user.id,
          portal_signature_data: {
            signer_name: signerName,
            timestamp: new Date().toISOString(),
            signature_level: 'simple_eidas',
            disclaimer_shown: true,
            ip_address: 'client',
          },
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Documento firmado correctamente');
      queryClient.invalidateQueries({ queryKey: ['portal-documents'] });
    },
    onError: () => {
      toast.error('Error al firmar el documento');
    },
  });
}

export function useViewDocument() {
  return useMutation({
    mutationFn: async (_docId: string) => {
      // Track view - no-op for now with new schema
    },
  });
}

export function useDownloadDocument() {
  const { user } = usePortalAuth();

  return useMutation({
    mutationFn: async ({ sharedContentId: _id, filePath, fileName }: {
      sharedContentId: string;
      filePath: string;
      fileName: string;
    }) => {
      const { data: urlData } = await supabase.storage
        .from('matter-documents')
        .createSignedUrl(filePath, 3600);

      if (urlData?.signedUrl) {
        const link = document.createElement('a');
        link.href = urlData.signedUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No se pudo generar enlace de descarga');
      }
    },
    onSuccess: () => {
      toast.success('Documento descargado');
    },
    onError: () => {
      toast.error('Error al descargar el documento');
    },
  });
}

export function usePortalMatterDocuments(matterId: string | undefined) {
  const { user } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-matter-documents', matterId],
    queryFn: async (): Promise<PortalDocument[]> => {
      if (!user?.contactId || !matterId) return [];

      const { data, error } = await fromTable('matter_documents')
        .select(`
          id, name, mime_type, file_size, file_path,
          matter_id, category, created_at,
          portal_requires_signature, portal_signature_level,
          portal_signature_status, portal_signed_at, portal_signed_by
        `)
        .eq('matter_id', matterId)
        .eq('portal_visible', true)
        .order('created_at', { ascending: false });

      if (error) return [];

      return (data || []).map((doc: any) => ({
        id: doc.id,
        document_id: doc.id,
        name: doc.name || '',
        mime_type: doc.mime_type || 'application/octet-stream',
        file_size: doc.file_size || 0,
        file_path: doc.file_path || '',
        matter_id: doc.matter_id,
        matter_reference: null,
        matter_title: null,
        category: doc.category,
        can_download: true,
        expires_at: null,
        shared_at: doc.created_at,
        viewed_at: null,
        downloaded_at: null,
        download_count: 0,
        portal_requires_signature: doc.portal_requires_signature || false,
        portal_signature_level: doc.portal_signature_level || 'simple',
        portal_signature_status: doc.portal_signature_status || 'not_required',
        portal_signed_at: doc.portal_signed_at || null,
        portal_signed_by: doc.portal_signed_by || null,
      }));
    },
    enabled: !!user?.contactId && !!matterId,
    staleTime: 60000,
  });
}
