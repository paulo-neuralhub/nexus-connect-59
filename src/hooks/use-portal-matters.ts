/**
 * Hook para expedientes del Portal Cliente — V2
 * Uses portal_access + portal_visible filter
 */

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { usePortalAuth } from './usePortalAuth';

export interface PortalMatter {
  id: string;
  reference: string;
  title: string;
  status: string;
  type: string;
  jurisdiction: string | null;
  created_at: string;
  deadline_count: number;
  mark_name: string | null;
  portal_status_label: string | null;
  portal_certificate_generated: boolean;
  portal_show_deadlines: boolean;
  portal_show_costs: boolean;
  portal_timeline_visible: boolean;
}

export interface PortalMatterDetail extends PortalMatter {
  notes?: string;
  application_number?: string;
  registration_number?: string;
  filing_date?: string;
  registration_date?: string;
  expiry_date?: string;
  owner_name?: string;
  documents_count?: number;
}

const STATUS_PROGRESS: Record<string, number> = {
  pending: 15,
  filed: 15,
  examining: 50,
  published: 70,
  opposition_period: 85,
  registered: 100,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En tramitación',
  filed: 'Presentada',
  examining: 'En examen',
  published: 'Publicada — período de oposición',
  opposition_period: 'En oposición',
  registered: '✓ Registrada',
  granted: '✓ Concedida',
  refused: 'Denegada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

export { STATUS_PROGRESS, STATUS_LABELS };

export function usePortalMatters() {
  const { user } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-matters', user?.contactId],
    queryFn: async (): Promise<PortalMatter[]> => {
      if (!user?.contactId) return [];

      const { data, error } = await fromTable('matters')
        .select(`
          id, reference, title, status, type, jurisdiction,
          created_at, mark_name,
          portal_status_label, portal_certificate_generated,
          portal_show_deadlines, portal_show_costs, portal_timeline_visible
        `)
        .eq('client_id', user.contactId)
        .eq('portal_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        reference: m.reference || '',
        title: m.title || '',
        status: m.status || '',
        type: m.type || '',
        jurisdiction: m.jurisdiction || null,
        created_at: m.created_at || '',
        deadline_count: 0,
        mark_name: m.mark_name || null,
        portal_status_label: m.portal_status_label || null,
        portal_certificate_generated: m.portal_certificate_generated || false,
        portal_show_deadlines: m.portal_show_deadlines ?? true,
        portal_show_costs: m.portal_show_costs ?? false,
        portal_timeline_visible: m.portal_timeline_visible ?? true,
      }));
    },
    enabled: !!user?.contactId,
    staleTime: 60000,
  });
}

export function usePortalMatterDetail(matterId: string | undefined) {
  const { user } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-matter-detail', matterId],
    queryFn: async (): Promise<PortalMatterDetail | null> => {
      if (!user?.contactId || !matterId) return null;

      const { data, error } = await fromTable('matters')
        .select(`
          id, reference, title, status, type, jurisdiction,
          created_at, mark_name, notes,
          application_number, registration_number,
          filing_date, registration_date, expiry_date,
          owner_name,
          portal_status_label, portal_certificate_generated,
          portal_show_deadlines, portal_show_costs, portal_timeline_visible
        `)
        .eq('id', matterId)
        .eq('client_id', user.contactId)
        .eq('portal_visible', true)
        .single();

      if (error) throw error;

      // Count documents
      const { count: docsCount } = await fromTable('matter_documents')
        .select('id', { count: 'exact', head: true })
        .eq('matter_id', matterId)
        .eq('portal_visible', true);

      return {
        ...data,
        reference: data.reference || '',
        title: data.title || '',
        status: data.status || '',
        type: data.type || '',
        jurisdiction: data.jurisdiction || null,
        created_at: data.created_at || '',
        deadline_count: 0,
        mark_name: data.mark_name || null,
        portal_status_label: data.portal_status_label || null,
        portal_certificate_generated: data.portal_certificate_generated || false,
        portal_show_deadlines: data.portal_show_deadlines ?? true,
        portal_show_costs: data.portal_show_costs ?? false,
        portal_timeline_visible: data.portal_timeline_visible ?? true,
        documents_count: docsCount || 0,
      };
    },
    enabled: !!user?.contactId && !!matterId,
    staleTime: 60000,
  });
}

export function useCanAccessMatter(matterId: string | undefined) {
  const { user } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-can-access-matter', user?.contactId, matterId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.contactId || !matterId) return false;

      const { data } = await fromTable('matters')
        .select('id')
        .eq('id', matterId)
        .eq('client_id', user.contactId)
        .eq('portal_visible', true)
        .maybeSingle();

      return !!data;
    },
    enabled: !!user?.contactId && !!matterId,
    staleTime: 300000,
  });
}
