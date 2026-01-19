// src/hooks/ai/useTranslation.ts
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import type { 
  Translation, 
  TranslationGlossary, 
  GlossaryTerm 
} from '@/lib/constants/translation';

export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  documentType: string;
  glossaryId?: string;
  disclaimerAccepted: boolean;
}

export interface TranslationResult {
  id: string;
  translatedText: string;
  confidence: number;
  termsUsed: Array<{ source: string; target: string }>;
  processingTime: number;
}

export function useTranslate() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (request: TranslationRequest): Promise<TranslationResult> => {
      if (!request.disclaimerAccepted) {
        throw new Error('Debe aceptar el aviso legal antes de continuar');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!currentOrganization?.id) throw new Error('No organization selected');

      // Create translation record
      const { data: translation, error: insertError } = await supabase
        .from('ai_translations')
        .insert({
          organization_id: currentOrganization.id,
          user_id: user.id,
          source_language: request.sourceLanguage,
          target_language: request.targetLanguage,
          document_type: request.documentType,
          source_text: request.sourceText,
          glossary_id: request.glossaryId || null,
          disclaimer_accepted: true,
          disclaimer_accepted_at: new Date().toISOString(),
          word_count: request.sourceText.split(/\s+/).filter(Boolean).length,
          character_count: request.sourceText.length,
          status: 'processing',
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Call AI translation edge function
      const startTime = Date.now();
      const { data: result, error: aiError } = await supabase.functions.invoke('ai-legal-translate', {
        body: {
          translationId: translation.id,
          sourceText: request.sourceText,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          documentType: request.documentType,
          glossaryId: request.glossaryId,
        },
      });

      if (aiError) {
        // Update status to error
        await supabase
          .from('ai_translations')
          .update({ status: 'error' })
          .eq('id', translation.id);
        throw aiError;
      }

      const processingTime = Date.now() - startTime;

      // Update record with results
      await supabase
        .from('ai_translations')
        .update({
          translated_text: result.translatedText,
          confidence_score: result.confidence,
          terms_used: result.termsUsed || [],
          processing_time_ms: processingTime,
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', translation.id);

      return {
        id: translation.id,
        translatedText: result.translatedText,
        confidence: result.confidence || 0.85,
        termsUsed: result.termsUsed || [],
        processingTime,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast.success('Traducción completada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en la traducción');
    },
  });
}

export function useGlossaries(sourceLanguage?: string, targetLanguage?: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['glossaries', sourceLanguage, targetLanguage, currentOrganization?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('ai_translation_glossaries')
        .select('*');

      // Filter by language pair if specified
      if (sourceLanguage) {
        query = query.eq('source_language', sourceLanguage);
      }
      if (targetLanguage) {
        query = query.eq('target_language', targetLanguage);
      }

      const { data, error } = await query.order('is_official', { ascending: false });
      
      if (error) throw error;
      
      // Filter to show only public, official, or user's own glossaries
      const filtered = (data || []).filter((g: any) => 
        g.is_public || 
        g.is_official || 
        g.user_id === user?.id ||
        g.organization_id === currentOrganization?.id
      );

      return filtered as TranslationGlossary[];
    },
    enabled: true,
  });
}

export function useGlossaryTerms(glossaryId: string | undefined) {
  return useQuery({
    queryKey: ['glossary-terms', glossaryId],
    queryFn: async () => {
      if (!glossaryId) return [];

      const { data, error } = await supabase
        .from('ai_glossary_terms')
        .select('*')
        .eq('glossary_id', glossaryId)
        .order('source_term');

      if (error) throw error;
      return data as GlossaryTerm[];
    },
    enabled: !!glossaryId,
  });
}

export function useTranslationHistory(limit = 50) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['translations', currentOrganization?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_translations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Translation[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateGlossary() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: Partial<TranslationGlossary>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: glossary, error } = await supabase
        .from('ai_translation_glossaries')
        .insert({
          organization_id: currentOrganization?.id,
          user_id: user.id,
          name: data.name,
          source_language: data.source_language,
          target_language: data.target_language,
          domain: data.domain,
          is_public: data.is_public || false,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return glossary as TranslationGlossary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossaries'] });
      toast.success('Glosario creado');
    },
  });
}

export function useAddGlossaryTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      glossaryId, 
      term 
    }: { 
      glossaryId: string; 
      term: Partial<GlossaryTerm>;
    }) => {
      const { data, error } = await supabase
        .from('ai_glossary_terms')
        .insert({
          glossary_id: glossaryId,
          source_term: term.source_term,
          target_term: term.target_term,
          context: term.context,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as GlossaryTerm;
    },
    onSuccess: (_, { glossaryId }) => {
      queryClient.invalidateQueries({ queryKey: ['glossary-terms', glossaryId] });
      toast.success('Término añadido');
    },
  });
}

export function useDeleteGlossaryTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, glossaryId }: { id: string; glossaryId: string }) => {
      const { error } = await supabase
        .from('ai_glossary_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { glossaryId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['glossary-terms', data.glossaryId] });
      toast.success('Término eliminado');
    },
  });
}
