// ============================================================
// IP-NEXUS - ALL TASKS UNIFIED HOOK
// L90: Hook para obtener todas las tareas (CRM + Expedientes)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export interface TaskFilters {
  status?: 'pending' | 'completed' | 'all';
  assignedTo?: string | 'me' | 'all';
  source?: 'matter' | 'crm' | 'all';
  priority?: string;
  dueDateRange?: { from: Date; to: Date };
}

export interface UnifiedTask {
  id: string;
  subject: string | null;
  content: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  priority?: string;
  type: string;
  created_at: string;
  // Source info
  source: 'matter' | 'crm' | 'other';
  sourceLabel: string;
  sourceName: string;
  sourceUrl: string;
  // Relations
  matter_id: string | null;
  deal_id: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  // Joined data
  matter?: { id: string; reference: string; title: string } | null;
  deal?: { id: string; title: string } | null;
  assigned_user?: { id: string; full_name: string; avatar_url: string | null } | null;
  created_by?: string | null;
}

export function useAllTasks(filters: TaskFilters = {}) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-tasks', currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const tasks: UnifiedTask[] = [];

      // 1. Get tasks from activities table (matter-linked tasks)
      if (filters.source !== 'crm') {
        let query = supabase
          .from('activities')
          .select(`
            id, subject, content, due_date, is_completed, completed_at, type, created_at,
            matter_id, deal_id, contact_id,
            metadata,
            matter:matters(id, reference, title),
            deal:deals(id, title),
            created_by
          `)
          .eq('organization_id', currentOrganization.id)
          .eq('type', 'task')
          .order('due_date', { ascending: true, nullsFirst: false });

        // Status filter
        if (filters.status === 'pending') {
          query = query.eq('is_completed', false);
        } else if (filters.status === 'completed') {
          query = query.eq('is_completed', true);
        }

        // Date range filter
        if (filters.dueDateRange) {
          query = query
            .gte('due_date', filters.dueDateRange.from.toISOString())
            .lte('due_date', filters.dueDateRange.to.toISOString());
        }

        const { data, error } = await query.limit(100);
        if (!error && data) {
          for (const task of data) {
            const priority = (task.metadata as Record<string, unknown>)?.priority as string || 'medium';
            
            tasks.push({
              ...task,
              priority,
              source: 'matter' as const,
              sourceLabel: task.matter?.reference || 'Expediente',
              sourceName: task.matter?.title || '',
              sourceUrl: task.matter_id ? `/app/expedientes/${task.matter_id}` : '/app/tareas',
              assigned_to: task.created_by, // Use created_by as assigned_to for activities
            });
          }
        }
      }

      // 2. Get tasks from crm_tasks table
      if (filters.source !== 'matter') {
        let crmQuery = supabase
          .from('crm_tasks')
          .select(`
            id, title, description, due_date, status, completed_at, created_at,
            account_id, deal_id, contact_id, assigned_to, metadata,
            crm_accounts(id, name),
            deals(id, title)
          `)
          .eq('organization_id', currentOrganization.id)
          .order('due_date', { ascending: true, nullsFirst: false });

        // Status filter for crm_tasks
        if (filters.status === 'pending') {
          crmQuery = crmQuery.in('status', ['pending', 'in_progress']);
        } else if (filters.status === 'completed') {
          crmQuery = crmQuery.eq('status', 'completed');
        }

        // Date range filter
        if (filters.dueDateRange) {
          crmQuery = crmQuery
            .gte('due_date', filters.dueDateRange.from.toISOString())
            .lte('due_date', filters.dueDateRange.to.toISOString());
        }

        const { data: crmData, error: crmError } = await crmQuery.limit(100);
        if (!crmError && crmData) {
          for (const task of crmData) {
            const priority = (task.metadata as Record<string, unknown>)?.priority as string || 'medium';
            
            tasks.push({
              id: task.id,
              subject: task.title,
              content: task.description,
              due_date: task.due_date,
              is_completed: task.status === 'completed',
              completed_at: task.completed_at,
              type: 'task',
              created_at: task.created_at,
              priority,
              source: 'crm' as const,
              sourceLabel: task.crm_accounts?.name || 'CRM',
              sourceName: task.deals?.title || '',
              sourceUrl: task.deal_id 
                ? `/app/crm/deals/${task.deal_id}` 
                : task.account_id 
                  ? `/app/crm/accounts/${task.account_id}`
                  : '/app/tareas',
              matter_id: null,
              deal_id: task.deal_id,
              contact_id: task.contact_id,
              assigned_to: task.assigned_to,
              matter: null,
              deal: task.deals,
              assigned_user: null,
              created_by: null,
            });
          }
        }
      }

      // Sort combined results by due_date
      tasks.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      // Filter by assignedTo if needed
      if (filters.assignedTo === 'me' && user?.id) {
        return tasks.filter((t) => t.created_by === user.id || t.assigned_to === user.id);
      }

      return tasks;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('activities')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['matter-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Tarea actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Agrupar tareas por fecha
export function groupTasksByDate(tasks: UnifiedTask[]): Record<string, UnifiedTask[]> {
  const groups: Record<string, UnifiedTask[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach((task) => {
    if (!task.due_date) {
      const label = 'Sin fecha';
      if (!groups[label]) groups[label] = [];
      groups[label].push(task);
      return;
    }

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays < 0) label = 'Vencidas';
    else if (diffDays === 0) label = 'Hoy';
    else if (diffDays === 1) label = 'Mañana';
    else if (diffDays <= 7) label = 'Esta semana';
    else if (diffDays <= 14) label = 'Próxima semana';
    else label = 'Más adelante';

    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
  });

  return groups;
}
