// ============================================================
// IP-NEXUS — Inbox hooks
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';

export interface InboxMessage {
  id: string;
  channel: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  subject: string | null;
  body: string | null;
  ai_category: string | null;
  ai_urgency_score: number | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  ai_proposed_action: string | null;
  ai_draft_response: string | null;
  status: string | null;
  created_at: string | null;
  assigned_to: string | null;
  account_id: string | null;
  contact_id: string | null;
  matter_id: string | null;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
}

export function useInboxMessages(channelFilter?: string | null, statusFilter?: string | null) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['inbox-messages', organizationId, channelFilter, statusFilter],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = fromTable('incoming_messages')
        .select(`
          id, channel, sender_name, sender_email, sender_phone,
          subject, body, ai_category, ai_urgency_score, ai_summary,
          ai_confidence, ai_proposed_action, ai_draft_response,
          status, created_at, assigned_to, account_id, contact_id, matter_id,
          account:crm_accounts(id, name),
          contact:contacts(id, name)
        `)
        .eq('organization_id', organizationId)
        .order('ai_urgency_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (channelFilter) {
        q = q.eq('channel', channelFilter);
      }
      if (statusFilter === 'urgent') {
        q = q.gte('ai_urgency_score', 7);
      } else if (statusFilter === 'pending') {
        q = q.in('status', ['pending', 'awaiting_approval']);
      } else if (statusFilter === 'processed') {
        q = q.in('status', ['replied', 'archived', 'processed']);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as InboxMessage[];
    },
    enabled: !!organizationId,
  });
}

export function useInboxCount() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['inbox-count', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      const { count, error } = await fromTable('incoming_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'awaiting_approval']);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });
}

export function useClientMatters(accountId: string | null | undefined) {
  return useQuery({
    queryKey: ['client-matters', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await fromTable('matters')
        .select('id, reference_number, title, status, type')
        .or(`client_id.eq.${accountId},crm_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });
}

export function useClientActivities(accountId: string | null | undefined) {
  return useQuery({
    queryKey: ['client-activities', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await fromTable('activities')
        .select('id, type, subject, created_at')
        .eq('contact_id', accountId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) return [];
      return data || [];
    },
    enabled: !!accountId,
  });
}
