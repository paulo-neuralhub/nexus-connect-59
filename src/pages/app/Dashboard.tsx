// =============================================
// Dashboard Principal — SILK Command Center
// Usa componentes CommandCenter + hooks existentes
// =============================================

import { useDashboardHome } from '@/hooks/use-dashboard-home';
import { useDashboardMetrics } from '@/components/dashboard/MetricsBar';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';
import { PendingApprovalsWidget } from '@/components/dashboard/PendingApprovalsWidget';
import { BriefingCard } from '@/components/copilot/BriefingCard';
import { CriticalAlertsBanner } from '@/components/dashboard/critical-alerts-banner';
import {
  UrgentBadges,
  OperationalKPIs,
  AgendaToday,
  MiniCalendar,
  UpcomingDeadlinesList,
  ExpedientesTiposChart,
  FacturacionEvolucionChart,
  PipelineChart,
  RecentActivityFeed,
} from '@/components/dashboard/CommandCenter';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data, isLoading } = useDashboardHome();
  const { metrics } = useDashboardMetrics();

  // Derive values from data
  const totalMatters = data?.totalMatters ?? 0;
  const activeWatchlists = data?.activeWatchlists ?? 0;
  const criticalAlerts = data?.criticalAlerts ?? 0;
  const highAlerts = data?.highAlerts ?? 0;
  const upcomingDeadlines = data?.upcomingDeadlines ?? 0;
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

  // Derive urgent expedientes count from metrics
  const urgentDeadlinesMetric = metrics.find(m => m.label === 'Urgentes');
  const expedientesUrgentes = typeof urgentDeadlinesMetric?.value === 'number' 
    ? urgentDeadlinesMetric.value : 0;

  // Map deadlines for UpcomingDeadlinesList
  const upcomingDeadlineItems = deadlines.map(d => ({
    id: d.id,
    titulo: d.title,
    fecha: d.dueDate,
    tipo: d.type as 'plazo' | 'renovacion' | 'oposicion' | 'otro',
    estado: d.priority === 'critical' ? 'urgente' as const 
          : d.priority === 'high' ? 'proximo' as const 
          : 'normal' as const,
    expedienteRef: d.matterRef,
    matterId: d.matterId,
    oficina: d.office,
  }));

  // Map activities for RecentActivityFeed
  const activityItems = recentActivity.map(a => ({
    id: a.id,
    tipo: a.type as 'deadline' | 'task' | 'document' | 'email' | 'note' | 'stage_change' | 'crm',
    descripcion: a.title,
    detalle: a.description || undefined,
    timestamp: a.timestamp,
    modulo: a.module,
    link: a.link,
    usuario: a.userName,
  }));

  // Facturacion chart data (placeholder since no real monthly data in hook)
  const facturacionData = [
    { mes: 'Ene', valor: 0 },
    { mes: 'Feb', valor: 0 },
    { mes: 'Mar', valor: 0 },
    { mes: 'Abr', valor: 0 },
    { mes: 'May', valor: 0 },
    { mes: 'Jun', valor: 0 },
  ];

  // Expedientes por tipo (from mattersByPhase)
  const expedientesTipos = mattersByPhase
    .filter(p => p.count > 0)
    .map(p => ({
      tipo: p.nombre,
      cantidad: p.count,
      color: p.color,
    }));

  // Pipeline data
  const pipelineData = mattersByPhase.map(p => ({
    fase: p.fase,
    nombre: p.nombre,
    count: p.count,
    color: p.color,
    max: p.max,
  }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-80 rounded-xl" />
          <Skeleton className="col-span-5 h-80 rounded-xl" />
          <Skeleton className="col-span-3 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* ── HEADER ─────────────────────────────── */}
      <DashboardWelcomeHeader plazosEstaSemana={plazosEstaSemana} />

      {/* ── PENDING APPROVALS ──────────────────── */}
      <PendingApprovalsWidget />

      {/* ── BRIEFING CARD ──────────────────────── */}
      <BriefingCard />

      {/* ── CRITICAL ALERTS ────────────────────── */}
      <CriticalAlertsBanner count={criticalAlerts + highAlerts} />

      {/* ── URGENT BADGES ──────────────────────── */}
      <UrgentBadges
        plazosHoy={upcomingDeadlines}
        expedientesUrgentes={expedientesUrgentes}
        alertasSpider={criticalAlerts + highAlerts}
        plazosUrgentes={plazosEstaSemana}
      />

      {/* ── OPERATIONAL KPIs ───────────────────── */}
      <OperationalKPIs
        expedientesActivos={totalMatters}
        vigilanciasActivas={activeWatchlists}
        emailsSinLeer={0}
        whatsappSinLeer={0}
      />

      {/* ── MAIN CONTENT: Agenda + Calendar + Deadlines ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Agenda HOY — 4/12 */}
        <div className="lg:col-span-4">
          <AgendaToday eventos={[]} />
        </div>

        {/* Mini Calendar — 5/12 */}
        <div className="lg:col-span-5">
          <MiniCalendar eventos={[]} />
        </div>

        {/* Plazos Próximos — 3/12 */}
        <div className="lg:col-span-3">
          <UpcomingDeadlinesList plazos={upcomingDeadlineItems} />
        </div>
      </div>

      {/* ── CHARTS ROW ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expedientes por Tipo */}
        <ExpedientesTiposChart data={expedientesTipos} />

        {/* Facturación */}
        <FacturacionEvolucionChart
          data={facturacionData}
          metricas={{ total: data?.dealsPipeline ?? 0, currency: 'EUR' }}
        />

        {/* Pipeline por Fase */}
        <PipelineChart data={pipelineData} />
      </div>

      {/* ── RECENT ACTIVITY ────────────────────── */}
      <RecentActivityFeed items={activityItems} />
    </div>
  );
}
