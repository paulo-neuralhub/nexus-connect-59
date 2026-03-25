/**
 * use-matter-deadlines - Hook para plazos del expediente
 * Uses real matter_deadlines columns: deadline_date, status, priority, etc.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface MatterDeadline {
  id: string;
  matter_id: string;
  organization_id: string;
  rule_code?: string | null;
  title: string;
  description?: string | null;
  deadline_type?: string;
  deadline_date: string;
  status: string; // pending | overdue | completed | cancelled
  priority?: string; // critical | high | normal
  completed_at?: string | null;
  completed_by?: string | null;
  completion_notes?: string | null;
  extension_count?: number;
  extension_reason?: string | null;
  original_deadline?: string | null;
  auto_generated?: boolean;
  source?: string | null;
  metadata?: any;
  created_at: string;
  assigned_to?: string | null;
}

export function useMatterDeadlines(matterId: string) {
  return useQuery({
    queryKey: ['matter-deadlines', matterId],
    queryFn: async () => {
      const client: any = supabase;
      const { data, error } = await client
        .from('matter_deadlines')
        .select('*')
        .eq('matter_id', matterId)
        .order('deadline_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as MatterDeadline[];
    },
    enabled: !!matterId,
  });
}

export function useCreateMatterDeadline() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: {
      matter_id: string;
      title: string;
      description?: string | null;
      deadline_type?: string;
      deadline_date: string;
      priority?: string;
    }) => {
      const client: any = supabase;
      const { data: deadline, error } = await client
        .from('matter_deadlines')
        .insert({ 
          matter_id: data.matter_id,
          organization_id: currentOrganization!.id,
          title: data.title,
          description: data.description,
          deadline_type: data.deadline_type || 'other',
          deadline_date: data.deadline_date,
          priority: data.priority || 'normal',
          status: 'pending',
          auto_generated: false,
          source: 'manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return deadline;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', variables.matter_id] });
    },
  });
}

export function useCompleteMatterDeadline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const client: any = supabase;
      const { error } = await client
        .from('matter_deadlines')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: notes || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines'] });
    },
  });
}

export function useExtendMatterDeadline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, newDate, reason, currentDate, currentExtensionCount }: {
      id: string;
      newDate: string;
      reason: string;
      currentDate: string;
      currentExtensionCount: number;
    }) => {
      const client: any = supabase;
      const updateData: any = {
        deadline_date: newDate,
        extension_count: (currentExtensionCount || 0) + 1,
        extension_reason: reason,
      };
      // Store original deadline on first extension
      if (currentExtensionCount === 0) {
        updateData.original_deadline = currentDate;
      }
      const { error } = await client
        .from('matter_deadlines')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines'] });
    },
  });
}
