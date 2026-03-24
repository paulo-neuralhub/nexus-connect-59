/**
 * useCRMPendingItems - Hook para tareas y llamadas pendientes CRM (datos reales)
 * Uses crm_tasks and crm_activities tables
 */

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PendingCall {
  id: string;
  name: string;
  company: string;
  phone: string;
  time: string;
}

export interface UrgentTask {
  id: string;
  title: string;
  urgency: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface RecentActivity {
  id: string;
  type: 'email' | 'call' | 'convert' | 'won' | 'lead' | 'note';
  text: string;
  user: string;
  time: string;
}

export function useCRMPendingCalls() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['crm-pending-calls', organizationId],
    queryFn: async (): Promise<PendingCall[]> => {
      if (!organizationId) return [];

      try {
        const today = new Date();
        const todayStart = startOfDay(today).toISOString();
        const todayEnd = endOfDay(today).toISOString();

        const { data, error } = await fromTable('crm_tasks')
          .select(`
            id, title, due_date,
            contact:crm_contacts!contact_id(id, full_name, phone, account:crm_accounts!account_id(name))
          `)
          .eq('organization_id', organizationId)
          .eq('status', 'pending')
          .gte('due_date', todayStart)
          .lte('due_date', todayEnd)
          .order('due_date', { ascending: true })
          .limit(5);

        if (error) {
          console.warn('[useCRMPendingCalls] Error:', error.message);
          return [];
        }

        return (data || []).map((t: Record<string, unknown>) => {
          const contact = t.contact as { full_name?: string; phone?: string; account?: { name?: string } } | null;
          return {
            id: t.id as string,
            name: contact?.full_name || 'Sin asignar',
            company: contact?.account?.name || 'Sin empresa',
            phone: contact?.phone || '',
            time: t.due_date ? format(new Date(t.due_date as string), 'HH:mm', { locale: es }) : '--:--',
          };
        });
      } catch {
        return [];
      }
    },
    enabled: !!organizationId,
  });
}

export function useCRMUrgentTasks() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['crm-urgent-tasks', organizationId],
    queryFn: async (): Promise<UrgentTask[]> => {
      if (!organizationId) return [];

      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await fromTable('crm_tasks')
          .select('id, title, status, due_date')
          .eq('organization_id', organizationId)
          .eq('status', 'pending')
          .lte('due_date', endOfDay(tomorrow).toISOString())
          .order('due_date', { ascending: true })
          .limit(5);

        if (error) {
          console.warn('[useCRMUrgentTasks] Error:', error.message);
          return [];
        }

        return (data || []).map((t: Record<string, unknown>) => {
          const due = t.due_date ? new Date(t.due_date as string) : null;
          const isToday = due && startOfDay(due).getTime() === startOfDay(today).getTime();
          const isTomorrow = due && startOfDay(due).getTime() === startOfDay(tomorrow).getTime();
          const urgency = isToday ? 'high' : isTomorrow ? 'medium' : 'low';

          return {
            id: t.id as string,
            title: (t.title as string) || 'Tarea sin título',
            urgency,
            dueDate: isToday ? 'Hoy' : isTomorrow ? 'Mañana' : due ? format(due, 'd MMM', { locale: es }) : 'Sin fecha',
          };
        });
      } catch {
        return [];
      }
    },
    enabled: !!organizationId,
  });
}

export function useCRMRecentActivity() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['crm-recent-activity', organizationId],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!organizationId) return [];

      try {
        const { data, error } = await fromTable('crm_activities')
          .select(`
            id, activity_type, subject, activity_date, created_by
          `)
          .eq('organization_id', organizationId)
          .order('activity_date', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('[useCRMRecentActivity] Error:', error.message);
          return [];
        }

        return (data || []).map((i: Record<string, unknown>) => {
          const actType = i.activity_type as string;
          let type: RecentActivity['type'] = 'note';
          if (actType === 'email') type = 'email';
          else if (actType === 'call') type = 'call';

          const creator = i.creator as { first_name?: string; last_name?: string } | null;
          const userName = creator ? [creator.first_name, creator.last_name].filter(Boolean).join(' ') : 'Sistema';

          return {
            id: i.id as string,
            type,
            text: (i.subject as string) || 'Actividad registrada',
            user: userName,
            time: i.activity_date ? format(new Date(i.activity_date as string), 'HH:mm', { locale: es }) : '',
          };
        });
      } catch {
        return [];
      }
    },
    enabled: !!organizationId,
  });
}

export function useCRMAverageTicket() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['crm-avg-ticket', organizationId],
    queryFn: async (): Promise<number> => {
      if (!organizationId) return 0;

      try {
        const { data, error } = await fromTable('crm_deals')
          .select('amount_eur, amount')
          .eq('organization_id', organizationId)
          .not('amount_eur', 'is', null);

        if (error || !data || data.length === 0) return 0;

        const total = data.reduce((sum, d: Record<string, unknown>) => sum + ((d.amount_eur as number) || (d.amount as number) || 0), 0);
        return Math.round(total / data.length);
      } catch {
        return 0;
      }
    },
    enabled: !!organizationId,
  });
}
