// ============================================================
// IP-NEXUS — Approvals hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable, rpcFn } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface PendingApproval {
  id: string;
  source_type: string;
  source_id: string | null;
  title: string;
  summary: string | null;
  urgency_level: string | null;
  status: string | null;
  ai_analysis: string | null;
  ai_confidence: number | null;
  proposed_action: string | null;
  proposed_data: any;
  expires_at: string | null;
  created_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  account_id: string | null;
  matter_id: string | null;
  account?: { id: string; name: string } | null;
  matter?: { id: string; reference?: string; title?: string; type?: string } | null;
}

export function usePendingApprovalsList(urgencyFilter?: string | null) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['pending-approvals-list', organizationId, urgencyFilter],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = fromTable('pending_approvals')
        .select(`
          *,
          account:crm_accounts(id, name),
          matter:matters(id, reference, title, type)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('urgency_level', { ascending: false })
        .order('created_at', { ascending: true });

      if (urgencyFilter && urgencyFilter !== 'all') {
        q = q.eq('urgency_level', urgencyFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PendingApproval[];
    },
    enabled: !!organizationId,
  });
}

export function useApprovalsCount() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['approvals-count', organizationId],
    queryFn: async () => {
      if (!organizationId) return { total: 0, critical: 0 };
      const { data, error } = await fromTable('pending_approvals')
        .select('id, urgency_level')
        .eq('organization_id', organizationId)
        .eq('status', 'pending');
      if (error) throw error;
      const items = data || [];
      return {
        total: items.length,
        critical: items.filter((i: any) => i.urgency_level === 'critical').length,
      };
    },
    enabled: !!organizationId,
  });
}

export function useApproveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, userId, notes }: { approvalId: string; userId: string; notes?: string }) => {
      const { data, error } = await rpcFn('approve_pending_item', {
        p_approval_id: approvalId,
        p_user_id: userId,
        p_notes: notes || null,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Error al aprobar');
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Aprobado correctamente');
      qc.invalidateQueries({ queryKey: ['pending-approvals-list'] });
      qc.invalidateQueries({ queryKey: ['approvals-count'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al aprobar');
    },
  });
}

export function useRejectItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, userId, reason }: { approvalId: string; userId: string; reason?: string }) => {
      const { error } = await fromTable('pending_approvals')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reason || null,
        })
        .eq('id', approvalId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rechazado');
      qc.invalidateQueries({ queryKey: ['pending-approvals-list'] });
      qc.invalidateQueries({ queryKey: ['approvals-count'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al rechazar');
    },
  });
}
