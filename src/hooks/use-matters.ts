import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { Matter, MatterFilters } from '@/types/matters';

export function useMatters(filters?: MatterFilters) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['matters', currentOrganization?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('matters')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,mark_name.ilike.%${filters.search}%`);
      }
      if (filters?.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        query = query.in('type', types);
      }
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }
      if (filters?.jurisdiction) {
        query = query.eq('jurisdiction_code', filters.jurisdiction);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Matter[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useMatter(id: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['matter', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .single();
      
      if (error) throw error;
      return data as Matter;
    },
    enabled: !!id && !!currentOrganization?.id,
  });
}

export function useCreateMatter() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<Matter>) => {
      const { data: matter, error } = await supabase
        .from('matters')
        .insert({ ...data, organization_id: currentOrganization!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return matter;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      // Auto-generate deadlines for the new matter
      if (result?.id) {
        supabase.functions.invoke('generate-matter-deadlines', {
          body: { matter_id: result.id, event_type: 'created' },
        }).catch(console.error);
      }
    },
  });
}

export function useUpdateMatter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Matter> }) => {
      const { data: matter, error } = await supabase
        .from('matters')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return matter;
    },
    onSuccess: (result: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      queryClient.invalidateQueries({ queryKey: ['matter', variables.id] });
      // Re-generate deadlines when key fields change
      const triggerFields = ['status', 'registration_date', 'expiry_date', 'filing_date'];
      const changedField = triggerFields.find(f => f in variables.data);
      if (changedField) {
        supabase.functions.invoke('generate-matter-deadlines', {
          body: {
            matter_id: variables.id,
            event_type: changedField === 'status' ? 'status_changed' : 'date_updated',
            trigger_field: changedField,
          },
        }).catch(console.error);
      }
    },
  });
}

export function useDeleteMatter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('matters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

export function useMatterDocuments(matterId: string) {
  return useQuery({
    queryKey: ['matter-documents', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_documents')
        .select('*')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!matterId,
  });
}

export function useMatterEvents(matterId: string) {
  return useQuery({
    queryKey: ['matter-events', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_events')
        .select('*')
        .eq('matter_id', matterId)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!matterId,
  });
}
