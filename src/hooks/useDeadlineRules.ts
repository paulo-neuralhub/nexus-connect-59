// ============================================================
// IP-NEXUS - DEADLINE RULES HOOK
// Sistema de reglas para cálculo automático de plazos
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

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

export interface DeadlineRule {
  id: string;
  organization_id?: string;
  deadline_type_id: string;
  jurisdiction: string;
  trigger_event: string;
  days_offset: number;
  months_offset: number;
  years_offset: number;
  business_days_only: boolean;
  adjust_to_next_business_day: boolean;
  exclude_holidays: boolean;
  holiday_calendar: string;
  reminder_days: number[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_fatal: boolean;
  auto_create_task: boolean;
  notify_roles: string[];
  is_active: boolean;
  is_system: boolean;
  deadline_type?: DeadlineType;
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
      return data as DeadlineType[];
    },
  });
}

// Obtener reglas de deadline
export function useDeadlineRules(filters?: DeadlineRuleFilters) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['deadline-rules', currentOrganization?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('deadline_rules')
        .select(`
          *,
          deadline_type:deadline_types(*)
        `)
        .or(`organization_id.is.null,organization_id.eq.${currentOrganization?.id}`)
        .eq('is_active', true);
      
      if (filters?.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let rules = data as DeadlineRule[];
      
      // Filtrar por tipo de matter si se especifica
      if (filters?.matterType) {
        rules = rules.filter(rule => 
          rule.deadline_type?.matter_types?.includes(filters.matterType!)
        );
      }
      
      if (filters?.category) {
        rules = rules.filter(rule => 
          rule.deadline_type?.category === filters.category
        );
      }
      
      return rules;
    },
    enabled: !!currentOrganization?.id,
  });
}

// Crear regla personalizada
export function useCreateDeadlineRule() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<DeadlineRule>) => {
      const { data: rule, error } = await supabase
        .from('deadline_rules')
        .insert({
          ...data,
          organization_id: currentOrganization!.id,
          is_system: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return rule;
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeadlineRule> }) => {
      const { data: rule, error } = await supabase
        .from('deadline_rules')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return rule;
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
        .eq('is_system', false);
      
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
      return data;
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
