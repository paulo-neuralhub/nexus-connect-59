// ============================================================
// useCopilot — Central hook for IP-NEXUS CoPilot
// Manages context, panel state, briefing, alerts, and chat
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

// ── Types ───────────────────────────────────────────────────

export type CopilotPanelState = 'bubble' | 'compact' | 'expanded' | 'hidden' | 'guide';

export interface CopilotConfig {
  mode: 'basic' | 'pro';
  name: string;
  avatarUrl: string | null;
  queriesUsed: number;
  queriesLimit: number;
  queriesRemaining: number;
  features: {
    documentGeneration: boolean;
    appActions: boolean;
    proactive: boolean;
  };
}

export interface CopilotAlerts {
  fatalDeadlines: Array<{
    id: string;
    title: string;
    due_date: string;
    is_critical: boolean;
    matter_title: string | null;
    reference_number: string | null;
    hours_remaining: number;
  }>;
  criticalSpider: number;
  overdueInvoices: number;
  overdueAmount: number;
  unreadChat: number;
}

export interface CopilotUserPrefs {
  copilot_visible: boolean;
  copilot_position: string;
  copilot_size: string;
  show_rag_sources: boolean;
}

export interface BriefingData {
  id: string;
  content_json: {
    summary: string;
    generated_at: string;
    items: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      matter_id?: string;
      action_url: string;
      days_remaining?: number;
      icon: string;
    }>;
  };
  total_items: number;
  urgent_items: number;
  was_read: boolean;
}

export interface CopilotContextData {
  copilot: CopilotConfig;
  user_prefs: CopilotUserPrefs;
  briefing: BriefingData | null;
  alerts: CopilotAlerts;
  matter_context: Record<string, unknown> | null;
  client_context: Record<string, unknown> | null;
  available_guides: Array<{
    guide_id: string;
    step_order: number;
    title: string;
    copilot_message: string;
    target_selector: string | null;
    is_skippable: boolean;
  }>;
}

export interface GuideStep {
  guide_id: string;
  step_order: number;
  title: string;
  copilot_message: string;
  target_selector: string | null;
  is_skippable: boolean;
}

// ── Default state ───────────────────────────────────────────

const DEFAULT_CONFIG: CopilotConfig = {
  mode: 'basic',
  name: 'CoPilot Nexus',
  avatarUrl: null,
  queriesUsed: 0,
  queriesLimit: 50,
  queriesRemaining: 50,
  features: { documentGeneration: false, appActions: false, proactive: false },
};

const DEFAULT_ALERTS: CopilotAlerts = {
  fatalDeadlines: [],
  criticalSpider: 0,
  overdueInvoices: 0,
  overdueAmount: 0,
  unreadChat: 0,
};

const DEFAULT_PREFS: CopilotUserPrefs = {
  copilot_visible: true,
  copilot_position: 'bottom-right',
  copilot_size: 'bubble',
  show_rag_sources: false,
};

// ── Page-specific suggestions ───────────────────────────────

const PAGE_SUGGESTIONS: Record<string, string> = {
  '/app/matters': '¿Necesitas crear un expediente?',
  '/app/crm': '¿Buscas información de un cliente?',
  '/app/spider': '¿Quieres activar una vigilancia?',
  '/app/finance': '¿Necesitas generar una factura?',
  '/app/genius': '¿Quieres hacer una consulta legal?',
  '/app/dashboard': '¿Cómo puedo ayudarte hoy?',
};

export function getPageSuggestion(pathname: string): string {
  const sorted = Object.keys(PAGE_SUGGESTIONS).sort((a, b) => b.length - a.length);
  const match = sorted.find((key) => pathname.startsWith(key));
  return match ? PAGE_SUGGESTIONS[match] : '¿En qué puedo ayudarte?';
}

// ── Hook ────────────────────────────────────────────────────

