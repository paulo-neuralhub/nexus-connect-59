// ============================================================
// useCopilot — Central hook for IP-NEXUS CoPilot
// Manages context, panel state, briefing, alerts, chat,
// bubble states, drag, greeting, tracking & suggestions
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

// ── Types ───────────────────────────────────────────────────

export type CopilotPanelState = 'bubble' | 'compact' | 'expanded' | 'hidden' | 'guide';

export type BubbleVisualState = 'standby' | 'attentive' | 'speaking' | 'urgent' | 'guide';

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
  position_x?: number | null;
  position_y?: number | null;
  last_greeted_date?: string | null;
  bubble_state?: BubbleVisualState;
  learning_enabled?: boolean;
  suggestions_enabled?: boolean;
  greeting_enabled?: boolean;
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
  available_guides: Array<GuideStep>;
}

export interface GuideStep {
  guide_id: string;
  step_order: number;
  title: string;
  copilot_message: string;
  target_selector: string | null;
  is_skippable: boolean;
}

export interface CopilotSuggestion {
  id: string;
  suggestion_type: string;
  title: string;
  body: string;
  action_primary_label: string | null;
  action_primary_url: string | null;
  action_secondary_label: string | null;
  action_secondary_url: string | null;
  confidence_score: number;
  matter_id: string | null;
  crm_account_id: string | null;
}

