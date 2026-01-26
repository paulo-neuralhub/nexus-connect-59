// ============================================================
// IP-NEXUS - Telephony Purchase Hook
// ============================================================

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export type PurchaseResult = {
  success: boolean;
  error?: string;
  purchaseId?: string;
};

export function useTelephonyPurchase() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchasePack = async (packId: string): Promise<PurchaseResult> => {
    if (!currentOrganization?.id) {
      toast.error('No hay organización seleccionada');
      return { success: false, error: 'No organization' };
    }

    setIsPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('telephony-purchase-pack', {
        body: {
          tenantId: currentOrganization.id,
          packId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      // Invalidate balance and purchases queries
      queryClient.invalidateQueries({ queryKey: ['tenant-telephony-balance'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-telephony-purchases'] });

      toast.success('¡Compra realizada! Los minutos se han añadido a tu saldo.');

      return { success: true, purchaseId: data.purchaseId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al comprar: ${message}`);
      return { success: false, error: message };
    } finally {
      setIsPurchasing(false);
    }
  };

  const checkBalance = async (destination: string): Promise<{
    canCall: boolean;
    minutesAvailable: number;
    estimatedCost: number;
  } | null> => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase.functions.invoke('telephony-check-balance', {
        body: {
          tenantId: currentOrganization.id,
          destination,
        },
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error checking balance:', err);
      return null;
    }
  };

  return {
    purchasePack,
    checkBalance,
    isPurchasing,
  };
}
