// =============================================
// COMPONENTE: MetricsBar (SILK Hero Zone)
// Solo para Dashboard - KPIs principales
// =============================================

import { cn } from '@/lib/utils';
import { NeoBadge } from '@/components/ui/neo-badge';
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color: string;
  href?: string;
}

interface MetricsBarProps {
  metrics: Metric[];
}

/**
 * SILK Hero Zone - Solo Dashboard
 * Contenedor con gradiente sutil y grid de KPIs principales con NeoBadge
 */
export function MetricsBar({ metrics }: MetricsBarProps) {
  // Tomar solo los 4 primeros para Hero Zone (KPIs principales)
  // Los demás se pueden mostrar en otra sección si se desea
  const heroMetrics = metrics.slice(0, 4);
  const secondaryMetrics = metrics.slice(4);

  return (
    <div className="space-y-3">
      {/* SILK: Hero Zone Container */}
      <div 
        className="p-3 rounded-2xl mb-[18px]"
        style={{
          background: 'linear-gradient(135deg, #eceef6, #f1f4f9)',
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {heroMetrics.map((metric, idx) => (
            <HeroKPICard key={idx} metric={metric} />
          ))}
        </div>
      </div>

      {/* Secondary metrics row (si hay más de 4) */}
      {secondaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
          {secondaryMetrics.map((metric, idx) => (
            <SecondaryMetricCard key={idx} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SILK: Card KPI dentro de Hero Zone con NeoBadge
 */
function HeroKPICard({ metric }: { metric: Metric }) {
  return (
    <div 
      className="flex items-center gap-3 py-[13px] px-3 rounded-[14px] border border-black/[0.06] cursor-pointer transition-colors hover:border-[rgba(0,180,216,0.15)]"
      style={{ background: '#f1f4f9' }}
    >
      {/* NeoBadge with value */}
      <NeoBadge
        value={metric.value}
        color={metric.color}
        size="md"
      />
      
      {/* Content */}
      <div className="min-w-0 flex-1">
        <p 
          className="text-[11px] font-semibold uppercase tracking-wide truncate"
          style={{ color: '#0a2540' }}
        >
          {metric.label}
        </p>
        {metric.change !== undefined && (
          <p className={cn(
            "text-[10px] font-medium",
            metric.change >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% {metric.changeLabel}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SILK: Card secundaria (métricas 5-8) con NeoBadge
 */
function SecondaryMetricCard({ metric }: { metric: Metric }) {
  return (
    <div 
      className="flex items-center gap-3 py-3 px-3 rounded-[14px] border border-black/[0.06] cursor-pointer transition-colors hover:border-[rgba(0,180,216,0.15)]"
      style={{ background: '#f1f4f9' }}
    >
      {/* NeoBadge with value */}
      <NeoBadge
        value={metric.value}
        color={metric.color}
        size="sm"
      />
      
      {/* Content */}
      <div className="min-w-0 flex-1">
        <p 
          className="text-[10px] font-semibold uppercase tracking-wide truncate"
          style={{ color: '#0a2540' }}
        >
          {metric.label}
        </p>
      </div>
    </div>
  );
}

// =============================================
// Hook para obtener métricas del dashboard
// =============================================


export function useDashboardMetrics() {
  const { organizationId } = useOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const [
        mattersRes,
        activeMattersRes,
        deadlinesTodayRes,
        urgentDeadlinesRes,
        contactsRes,
        watchlistsRes,
        alertsRes,
        invoicesRes,
      ] = await Promise.all([
        // Total matters
        fromTable('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        
        // Active matters
        fromTable('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .not('status', 'in', '("archived","cancelled")'),
        
        // Deadlines today
        fromTable('matter_deadlines')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('deadline_date', todayStart)
          .lt('deadline_date', todayEnd),
        
        // Urgent deadlines (priority = critical or high)
        fromTable('matter_deadlines')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .in('priority', ['critical', 'high'])
          .eq('status', 'pending'),
        
        // CRM contacts/accounts
        fromTable('crm_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        
        // Active watchlists
        fromTable('spider_watches')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_active', true),
        
        // Spider alerts (unread)
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'new'),
        
        // Month invoices total
        fromTable('invoices')
          .select('total')
          .eq('organization_id', organizationId)
          .gte('invoice_date', monthStart)
          .lte('invoice_date', monthEnd),
      ]);

      const monthlyTotal = (invoicesRes.data ?? []).reduce(
        (sum: number, inv: { total?: number | null }) => sum + (inv.total ?? 0),
        0
      );

      return {
        totalMatters: mattersRes.count ?? 0,
        activeMatters: activeMattersRes.count ?? 0,
        deadlinesToday: deadlinesTodayRes.count ?? 0,
        urgentDeadlines: urgentDeadlinesRes.count ?? 0,
        totalContacts: contactsRes.count ?? 0,
        activeWatchlists: watchlistsRes.count ?? 0,
        unreadAlerts: alertsRes.count ?? 0,
        monthlyInvoicing: monthlyTotal,
      };
    },
    enabled: !!organizationId,
    staleTime: 30000,
  });

  const metrics: Metric[] = [
    {
      label: 'Expedientes',
      value: data?.totalMatters ?? 0,
      color: '#00b4d8', // accent cyan
    },
    {
      label: 'Activos',
      value: data?.activeMatters ?? 0,
      color: '#10B981', // green
    },
    {
      label: 'Plazos hoy',
      value: data?.deadlinesToday ?? 0,
      color: '#F59E0B', // amber
    },
    {
      label: 'Urgentes',
      value: data?.urgentDeadlines ?? 0,
      color: '#EF4444', // red
    },
    {
      label: 'Clientes',
      value: data?.totalContacts ?? 0,
      color: '#64748b', // neutral gray
    },
    {
      label: 'Vigilancias',
      value: data?.activeWatchlists ?? 0,
      color: '#2563eb', // blue (replacing purple)
    },
    {
      label: 'Alertas Spider',
      value: data?.unreadAlerts ?? 0,
      color: '#F59E0B', // amber
    },
    {
      label: 'Fact. mes',
      value: `€${(data?.monthlyInvoicing ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}`,
      color: '#10B981', // green
    },
  ];

  return { metrics, isLoading };
}
