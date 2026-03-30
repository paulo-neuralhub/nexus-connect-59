// ============================================================
// IP-NEXUS — Approvals hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface PendingApproval {
  id: string;
  organization_id: string;
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
    mutationFn: async ({ approval, userId }: { approval: PendingApproval; userId: string }) => {
      // PASO 1 — Actualizar estado
      const { error: updateError } = await fromTable('pending_approvals')
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: 'Aprobado desde panel de aprobaciones',
        })
        .eq('id', approval.id);
      if (updateError) throw updateError;

      // PASOS 2, 3, 4 — en paralelo
      const cascadePromises: Promise<any>[] = [];

      // PASO 2 — Crear tarea en expediente
      if (approval.matter_id) {
        cascadePromises.push(
          fromTable('matter_tasks').insert({
            organization_id: approval.organization_id,
            matter_id: approval.matter_id,
            title: approval.proposed_action ?? approval.title,
            description: approval.ai_analysis ?? approval.summary,
            status: 'pending',
            priority: approval.urgency_level === 'critical' ? 'critical'
              : approval.urgency_level === 'urgent' ? 'high' : 'medium',
            assigned_to: userId,
            due_date: approval.expires_at,
            created_by: userId,
          })
        );
      }

      // PASO 3 — Timeline del expediente
      if (approval.matter_id) {
        cascadePromises.push(
          fromTable('matter_timeline_events').insert({
            organization_id: approval.organization_id,
            matter_id: approval.matter_id,
            event_type: 'approval',
            title: 'Aprobado: ' + approval.title,
            description: approval.proposed_action,
            source_table: 'pending_approvals',
            source_id: approval.id,
            actor_id: userId,
            actor_type: 'staff',
            is_visible_in_portal: false,
            created_by: userId,
          })
        );
      }

      // PASO 4 — Actividad del cliente
      if (approval.account_id) {
        cascadePromises.push(
          (async () => {
            // Obtener nombre de la cuenta
            const { data: accountData } = await fromTable('crm_accounts')
              .select('name')
              .eq('id', approval.account_id)
              .single();

            let contactId: string | null = null;
            if (accountData?.name) {
              const { data: contact } = await fromTable('contacts')
                .select('id')
                .eq('organization_id', approval.organization_id)
                .eq('company_name', accountData.name)
                .limit(1)
                .single();
              contactId = contact?.id ?? null;
            }

            return fromTable('activities').insert({
              organization_id: approval.organization_id,
              type: 'task',
              subject: 'Acción requerida: ' + approval.title,
              content: approval.proposed_action,
              contact_id: contactId,
              is_completed: false,
              created_by: userId,
            });
          })()
        );
      }

      if (cascadePromises.length > 0) {
        await Promise.allSettled(cascadePromises);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Aprobado. Tarea creada en el expediente.');
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
    mutationFn: async ({ approval, userId, reason }: { approval: PendingApproval; userId: string; reason: string }) => {
      // PASO 1 — Actualizar estado
      const { error } = await fromTable('pending_approvals')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
        })
        .eq('id', approval.id);
      if (error) throw error;

      // PASO 2 — Timeline del expediente
      if (approval.matter_id) {
        await fromTable('matter_timeline_events').insert({
          organization_id: approval.organization_id,
          matter_id: approval.matter_id,
          event_type: 'rejection',
          title: 'Rechazado: ' + approval.title,
          description: reason,
          source_table: 'pending_approvals',
          source_id: approval.id,
          actor_id: userId,
          actor_type: 'staff',
          is_visible_in_portal: false,
          created_by: userId,
        });
      }
    },
    onSuccess: () => {
      toast.error('Solicitud rechazada.');
      qc.invalidateQueries({ queryKey: ['pending-approvals-list'] });
      qc.invalidateQueries({ queryKey: ['approvals-count'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al rechazar');
    },
  });
}
