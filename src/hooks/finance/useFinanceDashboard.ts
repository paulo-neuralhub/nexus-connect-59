import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface FinanceDashboardKPIs {
  invoicedThisMonth: number;
  collectedThisMonth: number;
  pendingCollection: number;
  overdueCount: number;
}

export interface MonthlyRevenueExpense {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
}

export interface ServiceTypeBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface UrgentInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  paid_amount: number;
  due_date: string;
  status: string;
  days_overdue: number; // negative = days remaining
}

export interface MatterProfitability {
  matter_id: string;
  reference: string;
  title: string;
  invoiced: number;
  hours_cost: number;
  expenses: number;
  margin: number;
  margin_pct: number;
}

export function useFinanceDashboardKPIs() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-dashboard-kpis', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization!.id;
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const today = now.toISOString().split('T')[0];

      // Invoiced this month
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('organization_id', orgId)
        .gte('invoice_date', monthStart)
        .not('status', 'eq', 'cancelled');

      // Collected this month
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('paid_amount')
        .eq('organization_id', orgId)
        .eq('status', 'paid')
        .gte('paid_date', monthStart);

      // Pending collection
      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('total, paid_amount')
        .eq('organization_id', orgId)
        .in('status', ['sent', 'viewed', 'partial', 'overdue']);

      // Overdue count
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('organization_id', orgId)
        .not('status', 'in', '("paid","cancelled","draft")')
        .lt('due_date', today);

      const result: FinanceDashboardKPIs = {
        invoicedThisMonth: monthInvoices?.reduce((s, i) => s + (i.total || 0), 0) || 0,
        collectedThisMonth: paidInvoices?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0,
        pendingCollection: pendingInvoices?.reduce((s, i) => s + ((i.total || 0) - (i.paid_amount || 0)), 0) || 0,
        overdueCount: overdueInvoices?.length || 0,
      };
      return result;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useRevenueVsExpenses() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-revenue-expenses', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization!.id;
      const months: MonthlyRevenueExpense[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('es-ES', { month: 'short' });

        const { data: rev } = await supabase
          .from('invoices')
          .select('paid_amount')
          .eq('organization_id', orgId)
          .eq('status', 'paid')
          .gte('paid_date', start)
          .lte('paid_date', endStr);

        const { data: exp } = await supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', orgId)
          .gte('expense_date', start)
          .lte('expense_date', endStr);

        months.push({
          month: start,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          revenue: rev?.reduce((s, r) => s + (r.paid_amount || 0), 0) || 0,
          expenses: exp?.reduce((s, e) => s + (e.amount || 0), 0) || 0,
        });
      }
      return months;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useServiceTypeBreakdown() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-service-breakdown', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization!.id;
      const yearStart = `${new Date().getFullYear()}-01-01`;

      const { data: items } = await supabase
        .from('invoice_items')
        .select('line_type, subtotal, invoice:invoices!inner(organization_id, invoice_date, status)')
        .gte('invoice.invoice_date', yearStart)
        .not('invoice.status', 'eq', 'cancelled');

      // Filter by org (since we can't nest eq on joins easily)
      const orgItems = (items || []).filter((i: any) => i.invoice?.organization_id === orgId);

      const groups: Record<string, number> = {};
      orgItems.forEach((item: any) => {
        const type = item.line_type || 'service';
        groups[type] = (groups[type] || 0) + (item.subtotal || 0);
      });

      const colorMap: Record<string, string> = {
        service: '#8B5CF6',
        official_fee: '#3B82F6',
        expense: '#F59E0B',
        discount: '#EF4444',
      };
      const nameMap: Record<string, string> = {
        service: 'Honorarios',
        official_fee: 'Tasas oficiales',
        expense: 'Gastos',
        discount: 'Descuentos',
      };

      return Object.entries(groups)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: nameMap[key] || key,
          value,
          color: colorMap[key] || '#6B7280',
        })) as ServiceTypeBreakdown[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUrgentInvoices() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-urgent-invoices', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization!.id;
      const today = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);

      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total, paid_amount, due_date, status')
        .eq('organization_id', orgId)
        .not('status', 'in', '("paid","cancelled","draft")')
        .lte('due_date', soon.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      return (data || []).map(inv => {
        const due = new Date(inv.due_date);
        const diffMs = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          ...inv,
          paid_amount: inv.paid_amount || 0,
          days_overdue: -diffDays, // positive = overdue, negative = days remaining
        } as UrgentInvoice;
      });
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useMatterProfitability() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-profitability', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization!.id;
      const now = new Date();
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const qStart = quarterStart.toISOString().split('T')[0];

      // Get invoices this quarter with matter linkage
      const { data: invoices } = await supabase
        .from('invoices')
        .select('matter_id, total')
        .eq('organization_id', orgId)
        .not('status', 'eq', 'cancelled')
        .not('matter_id', 'is', null)
        .gte('invoice_date', qStart);

      // Get time entries this quarter
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('matter_id, total_amount')
        .eq('organization_id', orgId)
        .gte('date', qStart);

      // Get expenses this quarter
      const { data: expenses } = await supabase
        .from('expenses')
        .select('matter_id, amount')
        .eq('organization_id', orgId)
        .not('matter_id', 'is', null)
        .gte('expense_date', qStart);

      // Aggregate by matter
      const matterMap = new Map<string, { invoiced: number; hours_cost: number; expenses: number }>();

      (invoices || []).forEach((inv: any) => {
        if (!inv.matter_id) return;
        const m = matterMap.get(inv.matter_id) || { invoiced: 0, hours_cost: 0, expenses: 0 };
        m.invoiced += inv.total || 0;
        matterMap.set(inv.matter_id, m);
      });

      (timeEntries || []).forEach((te: any) => {
        if (!te.matter_id) return;
        const m = matterMap.get(te.matter_id) || { invoiced: 0, hours_cost: 0, expenses: 0 };
        m.hours_cost += te.total_amount || 0;
        matterMap.set(te.matter_id, m);
      });

      (expenses || []).forEach((ex: any) => {
        if (!ex.matter_id) return;
        const m = matterMap.get(ex.matter_id) || { invoiced: 0, hours_cost: 0, expenses: 0 };
        m.expenses += ex.amount || 0;
        matterMap.set(ex.matter_id, m);
      });

      if (matterMap.size === 0) return [];

      // Fetch matter references
      const matterIds = Array.from(matterMap.keys());
      const { data: matters } = await supabase
        .from('matters')
        .select('id, reference, title')
        .in('id', matterIds.slice(0, 50));

      const matterInfo = new Map((matters || []).map(m => [m.id, m]));

      const results: MatterProfitability[] = [];
      matterMap.forEach((val, matterId) => {
        const info = matterInfo.get(matterId);
        const margin = val.invoiced - val.hours_cost - val.expenses;
        results.push({
          matter_id: matterId,
          reference: info?.reference || matterId.slice(0, 8),
          title: info?.title || '',
          invoiced: val.invoiced,
          hours_cost: val.hours_cost,
          expenses: val.expenses,
          margin,
          margin_pct: val.invoiced > 0 ? (margin / val.invoiced) * 100 : 0,
        });
      });

      return results.sort((a, b) => b.margin - a.margin).slice(0, 10);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}
