import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

export interface DashboardHomeData {
  // Counts
  totalMatters: number;
  activeWatchlists: number;
  pendingDeals: number;
  marketListings: number;
  
  // Financial
  portfolioValue: number;
  portfolioChange: number;
  portfolioCurrency: string;
  portfolioBreakdown: {
    trademarks: number;
    patents: number;
    designs: number;
    copyrights: number;
    other: number;
  };
  
  // Alerts
  criticalAlerts: number;
  highAlerts: number;
  upcomingDeadlines: number;
  expiringMatters: number;
  
  // Activity
  recentActivity: ActivityItem[];
  
  // Deadlines
  deadlines: DeadlineItem[];
  
  // Market
  marketNotifications: number;
  pendingOffers: number;
  
  // AI
  aiCreditsUsed: number;
  aiCreditsTotal: number;
  
  // CRM
  totalContacts: number;
  openDeals: number;
  dealsPipeline: number;
  
  // Pipeline by phase
  mattersByPhase: { fase: string; nombre: string; count: number; color: string; max: number }[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  module: string;
  timestamp: string;
  link?: string;
  userName?: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  matterId?: string;
  matterRef?: string;
  office?: string;
}

export function useDashboardHome() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-home', currentOrganization?.id],
    queryFn: async (): Promise<DashboardHomeData> => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('No organization context');
      }

      const orgId = currentOrganization.id;
      const now = new Date().toISOString();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      // Parallel queries for performance
      const [
        mattersResult,
        watchlistsResult,
        dealsResult,
        contactsResult,
        portfoliosResult,
        criticalAlertsResult,
        highAlertsResult,
        activitiesResult,
        deadlinesResult,
        expiringResult,
        aiUsageResult,
      ] = await Promise.all([
        // Total matters
        supabase
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Active watchlists
        supabase
          .from('spider_watches')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true),

        // Open deals (CRM V2 - crm_deals)
        supabase
          .from('crm_deals')
          .select('id, amount_eur', { count: 'exact' })
          .eq('organization_id', orgId)
          .not('stage', 'in', '("lost","won")'),

        // Total contacts
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Portfolio data — table may not exist, use safe fallback
        Promise.resolve({ data: [], error: null }),

        // Critical alerts
        supabase
          .from('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('severity', 'critical')
          .eq('status', 'new'),

        // High alerts
        supabase
          .from('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('severity', 'high')
          .eq('status', 'new'),

        // Recent activities (crm_activities — may be empty, fallback handled below)
        supabase
          .from('crm_activities')
          .select('id, activity_type, description, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),

        // Upcoming deadlines (matter_deadlines)
        supabase
          .from('matter_deadlines')
          .select('id, title, deadline_date, priority, deadline_type, status, matter_id, matters(reference)')
          .eq('organization_id', orgId)
          .gte('deadline_date', now)
          .lte('deadline_date', thirtyDaysFromNow)
          .neq('status', 'completed')
          .order('deadline_date', { ascending: true })
          .limit(10),

        // Expiring matters (next 90 days)
        supabase
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('expiry_date', now)
          .lte('expiry_date', ninetyDaysFromNow),

        // AI usage this month - skip if table doesn't exist
        Promise.resolve({ data: [], error: null }),
      ]);

      // Portfolio — tables may not exist, safe fallback
      const totalPortfolioValue = 0;
      const portfolioChange = 0;
      const breakdown = {
        trademarks: 0,
        patents: 0,
        designs: 0,
        copyrights: 0,
        other: 0,
      };

      // Calculate deal pipeline value (crm_deals uses 'amount' not 'value')
      const dealsPipeline = (dealsResult.data || []).reduce(
        (sum, d) => sum + ((d as any).amount_eur || 0),
        0
      );

      // Calculate AI usage (from activity_log or fallback to 0)
      const aiCreditsUsed = 0;

      // Get matters by phase for pipeline chart
      const { data: mattersPhaseData } = await supabase
        .from('matters')
        .select('status')
        .eq('organization_id', orgId);

      const PHASE_CONFIG: Record<string, { nombre: string; color: string }> = {
        F0: { nombre: 'Consulta', color: '#94a3b8' },
        F1: { nombre: 'Búsqueda', color: '#64748b' },
        F2: { nombre: 'Preparación', color: '#0ea5e9' },
        F3: { nombre: 'Presentación', color: '#2563eb' },
        F4: { nombre: 'Examen', color: '#8b5cf6' },
        F5: { nombre: 'Publicación', color: '#f59e0b' },
        F6: { nombre: 'Oposición', color: '#ef4444' },
        F7: { nombre: 'Concesión', color: '#10b981' },
        F8: { nombre: 'Vigente', color: '#059669' },
        F9: { nombre: 'Archivado', color: '#6b7280' },
      };

      const statusToPhase: Record<string, string> = {
        pending: 'F2',
        examining: 'F4',
        office_action: 'F4',
        published: 'F5',
        registered: 'F8',
      };

      const phaseCounts: Record<string, number> = {};
      (mattersPhaseData || []).forEach((m: any) => {
        const phase = statusToPhase[m.status] || 'F2';
        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
      });

      const maxCount = Math.max(...Object.values(phaseCounts), 1);
      const mattersByPhase = Object.entries(PHASE_CONFIG).map(([fase, cfg]) => ({
        fase,
        nombre: cfg.nombre,
        count: phaseCounts[fase] || 0,
        color: cfg.color,
        max: maxCount,
      }));

      // crm_activities puede estar vacía — fallback a deadlines como proxy
      const rawActivities = activitiesResult.data || [];
      const recentActivity: ActivityItem[] =
        rawActivities.length > 0
          ? rawActivities.map((a: any) => ({
              id: a.id,
              type: a.activity_type || 'activity',
              title: a.description || 'Actividad',
              description: a.description,
              module: 'crm' as const,
              timestamp: a.created_at || new Date().toISOString(),
              link: undefined,
              userName: undefined,
            }))
          : (deadlinesResult.data || []).slice(0, 5).map((d: any) => ({
              id: d.id,
              type: 'deadline',
              title: `Plazo: ${d.title || 'Sin título'}`,
              description: d.matters?.reference || null,
              module: 'docket' as const,
              timestamp: d.deadline_date,
              link: d.matter_id ? `/app/expedientes/${d.matter_id}` : undefined,
              userName: undefined,
            }));

      // Map deadlines (matter_deadlines uses 'deadline_date' not 'event_date')
      const deadlines: DeadlineItem[] = ((deadlinesResult.data as any[]) || []).map((d: any) => ({
        id: d.id,
        title: d.title || 'Plazo',
        dueDate: d.deadline_date,
        priority: (d.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
        type: d.deadline_type || 'deadline',
        matterId: d.matter_id || undefined,
        matterRef: d.matters?.reference || undefined,
        office: undefined,
      }));

      return {
        totalMatters: mattersResult.count || 0,
        activeWatchlists: watchlistsResult.count || 0,
        pendingDeals: dealsResult.count || 0,
        marketListings: 0,
        
        portfolioValue: totalPortfolioValue,
        portfolioChange: Math.round(portfolioChange * 100) / 100,
        portfolioCurrency: 'EUR',
        portfolioBreakdown: breakdown,
        
        criticalAlerts: criticalAlertsResult.count || 0,
        highAlerts: highAlertsResult.count || 0,
        upcomingDeadlines: deadlinesResult.data?.length || 0,
        expiringMatters: expiringResult.count || 0,
        
        recentActivity,
        deadlines,
        
        marketNotifications: 0,
        pendingOffers: 0,
        
        aiCreditsUsed,
        aiCreditsTotal: 500,
        
        totalContacts: contactsResult.count || 0,
        openDeals: dealsResult.count || 0,
        dealsPipeline,
        mattersByPhase,
      };
    },
    enabled: !!currentOrganization?.id && !!user?.id,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
