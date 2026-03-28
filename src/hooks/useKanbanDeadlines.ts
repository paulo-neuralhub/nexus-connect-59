/**
 * useKanbanDeadlines — Fetches overdue/pending deadlines for deals with linked matters
 */

import { useState, useEffect, useCallback } from 'react';
import type { KanbanDeal, KanbanDeadline } from '@/lib/kanban-utils';

export function useKanbanDeadlines(
  deals: KanbanDeal[],
  organizationId: string | undefined,
  supabase: any
) {
  const [deadlinesByMatter, setDeadlinesByMatter] = useState<Record<string, KanbanDeadline[]>>({});
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(false);
  const [lastFetchAt, setLastFetchAt] = useState<Date | null>(null);

  // Serialize to avoid re-renders from array reference changes
  const dealsKey = JSON.stringify(
    deals.map((d) => d.matter_id).filter(Boolean).sort()
  );

  const fetchDeadlines = useCallback(async () => {
    if (!organizationId) return;

    const matterIds = [
      ...new Set(deals.map((d) => d.matter_id).filter(Boolean) as string[]),
    ];

    // Guard: no linked matters, clear and exit
    if (matterIds.length === 0) {
      setDeadlinesByMatter({});
      return;
    }

    setIsLoadingDeadlines(true);

    try {
      const { data, error } = await supabase
        .from('matter_deadlines')
        .select('matter_id, title, deadline_date, status, priority')
        .in('matter_id', matterIds)
        .eq('organization_id', organizationId)
        .in('status', ['overdue', 'pending'])
        .lte(
          'deadline_date',
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('deadline_date', { ascending: true })
        .limit(100);

      if (error) throw error;

      const grouped = (data ?? []).reduce(
        (acc: Record<string, KanbanDeadline[]>, d: KanbanDeadline) => {
          if (!acc[d.matter_id]) acc[d.matter_id] = [];
          acc[d.matter_id].push(d);
          return acc;
        },
        {}
      );

      setDeadlinesByMatter(grouped);
      setLastFetchAt(new Date());
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[useKanbanDeadlines] Error:', err);
      }
      setDeadlinesByMatter({});
    } finally {
      setIsLoadingDeadlines(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealsKey, organizationId]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  return {
    deadlinesByMatter,
    isLoadingDeadlines,
    refreshDeadlines: fetchDeadlines,
    lastFetchAt,
  };
}
