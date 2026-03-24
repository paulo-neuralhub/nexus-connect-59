// ============================================================
// IP-NEXUS CRM V2 — Activities hooks (crm_activities)
// ============================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMActivity, ActivityFilters } from "./types";

const PAGE_SIZE = 20;

export function useCRMActivities(filters?: ActivityFilters) {
  const { organizationId } = useOrganization();

  return useInfiniteQuery({
    queryKey: ["crm-activities", organizationId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { items: [] as CRMActivity[], nextOffset: null };

      let query = fromTable("crm_activities")
        .select(`
          id, organization_id, account_id, contact_id, deal_id,
          activity_type, subject, description, activity_date,
          duration_minutes, outcome, next_action, next_action_date,
          created_by, created_at,
          account:crm_accounts!account_id(id, name),
          contact:crm_contacts!contact_id(id, full_name),
          deal:crm_deals!deal_id(id, name)
        `)
        .eq("organization_id", organizationId)
        .order("activity_date", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (filters?.account_id) query = query.eq("account_id", filters.account_id);
      if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id);
      if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);
      if (filters?.activity_type) query = query.eq("activity_type", filters.activity_type);
      if (filters?.date_from) query = query.gte("activity_date", filters.date_from);
      if (filters?.date_to) query = query.lte("activity_date", filters.date_to);

      const { data, error } = await query;
      if (error) throw error;
      const items = (data ?? []) as CRMActivity[];
      return {
        items,
        nextOffset: items.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!organizationId,
  });
}

/** Flat list helper for simpler consumers */
export function useCRMActivitiesFlat(filters?: ActivityFilters) {
  const result = useCRMActivities(filters);
  const activities = result.data?.pages.flatMap((p) => p.items) ?? [];
  return {
    activities,
    loadMore: result.fetchNextPage,
    hasMore: result.hasNextPage ?? false,
    isLoading: result.isLoading,
    isFetchingNextPage: result.isFetchingNextPage,
  };
}

export function useCreateCRMActivity() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (activity: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await fromTable("crm_activities")
        .insert({
          ...activity,
          organization_id: organizationId,
          created_by: activity.created_by || user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // If next_action is set, auto-create a task
      if (activity.next_action && activity.next_action_date) {
        await fromTable("crm_tasks").insert({
          organization_id: organizationId,
          account_id: activity.account_id ?? null,
          contact_id: activity.contact_id ?? null,
          deal_id: activity.deal_id ?? null,
          title: activity.next_action as string,
          due_date: activity.next_action_date,
          status: "pending",
          priority: "medium",
          assigned_to: user?.id,
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["crm-account"] });
      toast({ title: "Actividad registrada" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al registrar actividad", description: msg, variant: "destructive" });
    },
  });
}
