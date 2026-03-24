// @ts-nocheck
// src/hooks/use-realtime-collab.ts
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { useLocation } from 'react-router-dom';
import type { Json } from '@/integrations/supabase/types';

// ===== TYPES =====
export interface MatterComment {
  id: string;
  matter_id: string;
  organization_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  parent_id: string | null;
  attachments: Json;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  replies?: MatterComment[];
}

export interface UserPresenceData {
  user_id: string;
  status: string;
  users?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface MatterActivity {
  id: string;
  matter_id: string;
  organization_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  changes: Record<string, unknown>;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// ===== PRESENCE HOOK =====
export function usePresence() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const location = useLocation();

  useEffect(() => {
    if (!user?.id || !currentOrganization?.id) return;

    const matterMatch = location.pathname.match(/\/docket\/([a-f0-9-]+)/);
    const matterId = matterMatch ? matterMatch[1] : null;

    const updatePresence = async () => {
      try {
        await supabase.from('user_presence').upsert({
          user_id: user.id,
          organization_id: currentOrganization.id,
          last_seen_at: new Date().toISOString(),
          status: 'online',
        }, {
          onConflict: 'user_id',
        });
      } catch {
        // user_presence table may not have all columns yet
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        supabase.from('user_presence')
          .update({ status: 'away', last_seen_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, currentOrganization?.id, location.pathname]);
}

// ===== MATTER PRESENCE HOOK =====
export function useMatterPresence(matterId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['matter-presence', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, users(full_name, avatar_url)')
        .eq('current_matter_id', matterId)
        .neq('user_id', user?.id || '')
        .gte('last_seen_at', new Date(Date.now() - 120000).toISOString());
      
      if (error) throw error;
      return (data || []) as UserPresenceData[];
    },
    refetchInterval: 15000,
    enabled: !!matterId && !!user?.id,
  });

  useEffect(() => {
    if (!matterId) return;

    const channel = supabase
      .channel(`presence:${matterId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `current_matter_id=eq.${matterId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['matter-presence', matterId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matterId, queryClient]);

  return query;
}

// ===== MATTER COMMENTS HOOKS =====
export function useMatterComments(matterId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['matter-comments', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_comments')
        .select(`
          *,
          user:users(id, full_name, avatar_url),
          replies:matter_comments(
            *,
            user:users(id, full_name, avatar_url)
          )
        `)
        .eq('matter_id', matterId)
        .is('parent_id', null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as MatterComment[];
    },
    enabled: !!matterId,
  });

  useEffect(() => {
    if (!matterId) return;

    const channel = supabase
      .channel(`comments:${matterId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matter_comments',
        filter: `matter_id=eq.${matterId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['matter-comments', matterId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matterId, queryClient]);

  return query;
}

export function useCreateComment() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      matterId, 
      content, 
      parentId,
      mentions = []
    }: { 
      matterId: string; 
      content: string; 
      parentId?: string;
      mentions?: string[];
    }) => {
      const { error } = await supabase.from('matter_comments').insert({
        matter_id: matterId,
        organization_id: currentOrganization?.id,
        user_id: user?.id,
        content,
        parent_id: parentId || null,
        mentions,
      });
      if (error) throw error;
    },
    onSuccess: (_, { matterId }) => {
      queryClient.invalidateQueries({ queryKey: ['matter-comments', matterId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content, matterId }: { id: string; content: string; matterId: string }) => {
      const { error } = await supabase
        .from('matter_comments')
        .update({ 
          content, 
          is_edited: true, 
          edited_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
      return matterId;
    },
    onSuccess: (matterId) => {
      queryClient.invalidateQueries({ queryKey: ['matter-comments', matterId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, matterId }: { id: string; matterId: string }) => {
      const { error } = await supabase
        .from('matter_comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return matterId;
    },
    onSuccess: (matterId) => {
      queryClient.invalidateQueries({ queryKey: ['matter-comments', matterId] });
    },
  });
}

// ===== MATTER ACTIVITY HOOK =====
export function useMatterActivity(matterId: string, maxItems = 30) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['matter-activity', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_activity')
        .select(`*, user:users(full_name, avatar_url)`)
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      
      if (error) throw error;
      return (data || []) as MatterActivity[];
    },
    enabled: !!matterId,
  });

  useEffect(() => {
    if (!matterId) return;

    const channel = supabase
      .channel(`activity:${matterId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matter_activity',
        filter: `matter_id=eq.${matterId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['matter-activity', matterId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matterId, queryClient]);

  return query;
}

// ===== LOG ACTIVITY =====
export function useLogActivity() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      matterId,
      activityType,
      description,
      changes,
      referenceType,
      referenceId,
    }: {
      matterId: string;
      activityType: string;
      description: string;
      changes?: Record<string, unknown>;
      referenceType?: string;
      referenceId?: string;
    }) => {
      const insertData = {
        matter_id: matterId,
        organization_id: currentOrganization?.id,
        user_id: user?.id,
        activity_type: activityType,
        description,
        changes: (changes || {}) as Json,
        reference_type: referenceType,
        reference_id: referenceId,
      };
      const { error } = await supabase.from('matter_activity').insert(insertData);
      if (error) throw error;
    },
  });
}
