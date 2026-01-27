// =============================================
// COMPONENTE: MetricsBar
// Barra compacta de métricas principales
// =============================================

import { 
  Folder, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle,
  Euro,
  Calendar,
  Eye,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}

interface MetricsBarProps {
  metrics: Metric[];
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics.map((metric, idx) => (
        <MetricCard key={idx} metric={metric} />
      ))}
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card className="flex items-center gap-3 p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div 
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${metric.color}15`, color: metric.color }}
      >
        {metric.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground truncate">
          {metric.value}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {metric.label}
        </p>
        {metric.change !== undefined && (
          <p className={cn(
            "text-[10px] font-medium",
            metric.change >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% {metric.changeLabel}
          </p>
        )}
      </div>
    </Card>
  );
}

// =============================================
// Hook para obtener métricas del dashboard
// =============================================

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';

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
          .eq('status', 'active'),
        
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
        fromTable('watchlists')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_active', true),
        
        // Spider alerts (unread)
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'unread'),
        
        // Month invoices total
        fromTable('invoices')
          .select('total_amount')
          .eq('organization_id', organizationId)
          .gte('invoice_date', monthStart)
          .lte('invoice_date', monthEnd),
      ]);

      const monthlyTotal = (invoicesRes.data ?? []).reduce(
        (sum: number, inv: { total_amount?: number | null }) => sum + (inv.total_amount ?? 0),
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
      icon: <Folder className="h-5 w-5" />,
      color: '#3B82F6',
    },
    {
      label: 'Activos',
      value: data?.activeMatters ?? 0,
      icon: <CheckCircle className="h-5 w-5" />,
      color: '#10B981',
    },
    {
      label: 'Plazos hoy',
      value: data?.deadlinesToday ?? 0,
      icon: <Calendar className="h-5 w-5" />,
      color: '#F59E0B',
    },
    {
      label: 'Urgentes',
      value: data?.urgentDeadlines ?? 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: '#EF4444',
    },
    {
      label: 'Clientes',
      value: data?.totalContacts ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: '#8B5CF6',
    },
    {
      label: 'Vigilancias',
      value: data?.activeWatchlists ?? 0,
      icon: <Eye className="h-5 w-5" />,
      color: '#EC4899',
    },
    {
      label: 'Alertas Spider',
      value: data?.unreadAlerts ?? 0,
      icon: <Bell className="h-5 w-5" />,
      color: '#F97316',
    },
    {
      label: 'Fact. mes',
      value: `€${(data?.monthlyInvoicing ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}`,
      icon: <Euro className="h-5 w-5" />,
      color: '#059669',
    },
  ];

  return { metrics, isLoading };
}
