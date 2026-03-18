import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { WhatsAppTier, WhatsAppSessionStatus } from '@/types/legal-ops';

interface WhatsAppSession {
  id: string;
  status: WhatsAppSessionStatus;
  phone_number?: string;
  device_name?: string;
  last_seen_at?: string;
  last_sync_at?: string;
  messages_synced: number;
  error_message?: string;
}

interface WhatsAppConfig {
  tier: WhatsAppTier;
  addendum_signed: boolean;
  can_sync: boolean;
}

export function useWhatsAppSession() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener configuración actual
  const configQuery = useQuery({
    queryKey: ['whatsapp-config', currentOrganization?.id],
    queryFn: async (): Promise<WhatsAppConfig> => {
      const { data, error } = await supabase
        .from('tenant_ai_config')
        .select('whatsapp_tier, whatsapp_addendum_signed')
        .eq('organization_id', currentOrganization?.id)
        .maybeSingle();

      if (error) throw error;

      return {
        tier: (data?.whatsapp_tier as WhatsAppTier) || 'tier3_basic',
        addendum_signed: data?.whatsapp_addendum_signed || false,
        can_sync: data?.whatsapp_tier !== 'tier3_basic' && data?.whatsapp_addendum_signed
      };
    },
    enabled: !!currentOrganization?.id
  });

  // Obtener sesión actual (para Tier 2)
  const sessionQuery = useQuery({
    queryKey: ['whatsapp-session', currentOrganization?.id, user?.id],
    queryFn: async (): Promise<WhatsAppSession | null> => {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data as WhatsAppSession | null;
    },
    enabled: !!currentOrganization?.id && !!user?.id && configQuery.data?.tier === 'tier2_sync'
  });

  // Iniciar conexión QR (Tier 2)
  const startConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect', {
        body: { 
          organization_id: currentOrganization?.id,
          user_id: user?.id 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session'] });
    }
  });

  // Desconectar sesión
  const disconnect = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ 
          status: 'disconnected',
          session_data_encrypted: null 
        })
        .eq('organization_id', currentOrganization?.id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session'] });
    }
  });

  // Sincronizar mensajes manualmente
  const syncMessages = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('whatsapp-sync', {
        body: { 
          organization_id: currentOrganization?.id,
          user_id: user?.id 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-session'] });
    }
  });

  return {
    config: configQuery.data,
    session: sessionQuery.data,
    isLoading: configQuery.isLoading || sessionQuery.isLoading,
    startConnection,
    disconnect,
    syncMessages
  };
}

// Hook para generar link de click-to-chat (Tier 3)
export function useWhatsAppClickToChat() {
  const { currentOrganization } = useOrganization();

  const generateLink = (
    phoneNumber: string, 
    message?: string,
    context?: { client_name?: string; matter_ref?: string }
  ): string => {
    // Limpiar número (solo dígitos)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Construir mensaje con contexto
    let text = message || '';
    if (context?.client_name) {
      text = `Hola ${context.client_name}`;
      if (context?.matter_ref) {
        text += ` (Ref: ${context.matter_ref})`;
      }
      text += ', ';
    }
    
    // URL codificada
    const encodedText = encodeURIComponent(text);
    
    return `https://wa.me/${cleanNumber}${text ? `?text=${encodedText}` : ''}`;
  };

  const trackClick = async (
    phoneNumber: string, 
    client_id?: string,
    matter_id?: string
  ) => {
    // Log del click para analytics (sin contenido de mensaje)
    await supabase.from('audit_logs').insert({
      organization_id: currentOrganization?.id,
      action: 'whatsapp_click_to_chat',
      resource_type: 'communication',
      changes: {
        phone_number: phoneNumber.slice(-4), // Solo últimos 4 dígitos
        client_id,
        matter_id,
        timestamp: new Date().toISOString()
      }
    });
  };

  return { generateLink, trackClick };
}
