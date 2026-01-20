import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { CommCategory } from '@/types/legal-ops';

interface ClassificationResult {
  category: CommCategory;
  subcategory?: string;
  priority: number;
  confidence: number;
  reasoning?: string;
}

export function useAIClassification() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Clasificar una comunicación
  const classifySingle = useMutation({
    mutationFn: async (communicationId: string): Promise<ClassificationResult> => {
      const { data, error } = await supabase.functions.invoke('classify-communication', {
        body: { 
          communication_id: communicationId,
          organization_id: currentOrganization?.id
        }
      });

      if (error) throw error;
      return data as ClassificationResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });

  // Clasificar batch de comunicaciones
  const classifyBatch = useMutation({
    mutationFn: async (communicationIds: string[]): Promise<Map<string, ClassificationResult>> => {
      const { data, error } = await supabase.functions.invoke('classify-communications-batch', {
        body: { 
          communication_ids: communicationIds,
          organization_id: currentOrganization?.id
        }
      });

      if (error) throw error;
      return new Map(Object.entries(data as Record<string, ClassificationResult>));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });

  // Re-clasificar con feedback
  const reclassifyWithFeedback = useMutation({
    mutationFn: async ({ 
      communicationId, 
      correctCategory,
      feedback 
    }: { 
      communicationId: string;
      correctCategory: CommCategory;
      feedback?: string;
    }) => {
      // 1. Guardar clasificación manual
      await supabase
        .from('communications')
        .update({ 
          manual_category: correctCategory,
          classified_at: new Date().toISOString(),
          classified_by: user?.id
        })
        .eq('id', communicationId);

      // 2. Registrar feedback para mejora del modelo
      const { data: comm } = await supabase
        .from('communications')
        .select('ai_category, ai_confidence, body')
        .eq('id', communicationId)
        .single();

      if (comm) {
        await supabase.from('legalops_ai_feedback').insert({
          organization_id: currentOrganization?.id,
          interaction_id: communicationId,
          user_id: user?.id,
          feedback_type: 'correction',
          original_output: comm.ai_category,
          corrected_output: correctCategory,
          feedback_comment: feedback
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    }
  });

  return {
    classifySingle,
    classifyBatch,
    reclassifyWithFeedback,
    isClassifying: classifySingle.isPending || classifyBatch.isPending
  };
}
