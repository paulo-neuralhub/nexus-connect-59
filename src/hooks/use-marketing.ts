import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { 
  EmailTemplate, 
  ContactList, 
  EmailCampaign, 
  Automation,
  EmailEditorContent,
  FilterCondition
} from '@/types/marketing';
import type { Json } from '@/integrations/supabase/types';

// Helper functions for type conversion
function parseJsonContent(json: Json | null): EmailEditorContent | undefined {
  if (!json) return undefined;
  return json as unknown as EmailEditorContent;
}

function parseFilterConditions(json: Json | null): FilterCondition[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as FilterCondition[];
}

// ===== TEMPLATES =====
export function useTemplates(category?: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['email-templates', currentOrganization?.id, category],
    queryFn: async () => {
      let query = supabase
        .from('comm_templates')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        json_content: parseJsonContent(t.json_content),
        owner_type: t.owner_type as 'tenant' | 'backoffice',
        category: t.category as EmailTemplate['category'],
      })) as EmailTemplate[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comm_templates')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      
      return {
        ...data,
        json_content: parseJsonContent(data.json_content),
        owner_type: data.owner_type as 'tenant' | 'backoffice',
        category: data.category as EmailTemplate['category'],
      } as EmailTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      const insertData = {
        name: data.name!,
        subject: data.subject!,
        html_content: data.html_content!,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        description: data.description,
        category: data.category,
        preview_text: data.preview_text,
        json_content: data.json_content as unknown as Json,
        plain_text: data.plain_text,
        available_variables: data.available_variables,
      };
      
      const { data: template, error } = await supabase
        .from('comm_templates')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailTemplate> }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.html_content !== undefined) updateData.html_content = data.html_content;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.preview_text !== undefined) updateData.preview_text = data.preview_text;
      if (data.json_content !== undefined) updateData.json_content = data.json_content as unknown as Json;
      if (data.plain_text !== undefined) updateData.plain_text = data.plain_text;
      if (data.available_variables !== undefined) updateData.available_variables = data.available_variables;
      
      const { data: template, error } = await supabase
        .from('comm_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return template;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-template', variables.id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comm_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

// ===== CONTACT LISTS =====
export function useContactLists() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['contact-lists', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      
      return (data || []).map(l => ({
        ...l,
        filter_conditions: parseFilterConditions(l.filter_conditions),
        owner_type: l.owner_type as 'tenant' | 'backoffice',
        type: l.type as 'static' | 'dynamic',
      })) as ContactList[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateContactList() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<ContactList>) => {
      const insertData = {
        name: data.name!,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        description: data.description,
        type: data.type,
        filter_conditions: data.filter_conditions as unknown as Json,
      };
      
      const { data: list, error } = await supabase
        .from('contact_lists')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}

export function useAddContactsToList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listId, contactIds }: { listId: string; contactIds: string[] }) => {
      const members = contactIds.map(contactId => ({
        list_id: listId,
        contact_id: contactId,
      }));
      
      const { error } = await supabase
        .from('contact_list_members')
        .upsert(members, { onConflict: 'list_id,contact_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}

export function useDeleteContactList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}

// ===== CAMPAIGNS =====
export function useCampaigns(status?: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['email-campaigns', currentOrganization?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(c => ({
        ...c,
        json_content: parseJsonContent(c.json_content),
        segment_conditions: parseFilterConditions(c.segment_conditions),
        ab_test_config: c.ab_test_config as unknown as EmailCampaign['ab_test_config'],
        owner_type: c.owner_type as 'tenant' | 'backoffice',
        campaign_type: c.campaign_type as EmailCampaign['campaign_type'],
        status: c.status as EmailCampaign['status'],
      })) as EmailCampaign[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['email-campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      
      return {
        ...data,
        json_content: parseJsonContent(data.json_content),
        segment_conditions: parseFilterConditions(data.segment_conditions),
        ab_test_config: data.ab_test_config as unknown as EmailCampaign['ab_test_config'],
        owner_type: data.owner_type as 'tenant' | 'backoffice',
        campaign_type: data.campaign_type as EmailCampaign['campaign_type'],
        status: data.status as EmailCampaign['status'],
      } as EmailCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailCampaign>) => {
      const insertData = {
        name: data.name!,
        subject: data.subject!,
        from_name: data.from_name!,
        from_email: data.from_email!,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        description: data.description,
        campaign_type: data.campaign_type,
        template_id: data.template_id,
        preview_text: data.preview_text,
        reply_to: data.reply_to,
        html_content: data.html_content,
        json_content: data.json_content as unknown as Json,
        list_ids: data.list_ids,
        segment_conditions: data.segment_conditions as unknown as Json,
        exclude_list_ids: data.exclude_list_ids,
      };
      
      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailCampaign> }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.from_name !== undefined) updateData.from_name = data.from_name;
      if (data.from_email !== undefined) updateData.from_email = data.from_email;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.html_content !== undefined) updateData.html_content = data.html_content;
      if (data.json_content !== undefined) updateData.json_content = data.json_content as unknown as Json;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.scheduled_at !== undefined) updateData.scheduled_at = data.scheduled_at;
      
      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['email-campaign', variables.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
  });
}

// ===== AUTOMATIONS =====
export function useAutomations() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['automations', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      return (data || []).map(a => ({
        ...a,
        trigger_config: a.trigger_config as unknown as Record<string, unknown>,
        filter_conditions: parseFilterConditions(a.filter_conditions),
        actions: (a.actions || []) as unknown as Automation['actions'],
        owner_type: a.owner_type as 'tenant' | 'backoffice',
        trigger_type: a.trigger_type as Automation['trigger_type'],
        status: a.status as Automation['status'],
      })) as Automation[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<Automation>) => {
      const insertData = {
        name: data.name!,
        trigger_type: data.trigger_type!,
        organization_id: currentOrganization!.id,
        owner_type: 'tenant',
        description: data.description,
        trigger_config: data.trigger_config as unknown as Json,
        filter_conditions: data.filter_conditions as unknown as Json,
        actions: data.actions as unknown as Json,
        status: data.status,
      };
      
      const { data: automation, error } = await supabase
        .from('automations')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return automation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Automation> }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config as unknown as Json;
      if (data.filter_conditions !== undefined) updateData.filter_conditions = data.filter_conditions as unknown as Json;
      if (data.actions !== undefined) updateData.actions = data.actions as unknown as Json;
      if (data.status !== undefined) updateData.status = data.status;
      
      const { data: automation, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return automation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation', variables.id] });
    },
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}
