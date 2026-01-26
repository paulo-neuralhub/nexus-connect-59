import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { 
  Communication, 
  CommChannel, 
  CommCategory,
  CommDirection 
} from '@/types/legal-ops';

interface CommunicationsFilters {
  channel?: CommChannel | CommChannel[];
  client_id?: string;
  matter_id?: string;
  category?: CommCategory;
  is_read?: boolean;
  is_starred?: boolean;
  direction?: CommDirection;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface CommunicationsResult {
  data: Communication[];
  count: number;
  hasMore: boolean;
}

export function useCommunications(
  filters: CommunicationsFilters = {},
  page: number = 1,
  pageSize: number = 50
) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['communications', currentOrganization?.id, filters, page, pageSize],
    queryFn: async (): Promise<CommunicationsResult> => {
      let query = supabase
        .from('communications')
        .select(`
          *,
          client:contacts!client_id(id, name, company_name, email),
          contact:contacts!contact_id(id, name, email),
          matter:matters(id, title, reference)
        `, { count: 'exact' })
        .eq('organization_id', currentOrganization?.id)
        .order('received_at', { ascending: false });

      // Aplicar filtros
      if (filters.channel) {
        if (Array.isArray(filters.channel)) {
          query = query.in('channel', filters.channel);
        } else {
          query = query.eq('channel', filters.channel);
        }
      }

      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      if (filters.matter_id) {
        query = query.eq('matter_id', filters.matter_id);
      }

      if (filters.category) {
        query = query.or(
          `manual_category.eq.${filters.category},and(manual_category.is.null,ai_category.eq.${filters.category})`
        );
      }

      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters.is_starred !== undefined) {
        query = query.eq('is_starred', filters.is_starred);
      }

      if (filters.direction) {
        query = query.eq('direction', filters.direction);
      }

      if (filters.date_from) {
        query = query.gte('received_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('received_at', filters.date_to);
      }

      if (filters.search) {
        query = query.or(
          `subject.ilike.%${filters.search}%,body.ilike.%${filters.search}%`
        );
      }

      // Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as unknown as Communication[],
        count: count || 0,
        hasMore: (count || 0) > to + 1
      };
    },
    enabled: !!currentOrganization?.id
  });
}

