import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WritingAction = 
  | 'rewrite' | 'correct' | 'improve' | 'simplify' 
  | 'translate' | 'expand' | 'shorten' | 'legal_tone' | 'full_draft';

interface WritingResult {
  original: string;
  result: string;
  action: WritingAction;
}

interface UseGeniusWritingReturn {
  processText: (action: WritingAction, text: string, options?: {
    targetLanguage?: string;
    context?: Record<string, string>;
    draftType?: string;
    draftPrompt?: string;
  }) => Promise<string | null>;
  isProcessing: boolean;
  lastResult: WritingResult | null;
  clearResult: () => void;
}

export function useGeniusWriting(): UseGeniusWritingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<WritingResult | null>(null);

  const processText = useCallback(async (
    action: WritingAction,
    text: string,
    options?: {
      targetLanguage?: string;
      context?: Record<string, string>;
      draftType?: string;
      draftPrompt?: string;
    }
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('genius-writing', {
        body: {
          action,
          text,
          target_language: options?.targetLanguage,
          context: options?.context,
          draft_type: options?.draftType,
          draft_prompt: options?.draftPrompt,
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Límite de solicitudes alcanzado. Intenta de nuevo en unos segundos.');
        } else if (data.error.includes('Payment')) {
          toast.error('Créditos de IA agotados. Contacta al administrador.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      const result = data.result as string;
      setLastResult({ original: text, result, action });
      return result;
    } catch (err) {
      console.error('Genius writing error:', err);
      toast.error('Error al procesar el texto con IA');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearResult = useCallback(() => setLastResult(null), []);

  return { processText, isProcessing, lastResult, clearResult };
}
