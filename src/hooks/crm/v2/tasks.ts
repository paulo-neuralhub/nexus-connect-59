// ============================================================
// IP-NEXUS CRM V2 — Tasks hooks (crm_tasks)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMTask } from "./types";

export function useCRMTasks(filters?: { account_id?: string; deal_id?: string; status?: string | string[] }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-tasks", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as CRMTask[];
      let query = fromTable("crm_tasks")
        .select(`
          id, organization_id, account_id, contact_id, deal_id,
          title, description, status, priority, due_date,
          completed_at, assigned_to, created_by, created_at,
          account:crm_accounts!account_id(id, name),
          contact:crm_contacts!contact_id(id, full_name),
          deal:crm_deals!deal_id(id, name)
        `)
        .eq("organization_id", organizationId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters?.account_id) query = query.eq("account_id", filters.account_id);
      if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in("status", statuses);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CRMTask[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateCRMTask() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await fromTable("crm_tasks")
        .insert({
          ...task,
          organization_id: organizationId,
          created_by: task.created_by || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Tarea creada" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear tarea", description: msg, variant: "destructive" });
    },
  });
}

export function useCompleteCRMTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await fromTable("crm_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Tarea completada" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al completar tarea", description: msg, variant: "destructive" });
    },
  });
}