export interface MemoryExplanation {
  learning_since: string;
  total_events_captured: number;
  suggestions_acted_pct: number;
  patterns_in_plain_language: string[];
  writing_styles: Array<{ context_type: string; summary: string }>;
  recent_decisions: Array<{ type: string; date: string; jurisdiction: string }>;
  can_delete: boolean;
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
  position_x: null,
  position_y: null,
  last_greeted_date: null,
  bubble_state: 'standby',
  learning_enabled: true,
  suggestions_enabled: true,
  greeting_enabled: true,
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

// ── Session ID helper ───────────────────────────────────────

function getSessionId(): string {
  const key = 'copilot_session_id';
  const dateKey = 'copilot_session_date';
  const today = new Date().toISOString().split('T')[0];
  const stored = sessionStorage.getItem(key);
  const storedDate = sessionStorage.getItem(dateKey);
  if (stored && storedDate === today) return stored;
  const id = `${today}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, id);
  sessionStorage.setItem(dateKey, today);
  return id;
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

  // Bubble visual state
  const [bubbleState, setBubbleState] = useState<BubbleVisualState>('standby');

  // Greeting
  const [showGreeting, setShowGreeting] = useState(false);
  const greetingShownRef = useRef(false);

  // Drag position (null = default CSS position)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Guide state
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Active suggestion
  const [activeSuggestion, setActiveSuggestion] = useState<CopilotSuggestion | null>(null);

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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Derived state
  const ctx = contextQuery.data;
  const config = ctx?.copilot ?? DEFAULT_CONFIG;
  const userPrefs = ctx?.user_prefs ?? DEFAULT_PREFS;
  const alerts = ctx?.alerts ?? DEFAULT_ALERTS;
  const briefing = ctx?.briefing ?? null;
  const availableGuides = ctx?.available_guides ?? [];

  const isPro = config.mode === 'pro';

  // Avatar URL based on mode
  const avatarUrl = isPro
    ? '/assets/copilot-genius-avatar.jpeg'
    : '/assets/copilot-nexus-avatar.jpeg';

  const urgentCount = useMemo(() => {
    let count = (alerts.fatalDeadlines?.length ?? 0) + (alerts.criticalSpider ?? 0) + (alerts.overdueInvoices ?? 0);
    if (briefing && !briefing.was_read && (briefing.urgent_items ?? 0) > 0) {
      count += briefing.urgent_items;
    }
    return count;
  }, [alerts, briefing]);

  // ── Bubble state machine ────────────────────────────────
  useEffect(() => {
    if (panelState === 'guide') {
      setBubbleState('guide');
    } else if (urgentCount > 0) {
      setBubbleState('urgent');
    } else if (isThinking) {
      setBubbleState('speaking');
    } else if (activeSuggestion) {
      setBubbleState('attentive');
    } else {
      setBubbleState('standby');
    }
  }, [panelState, urgentCount, isThinking, activeSuggestion]);

  // ── Load saved drag position from prefs ─────────────────
  useEffect(() => {
    if (userPrefs.position_x != null && userPrefs.position_y != null) {
      setDragPosition({ x: userPrefs.position_x, y: userPrefs.position_y });
    }
  }, [userPrefs.position_x, userPrefs.position_y]);

  // ── Greeting logic (once per day, 2s delay) ─────────────
  // Toggle to true to force greeting for visual verification, then set back to false
  const FORCE_GREETING_TEST = false;

  useEffect(() => {
    if (greetingShownRef.current) return;
    if (panelState !== 'bubble') return;
    if (userPrefs.greeting_enabled === false) return;

    const today = new Date().toISOString().split('T')[0];
    if (!FORCE_GREETING_TEST && userPrefs.last_greeted_date === today) return;

    const timer = setTimeout(() => {
      setShowGreeting(true);
      greetingShownRef.current = true;
      // Auto-hide after 6s
      setTimeout(() => setShowGreeting(false), 6000);
      // Persist greeted date (fire-and-forget)
      savePrefs.mutate({ last_greeted_date: today });
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelState, userPrefs.greeting_enabled, userPrefs.last_greeted_date]);

  // ── Refresh context on route change ─────────────────────
  useEffect(() => {
    if (currentOrganization?.id) {
      queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
    }
  }, [currentPage, currentOrganization?.id, queryClient]);

  // ── Track page views (fire-and-forget) ──────────────────
  useEffect(() => {
    if (!user?.id || userPrefs.learning_enabled === false) return;
    trackEvent('page_view', { page_url: currentPage }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, user?.id]);

  // ── Fetch contextual suggestion on page change ──────────
  useEffect(() => {
    if (!user?.id || userPrefs.suggestions_enabled === false) return;
    if (panelState !== 'bubble') return;

    const fetchSuggestion = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('copilot-suggest', {
          body: {
            page_url: currentPage,
            matter_id: matterId || undefined,
            crm_account_id: crmAccountId || undefined,
          },
        });
        if (error) throw error;
        if (data?.has_suggestion && data.suggestion) {
          setActiveSuggestion(data.suggestion);
        } else {
          setActiveSuggestion(null);
        }
      } catch {
        // non-blocking
      }
    };

    const timer = setTimeout(fetchSuggestion, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, matterId, crmAccountId, user?.id]);

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

  // ── Tracking helper ─────────────────────────────────────
  const trackEvent = useCallback(async (
    event_type: string,
    extra?: Record<string, unknown>
  ) => {
    try {
      await supabase.functions.invoke('copilot-track', {
        body: {
          event_type,
          session_id: getSessionId(),
          page_url: currentPage,
          matter_id: matterId || undefined,
          crm_account_id: crmAccountId || undefined,
          ...extra,
        },
      });
    } catch {
      // fire-and-forget
    }
  }, [currentPage, matterId, crmAccountId]);

  // ── Suggestion actions ──────────────────────────────────
  const actOnSuggestion = useCallback(async (action: 'primary' | 'secondary') => {
    if (!activeSuggestion) return;
    await trackEvent('suggestion_acted', {
      suggestion_id: activeSuggestion.id,
      event_data: { action },
    });
    setActiveSuggestion(null);
  }, [activeSuggestion, trackEvent]);

  const dismissSuggestion = useCallback(async () => {
    if (!activeSuggestion) return;
    await trackEvent('suggestion_dismissed', {
      suggestion_id: activeSuggestion.id,
    });
    setActiveSuggestion(null);
  }, [activeSuggestion, trackEvent]);

  // ── Drag end — persist position ─────────────────────────
  const onDragEnd = useCallback((x: number, y: number) => {
    setDragPosition({ x, y });
    savePrefs.mutate({ position_x: x, position_y: y });
  }, [savePrefs]);

  // ── Mark briefing as read ───────────────────────────────
  const markBriefingRead = useCallback(async () => {
    if (!briefing?.id) return;
    try {
      await supabase
        .from('genius_daily_briefings')
        .update({
          was_read: true,
          read_at: new Date().toISOString(),
          read_by: user?.id,
        })
        .eq('id', briefing.id);
      queryClient.invalidateQueries({ queryKey: ['copilot-context'] });
      trackEvent('briefing_read').catch(() => {});
    } catch (e) {
      console.error('Failed to mark briefing read:', e);
    }
  }, [briefing, user?.id, queryClient, trackEvent]);

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
    trackEvent('guide_started', { event_data: { guide_id: guideId } }).catch(() => {});
  }, [trackEvent]);

  const nextStep = useCallback(() => {
    if (!activeGuide) return;
    const guideSteps = availableGuides.filter((g) => g.guide_id === activeGuide);
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      savePrefs.mutate({ guide_dismissed_id: activeGuide });
      setActiveGuide(null);
      setCurrentStep(0);
      setPanelState('bubble');
      trackEvent('guide_completed', { event_data: { guide_id: activeGuide } }).catch(() => {});
    }
  }, [activeGuide, currentStep, availableGuides, savePrefs, trackEvent]);

  const dismissGuide = useCallback(() => {
    if (activeGuide) {
      savePrefs.mutate({ guide_dismissed_id: activeGuide });
      trackEvent('guide_dismissed', { event_data: { guide_id: activeGuide } }).catch(() => {});
    }
    setActiveGuide(null);
    setCurrentStep(0);
    setPanelState('bubble');
  }, [activeGuide, savePrefs, trackEvent]);

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

  // ── Memory explain query (lazy) ─────────────────────────
  const memoryExplainQuery = useQuery({
    queryKey: ['copilot-memory-explain'],
    queryFn: async (): Promise<MemoryExplanation | null> => {
      const { data, error } = await supabase.functions.invoke('copilot-memory-explain');
      if (error) throw error;
      return data as MemoryExplanation;
    },
    enabled: false, // manually triggered
    staleTime: 5 * 60 * 1000,
  });

  const fetchMemoryExplanation = useCallback(() => {
    memoryExplainQuery.refetch();
  }, [memoryExplainQuery]);

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
    avatarUrl,
    queriesRemaining: config.queriesRemaining,
    queriesUsed: config.queriesUsed,
    queriesLimit: config.queriesLimit,
    features: config.features,

    // Panel state
    panelState,
    setPanelState,

    // Bubble visual state
    bubbleState,

    // Drag
    dragPosition,
    onDragEnd,

    // Greeting
    showGreeting,
    setShowGreeting,

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

    // Suggestions
    activeSuggestion,
    actOnSuggestion,
    dismissSuggestion,

    // User prefs
    userPrefs,
    savePrefs: savePrefs.mutate,

    // Chat
    sendMessage,
    conversationId,
    isThinking,
    setConversationId,

    // Tracking
    trackEvent,

    // Memory / GDPR transparency
    memoryExplanation: memoryExplainQuery.data ?? null,
    isLoadingMemory: memoryExplainQuery.isLoading,
    fetchMemoryExplanation,

    // Loading
    isLoading: contextQuery.isLoading,
  };
}
