/**
 * Hook for managing communication_templates table
 * Provides access to professional WhatsApp and Email templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useToast } from '@/hooks/use-toast';

export interface TemplateVariable {
  name: string;
  label: string;
  required: boolean;
  default?: string;
}

export interface CommunicationTemplate {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  channel: 'whatsapp' | 'email' | 'sms';
  category: string;
  subject: string | null;
  content_text: string;
  content_html: string | null;
  variables: TemplateVariable[];
  is_system: boolean;
  is_active: boolean;
  thumbnail_url: string | null;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_CATEGORIES = [
  { value: 'bienvenida', label: 'Bienvenida', color: '#3b82f6', icon: '👋' },
  { value: 'seguimiento', label: 'Seguimiento', color: '#8b5cf6', icon: '📊' },
  { value: 'plazos', label: 'Plazos', color: '#f59e0b', icon: '⏰' },
  { value: 'facturacion', label: 'Facturación', color: '#14b8a6', icon: '💰' },
  { value: 'marketing', label: 'Marketing', color: '#ec4899', icon: '📣' },
  { value: 'legal', label: 'Legal', color: '#22c55e', icon: '⚖️' },
  { value: 'notificaciones', label: 'Notificaciones', color: '#0ea5e9', icon: '🔔' },
  { value: 'recordatorios', label: 'Recordatorios', color: '#eab308', icon: '📅' },
  { value: 'confirmaciones', label: 'Confirmaciones', color: '#10b981', icon: '✅' },
];

interface UseTemplatesOptions {
  channel?: 'whatsapp' | 'email' | 'sms';
  category?: string;
  search?: string;
  isActive?: boolean;
}

export function useCommunicationTemplates(options?: UseTemplatesOptions) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['communication-templates', currentOrganization?.id, options],
    queryFn: async () => {
      let query = supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', options?.isActive ?? true)
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      if (options?.channel) {
        query = query.eq('channel', options.channel);
      }

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      let templates = (data || []).map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables as unknown as TemplateVariable[] : [],
        tags: Array.isArray(t.tags) ? t.tags : [],
      })) as unknown as CommunicationTemplate[];

      // Client-side search
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          t.code.toLowerCase().includes(searchLower) ||
          (t.description?.toLowerCase().includes(searchLower)) ||
          (t.subject?.toLowerCase().includes(searchLower))
        );
      }

      return templates;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCommunicationTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['communication-template', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables as unknown as TemplateVariable[] : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      } as unknown as CommunicationTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateCommunicationTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (template: Partial<CommunicationTemplate>) => {
      const insertData = {
        ...template,
        organization_id: currentOrganization?.id,
        is_system: false,
        variables: template.variables as unknown as any,
      };
      
      const { data, error } = await supabase
        .from('communication_templates')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Plantilla creada', description: 'La plantilla se ha creado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCommunicationTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommunicationTemplate> & { id: string }) => {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        variables: updates.variables as unknown as any,
      };
      
      const { data, error } = await supabase
        .from('communication_templates')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Plantilla actualizada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCommunicationTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('communication_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Plantilla eliminada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDuplicateCommunicationTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (template: CommunicationTemplate) => {
      const insertData = {
        code: `${template.code}_copy_${Date.now()}`,
        name: `${template.name} (copia)`,
        description: template.description,
        channel: template.channel,
        category: template.category,
        subject: template.subject,
        content_text: template.content_text,
        content_html: template.content_html,
        variables: template.variables as unknown as any,
        tags: template.tags,
        organization_id: currentOrganization?.id,
        is_system: false,
        usage_count: 0,
      };
      
      const { data, error } = await supabase
        .from('communication_templates')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Plantilla duplicada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Render template with variables replaced
export function renderTemplate(
  template: CommunicationTemplate,
  variables: Record<string, string>
): { subject: string; content: string } {
  let subject = template.subject || '';
  let content = template.channel === 'email' 
    ? (template.content_html || template.content_text) 
    : template.content_text;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    content = content.replace(regex, value);
  });

  return { subject, content };
}
