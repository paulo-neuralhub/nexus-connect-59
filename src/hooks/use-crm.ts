// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { Contact, ContactFilters, Deal, DealFilters, Pipeline, Activity } from '@/types/crm';
import { useAuth } from '@/contexts/auth-context';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ===== CONTACTS =====
export function useContacts(filters?: ContactFilters) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['contacts', currentOrganization?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.lifecycle_stage) {
        const stages = Array.isArray(filters.lifecycle_stage) ? filters.lifecycle_stage : [filters.lifecycle_stage];
        query = query.in('lifecycle_stage', stages);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useContact(id: string | undefined) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id!)
        .eq('organization_id', currentOrganization!.id)
        .single();
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id && !!currentOrganization?.id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<TablesInsert<'contacts'>, 'organization_id' | 'owner_type'>) => {
      const insertData: TablesInsert<'contacts'> = {
        ...data,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        created_by: user?.id,
      };
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return contact as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'contacts'> }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return contact as Contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// ===== ACTIVITIES =====
export function useActivities(params: { contactId?: string; dealId?: string; matterId?: string }) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['activities', params],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      
      if (params.contactId) query = query.eq('contact_id', params.contactId);
      if (params.dealId) query = query.eq('deal_id', params.dealId);
      if (params.matterId) query = query.eq('matter_id', params.matterId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!currentOrganization?.id && !!(params.contactId || params.dealId || params.matterId),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<TablesInsert<'activities'>, 'organization_id' | 'owner_type'>) => {
      const insertData: TablesInsert<'activities'> = {
        ...data,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        created_by: user?.id,
      };
      const { data: activity, error } = await supabase
        .from('activities')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return activity as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// ===== PIPELINES =====
export function usePipelines() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['pipelines', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select(`
          *,
          stages:pipeline_stages(*)
        `)
        .eq('organization_id', currentOrganization!.id)
        .eq('is_active', true)
        .order('position');
      if (error) throw error;
      
      // Ordenar stages por position
      return data.map(p => ({
        ...p,
        stages: p.stages?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      })) as Pipeline[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function usePipeline(id: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select(`
          *,
          stages:pipeline_stages(*)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return {
        ...data,
        stages: data.stages?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      } as Pipeline;
    },
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: { name: string; pipeline_type: string; stages: { name: string; color: string; probability: number; is_won_stage?: boolean; is_lost_stage?: boolean }[] }) => {
      // Create pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert({ 
          name: data.name,
          pipeline_type: data.pipeline_type,
          organization_id: currentOrganization!.id,
          owner_type: 'tenant',
        })
        .select()
        .single();
      if (pipelineError) throw pipelineError;
      
      // Create stages
      const stages = data.stages.map((stage, idx) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        color: stage.color,
        position: idx,
        probability: stage.probability,
        is_won_stage: stage.is_won_stage || false,
        is_lost_stage: stage.is_lost_stage || false,
      }));
      
      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .insert(stages);
      if (stagesError) throw stagesError;
      
      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

// ===== DEALS =====
export function useDeals(filters?: DealFilters) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['deals', currentOrganization?.id, filters],
    queryFn: async () => {
      // Use explicit hint for the contact relationship since deals has two FKs to contacts
      let query = supabase
        .from('deals')
        .select(`
          *,
          contact:contacts!deals_contact_id_fkey(*),
          stage:pipeline_stages(*)
        `)
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      
      if (filters?.pipeline_id) query = query.eq('pipeline_id', filters.pipeline_id);
      if (filters?.stage_id) query = query.eq('stage_id', filters.stage_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id);
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Deal[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useDeal(id: string | undefined) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contact:contacts!deals_contact_id_fkey(*),
          stage:pipeline_stages(*)
        `)
        .eq('id', id!)
        .eq('organization_id', currentOrganization!.id)
        .single();
      if (error) throw error;
      return data as unknown as Deal;
    },
    enabled: !!id && !!currentOrganization?.id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<TablesInsert<'deals'>, 'organization_id' | 'owner_type'>) => {
      const insertData: TablesInsert<'deals'> = {
        ...data,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        created_by: user?.id,
      };
      const { data: deal, error } = await supabase
        .from('deals')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return deal as unknown as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'deals'> }) => {
      const { data: deal, error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return deal as unknown as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
