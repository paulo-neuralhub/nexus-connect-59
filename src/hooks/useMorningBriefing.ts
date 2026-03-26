import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/hooks/useOrganization';

export const useMorningBriefing = () => {
  const { user } = useAuth();
  const { organizationId: orgId } = useOrganization();
  const currentUserId = user?.id;

  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadBriefing = async () => {
    if (!orgId || !currentUserId) return;
    const { data } = await supabase
      .from('genius_daily_briefings')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', currentUserId)
      .eq('briefing_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setBriefing(data);
    setLoading(false);
  };

  const generateBriefing = async (force = false) => {
    if (!orgId || !currentUserId) return;
    setGenerating(true);
    try {
      await supabase.functions.invoke('generate-morning-briefing', {
        body: { user_id: currentUserId, organization_id: orgId, force },
      });
      await loadBriefing();
    } finally {
      setGenerating(false);
    }
  };

  const resolveItem = async (
    briefingId: string,
    itemId: string,
    note = 'Resuelto manualmente'
  ) => {
    await supabase
      .from('briefing_item_resolutions')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: currentUserId,
        resolution_note: note,
      })
      .eq('briefing_id', briefingId)
      .eq('item_id', itemId);
  };

  useEffect(() => {
    loadBriefing();
  }, [orgId, currentUserId]);

  useEffect(() => {
    if (!loading && !briefing && orgId && currentUserId) {
      generateBriefing();
    }
  }, [loading, briefing, orgId, currentUserId]);

  return {
    briefing,
    loading,
    generating,
    generateBriefing,
    resolveItem,
    content: briefing?.content_json || null,
  };
};
