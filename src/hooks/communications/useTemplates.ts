// =============================================
// HOOK: useTemplates
// Gestión unificada de plantillas de comunicación
// =============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type TemplateChannelType = 'email' | 'whatsapp' | 'sms';

export interface TemplateVariable {
  name: string;
  description?: string;
  example?: string;
}

export interface EmailTemplate {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: TemplateVariable[] | null;
  is_active: boolean | null;
  is_system: boolean | null;
  usage_count: number | null;
  last_used_at: string | null;
  created_at: string | null;
}

export interface WhatsAppTemplate {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  wa_template_name: string;
  category: string | null;
  language: string | null;
  header_type: string | null;
  header_text: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: Json | null;
  variables: TemplateVariable[] | null;
  status: 'pending' | 'approved' | 'rejected' | string | null;
  created_at: string | null;
}

// Available variables for templates
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'client_name', description: 'Nombre del cliente' },
  { name: 'client_email', description: 'Email del cliente' },
  { name: 'contact_name', description: 'Nombre del contacto' },
  { name: 'matter_reference', description: 'Referencia del expediente' },
  { name: 'matter_title', description: 'Título del expediente' },
  { name: 'deadline_date', description: 'Fecha del plazo' },
  { name: 'deadline_description', description: 'Descripción del plazo' },
  { name: 'company_name', description: 'Nombre de tu empresa' },
  { name: 'sender_name', description: 'Nombre del remitente' },
  { name: 'sender_email', description: 'Email del remitente' },
  { name: 'current_date', description: 'Fecha actual' },
  { name: 'portal_link', description: 'Link al portal del cliente' },
];

export const TEMPLATE_CATEGORIES = [
  { value: 'welcome', label: 'Bienvenida', color: '#10B981' },
  { value: 'reminder', label: 'Recordatorio', color: '#F59E0B' },
  { value: 'notification', label: 'Notificación', color: '#3B82F6' },
  { value: 'marketing', label: 'Marketing', color: '#8B5CF6' },
  { value: 'legal', label: 'Legal', color: '#EF4444' },
  { value: 'billing', label: 'Facturación', color: '#06B6D4' },
  { value: 'other', label: 'Otro', color: '#6B7280' },
];

// =============================================
// Email Templates
// =============================================

export function useEmailTemplates(options?: { category?: string; search?: string }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['email-templates', currentOrganization?.id, options],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('crm_email_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('is_system', { ascending: false })
        .order('name');

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map database rows to EmailTemplate with proper variable parsing
      let templates = (data || []).map(row => ({
        ...row,
        variables: Array.isArray(row.variables) ? row.variables as unknown as TemplateVariable[] : null,
      })) as EmailTemplate[];

      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          t.subject.toLowerCase().includes(searchLower) ||
          t.code.toLowerCase().includes(searchLower)
        );
      }

      return templates;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useSaveEmailTemplate() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id?: string }) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // Convert variables to JSON-compatible format
      const variables = template.variables as unknown as Json;

      const dataToSave = {
        name: template.name,
        code: template.code,
        description: template.description,
        category: template.category,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables,
        is_active: template.is_active,
        organization_id: currentOrganization.id,
      };

      if (template.id) {
        const { error } = await supabase
          .from('crm_email_templates')
          .update(dataToSave)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crm_email_templates')
          .insert(dataToSave as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla guardada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla eliminada');
    },
  });
}

export function useDuplicateEmailTemplate() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: EmailTemplate) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const { error } = await supabase
        .from('crm_email_templates')
        .insert({
          organization_id: currentOrganization.id,
          name: `${template.name} (copia)`,
          code: `${template.code}_copy_${Date.now()}`,
          description: template.description,
          category: template.category,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          variables: template.variables as unknown as Json,
          is_system: false,
          is_active: true,
          usage_count: 0,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla duplicada');
    },
  });
}

// =============================================
// WhatsApp Templates
// =============================================

export function useWhatsAppTemplates(options?: { category?: string; status?: string }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['whatsapp-templates', currentOrganization?.id, options],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('crm_whatsapp_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map database rows to WhatsAppTemplate with proper variable parsing
      return (data || []).map(row => ({
        ...row,
        variables: Array.isArray(row.variables) ? row.variables as unknown as TemplateVariable[] : null,
      })) as WhatsAppTemplate[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useSaveWhatsAppTemplate() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<WhatsAppTemplate> & { id?: string }) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // Convert variables to JSON-compatible format
      const variables = template.variables as unknown as Json;
      const buttons = template.buttons as Json;

      const dataToSave = {
        name: template.name,
        code: template.code,
        wa_template_name: template.wa_template_name,
        category: template.category,
        language: template.language,
        header_type: template.header_type,
        header_text: template.header_text,
        body_text: template.body_text,
        footer_text: template.footer_text,
        buttons,
        variables,
        status: template.status,
        organization_id: currentOrganization.id,
      };

      if (template.id) {
        const { error } = await supabase
          .from('crm_whatsapp_templates')
          .update(dataToSave)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crm_whatsapp_templates')
          .insert(dataToSave as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla guardada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_whatsapp_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla eliminada');
    },
  });
}

// =============================================
// Template Utilities
// =============================================

export function detectVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = [...text.matchAll(regex)];
  return [...new Set(matches.map(m => m[1]))];
}

export function renderTemplate(text: string, data: Record<string, string>): string {
  let result = text;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  // Replace remaining variables with placeholders
  TEMPLATE_VARIABLES.forEach(v => {
    result = result.replace(
      new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'),
      `[${v.description}]`
    );
  });
  return result;
}
