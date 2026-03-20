/**
 * CRM Account Detail — Tab: Deals
 */

import { DealMiniListWithPanel } from "@/components/features/crm/v2/deal-panel/DealMiniListWithPanel";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";

interface Deal {
  id: string;
  name?: string | null;
  stage?: string | null;
  stage_id?: string | null;
  pipeline_id?: string | null;
  amount?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  created_at?: string | null;
  account?: { id: string; name?: string | null } | null;
  contact?: { id: string; full_name?: string | null } | null;
  owner?: { id: string; full_name?: string | null } | null;
}

interface Props {
  deals: Deal[];
  onAddDeal?: () => void;
}

export function AccountDealsTab({ deals, onAddDeal }: Props) {
  const totalAmount = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm text-muted-foreground">{deals.length} deal(s)</h3>
          {totalAmount > 0 && (
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              €{totalAmount.toLocaleString()}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={onAddDeal}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Deal
        </Button>
      </div>

      <DealMiniListWithPanel deals={deals} emptyLabel="Sin deals para esta cuenta" />
    </div>
  );
}
