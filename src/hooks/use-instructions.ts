// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export interface Instruction {
  id: string;
  organization_id: string;
  crm_account_id: string | null;
  title: string;
  description: string;
  instruction_type: string;
  source: string | null;
  status: string | null;
  is_urgent: boolean | null;
  deadline_date: string | null;
  conflict_checked: boolean | null;
  acknowledgement_sent_at: string | null;
  quote_sent_at: string | null;
  quote_approved_at: string | null;
  executed_count: number | null;
  total_targets: number | null;
  failed_count: number | null;
  sent_by: string;
  sent_at: string | null;
  completed_at: string | null;
  target_ids: string[];
  target_type: string;
  target_family_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  account?: { id: string; name: string; } | null;
  items?: InstructionItem[];
}

export interface InstructionItem {
  id: string;
  bulk_instruction_id: string;
  organization_id: string;
  jurisdiction_code: string | null;
  matter_id: string | null;
  status: string | null;
  specific_instruction: string | null;
  executed_at: string | null;
  confirmed_at: string | null;
  response_text: string | null;
  account_id: string | null;
  assigned_agent_account_id: string | null;
  created_at: string | null;
}

export type InstructionFilter = 'pending' | 'in_progress' | 'completed' | 'all';

export function useInstructions(filter: InstructionFilter = 'all') {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['instructions', organizationId, filter],
    queryFn: async () => {
      let query = fromTable('bulk_instructions')
        .select(`
          *,
          account:crm_accounts!bulk_instructions_crm_account_id_fkey(id, name),
          items:bulk_instruction_items(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.or('status.eq.draft,status.eq.sent,conflict_checked.eq.false,quote_sent_at.is.null');
      } else if (filter === 'in_progress') {
        query = query.in('status', ['in_progress', 'sent', 'partially_executed']);
      } else if (filter === 'completed') {
        query = query.in('status', ['completed', 'cancelled']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Instruction[];
    },
    enabled: !!organizationId,
  });
}

export function useInstructionsPendingCount() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['instructions-pending-count', organizationId],
    queryFn: async () => {
      const { count, error } = await fromTable('bulk_instructions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .or('status.eq.draft,status.eq.sent,conflict_checked.eq.false');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });
}

export function useCreateInstruction() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      instruction_type: string;
      crm_account_id?: string;
      source?: string;
      is_urgent?: boolean;
      deadline_date?: string;
      jurisdictions?: string[];
      status?: string;
    }) => {
      const { jurisdictions, ...rest } = data;
      const targetIds = jurisdictions || [];

      const { data: instruction, error } = await fromTable('bulk_instructions')
        .insert({
          ...rest,
          organization_id: organizationId,
          sent_by: profile?.id,
          target_ids: targetIds,
          target_type: 'jurisdiction',
          total_targets: targetIds.length,
          status: data.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Create items per jurisdiction
      if (targetIds.length > 0) {
        const items = targetIds.map((jc: string) => ({
          bulk_instruction_id: instruction.id,
          organization_id: organizationId,
          jurisdiction_code: jc,
          status: 'pending',
        }));

        const { error: itemsError } = await fromTable('bulk_instruction_items')
          .insert(items);
        if (itemsError) throw itemsError;
      }

      return instruction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructions'] });
      qc.invalidateQueries({ queryKey: ['instructions-pending-count'] });
      toast.success('Instrucción creada correctamente');
    },
    onError: () => {
      toast.error('Error al crear la instrucción');
    },
  });
}

export function useUpdateInstruction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await fromTable('bulk_instructions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructions'] });
      qc.invalidateQueries({ queryKey: ['instructions-pending-count'] });
    },
  });
}
