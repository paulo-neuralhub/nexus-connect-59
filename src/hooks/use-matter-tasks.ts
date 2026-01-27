/**
 * use-matter-tasks - Hook para tareas del expediente
 * Usa la tabla matter_tasks dedicada
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface MatterTask {
  id: string;
  matter_id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  created_at: string;
}

export function useMatterTasks(matterId: string) {
  return useQuery({
    queryKey: ['matter-tasks', matterId],
    queryFn: async () => {
      // Query from the dedicated matter_tasks table
      const client: any = supabase;
      const { data, error } = await client
        .from('matter_tasks')
        .select(`
          id,
          matter_id,
          organization_id,
          title,
          description,
          priority,
          status,
          due_date,
          is_completed,
          completed_at,
          assigned_to,
          created_at,
          users:assigned_to(full_name)
        `)
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        id: t.id,
        matter_id: t.matter_id,
        organization_id: t.organization_id,
        title: t.title,
        description: t.description,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        due_date: t.due_date,
        is_completed: t.is_completed || false,
        completed_at: t.completed_at,
        assigned_to: t.assigned_to,
        assigned_to_name: t.users?.full_name,
        created_at: t.created_at,
      })) as MatterTask[];
    },
    enabled: !!matterId,
  });
}

export function useCreateMatterTask() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: {
      matter_id: string;
      title: string;
      description?: string | null;
      priority?: string;
      due_date?: string | null;
      assigned_to?: string | null;
    }) => {
      const client: any = supabase;
      const { data: task, error } = await client
        .from('matter_tasks')
        .insert({ 
          organization_id: currentOrganization!.id,
          matter_id: data.matter_id,
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          status: 'pending',
          due_date: data.due_date,
          assigned_to: data.assigned_to,
          is_completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matter-tasks', variables.matter_id] });
    },
  });
}

export function useCompleteMatterTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const client: any = supabase;
      const { error } = await client
        .from('matter_tasks')
        .update({ 
          is_completed: true,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-tasks'] });
    },
  });
}
