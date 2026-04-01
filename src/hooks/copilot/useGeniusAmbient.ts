// ============================================================
// IP-NEXUS — GENIUS Ambient Intelligence Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useEffect, useMemo } from "react";

export interface CopilotSuggestion {
  id: string;
  organization_id: string;
  user_id: string | null;
  suggestion_type: string;
  title: string;
  body: string | null;
  action_primary_label: string | null;
  action_primary_url: string | null;
  action_secondary_label: string | null;
  action_secondary_url: string | null;
  matter_id: string | null;
  crm_account_id: string | null;
  trigger_source: string | null;
  confidence_score: number;
  shown_at: string | null;
  acted_at: string | null;
  dismissed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CopilotPreferences {
  copilot_visible: boolean;
  copilot_position: string;
  copilot_size: string;
  bubble_state: string;
  suggestions_enabled: boolean;
  suggestion_confidence_threshold: number;
  greeting_enabled: boolean;
  last_greeted_date: string | null;
}

const DEFAULT_PREFS: CopilotPreferences = {
  copilot_visible: true,
  copilot_position: "bottom-right",
  copilot_size: "default",
  bubble_state: "collapsed",
  suggestions_enabled: true,
  suggestion_confidence_threshold: 50,
  greeting_enabled: true,
  last_greeted_date: null,
};

export function useGeniusAmbient() {
  const { organizationId } = useOrganization();
  const qc = useQueryClient();

  // ── Preferences ─────────────────────────────────────────
  const prefsQuery = useQuery({
    queryKey: ["copilot-prefs"],
    queryFn: async (): Promise<CopilotPreferences> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_PREFS;
      const { data } = await fromTable("copilot_user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data ? { ...DEFAULT_PREFS, ...data } : DEFAULT_PREFS;
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Suggestions ─────────────────────────────────────────
  const suggestionsQuery = useQuery({
    queryKey: ["copilot-suggestions-ambient", organizationId],
    queryFn: async (): Promise<CopilotSuggestion[]> => {
      if (!organizationId) return [];
      const { data } = await fromTable("copilot_suggestions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("confidence_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as CopilotSuggestion[];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });

  // ── User name for greeting ──────────────────────────────
  const profileQuery = useQuery({
    queryKey: ["copilot-profile-name"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await fromTable("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();
      return data?.first_name as string | null;
    },
    staleTime: 30 * 60 * 1000,
  });

  // ── Derived state ───────────────────────────────────────
  const suggestions = suggestionsQuery.data ?? [];
  const unreadCount = useMemo(
    () => suggestions.filter((s) => !s.shown_at && !s.dismissed_at).length,
    [suggestions]
  );
  const hasUrgent = useMemo(
    () => suggestions.some((s) => s.suggestion_type === "urgent" && !s.shown_at),
    [suggestions]
  );

  // ── Mutations ───────────────────────────────────────────
  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      await fromTable("copilot_suggestions")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["copilot-suggestions-ambient"] });
      const prev = qc.getQueryData<CopilotSuggestion[]>(["copilot-suggestions-ambient", organizationId]);
      qc.setQueryData(
        ["copilot-suggestions-ambient", organizationId],
        (old: CopilotSuggestion[] | undefined) =>
          (old ?? []).filter((s) => s.id !== id)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["copilot-suggestions-ambient", organizationId], ctx.prev);
    },
  });

  const markShownMutation = useMutation({
    mutationFn: async (id: string) => {
      await fromTable("copilot_suggestions")
        .update({ shown_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["copilot-suggestions-ambient"] }),
  });

  const markActionedMutation = useMutation({
    mutationFn: async (id: string) => {
      await fromTable("copilot_suggestions")
        .update({ acted_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["copilot-suggestions-ambient"] }),
  });

  // ── Realtime subscription ───────────────────────────────
  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel("copilot-suggestions-rt")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "copilot_suggestions",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["copilot-suggestions-ambient"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, qc]);

  return {
    suggestions,
    unreadCount,
    hasUrgent,
    isLoading: suggestionsQuery.isLoading,
    preferences: prefsQuery.data ?? DEFAULT_PREFS,
    userName: profileQuery.data ?? null,
    dismiss: (id: string) => dismissMutation.mutate(id),
    markShown: (id: string) => markShownMutation.mutate(id),
    markActioned: (id: string) => markActionedMutation.mutate(id),
  };
}
