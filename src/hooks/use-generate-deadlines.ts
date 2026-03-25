/**
 * useGenerateDeadlines — Hook to invoke deadline generation and handle fallback modal
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface DeadlineModalData {
  officeCode: string;
  officeName: string;
  officeId: string | null;
  countryCode: string | null;
  missingFields: any[];
  availableData: Record<string, any>;
  geniusSuggestions: any[];
  matterId: string;
  organizationId: string;
}

export function useGenerateDeadlines() {
  const [modalData, setModalData] = useState<DeadlineModalData | null>(null);
  const queryClient = useQueryClient();

  const generate = useCallback(
    async (
      matterId: string,
      organizationId: string,
      eventType: 'created' | 'status_changed' | 'date_updated' = 'created',
      triggerField?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'generate-matter-deadlines',
          {
            body: {
              matter_id: matterId,
              event_type: eventType,
              trigger_field: triggerField,
            },
          }
        );

        if (error) {
          console.error('Deadline generation error:', error);
          return;
        }

        if (data?.requires_manual_input) {
          // Open modal for manual input
          setModalData({
            officeCode: data.office_code,
            officeName: data.office_name,
            officeId: data.office_id,
            countryCode: data.country_code,
            missingFields: data.missing_fields || [],
            availableData: data.available_data || {},
            geniusSuggestions: data.genius_suggestions || [],
            matterId,
            organizationId,
          });
          return;
        }

        if (data?.success) {
          const total =
            (data.deadlines_created || 0) +
            (data.calendar_events_created || 0);
          if (total > 0) {
            toast.success(
              `✅ ${data.deadlines_created} plazos y ${data.calendar_events_created} recordatorios generados`
            );
          }
          // Refresh calendar and deadlines
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
          queryClient.invalidateQueries({ queryKey: ['matter-deadlines'] });
        }
      } catch (err) {
        console.error('Deadline generation failed:', err);
      }
    },
    [queryClient]
  );

  const closeModal = useCallback(() => {
    setModalData(null);
  }, []);

  const onModalComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    queryClient.invalidateQueries({ queryKey: ['matter-deadlines'] });
    setModalData(null);
  }, [queryClient]);

  return { generate, modalData, closeModal, onModalComplete };
}
