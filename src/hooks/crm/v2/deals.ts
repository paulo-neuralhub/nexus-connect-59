// ============================================================
// IP-NEXUS CRM V2 — Deals hooks (crm_deals)
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMDeal, DealFilters, CRMPipelineStage } from "./types";

export function useCRMDeals(filters?: DealFilters) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-deals", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as CRMDeal[];
      let query = fromTable("crm_deals")
        .select(`
          id, organization_id, account_id, name, stage,
          pipeline_id, pipeline_stage_id, deal_type, opportunity_type,
          jurisdiction_code, nice_classes, amount, amount_eur,
          weighted_amount, official_fees_eur, professional_fees_eur,
          probability_pct, expected_close_date, actual_close_date,
          lost_reason, matter_id, account_name_cache, assigned_to,
          created_at, updated_at,
          account:crm_accounts!account_id(id, name),
          contact:crm_contacts!contact_id(id, full_name),
          pipeline_stage:crm_pipeline_stages!pipeline_stage_id(id, name, color, probability, is_won_stage, is_lost_stage)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (filters?.pipeline_id) query = query.eq("pipeline_id", filters.pipeline_id);
      if (filters?.pipeline_stage_id) query = query.eq("pipeline_stage_id", filters.pipeline_stage_id);
      if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to);
      if (filters?.account_id) query = query.eq("account_id", filters.account_id);
      if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id);
      if (filters?.deal_type) query = query.eq("deal_type", filters.deal_type);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CRMDeal[];
    },
    enabled: !!organizationId,
  });
}

/** Group deals by pipeline_stage_id for Kanban view */
export function useDealsByStage(pipelineId: string | undefined, stages: CRMPipelineStage[]) {
  const { data: deals = [], ...rest } = useCRMDeals(pipelineId ? { pipeline_id: pipelineId } : undefined);

  const dealsByStage: Record<string, CRMDeal[]> = {};
  for (const s of stages) {
    dealsByStage[s.id] = [];
  }
  for (const deal of deals) {
    const sid = deal.pipeline_stage_id;
    if (sid && dealsByStage[sid]) {
      dealsByStage[sid].push(deal);
    }
  }

  const totalValue = deals.reduce((s, d) => s + (d.amount_eur ?? d.amount ?? 0), 0);
  const closedWon = deals.filter((d) => d.pipeline_stage?.is_won_stage);
  const closedAll = deals.filter((d) => d.pipeline_stage?.is_won_stage || d.pipeline_stage?.is_lost_stage);
  const winRate = closedAll.length > 0 ? Math.round((closedWon.length / closedAll.length) * 100) : 0;

  return {
    deals,
    dealsByStage,
    kpis: { totalDeals: deals.length, totalValue, winRate },
    ...rest,
  };
}

export function useCreateCRMDeal() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (deal: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await fromTable("crm_deals")
        .insert({
          ...deal,
          organization_id: organizationId,
          assigned_to: deal.assigned_to || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Deal creado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear deal", description: msg, variant: "destructive" });
    },
  });
}

export function useUpdateCRMDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { id: string; data: Record<string, unknown> }) => {
      const { data, error } = await fromTable("crm_deals")
        .update({ ...params.data, updated_at: new Date().toISOString() })
        .eq("id", params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Deal actualizado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al actualizar deal", description: msg, variant: "destructive" });
    },
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { dealId: string; newStageId: string; lostReason?: string }) => {
      // Fetch target stage info
      const { data: targetStage, error: stageErr } = await fromTable("crm_pipeline_stages")
        .select("id, name, probability, is_won_stage, is_lost_stage")
        .eq("id", params.newStageId)
        .single();
      if (stageErr) throw stageErr;

      const updates: Record<string, unknown> = {
        pipeline_stage_id: params.newStageId,
        stage: targetStage.name,
        probability_pct: targetStage.probability,
        stage_entered_at: new Date().toISOString(),
      };

      if (targetStage.is_won_stage) {
        updates.actual_close_date = new Date().toISOString();
      } else if (targetStage.is_lost_stage) {
        updates.actual_close_date = new Date().toISOString();
        updates.lost_reason = params.lostReason ?? null;
      }

      const { data, error } = await fromTable("crm_deals")
        .update(updates)
        .eq("id", params.dealId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Deal movido de etapa" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al mover deal", description: msg, variant: "destructive" });
    },
  });
}

/** Compat alias for consumers that use the old name */
export const useUpdateDealStage = useMoveDealStage;

export function useDeleteCRMDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await fromTable("crm_deals").delete().eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Deal eliminado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al eliminar deal", description: msg, variant: "destructive" });
    },
  });
}
