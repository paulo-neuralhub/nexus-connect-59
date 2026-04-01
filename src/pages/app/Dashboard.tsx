// =============================================
// Dashboard Principal — Enhanced Command Center
// KPI Cards + Próximos 7 Días + Activity + Quick Access
// =============================================

import { useDashboardHome } from '@/hooks/use-dashboard-home';
import { useDashboardMetrics } from '@/components/dashboard/MetricsBar';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';
import { useApprovalsCount } from '@/hooks/use-approvals';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import {
  UrgentBadges,
  AgendaToday,
  MiniCalendar,
  UpcomingDeadlinesList,
  ExpedientesTiposChart,
  FacturacionEvolucionChart,
  PipelineChart,
  RecentActivityFeed,
  DashboardKPICards,
  Proximos7Dias,
  QuickAccessGrid,
} from '@/components/dashboard/CommandCenter';
import type { Deadline7d } from '@/components/dashboard/CommandCenter';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data, isLoading } = useDashboardHome();
  const { metrics } = useDashboardMetrics();
  const { data: countsData } = useApprovalsCount();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // ── Enhanced queries for KPI cards ──────────────────
  // Spider alerts (high + critical, status=new)
  const { data: spiderCount } = useQuery({
    queryKey: ['dashboard-spider-alerts', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('spider_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('status', 'new')
        .in('severity', ['high', 'critical']);
      return count ?? 0;
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  // Active matters (not closed/abandoned)
  const { data: mattersCount } = useQuery({
    queryKey: ['dashboard-active-matters', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('matters')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .not('status', 'in', '("closed","abandoned")');
      return count ?? 0;
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  // Pending tasks for current user
  const { data: tasksCount } = useQuery({
    queryKey: ['dashboard-my-tasks', orgId, user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('status', 'pending')
        .eq('assigned_to', user!.id);
      return count ?? 0;
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 30000,
  });

  // Próximos 7 días deadlines with full join data
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deadlines7d, isLoading: loadingDeadlines7d } = useQuery({
    queryKey: ['dashboard-7d-deadlines', orgId],
    queryFn: async () => {
      // Fetch deadlines ≤ 7 days (including overdue)
      const { data: rows } = await supabase
        .from('matter_deadlines')
        .select(`
          id, deadline_type, title, deadline_date, status, priority,
          matter_id,
          matters!inner(id, reference, title, ip_type, jurisdiction_code, crm_account_id)
        `)
        .eq('organization_id', orgId!)
        .neq('status', 'completed')
        .lte('deadline_date', sevenDaysFromNow)
        .order('deadline_date', { ascending: true })
        .limit(20);

      if (!rows) return [];

      // Fetch client names for crm_account_ids
      const accountIds = [...new Set(
        rows
          .map((r: any) => r.matters?.crm_account_id)
          .filter(Boolean)
      )];

      let clientMap: Record<string, string> = {};
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('crm_accounts')
          .select('id, name')
          .in('id', accountIds);
        if (accounts) {
          clientMap = Object.fromEntries(accounts.map((a: any) => [a.id, a.name]));
        }
      }

      return rows.map((r: any): Deadline7d => ({
        id: r.id,
        title: r.title || 'Plazo',
        deadlineDate: r.deadline_date,
        deadlineType: r.deadline_type || 'internal',
        priority: r.priority || 'medium',
        matterRef: r.matters?.reference,
        matterId: r.matters?.id,
        clientName: r.matters?.crm_account_id ? clientMap[r.matters.crm_account_id] : undefined,
        jurisdictionCode: r.matters?.jurisdiction_code,
      }));
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  // Count plazos < 7 days for KPI
  const plazosUrgentes = deadlines7d?.filter(d => !['completed'].includes(d.priority)).length ?? 0;

  // Derive values from data
  const deadlines = data?.deadlines ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const mattersByPhase = data?.mattersByPhase ?? [];

  // Count plazos this week for header
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const plazosEstaSemana = deadlines.filter(d => {
    const due = new Date(d.dueDate);
    return due >= now && due <= weekEnd;
  }).length;

  // Map deadlines for UpcomingDeadlinesList
  const upcomingDeadlineItems = deadlines.map(d => ({
    id: d.id,
    titulo: d.title,
    expediente: d.matterRef || '',
    fecha: new Date(d.dueDate),
    oficina: d.office || '',
    matterId: d.matterId,
  }));

  // Map activities for RecentActivityFeed
  const activityItems = recentActivity.map(a => ({
    id: a.id,
    type: a.type,
    titulo: a.title,
    usuario: a.userName,
    tiempo: new Date(a.timestamp),
    link: a.link,
  }));

  // Facturacion chart data
  const facturacionData = [
    { mes: 'Ene', valor: 0 },
    { mes: 'Feb', valor: 0 },
    { mes: 'Mar', valor: 0 },
    { mes: 'Abr', valor: 0 },
    { mes: 'May', valor: 0 },
    { mes: 'Jun', valor: 0 },
  ];

  // Expedientes por tipo
  const expedientesTipos = mattersByPhase
    .filter(p => p.count > 0)
    .map(p => ({ tipo: p.nombre, count: p.count, color: p.color }));

  // Pipeline data
  const pipelineData = mattersByPhase.map(p => ({
    fase: p.fase, nombre: p.nombre, count: p.count, color: p.color, max: p.max,
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-80 rounded-xl" />
          <Skeleton className="col-span-5 h-80 rounded-xl" />
          <Skeleton className="col-span-3 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HEADER ─────────────────────────────── */}
      <DashboardWelcomeHeader plazosEstaSemana={plazosEstaSemana} />

      {/* ── KPI CARDS (Section 1) ──────────────── */}
      <DashboardKPICards
        plazosUrgentes={plazosUrgentes}
        alertasSpider={spiderCount ?? 0}
        expedientesActivos={mattersCount ?? data?.totalMatters ?? 0}
        misTareas={tasksCount ?? 0}
      />

      {/* ── PRÓXIMOS 7 DÍAS (Section 2) ────────── */}
      <Proximos7Dias
        deadlines={deadlines7d ?? []}
        isLoading={loadingDeadlines7d}
      />

      {/* ── URGENT BADGES (existing, shown if needed) */}
      <UrgentBadges
        plazosHoy={data?.upcomingDeadlines ?? 0}
        expedientesUrgentes={0}
        alertasSpider={(data?.criticalAlerts ?? 0) + (data?.highAlerts ?? 0)}
        plazosUrgentes={plazosEstaSemana}
        aprobacionesPendientes={countsData?.total ?? 0}
      />

      {/* ── MAIN CONTENT: Agenda + Calendar + Deadlines ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <AgendaToday eventos={[]} />
        </div>
        <div className="lg:col-span-5">
          <MiniCalendar deadlines={[]} />
        </div>
        <div className="lg:col-span-3">
          <UpcomingDeadlinesList plazos={upcomingDeadlineItems} />
        </div>
      </div>

      {/* ── CHARTS ROW ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ExpedientesTiposChart data={expedientesTipos} />
        <FacturacionEvolucionChart
          data={facturacionData}
          metricas={{ mes: '0€', trimestre: '0€', año: '0€' }}
        />
        <PipelineChart data={pipelineData} />
      </div>

      {/* ── RECENT ACTIVITY (Section 3) ────────── */}
      <RecentActivityFeed actividades={activityItems} />

      {/* ── QUICK ACCESS (Section 4) ───────────── */}
      <QuickAccessGrid />
    </div>
  );
}
