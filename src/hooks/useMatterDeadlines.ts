// ============================================================
// IP-NEXUS - MATTER DEADLINES HOOK
// Gestión de plazos por expediente
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface MatterDeadline {
  id: string;
  organization_id: string;
  matter_id: string;
  rule_id?: string;
  rule_code?: string;
  deadline_type: string;
  title: string;
  description?: string;
  trigger_date?: string;
  deadline_date: string;
  original_deadline?: string;
  status: 'pending' | 'upcoming' | 'urgent' | 'overdue' | 'completed' | 'cancelled';
  priority: string;
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  extension_count?: number;
  extension_reason?: string;
  extended_by?: string;
  task_id?: string;
  alerts_sent?: Record<string, string>;
  next_alert_date?: string;
  google_event_id?: string;
  outlook_event_id?: string;
  metadata?: Record<string, unknown>;
  auto_generated?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  matter?: {
    id: string;
    reference: string;
    title: string;
    type: string;
  };
}

export interface DeadlineFilters {
  matterId?: string;
  status?: string | string[];
  priority?: string | string[];
  from?: string;
  to?: string;
  limit?: number;
}

// Obtener plazos de un expediente
export function useMatterDeadlines(matterId: string) {
  return useQuery({
    queryKey: ['matter-deadlines', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_deadlines')
        .select('*')
        .eq('matter_id', matterId)
        .order('deadline_date', { ascending: true });
      
      if (error) throw error;
      return data as MatterDeadline[];
    },
    enabled: !!matterId,
  });
}

// Obtener todos los plazos pendientes
export function useAllPendingDeadlines(filters?: DeadlineFilters) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['pending-deadlines', currentOrganization?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('matter_deadlines')
        .select(`
          *,
          matter:matters(id, reference, title, type)
        `)
        .eq('organization_id', currentOrganization!.id)
        .not('status', 'in', '("completed","cancelled")');
      
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }
      
      if (filters?.priority) {
        const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
        query = query.in('priority', priorities);
      }
      
      if (filters?.from) {
        query = query.gte('deadline_date', filters.from);
      }
      
      if (filters?.to) {
        query = query.lte('deadline_date', filters.to);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query.order('deadline_date', { ascending: true });
      
      if (error) throw error;
      return data as MatterDeadline[];
    },
    enabled: !!currentOrganization?.id,
  });
}

// Completar un plazo
export function useCompleteDeadline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('matter_deadlines')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: notes,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', data.matter_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

// Extender un plazo
export function useExtendDeadline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      newDate, 
      reason 
    }: { 
      id: string; 
      newDate: string; 
      reason: string 
    }) => {
      // Primero obtener el deadline actual
      const { data: current } = await supabase
        .from('matter_deadlines')
        .select('extension_count')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase
        .from('matter_deadlines')
        .update({
          deadline_date: newDate,
          extension_count: (current?.extension_count || 0) + 1,
          extension_reason: reason,
          status: 'pending',
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', data.matter_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

// Cancelar un plazo
export function useCancelDeadline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('matter_deadlines')
        .update({
          status: 'cancelled',
          completion_notes: `Cancelado: ${reason}`,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', data.matter_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

// Añadir plazo manual
export function useAddManualDeadline() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: {
      matter_id: string;
      title: string;
      deadline_date: string;
      description?: string;
      priority?: string;
      deadline_type?: string;
    }) => {
      const insertData = {
        organization_id: currentOrganization!.id,
        matter_id: data.matter_id,
        title: data.title,
        deadline_date: data.deadline_date,
        trigger_date: data.deadline_date,
        original_deadline: data.deadline_date,
        description: data.description || null,
        priority: data.priority || 'medium',
        deadline_type: data.deadline_type || 'manual',
        status: 'pending' as const,
        auto_generated: false,
        source: 'manual',
      };
      
      const { data: deadline, error } = await supabase
        .from('matter_deadlines')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return deadline;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', data.matter_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

// Obtener recordatorios de un plazo
export function useDeadlineReminders(deadlineId: string) {
  return useQuery({
    queryKey: ['deadline-reminders', deadlineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('deadline_id', deadlineId)
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!deadlineId,
  });
}

// Estadísticas de plazos
export function useDeadlineStats() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['deadline-stats', currentOrganization?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Vencidos
      const { count: overdue } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id)
        .lt('deadline_date', today)
        .not('status', 'in', '("completed","cancelled")');
      
      // Urgentes (próximos 7 días)
      const { count: urgent } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id)
        .gte('deadline_date', today)
        .lte('deadline_date', in7Days)
        .not('status', 'in', '("completed","cancelled")');
      
      // Próximos (próximos 30 días)
      const { count: upcoming } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id)
        .gte('deadline_date', today)
        .lte('deadline_date', in30Days)
        .not('status', 'in', '("completed","cancelled")');
      
      // Este mes
      const { count: thisMonth } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id)
        .gte('deadline_date', today)
        .lte('deadline_date', endOfMonth)
        .not('status', 'in', '("completed","cancelled")');
      
      return {
        overdue: overdue || 0,
        urgent: urgent || 0,
        upcoming: upcoming || 0,
        thisMonth: thisMonth || 0,
      };
    },
    enabled: !!currentOrganization?.id,
  });
}
