/**
 * DealOriginCard — Shows the CRM deal linked to a matter (in sidebar)
 */

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface Props {
  matterId: string;
}

function formatEUR(amount?: number | null) {
  if (amount == null) return null;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

export function DealOriginCard({ matterId }: Props) {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();

  const { data: deal } = useQuery({
    queryKey: ["matter-linked-deal", matterId, organizationId],
    queryFn: async () => {
      if (!organizationId || !matterId) return null;
      const { data, error } = await fromTable("crm_deals")
        .select(`
          id, name, stage, amount_eur,
          pipeline:crm_pipelines!pipeline_id(id, name),
          pipeline_stage:crm_pipeline_stages!pipeline_stage_id(id, name, color)
        `)
        .eq("matter_id", matterId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && !!matterId,
  });

  if (!deal) return null;

  const stageColor = (deal as any).pipeline_stage?.color ?? "#64748B";
  const stageName = (deal as any).pipeline_stage?.name ?? deal.stage ?? "—";
  const pipelineName = (deal as any).pipeline?.name ?? "Pipeline";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
      style={{ borderLeftColor: stageColor }}
      onClick={() => navigate(`/app/crm/v2/deals/${deal.id}`)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wide">Deal origen</span>
        </div>
        <p className="font-semibold text-sm">{deal.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className="text-[10px]"
            style={{
              backgroundColor: `${stageColor}20`,
              color: stageColor,
              border: `1px solid ${stageColor}30`,
            }}
          >
            {stageName}
          </Badge>
          <span className="text-xs text-muted-foreground">{pipelineName}</span>
          {formatEUR(deal.amount_eur) && (
            <span className="text-xs font-mono font-semibold text-emerald-600">
              {formatEUR(deal.amount_eur)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