// Hook para una comunicación específica
export function useCommunication(id: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['communication', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          *,
          client:contacts!client_id(*),
          contact:contacts!contact_id(*),
          matter:matters(*),
          transcription:audio_transcriptions(*)
        `)
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id)
        .single();

      if (error) throw error;
      return data as unknown as Communication & { transcription?: unknown };
    },
    enabled: !!id && !!currentOrganization?.id
  });
}

// Hook para marcar como leído
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      
      const { error } = await supabase
        .from('communications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', idsArray)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para toggle starred
export function useToggleStar() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, is_starred }: { id: string; is_starred: boolean }) => {
      const { error } = await supabase
        .from('communications')
        .update({ is_starred })
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para archivar
export function useArchiveCommunication() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      
      const { error } = await supabase
        .from('communications')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString() 
        })
        .in('id', idsArray)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para clasificación manual
export function useClassifyCommunication() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      id, 
      category, 
      priority 
    }: { 
      id: string; 
      category: CommCategory; 
      priority?: number 
    }) => {
      const { error } = await supabase
        .from('communications')
        .update({ 
          manual_category: category,
          manual_priority: priority,
          classified_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para asignar comunicación
export function useAssignCommunication() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      id, 
      assigned_to 
    }: { 
      id: string; 
      assigned_to: string | null 
    }) => {
      const { error } = await supabase
        .from('communications')
        .update({ 
          assigned_to,
          assigned_at: assigned_to ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para vincular a cliente/asunto
export function useLinkCommunication() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      id, 
      client_id,
      matter_id 
    }: { 
      id: string; 
      client_id?: string | null;
      matter_id?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (client_id !== undefined) updates.client_id = client_id;
      if (matter_id !== undefined) updates.matter_id = matter_id;

      const { error } = await supabase
        .from('communications')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}

// Hook para estadísticas de inbox
export function useInboxStats() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['inbox-stats', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('channel, is_read, ai_category')
        .eq('organization_id', currentOrganization?.id)
        .eq('is_archived', false);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(c => !c.is_read).length || 0,
        byChannel: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        urgent: data?.filter(c => c.ai_category === 'urgent').length || 0
      };

      data?.forEach(comm => {
        stats.byChannel[comm.channel] = (stats.byChannel[comm.channel] || 0) + 1;
        if (comm.ai_category) {
          stats.byCategory[comm.ai_category] = (stats.byCategory[comm.ai_category] || 0) + 1;
        }
      });

      return stats;
    },
    enabled: !!currentOrganization?.id,
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });
}

// Hook para crear comunicación
export function useCreateCommunication() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (communication: {
      channel: CommChannel;
      direction: CommDirection;
      subject?: string;
      body?: string;
      client_id?: string;
      contact_id?: string;
      matter_id?: string;
      email_from?: string;
      email_to?: string[];
      whatsapp_from?: string;
      whatsapp_to?: string;
      received_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('communications')
        .insert({
          organization_id: currentOrganization?.id!,
          channel: communication.channel,
          direction: communication.direction,
          subject: communication.subject || null,
          body: communication.body || null,
          client_id: communication.client_id || null,
          contact_id: communication.contact_id || null,
          matter_id: communication.matter_id || null,
          email_from: communication.email_from || null,
          email_to: communication.email_to || null,
          whatsapp_from: communication.whatsapp_from || null,
          whatsapp_to: communication.whatsapp_to || null,
          received_at: communication.received_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-stats'] });
    }
  });
}

// =============================================
// Hook para enviar email
// =============================================
export function useSendEmail() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      to: string;
      to_name?: string;
      subject: string;
      body: string;
      body_html?: string;
      attachments?: { name: string; content: string; type: string }[];
      contact_id?: string;
      client_id?: string;
      matter_id?: string;
      template_id?: string;
      scheduled_at?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id: currentOrganization?.id,
          to: params.to,
          subject: params.subject,
          html: params.body_html || params.body,
          text: params.body,
          template_data: {
            to_name: params.to_name,
            contact_id: params.contact_id,
            client_id: params.client_id,
            matter_id: params.matter_id,
          }
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-stats'] });
    }
  });
}

// =============================================
// Hook para enviar SMS
// =============================================
export function useSendSMS() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      to: string;
      message: string;
      contact_id?: string;
      client_id?: string;
      matter_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          organization_id: currentOrganization?.id,
          to: params.to,
          message: params.message,
          contact_id: params.contact_id,
          client_id: params.client_id,
          matter_id: params.matter_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-stats'] });
    }
  });
}

// =============================================
// Hook para enviar WhatsApp
// =============================================
export function useSendWhatsApp() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      to: string;
      message?: string;
      template_name?: string;
      template_language?: string;
      template_params?: Record<string, string[]>;
      media_url?: string;
      media_type?: 'image' | 'document' | 'audio' | 'video';
      contact_id?: string;
      client_id?: string;
      matter_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          organization_id: currentOrganization?.id,
          to: params.to,
          message: params.message,
          template_name: params.template_name,
          template_language: params.template_language,
          template_params: params.template_params,
          media_url: params.media_url,
          media_type: params.media_type,
          contact_id: params.contact_id,
          client_id: params.client_id,
          matter_id: params.matter_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-stats'] });
    }
  });
}

// =============================================
// Hook para hacer llamada
// =============================================
export function useMakeCall() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      to: string;
      contact_id?: string;
      client_id?: string;
      matter_id?: string;
      record?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('telephony-make-call', {
        body: {
          tenantId: currentOrganization?.id,
          toNumber: params.to,
          record: params.record ?? true,
          contactId: params.contact_id,
          clientId: params.client_id,
          matterId: params.matter_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });
}
