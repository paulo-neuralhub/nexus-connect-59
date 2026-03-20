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

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const [accountsRes, contactsRes, leadsRes, dealsRes, tasksRes] = await Promise.all([
        fromTable("crm_accounts")
          .select("id, is_active, health_score", { count: "exact" })
          .eq("organization_id", organizationId),
        fromTable("crm_contacts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
        fromTable("crm_leads")
          .select("id, lead_score, lead_status, converted_at")
          .eq("organization_id", organizationId),
        fromTable("crm_deals")
          .select(`
            id, amount_eur, amount, weighted_amount, expected_close_date, 
            created_at, actual_close_date,
            pipeline_stage:crm_pipeline_stages!pipeline_stage_id(is_won_stage, is_lost_stage)
          `)
          .eq("organization_id", organizationId),
        fromTable("crm_tasks")
          .select("id, status", { count: "exact" })
          .eq("organization_id", organizationId)
          .in("status", ["pending", "in_progress"]),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const accounts = accountsRes.data ?? [];
      const activeAccounts = accounts.filter((a: any) => a.is_active).length;
      const atRisk = accounts.filter((a: any) => (a.health_score ?? 100) < 50).length;

      const leads = leadsRes.data ?? [];
      const unconvertedLeads = leads.filter((l: any) => !l.converted_at);
      const hotLeads = unconvertedLeads.filter((l: any) => (l.lead_score ?? 0) >= 80).length;
      const convertedLeads = leads.filter((l: any) => l.converted_at);
      const leadConversionRate = leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0;

      const deals = dealsRes.data ?? [];
      const openDeals = deals.filter((d: any) => !d.pipeline_stage?.is_won_stage && !d.pipeline_stage?.is_lost_stage);
      const totalPipelineValue = openDeals.reduce((s: number, d: any) => s + (d.amount_eur ?? d.amount ?? 0), 0);
      const weightedPipelineValue = openDeals.reduce((s: number, d: any) => s + (d.weighted_amount ?? 0), 0);

      const closingThisMonth = openDeals.filter((d: any) => {
        const close = d.expected_close_date;
        return close && close >= monthStart.split("T")[0] && close < monthEnd.split("T")[0];
      }).length;

      const wonDeals = deals.filter((d: any) => d.pipeline_stage?.is_won_stage);
      const lostDeals = deals.filter((d: any) => d.pipeline_stage?.is_lost_stage);
      const closedTotal = wonDeals.length + lostDeals.length;
      const winRate = closedTotal > 0 ? Math.round((wonDeals.length / closedTotal) * 100) : 0;

      return {
        active_accounts: activeAccounts,
        total_pipeline_eur: totalPipelineValue,
        deals_this_month: closingThisMonth,
        activities_today: 0,
        // Extended KPIs
        total_accounts: accounts.length,
        total_contacts: contactsRes.count ?? 0,
        total_leads: unconvertedLeads.length,
        hot_leads: hotLeads,
        total_pipeline_value: totalPipelineValue,
        weighted_pipeline_value: weightedPipelineValue,
        deals_closing_this_month: closingThisMonth,
        pending_tasks: tasksRes.count ?? 0,
        at_risk_accounts: atRisk,
        win_rate: winRate,
        lead_conversion_rate: leadConversionRate,
      };
    },
    enabled: !!organizationId,
    refetchInterval: 5 * 60_000,
  });
}
