import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketUserReview } from '@/types/market-users';

// =====================================================
// REVIEWS DE UN USUARIO
// =====================================================

export function useMarketUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['market-user-reviews', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('market_user_reviews')
        .select(`
          *,
          reviewer:reviewer_id(id, display_name, avatar_url, country)
        `)
        .eq('reviewed_user_id', userId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as MarketUserReview[];
    },
    enabled: !!userId,
  });
}

// =====================================================
// RESUMEN DE REVIEWS
// =====================================================

export function useReviewsSummary(userId: string | undefined) {
  return useQuery({
    queryKey: ['market-user-reviews-summary', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('market_user_reviews')
        .select('rating_overall, rating_communication, rating_quality, rating_timeliness, rating_value')
        .eq('reviewed_user_id', userId)
        .eq('is_visible', true);
      
      if (error) throw error;
      
      if (!data.length) {
        return {
          count: 0,
          avgOverall: 0,
          avgCommunication: 0,
          avgQuality: 0,
          avgTimeliness: 0,
          avgValue: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.forEach(r => {
        distribution[r.rating_overall as 1|2|3|4|5]++;
      });
      
      const avg = (arr: (number | null)[]) => {
        const valid = arr.filter((v): v is number => v !== null);
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      };
      
      return {
        count: data.length,
        avgOverall: avg(data.map(r => r.rating_overall)),
        avgCommunication: avg(data.map(r => r.rating_communication)),
        avgQuality: avg(data.map(r => r.rating_quality)),
        avgTimeliness: avg(data.map(r => r.rating_timeliness)),
        avgValue: avg(data.map(r => r.rating_value)),
        distribution,
      };
    },
    enabled: !!userId,
  });
}

// =====================================================
// CREAR REVIEW
// =====================================================

interface CreateReviewData {
  reviewed_user_id: string;
  reviewer_id: string;
  transaction_id?: string;
  rating_overall: number;
  rating_communication?: number;
  rating_quality?: number;
  rating_timeliness?: number;
  rating_value?: number;
  title?: string;
  comment?: string;
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: CreateReviewData) => {
      const { data, error } = await supabase
        .from('market_user_reviews')
        .insert(review as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUserReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['market-user-reviews', data.reviewed_user_id] });
      queryClient.invalidateQueries({ queryKey: ['market-user-reviews-summary', data.reviewed_user_id] });
      queryClient.invalidateQueries({ queryKey: ['market-user', data.reviewed_user_id] });
    },
  });
}

// =====================================================
// RESPONDER A REVIEW
// =====================================================

export function useRespondToReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const { data, error } = await supabase
        .from('market_user_reviews')
        .update({ 
          response, 
          response_at: new Date().toISOString() 
        } as any)
        .eq('id', reviewId)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUserReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['market-user-reviews', data.reviewed_user_id] });
    },
  });
}

// =====================================================
// REPORTAR REVIEW
// =====================================================

export function useFlagReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('market_user_reviews')
        .update({ 
          is_flagged: true, 
          flag_reason: reason 
        } as any)
        .eq('id', reviewId)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUserReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['market-user-reviews', data.reviewed_user_id] });
    },
  });
}
