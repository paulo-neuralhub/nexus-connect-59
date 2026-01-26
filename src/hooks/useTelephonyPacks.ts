import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TelephonyPack = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  minutes_included: number;
  sms_included: number;
  price: number;
  currency: string;
  validity_days: number;
  is_active: boolean;
  is_featured: boolean;
  min_plan: string | null;
  display_order: number;
  badge_text: string | null;
  savings_percentage: number | null;
  created_at: string;
};

export function useTelephonyPacks() {
  return useQuery({
    queryKey: ['telephony-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_packs')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return (data ?? []) as TelephonyPack[];
    },
  });
}

export function useTelephonyPack(id: string) {
  return useQuery({
    queryKey: ['telephony-pack', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_packs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as TelephonyPack | null;
    },
    enabled: !!id,
  });
}

export function useCreateTelephonyPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TelephonyPack, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('telephony_packs')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telephony-packs'] });
      toast.success('Pack creado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear pack: ${error.message}`);
    },
  });
}

export function useUpdateTelephonyPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TelephonyPack> & { id: string }) => {
      const { error } = await supabase
        .from('telephony_packs')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telephony-packs'] });
      toast.success('Pack actualizado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar pack: ${error.message}`);
    },
  });
}

export function useDeleteTelephonyPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telephony_packs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telephony-packs'] });
      toast.success('Pack eliminado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar pack: ${error.message}`);
    },
  });
}
