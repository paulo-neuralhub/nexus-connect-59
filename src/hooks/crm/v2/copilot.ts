// ============================================================
// IP-NEXUS CRM V2 — IP-CoPilot hook
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";

export interface CoPilotSuggestion {
  id: string;
  suggestion_type: "urgent" | "opportunity" | "insight" | "draft_text";
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  action_label: string | null;
  action_type: string | null;
  action_data: Record<string, unknown>;
  related_matter_id: string | null;
  related_deadline_id: string | null;
  is_dismissed: boolean;
  is_actioned: boolean;
  generated_at: string;
  expires_at: string;
}

export function useIPCoPilot(contextType: string, contextId: string | undefined) {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({
    queryKey: ["copilot-suggestions", contextType, contextId],
    queryFn: async (): Promise<CoPilotSuggestion[]> => {
      if (!organizationId || !contextId) return [];
      const { data } = await fromTable("crm_ai_suggestions")
        .select("*")
        .eq("context_type", contextType)
        .eq("context_id", contextId)
        .eq("organization_id", organizationId)
        .eq("is_dismissed", false)
        .gt("expires_at", new Date().toISOString())
        .order("priority", { ascending: true })
      .limit(4);
      return (data ?? []) as CoPilotSuggestion[];
    },
    enabled: !!organizationId && !!contextId && contextType !== "email_draft",
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const generateMutation = useMutation({
    mutationFn: async (forceRegenerate = false) => {
      if (!organizationId || !contextId) throw new Error("Missing context");
      const { data, error } = await supabase.functions.invoke("crm-copilot", {
        body: {
          context_type: contextType,
          context_id: contextId,
          organization_id: organizationId,
          force_regenerate: forceRegenerate,
        },
      });
      if (error) throw error;
      return data as { suggestions: CoPilotSuggestion[]; from_cache: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copilot-suggestions", contextType, contextId] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await fromTable("crm_ai_suggestions")
        .update({ is_dismissed: true })
        .eq("id", suggestionId);
      if (error) throw error;
    },
    onMutate: async (suggestionId) => {
      await queryClient.cancelQueries({ queryKey: ["copilot-suggestions", contextType, contextId] });
      const prev = queryClient.getQueryData<CoPilotSuggestion[]>(["copilot-suggestions", contextType, contextId]);
      queryClient.setQueryData(
        ["copilot-suggestions", contextType, contextId],
        (old: CoPilotSuggestion[] | undefined) => (old ?? []).filter((s) => s.id !== suggestionId)
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["copilot-suggestions", contextType, contextId], context.prev);
      }
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await fromTable("crm_ai_suggestions")
        .update({ is_actioned: true })
        .eq("id", suggestionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copilot-suggestions", contextType, contextId] });
    },
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoading: suggestionsQuery.isLoading,
    isGenerating: generateMutation.isPending,
    error: suggestionsQuery.error || generateMutation.error,
    lastUpdated: suggestionsQuery.dataUpdatedAt,
    generate: (force?: boolean) => generateMutation.mutate(force ?? false),
    dismiss: (id: string) => dismissMutation.mutate(id),
    markActioned: (id: string) => actionMutation.mutate(id),
  };
}

export function useGenerateEmailDraft() {
  return useMutation({
    mutationFn: async (params: {
      accountName: string;
      contactName: string;
      context: string;
      organizationId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("crm-copilot", {
        body: {
          context_type: "email_draft",
          context_id: params.organizationId,
          organization_id: params.organizationId,
          force_regenerate: true,
          draft_context: {
            account_name: params.accountName,
            contact_name: params.contactName,
            context: params.context,
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });
}
