import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const STALE_TIME = 5 * 60 * 1000;

// =============================================
// REPORT DEFINITIONS
// Fixed: removed references to nonexistent columns (is_favorite, run_count, slug)
// Uses actual columns: id, name, description, report_type, config, is_active,
//   organization_id, output_formats, is_scheduled, schedule_cron, is_system_template
// =============================================

export function useReportDefinitions(options?: { category?: string }) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['report-definitions', currentOrganization?.id, options],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      let query = supabase
        .from('report_definitions')
        .select('*')
        .eq('is_active', true)
        .or(`organization_id.eq.${currentOrganization.id},is_system_template.eq.true`)
        .order('name', { ascending: true });
      
      if (options?.category) {
        query = query.eq('report_type', options.category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}

export function useReportDefinition(id: string | undefined) {
  return useQuery({
    queryKey: ['report-definition', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('report_definitions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

// =============================================
// REPORT EXECUTIONS
// Fixed: uses report_definition_id, not report_id
// Uses actual join relationship
// =============================================

export function useReportExecutions(options?: { reportId?: string; limit?: number }) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['report-executions', currentOrganization?.id, options],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      let query = supabase
        .from('report_executions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 20);
      
      if (options?.reportId) {
        query = query.eq('report_definition_id', options.reportId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}

export function useRunReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, params, format }: { 
      reportId: string; 
      params?: Record<string, unknown>; 
      format?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { report_definition_id: reportId, parameters: params, format }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-executions'] });
      queryClient.invalidateQueries({ queryKey: ['report-definitions'] });
      toast.success('Reporte generado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al generar reporte: ${error.message}`);
    }
  });
}

// =============================================
// ANALYTICS STATS — REPLACED
// Old: called nonexistent RPC get_analytics_stats
// New: queries real data from matters + deadlines + generated_reports
// =============================================

export function useAnalyticsStats(days: number = 30) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['analytics-stats', currentOrganization?.id, days],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      const orgId = currentOrganization.id;

      // Matters
      const { data: matters } = await supabase
        .from('matters')
        .select('type, status')
        .eq('organization_id', orgId);

      const m = matters || [];

      // Deadlines expiring in 30 days (uses deadline_date)
      const in30d = new Date();
      in30d.setDate(in30d.getDate() + 30);
      const { count: expiring30d } = await supabase
        .from('matter_deadlines')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .lte('deadline_date', in30d.toISOString().split('T')[0])
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'upcoming']);

      // Generated reports
      const { count: reportsCount } = await supabase
        .from('generated_reports')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      return {
        total_matters: m.length,
        total_trademarks: m.filter(x => x.type === 'trademark').length,
        total_patents: m.filter(x => x.type === 'patent').length,
        total_designs: m.filter(x => x.type === 'design').length,
        registered: m.filter(x => x.status === 'registered').length,
        pending: m.filter(x => ['pending', 'filed'].includes(x.status || '')).length,
        expiring_30d: expiring30d || 0,
        reports_generated: reportsCount || 0,
      } as Record<string, number>;
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}

// =============================================
// CHART DATA — Portfolio grouping via direct queries
// Replaces broken useAssetsGrouped that called nonexistent RPC
// =============================================

export function useAssetsGrouped(groupBy: 'ip_type' | 'status' | 'office_code') {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['assets-grouped', currentOrganization?.id, groupBy],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const fieldMap: Record<string, string> = {
        ip_type: 'type',
        status: 'status',
        office_code: 'jurisdiction',
      };
      const field = fieldMap[groupBy];

      const { data, error } = await supabase
        .from('matters')
        .select(field)
        .eq('organization_id', currentOrganization.id)
        .not(field, 'is', null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        const val = (row as any)[field] as string;
        if (val) counts[val] = (counts[val] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, groupBy === 'office_code' ? 10 : 20);
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}

// =============================================
// GENERATED REPORTS
// =============================================

export function useGeneratedReports() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['generated-reports', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}

// =============================================
// SCHEDULED EXPORTS (kept for compatibility)
// =============================================

export function useScheduledExports() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['scheduled-exports', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('report_definitions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_scheduled', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentOrganization?.id,
    staleTime: STALE_TIME,
  });
}
