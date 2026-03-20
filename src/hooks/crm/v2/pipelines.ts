// ============================================================
// IP-NEXUS CRM V2 — Pipelines hooks (crm_pipelines + crm_pipeline_stages)
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import type { CRMPipeline, CRMPipelineStage } from "./types";

export function useCRMPipelines() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-pipelines", organizationId],
    queryFn: async () => {
      if (!organizationId) return [] as CRMPipeline[];

      const { data, error } = await fromTable("crm_pipelines")
        .select(`
          id, organization_id, name, description, pipeline_type,
          is_default, is_active, position, created_at, updated_at,
          stages:crm_pipeline_stages(id, pipeline_id, name, color, probability, position, is_won_stage, is_lost_stage, created_at)
        `)
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;

      return ((data ?? []) as CRMPipeline[]).map((p) => ({
        ...p,
        stages: (p.stages ?? []).slice().sort((a, b) => a.position - b.position),
      }));
    },
    enabled: !!organizationId,
    staleTime: 5 * 60_000,
  });
}

/** Get stages grouped by pipeline for quick lookup */
export function useStagesByPipeline() {
  const { data: pipelines = [], ...rest } = useCRMPipelines();
  const stagesByPipeline: Record<string, CRMPipelineStage[]> = {};
  for (const p of pipelines) {
    stagesByPipeline[p.id] = p.stages ?? [];
  }
  return { pipelines, stagesByPipeline, ...rest };
}
