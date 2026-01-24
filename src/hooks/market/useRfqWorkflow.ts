// src/hooks/market/useRfqWorkflow.ts
// Hooks para el flujo de trabajo RFQ (Request for Quote)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TYPES ===
export type RfqWorkStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed' | 'disputed' | 'cancelled';

export interface RfqWorkMessage {
  id: string;
  request_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  is_system: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface RfqWorkFile {
  id: string;
  request_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  is_deliverable: boolean;
  created_at: string;
  uploader?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface RfqPayment {
  id: string;
  request_id: string;
  agent_id: string;
  client_id: string;
  quote_id: string | null;
  amount: number;
  currency: string;
  platform_fee: number;
  agent_payout: number | null;
  stripe_payment_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'refunded' | 'failed';
  paid_at: string | null;
  created_at: string;
}

export interface RfqReview {
  id: string;
  request_id: string;
  agent_id: string;
  reviewer_id: string;
  overall_rating: number;
  communication_rating: number | null;
  quality_rating: number | null;
  timeliness_rating: number | null;
  title: string | null;
  comment: string | null;
  is_public: boolean;
  created_at: string;
}

// === WORK MESSAGES ===
export function useRfqWorkMessages(requestId: string | undefined) {
  return useQuery({
    queryKey: ['rfq-work-messages', requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await (supabase
        .from('rfq_work_messages' as any)
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;
      return (data || []) as unknown as RfqWorkMessage[];
    },
    enabled: !!requestId,
    refetchInterval: 10000, // Poll every 10s
  });
}

export function useSendRfqWorkMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      message,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize,
      isSystem = false,
    }: {
      requestId: string;
      message: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentType?: string;
      attachmentSize?: number;
      isSystem?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rfq_work_messages' as any)
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message,
          attachment_url: attachmentUrl || null,
          attachment_name: attachmentName || null,
          attachment_type: attachmentType || null,
          attachment_size: attachmentSize || null,
          is_system: isSystem,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-work-messages', variables.requestId] });
    },
    onError: () => {
      toast.error('Error al enviar mensaje');
    },
  });
}

// === WORK FILES ===
export function useRfqWorkFiles(requestId: string | undefined) {
  return useQuery({
    queryKey: ['rfq-work-files', requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await (supabase
        .from('rfq_work_files' as any)
        .select(`
          *,
          uploader:users!uploaded_by(id, full_name, avatar_url)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as unknown as RfqWorkFile[];
    },
    enabled: !!requestId,
  });
}

export function useUploadRfqWorkFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      file,
      isDeliverable = false,
    }: {
      requestId: string;
      file: File;
      isDeliverable?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const filePath = `rfq-work/${requestId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save file record
      const { data, error } = await supabase
        .from('rfq_work_files' as any)
        .insert({
          request_id: requestId,
          uploaded_by: user.id,
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          is_deliverable: isDeliverable,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-work-files', variables.requestId] });
      toast.success('Archivo subido correctamente');
    },
    onError: () => {
      toast.error('Error al subir archivo');
    },
  });
}

// === WORK STATUS UPDATES ===
export function useMarkRfqWorkComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      summary,
    }: {
      requestId: string;
      summary: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status
      const { error } = await supabase
        .from('rfq_requests' as any)
        .update({
          work_status: 'pending_review',
          work_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Add system message
      await supabase
        .from('rfq_work_messages' as any)
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: `✅ El agente ha marcado el trabajo como completado.\n\nResumen: ${summary}`,
          is_system: true,
        });

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-work-messages', variables.requestId] });
      toast.success('Trabajo marcado como completado');
    },
    onError: () => {
      toast.error('Error al marcar trabajo como completado');
    },
  });
}

export function useApproveRfqWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status
      const { error } = await supabase
        .from('rfq_requests' as any)
        .update({
          work_status: 'completed',
          work_completed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Add system message
      await supabase
        .from('rfq_work_messages' as any)
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: '💰 El cliente ha aprobado el trabajo y liberado el pago.',
          is_system: true,
        });

      return { success: true };
    },
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-work-messages', requestId] });
      toast.success('Trabajo aprobado y pago liberado');
    },
    onError: () => {
      toast.error('Error al aprobar trabajo');
    },
  });
}

export function useRequestRfqChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status back to in_progress
      const { error } = await supabase
        .from('rfq_requests' as any)
        .update({
          work_status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Add system message
      await supabase
        .from('rfq_work_messages' as any)
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: `🔄 El cliente ha solicitado cambios:\n\n${reason}`,
          is_system: true,
        });

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-work-messages', variables.requestId] });
      toast.success('Cambios solicitados');
    },
    onError: () => {
      toast.error('Error al solicitar cambios');
    },
  });
}

export function useOpenRfqDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status
      const { error } = await supabase
        .from('rfq_requests' as any)
        .update({
          work_status: 'disputed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Add system message
      await supabase
        .from('rfq_work_messages' as any)
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: `⚠️ Se ha abierto una disputa:\n\n${reason}`,
          is_system: true,
        });

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-work-messages', variables.requestId] });
      toast.success('Disputa abierta');
    },
    onError: () => {
      toast.error('Error al abrir disputa');
    },
  });
}

// === REVIEWS ===
export function useSubmitRfqReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      agentId,
      overallRating,
      communicationRating,
      qualityRating,
      timelinessRating,
      title,
      comment,
      isPublic,
    }: {
      requestId: string;
      agentId: string;
      overallRating: number;
      communicationRating?: number;
      qualityRating?: number;
      timelinessRating?: number;
      title?: string;
      comment?: string;
      isPublic: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rfq_reviews' as any)
        .insert({
          request_id: requestId,
          agent_id: agentId,
          reviewer_id: user.id,
          overall_rating: overallRating,
          communication_rating: communicationRating || null,
          quality_rating: qualityRating || null,
          timeliness_rating: timelinessRating || null,
          title: title || null,
          comment: comment || null,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['agent-reviews', variables.agentId] });
      toast.success('Review enviada correctamente');
    },
    onError: () => {
      toast.error('Error al enviar review');
    },
  });
}

export function useAgentReviews(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent-reviews', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await (supabase
        .from('rfq_reviews' as any)
        .select(`
          *,
          reviewer:users!reviewer_id(id, full_name, avatar_url),
          request:rfq_requests!request_id(id, title, reference_number)
        `)
        .eq('agent_id', agentId)
        .eq('is_public', true)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as unknown as (RfqReview & { reviewer: any; request: any })[];
    },
    enabled: !!agentId,
  });
}

// === PAYMENTS ===
export function useRfqPayments(requestId: string | undefined) {
  return useQuery({
    queryKey: ['rfq-payments', requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await (supabase
        .from('rfq_payments' as any)
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as unknown as RfqPayment[];
    },
    enabled: !!requestId,
  });
}

export function useCreateRfqPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      agentId,
      quoteId,
      amount,
      currency = 'EUR',
    }: {
      requestId: string;
      agentId: string;
      quoteId?: string;
      amount: number;
      currency?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate fees (10% platform fee)
      const platformFee = amount * 0.10;
      const agentPayout = amount - platformFee;

      const { data, error } = await supabase
        .from('rfq_payments' as any)
        .insert({
          request_id: requestId,
          agent_id: agentId,
          client_id: user.id,
          quote_id: quoteId || null,
          amount,
          currency,
          platform_fee: platformFee,
          agent_payout: agentPayout,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-payments', variables.requestId] });
    },
    onError: () => {
      toast.error('Error al crear pago');
    },
  });
}
