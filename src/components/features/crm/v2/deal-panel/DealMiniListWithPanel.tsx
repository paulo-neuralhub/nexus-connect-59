import { useMemo, useState } from "react";
import { DealKanbanCard } from "@/components/features/crm/v2/kanban/deal-kanban-card";
import { DealFormModal } from "@/components/features/crm/v2/DealFormModal";
import { useCRMPipelines } from "@/hooks/crm/v2/pipelines";
import type { CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import { DealDetailPanel } from "./DealDetailPanel";

type Deal = {
  id: string;
  name?: string | null;
  stage?: string | null;
  stage_id?: string | null;
  pipeline_id?: string | null;
  amount?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  account?: { id: string; name?: string | null } | null;
  contact?: { id: string; full_name?: string | null; email?: string | null; phone?: string | null } | null;
  owner?: { id: string; full_name?: string | null } | null;
};

type Props = {
  deals: Deal[];
  emptyLabel?: string;
};

export function DealMiniListWithPanel({ deals, emptyLabel = "Sin deals" }: Props) {
  const { data: pipelines = [] } = useCRMPipelines();

  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editDealId, setEditDealId] = useState<string | null>(null);

  const selectedDeal = useMemo(() => deals.find((d) => d.id === selectedDealId) ?? null, [deals, selectedDealId]);

  const stages: CRMPipelineStage[] = useMemo(() => {
    const pid = selectedDeal?.pipeline_id;
    if (!pid) return [];
    return (pipelines.find((p) => p.id === pid)?.stages ?? []) as CRMPipelineStage[];
  }, [pipelines, selectedDeal?.pipeline_id]);

  return (
    <>
      {deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {deals.map((d) => (
            <DealKanbanCard
              key={d.id}
              deal={{
                id: d.id,
                name: d.name ?? d.id,
                organization_id: "",
                account_id: null,
                contact_id: null,
                owner_id: null,
                assigned_to: null,
                stage: d.stage ?? null,
                pipeline_id: d.pipeline_id ?? null,
                pipeline_stage_id: d.stage_id ?? null,
                deal_type: null,
                opportunity_type: null,
                jurisdiction_code: null,
                nice_classes: null,
                amount: d.amount ?? null,
                amount_eur: null,
                weighted_amount: null,
                official_fees_eur: null,
                professional_fees_eur: null,
                probability_pct: d.probability ?? null,
                expected_close_date: d.expected_close_date ?? null,
                actual_close_date: null,
                stage_entered_at: null,
                stage_history: [],
                close_reason: null,
                lost_reason: null,
                lost_to_competitor: null,
                matter_id: null,
                account_name_cache: d.account?.name ?? null,
                created_at: d.created_at ?? "",
                updated_at: d.updated_at ?? "",
                account: d.account ? { id: d.account.id, name: d.account.name ?? "" } : null,
              }}
              onClick={() => {
                setSelectedDealId(d.id);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <DealDetailPanel
        deal={selectedDeal}
        open={open}
        onClose={() => setOpen(false)}
        stages={stages}
        onEdit={(dealId) => {
          setOpen(false);
          setEditDealId(dealId);
        }}
      />

      <DealFormModal
        open={editDealId !== null}
        onClose={() => setEditDealId(null)}
        dealId={editDealId}
        defaultAccountId={selectedDeal?.account?.id}
        defaultPipelineId={selectedDeal?.pipeline_id ?? undefined}
        defaultStageId={selectedDeal?.stage_id ?? undefined}
      />
    </>
  );
}
