// ============================================================
// IP-NEXUS - DEADLINE RULES HOOK
// Sistema de reglas para cálculo automático de plazos
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { Json } from '@/integrations/supabase/types';

export interface DeadlineType {
  id: string;
  code: string;
  name_es: string;
  name_en?: string;
  description?: string;
  category: 'filing' | 'response' | 'renewal' | 'opposition' | 'payment' | 'other';
  matter_types: string[];
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

// Interface que coincide con el schema actual de deadline_rules
export interface DeadlineRule {
  id: string;
  jurisdiction: string;
  matter_type: string;
  event_type: string;
  code: string;
  name: string;
  description?: string;
  days_from_event: number;
  calendar_type: string;
  conditions?: Json;
  creates_deadline: boolean;
  deadline_type?: string;
  priority: string;
  auto_create_task: boolean;
  task_template_id?: string;
  alert_days?: number[];
  is_active: boolean;
  source?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeadlineRuleFilters {
  jurisdiction?: string;
  matterType?: string;
  category?: string;
}

// Obtener tipos de plazo
export function useDeadlineTypes() {
  return useQuery({
    queryKey: ['deadline-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deadline_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as unknown as DeadlineType[];
    },
  });
}

// Obtener reglas de deadline
export function useDeadlineRules(filters?: DeadlineRuleFilters) {
  return useQuery({
    queryKey: ['deadline-rules', filters],
    queryFn: async () => {
      let query = supabase
        .from('deadline_rules')
        .select('*')
        .eq('is_active', true);
      
      if (filters?.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
      }
      
      if (filters?.matterType) {
        query = query.eq('matter_type', filters.matterType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as DeadlineRule[];
    },
  });
}

// Crear regla personalizada
export function useCreateDeadlineRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<DeadlineRule, 'id' | 'created_at' | 'updated_at'>) => {
      const insertData = {
        jurisdiction: data.jurisdiction,
        matter_type: data.matter_type,
        event_type: data.event_type,
        code: data.code,
        name: data.name,
        description: data.description,
        days_from_event: data.days_from_event,
        calendar_type: data.calendar_type || 'calendar',
        conditions: data.conditions,
        creates_deadline: data.creates_deadline ?? true,
        deadline_type: data.deadline_type,
        priority: data.priority || 'medium',
        auto_create_task: data.auto_create_task ?? false,
        task_template_id: data.task_template_id,
        alert_days: data.alert_days || [30, 15, 7, 1],
        is_active: data.is_active ?? true,
        source: data.source || 'custom',
        notes: data.notes,
      };
      
      const { data: rule, error } = await supabase
        .from('deadline_rules')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return rule as DeadlineRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline-rules'] });
    },
  });
}

// Actualizar regla
export function useUpdateDeadlineRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<DeadlineRule, 'id'>> }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.jurisdiction !== undefined) updateData.jurisdiction = data.jurisdiction;
      if (data.matter_type !== undefined) updateData.matter_type = data.matter_type;
      if (data.event_type !== undefined) updateData.event_type = data.event_type;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.days_from_event !== undefined) updateData.days_from_event = data.days_from_event;
      if (data.calendar_type !== undefined) updateData.calendar_type = data.calendar_type;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.alert_days !== undefined) updateData.alert_days = data.alert_days;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      const { data: rule, error } = await supabase
        .from('deadline_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return rule as DeadlineRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline-rules'] });
    },
  });
}

// Eliminar regla (solo custom)
export function useDeleteDeadlineRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deadline_rules')
        .delete()
        .eq('id', id)
        .eq('source', 'custom');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline-rules'] });
    },
  });
}

// Obtener festivos
export function useHolidayCalendar(countryCode: string, year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['holidays', countryCode, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holiday_calendars')
        .select('*')
        .eq('country_code', countryCode)
        .eq('year', currentYear)
        .order('date');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!countryCode,
  });
}

// Calcular plazos para un expediente
export function useCalculateDeadlines() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (matterId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-deadlines', {
        body: { matterId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, matterId) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', matterId] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

// Recalcular plazos
export function useRecalculateDeadlines() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (matterId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-deadlines', {
        body: { matterId, recalculate: true },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, matterId) => {
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines', matterId] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}
