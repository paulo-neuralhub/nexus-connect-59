// ============================================================
// IP-NEXUS BACKOFFICE — Knowledge Map Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromTable, rpcFn } from '@/lib/supabase';
import { toast } from 'sonner';

// ---------- Coverage Stats ----------
export function useKnowledgeCoverageStats() {
  return useQuery({
    queryKey: ['knowledge-coverage-stats'],
    queryFn: async () => {
      const { data, error } = await fromTable('genius_knowledge_coverage')
        .select('coverage_level');
      if (error) throw error;
      const rows = (data || []) as { coverage_level: string }[];
      const counts = { complete: 0, partial: 0, minimal: 0, none: 0 };
      rows.forEach((r) => {
        const lvl = r.coverage_level as keyof typeof counts;
        if (lvl in counts) counts[lvl]++;
      });
      return counts;
    },
  });
}

export function useKnowledgePendingReviews() {
  return useQuery({
    queryKey: ['knowledge-pending-reviews'],
    queryFn: async () => {
      const { count, error } = await fromTable('genius_kb_update_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_review');
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useKnowledgeOutdatedCount() {
  return useQuery({
    queryKey: ['knowledge-outdated-count'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { count, error } = await fromTable('genius_knowledge_global')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('last_verified_at', sixMonthsAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });
}

// ---------- Coverage Table ----------
export interface CoverageRow {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  office_id: string;
  coverage_level: string;
  coverage_score: number;
  effective_score: number;
  quality_penalty_applied: boolean;
  cov_deadlines: string;
  cov_oa_response: string;
  cov_legislation: string;
  cov_fees?: string;
  cov_opposition: string;
  cov_license?: string;
  total_kb_chunks: number;
  last_verification: string | null;
  last_kb_update: string | null;
  has_outdated_content: boolean;
  // joined from ipo_offices
  flag_emoji?: string;
  rep_requirement_type?: string;
  requires_translation?: boolean;
  accepted_filing_languages?: string[];
  region?: string;
  is_madrid_member?: boolean;
}

export function useKnowledgeCoverageTable() {
  return useQuery({
    queryKey: ['knowledge-coverage-table'],
    queryFn: async () => {
      const { data, error } = await fromTable('genius_knowledge_coverage')
        .select('*, ipo_offices:office_id(flag_emoji, rep_requirement_type, requires_translation, accepted_filing_languages, region, is_madrid_member)')
        .order('effective_score', { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((r: any) => ({
        ...r,
        flag_emoji: r.ipo_offices?.flag_emoji,
        rep_requirement_type: r.ipo_offices?.rep_requirement_type,
        requires_translation: r.ipo_offices?.requires_translation,
        accepted_filing_languages: r.ipo_offices?.accepted_filing_languages,
        region: r.ipo_offices?.region,
        is_madrid_member: r.ipo_offices?.is_madrid_member,
      })) as CoverageRow[];
    },
  });
}

// ---------- Update Queue ----------
export interface QueueItem {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name?: string;
  status: string;
  research_depth: string;
  proposed_chunks: any;
  confidence_level: string;
  estimated_cost_eur: number;
  created_at: string;
  reviewed_by?: string;
}

export function useUpdateQueue(status?: string) {
  return useQuery({
    queryKey: ['knowledge-update-queue', status],
    queryFn: async () => {
      let q = fromTable('genius_kb_update_queue')
        .select('*')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as QueueItem[];
    },
  });
}

// ---------- Outdated Content ----------
export interface OutdatedChunk {
  id: string;
  title: string;
  knowledge_type: string;
  jurisdiction_code: string;
  last_verified_at: string;
}

export function useOutdatedContent() {
  return useQuery({
    queryKey: ['knowledge-outdated-content'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data, error } = await fromTable('genius_knowledge_global')
        .select('id, title, knowledge_type, jurisdiction_code, last_verified_at')
        .eq('is_active', true)
        .lt('last_verified_at', sixMonthsAgo.toISOString())
        .order('last_verified_at', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as OutdatedChunk[];
    },
  });
}

// ---------- Jurisdiction Chunks (for detail panel) ----------
export function useJurisdictionChunks(jurisdictionCode?: string) {
  return useQuery({
    queryKey: ['knowledge-chunks', jurisdictionCode],
    enabled: !!jurisdictionCode,
    queryFn: async () => {
      const { data, error } = await fromTable('genius_knowledge_global')
        .select('*')
        .eq('jurisdiction_code', jurisdictionCode!)
        .eq('is_active', true)
        .order('knowledge_type');
      if (error) throw error;
      return data || [];
    },
  });
}

// ---------- Jurisdiction Update Logs ----------
export function useJurisdictionLogs(jurisdictionCode?: string) {
  return useQuery({
    queryKey: ['knowledge-logs', jurisdictionCode],
    enabled: !!jurisdictionCode,
    queryFn: async () => {
      const { data, error } = await fromTable('genius_kb_update_log')
        .select('*')
        .eq('jurisdiction_code', jurisdictionCode!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}

// ---------- Opportunities ----------
export function useKnowledgeOpportunities() {
  return useQuery({
    queryKey: ['knowledge-opportunities'],
    queryFn: async () => {
      // Madrid members without coverage
      const { data: madridNoCov } = await fromTable('ipo_offices')
        .select('id, code, name_en, flag_emoji, region')
        .eq('is_madrid_member', true)
        .is('genius_coverage_level', null)
        .limit(10);

      // Top LATAM uncovered
      const { data: latamNoCov } = await fromTable('ipo_offices')
        .select('id, code, name_en, flag_emoji, region')
        .eq('region', 'latin_america')
        .is('genius_coverage_level', null)
        .limit(5);

      return {
        madridNoCoverage: (madridNoCov || []) as any[],
        latamUncovered: (latamNoCov || []) as any[],
      };
    },
  });
}

// ---------- Approve Research ----------
export function useApproveResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { queue_id: string; approved_chunk_ids: string[] }) => {
      const { data, error } = await supabase.functions.invoke('genius-approve-research', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Investigación aprobada y chunks publicados');
      qc.invalidateQueries({ queryKey: ['knowledge-coverage-table'] });
      qc.invalidateQueries({ queryKey: ['knowledge-update-queue'] });
      qc.invalidateQueries({ queryKey: ['knowledge-coverage-stats'] });
    },
    onError: (e: any) => toast.error(e.message || 'Error al aprobar'),
  });
}

// ---------- Monthly Update ----------
export function useMonthlyUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('genius-monthly-update', {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Actualización mensual completada');
      qc.invalidateQueries({ queryKey: ['knowledge-update-queue'] });
    },
    onError: (e: any) => toast.error(e.message || 'Error en actualización mensual'),
  });
}

// ---------- Research Jurisdiction ----------
export function useResearchJurisdiction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      jurisdiction_code: string;
      depth?: 'basic' | 'full';
      confirmed_cost?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('genius-research-jurisdiction', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.action === 'cost_estimate') {
        toast.info(`Coste estimado: €${data.estimated_cost_eur}`);
      } else {
        toast.success('Investigación iniciada');
        qc.invalidateQueries({ queryKey: ['knowledge-update-queue'] });
      }
    },
    onError: (e: any) => toast.error(e.message || 'Error al investigar'),
  });
}