export function useCopilot() {
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  // Panel state
  const [panelState, setPanelState] = useState<CopilotPanelState>('bubble');

  // Guide state
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Derive page context from URL
  const currentPage = location.pathname;
  const matterId = params.id && currentPage.includes('/matters/') ? params.id : undefined;
  const crmAccountId = params.id && currentPage.includes('/crm/') ? params.id : undefined;

  // ── Load context from edge function ─────────────────────
  const contextQuery = useQuery({
    queryKey: ['copilot-context', currentPage, matterId, crmAccountId],
    queryFn: async (): Promise<CopilotContextData | null> => {
      if (!currentOrganization?.id || !user?.id) return null;

      try {
        const { data, error } = await supabase.functions.invoke('genius-copilot-context', {
          body: {
            current_page: currentPage,
            matter_id: matterId,
            crm_account_id: crmAccountId,
          },
        });
        if (error) throw error;
        return data as CopilotContextData;
      } catch (e) {
        console.warn('CoPilot context load failed (non-blocking):', e);
        return null;
      }
    },
    enabled: !!currentOrganization?.id && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 min
    refetchOnWindowFocus: false,
  });

  // Derived state
  const ctx = contextQuery.data;
  const config = ctx?.copilot ?? DEFAULT_CONFIG;
  const userPrefs = ctx?.user_prefs ?? DEFAULT_PREFS;
  const alerts = ctx?.alerts ?? DEFAULT_ALERTS;
  const briefing = ctx?.briefing ?? null;
  const availableGuides = ctx?.available_guides ?? [];

  const urgentCount = useMemo(() => {
    let count = (alerts.fatalDeadlines?.length ?? 0) + (alerts.criticalSpider ?? 0) + (alerts.overdueInvoices ?? 0);
    if (briefing && !briefing.was_read && (briefing.urgent_items ?? 0) > 0) {
      count += briefing.urgent_items;
    }
    return count;
  }, [alerts, briefing]);

  const isPro = config.mode === 'pro';

  // ── Refresh context on route change ─────────────────────
  useEffect(() => {
    if (currentOrganization?.id) {
      queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
    }
  }, [currentPage, currentOrganization?.id, queryClient]);

  // ── Save user preferences ───────────────────────────────
  const savePrefs = useMutation({
    mutationFn: async (prefs: Record<string, unknown>) => {
      const { error } = await supabase.functions.invoke('genius-user-prefs', {
        body: prefs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
    },
  });

  // ── Mark briefing as read ───────────────────────────────
  const markBriefingRead = useCallback(async () => {
    if (!briefing?.id) return;
    try {
      // Update directly via supabase since we have RLS
      await supabase
        .from('genius_daily_briefings')
        .update({
          was_read: true,
          read_at: new Date().toISOString(),
          read_by: user?.id,
        })
        .eq('id', briefing.id);
      queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
    } catch (e) {
      console.error('Failed to mark briefing read:', e);
    }
  }, [briefing, user?.id, queryClient]);

  // ── Dismiss briefing ────────────────────────────────────
  const dismissBriefing = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    savePrefs.mutate({ briefing_dismissed_date: today });
  }, [savePrefs]);

  // ── Guide controls ──────────────────────────────────────
  const startGuide = useCallback((guideId: string) => {
    setActiveGuide(guideId);
    setCurrentStep(0);
    setPanelState('guide');
  }, []);

  const nextStep = useCallback(() => {
    if (!activeGuide) return;
    const guideSteps = availableGuides.filter((g) => g.guide_id === activeGuide);
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Guide complete
      savePrefs.mutate({ guide_dismissed_id: activeGuide });
      setActiveGuide(null);
      setCurrentStep(0);
      setPanelState('bubble');
    }
  }, [activeGuide, currentStep, availableGuides, savePrefs]);

  const dismissGuide = useCallback(() => {
    if (activeGuide) {
      savePrefs.mutate({ guide_dismissed_id: activeGuide });
    }
    setActiveGuide(null);
    setCurrentStep(0);
    setPanelState('bubble');
  }, [activeGuide, savePrefs]);

  // ── Send chat message ───────────────────────────────────
  const sendMessage = useCallback(async (
    message: string,
    options?: { matterId?: string }
  ) => {
    setIsThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('genius-chat', {
        body: {
          conversation_id: conversationId,
          message,
          context_matter_id: options?.matterId || matterId,
          context_page: currentPage,
          stream: false,
        },
      });
      if (error) throw error;
      if (data?.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
      return data;
    } finally {
      setIsThinking(false);
    }
  }, [conversationId, matterId, currentPage]);

  // ── Refresh context manually ────────────────────────────
  const refreshContext = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
  }, [queryClient]);

  // Page suggestion
  const pageSuggestion = getPageSuggestion(currentPage);

  return {
    // Config
    mode: config.mode,
    isPro,
    name: config.name,
    avatarUrl: config.avatarUrl,
    queriesRemaining: config.queriesRemaining,
    queriesUsed: config.queriesUsed,
    queriesLimit: config.queriesLimit,
    features: config.features,

    // Panel state
    panelState,
    setPanelState,

    // Guide
    activeGuide,
    currentStep,
    guideSteps: activeGuide
      ? availableGuides.filter((g) => g.guide_id === activeGuide)
      : [],
    startGuide,
    nextStep,
    dismissGuide,
    availableGuides,

    // Briefing
    briefing,
    hasBriefing: !!briefing && !briefing.was_read,
    urgentCount,
    markBriefingRead,
    dismissBriefing,

    // Alerts
    alerts,

    // Context
    currentPage,
    currentMatter: ctx?.matter_context ?? null,
    currentClient: ctx?.client_context ?? null,
    refreshContext,
    pageSuggestion,

    // User prefs
    userPrefs,
    savePrefs: savePrefs.mutate,

    // Chat
    sendMessage,
    conversationId,
    isThinking,
    setConversationId,

    // Loading
    isLoading: contextQuery.isLoading,
  };
}
