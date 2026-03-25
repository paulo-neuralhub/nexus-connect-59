// ============================================================
// IP-NEXUS — Hook to invoke process-incoming-message Edge Function
// ============================================================

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProcessMessage() {
  const qc = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  const processMessage = async (messageId: string) => {
    setProcessingId(messageId);
    try {
      const { data, error } = await supabase.functions.invoke(
        'process-incoming-message',
        { body: { message_id: messageId } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await qc.invalidateQueries({ queryKey: ['inbox-messages'] });
      await qc.invalidateQueries({ queryKey: ['inbox-count'] });
      await qc.invalidateQueries({ queryKey: ['pending-approvals-list'] });
      await qc.invalidateQueries({ queryKey: ['approvals-count'] });
      toast.success('✅ Mensaje analizado por IP-GENIUS');
      return data;
    } catch (err: any) {
      console.error('processMessage error:', err);
      toast.error(err?.message || 'Error al analizar el mensaje');
    } finally {
      setProcessingId(null);
    }
  };

  const processAllPending = async () => {
    setProcessingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'process-incoming-message',
        { body: { process_all_pending: true } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await qc.invalidateQueries({ queryKey: ['inbox-messages'] });
      await qc.invalidateQueries({ queryKey: ['inbox-count'] });
      await qc.invalidateQueries({ queryKey: ['pending-approvals-list'] });
      await qc.invalidateQueries({ queryKey: ['approvals-count'] });
      toast.success(`✅ ${data?.processed || 0} mensajes analizados por IP-GENIUS`);
      return data;
    } catch (err: any) {
      console.error('processAllPending error:', err);
      toast.error(err?.message || 'Error al analizar mensajes');
    } finally {
      setProcessingAll(false);
    }
  };

  return { processMessage, processAllPending, processingId, processingAll };
}
