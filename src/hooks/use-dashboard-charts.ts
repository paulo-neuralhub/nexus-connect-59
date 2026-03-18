// =============================================
// HOOK: useDashboardCharts
// Datos reales para los gráficos del dashboard
// =============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface ExpedientesChartData {
  mes: string;
  nuevos: number;
  cerrados: number;
}

export interface FacturacionChartData {
  mes: string;
  valor: number;
}

export interface TiposChartData {
  name: string;
  value: number;
  color: string;
}

export interface TodayData {
  deadlines: Array<{
    id: string;
    title: string;
    time?: string;
    priority: 'high' | 'medium' | 'low';
    matterId?: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface RecentActivityData {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
}

// Hook para expedientes por mes (últimos 7 meses)
export function useExpedientesChart() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-expedientes-chart', currentOrganization?.id],
    queryFn: async (): Promise<ExpedientesChartData[]> => {
      if (!currentOrganization?.id) return [];

      const months: ExpedientesChartData[] = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // Nuevos expedientes creados en ese mes
        const { count: nuevos } = await supabase
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        // Expedientes cerrados en ese mes
        const { count: cerrados } = await supabase
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'closed')
          .gte('updated_at', date.toISOString())
          .lt('updated_at', nextMonth.toISOString());

        months.push({
          mes: monthNameCapitalized,
          nuevos: nuevos || 0,
          cerrados: cerrados || 0,
        });
      }

      return months;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60000,
  });
}

// Hook para facturación por mes (últimos 6 meses)
export function useFacturacionChart() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-facturacion-chart', currentOrganization?.id],
    queryFn: async (): Promise<FacturacionChartData[]> => {
      if (!currentOrganization?.id) return [];

      const months: FacturacionChartData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // Sumar total de facturas emitidas en ese mes
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total')
          .eq('organization_id', currentOrganization.id)
          .gte('invoice_date', date.toISOString().split('T')[0])
          .lt('invoice_date', nextMonth.toISOString().split('T')[0]);

        const totalVal = (invoices || []).reduce((sum, inv: any) => sum + (inv.total || 0), 0);

        months.push({
          mes: monthNameCapitalized,
          valor: totalVal,
        });
      }

      return months;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60000,
  });
}

// Hook para distribución por tipo de expediente
export function useTiposChart() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-tipos-chart', currentOrganization?.id],
    queryFn: async (): Promise<TiposChartData[]> => {
      if (!currentOrganization?.id) return [];

      const colors: Record<string, string> = {
        trademark: '#3B82F6',
        patent: '#10B981',
        design: '#F59E0B',
        copyright: '#8B5CF6',
        other: '#6B7280',
      };

      const labels: Record<string, string> = {
        trademark: 'Marcas',
        patent: 'Patentes',
        design: 'Diseños',
        copyright: 'Copyright',
        other: 'Otros',
      };

      // Contar expedientes por tipo
      const { data: matters } = await supabase
        .from('matters')
        .select('type')
        .eq('organization_id', currentOrganization.id);

      if (!matters || matters.length === 0) return [];

      const typeCounts: Record<string, number> = {};
      matters.forEach(m => {
        const type = m.type || 'other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const total = matters.length;
      const result: TiposChartData[] = [];

      Object.entries(typeCounts).forEach(([type, count]) => {
        result.push({
          name: labels[type] || type,
          value: Math.round((count / total) * 100),
          color: colors[type] || colors.other,
        });
      });

      // Ordenar por valor descendente
      return result.sort((a, b) => b.value - a.value);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60000,
  });
}

// Hook para sección "Hoy"
export function useTodayData() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-today', currentOrganization?.id],
    queryFn: async (): Promise<TodayData> => {
      if (!currentOrganization?.id) return { deadlines: [], alerts: [] };

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Plazos de hoy (usando deadline_date, no due_date)
      const { data: deadlinesData } = await supabase
        .from('matter_deadlines')
        .select('id, title, deadline_date, priority, matter_id')
        .eq('organization_id', currentOrganization.id)
        .gte('deadline_date', startOfDay.toISOString())
        .lt('deadline_date', endOfDay.toISOString())
        .order('deadline_date', { ascending: true });

      // Alertas no leídas (spider)
      const { data: alertsData } = await supabase
        .from('spider_alerts')
        .select('id, title, severity')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'unread')
        .in('severity', ['critical', 'high'])
        .limit(5);

      const deadlines = ((deadlinesData || []) as any[]).map((d: any) => ({
        id: d.id,
        title: d.title || 'Plazo',
        time: d.deadline_date ? new Date(d.deadline_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : undefined,
        priority: (d.priority === 'critical' ? 'high' : d.priority || 'medium') as 'high' | 'medium' | 'low',
        matterId: d.matter_id || undefined,
      }));

      const alerts = ((alertsData || []) as any[]).map((a: any) => ({
        id: a.id,
        title: a.title || 'Alerta',
        priority: (a.severity === 'critical' ? 'high' : a.severity || 'medium') as 'high' | 'medium' | 'low',
      }));

      return { deadlines, alerts };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 30000,
  });
}

// Hook para actividad reciente
export function useRecentActivityData() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-recent-activity', currentOrganization?.id],
    queryFn: async (): Promise<RecentActivityData[]> => {
      if (!currentOrganization?.id) return [];

      // Consultar activity_log
      const { data: activities } = await supabase
        .from('activity_log')
        .select('id, action, title, description, created_at, created_by, users!activity_log_created_by_fkey(full_name)')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return (activities || []).map((a: any) => ({
        id: a.id,
        type: mapActionToType(a.action),
        title: a.title || a.action || 'Actividad',
        description: a.description || undefined,
        timestamp: new Date(a.created_at),
        user: a.users?.full_name || undefined,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 30000,
  });
}

function mapActionToType(action: string): string {
  const mapping: Record<string, string> = {
    'create': 'matter_created',
    'update': 'matter_updated',
    'delete': 'matter_updated',
    'email_sent': 'email_sent',
    'call': 'call_made',
    'alert': 'alert',
    'complete': 'task_completed',
  };
  return mapping[action] || 'matter_updated';
}
