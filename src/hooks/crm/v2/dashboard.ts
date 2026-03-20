// ============================================================
// IP-NEXUS CRM V2 — Dashboard KPIs (real crm_* tables)
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import type { CRMDashboardKPIs } from "./types";

export function useCRMDashboardKPIs() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-dashboard-kpis", organizationId],
    queryFn: async (): Promise<CRMDashboardKPIs> => {
      if (!organizationId) throw new Error("Missing organizationId");

      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [accountsRes, dealsRes, activitiesRes] = await Promise.all([
        fromTable("crm_accounts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_active", true),
        fromTable("crm_deals")
          .select("id, amount_eur, amount, expected_close_date, created_at")
          .eq("organization_id", organizationId),
        fromTable("crm_activities")
          .select("id, activity_date")
          .eq("organization_id", organizationId)
          .gte("activity_date", today + "T00:00:00")
          .lte("activity_date", today + "T23:59:59"),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      const deals = dealsRes.data ?? [];
      const totalPipeline = deals.reduce((s, d) => s + (d.amount_eur ?? d.amount ?? 0), 0);
      const dealsThisMonth = deals.filter((d) => {
        const c = d.created_at?.split("T")[0] ?? "";
        return c >= monthStart.toISOString().split("T")[0] && c < monthEnd.toISOString().split("T")[0];
      }).length;

      return {
        active_accounts: accountsRes.count ?? 0,
        total_pipeline_eur: totalPipeline,
        deals_this_month: dealsThisMonth,
        activities_today: (activitiesRes.data ?? []).length,
      };
    },
    enabled: !!organizationId,
    refetchInterval: 5 * 60_000,
  });
}
