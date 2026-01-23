import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export type VoipSettings = {
  id: string;
  organization_id: string;

  provider: string;
  account_sid: string | null;
  auth_token: string | null;
  api_key_sid: string | null;
  api_key_secret: string | null;
  primary_number: string | null;
  fallback_number: string | null;

  recording_enabled: boolean;
  recording_consent_required: boolean;
  recording_consent_message: string;
  recording_storage: string;
  transcription_enabled: boolean;

  transcription_provider: string;
  transcription_language: string;

  ai_analysis_enabled: boolean;
  ai_provider: string;
  ai_model: string;

  webhook_url: string | null;
  status_callback_url: string | null;

  max_call_duration_minutes: number;
  max_concurrent_calls: number;

  created_at: string;
  updated_at: string;
};

export function useVoipSettings() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['voip-settings', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('voip_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as VoipSettings | null;
    },
  });
}

export function useUpdateVoipSettings() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<VoipSettings>) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // Upsert
      const { data, error } = await supabase
        .from('voip_settings')
        .upsert(
          {
            organization_id: currentOrganization.id,
            provider: settings.provider ?? 'twilio',
            recording_consent_message: settings.recording_consent_message ?? 'Esta llamada será grabada.',
            recording_storage: settings.recording_storage ?? 'supabase',
            transcription_provider: settings.transcription_provider ?? 'default',
            transcription_language: settings.transcription_language ?? 'es-ES',
            ai_analysis_enabled: settings.ai_analysis_enabled ?? true,
            ai_provider: settings.ai_provider ?? 'default',
            ai_model: settings.ai_model ?? 'default',
            max_call_duration_minutes: settings.max_call_duration_minutes ?? 60,
            max_concurrent_calls: settings.max_concurrent_calls ?? 2,
            ...settings,
          },
          { onConflict: 'organization_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-settings', currentOrganization?.id] });
      toast.success('Configuración de VoIP actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
