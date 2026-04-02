// ============================================================
// GENIUS Ambient Badge — Draggable + alive floating badge
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { GeniusAvatar } from "./GeniusAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGeniusAmbient } from "@/hooks/copilot/useGeniusAmbient";
import { GeniusInsightPanel } from "./GeniusInsightPanel";
import { useIsMobile, useNetworkStatus } from "@/hooks/use-mobile";
import { useGeniusBadgePosition } from "@/hooks/copilot/useGeniusBadgePosition";
import { useGeniusSidebar } from "@/contexts/genius-sidebar-context";

// ── CSS Animations ──────────────────────────────────────────
const BADGE_CSS_ID = "genius-ambient-css-v2";
const BADGE_CSS = `
  /* A) Idle breathing — scale + gold glow + float */
  @keyframes gb-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  @keyframes gb-glow-breathe {
    0%, 100% { box-shadow: 0 2px 12px rgba(0,0,0,0.1), 0 0 0 0 rgba(184,134,11,0.15); }
    50% { box-shadow: 0 2px 12px rgba(0,0,0,0.1), 0 0 14px 4px rgba(184,134,11,0.3); }
  }
  @keyframes gb-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .gb-breathe { animation: gb-breathe 4s ease-in-out infinite; }
  .gb-glow-breathe { animation: gb-glow-breathe 4s ease-in-out infinite; }
  .gb-float { animation: gb-float 3s ease-in-out infinite; }

  /* B) Attention bounce + sonar ring (every 30s) */
  @keyframes gb-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-8px) scale(1.05); }
    60% { transform: translateY(-2px) scale(1.02); }
  }
  @keyframes gb-sonar {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .gb-bounce { animation: gb-bounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1); }
  .gb-sonar {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid rgba(184,134,11,0.5);
    animation: gb-sonar 1s ease-out forwards;
    pointer-events: none;
  }

  /* C) Hover */
  @keyframes gb-hover-tilt {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(3deg); }
  }
  .gb-hover-tilt { animation: gb-hover-tilt 400ms ease-in-out; }

  /* D) Counter wobble */
  @keyframes gb-wobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  .gb-wobble { animation: gb-wobble 500ms ease-in-out 3; }

  /* E) Post-drag celebration */
  @keyframes gb-celebrate {
    0% { transform: scale(1); }
    40% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  .gb-celebrate { animation: gb-celebrate 300ms ease-out; }

  /* F) Contextual borders */
  @keyframes gb-amber-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); }
    50% { box-shadow: 0 0 12px 4px rgba(217,119,6,0.35); }
  }
  .gb-ctx-deadlines { animation: gb-amber-pulse 2s ease-in-out infinite; border-color: #D97706 !important; }
  .gb-ctx-genius { box-shadow: 0 0 12px 4px rgba(5,150,105,0.25); border-color: #059669 !important; }

  /* G) First-visit entrance */
  @keyframes gb-entrance {
    0% { transform: translateX(80px) scale(0.5); opacity: 0; }
    60% { transform: translateX(-8px) scale(1.1); opacity: 1; }
    80% { transform: translateX(4px) scale(0.95); }
    100% { transform: translateX(0) scale(1); opacity: 1; }
  }
  .gb-entrance { animation: gb-entrance 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

  /* Greeting tooltip */
  @keyframes gb-greeting-in {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes gb-greeting-out {
    from { opacity: 1; }
    to { opacity: 0; transform: translateY(4px); }
  }

  /* Hover tooltip */
  @keyframes gb-tooltip-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .gb-tooltip-in { animation: gb-tooltip-in 200ms ease-out forwards; }
  .gb-tooltip-out { animation: gb-greeting-out 200ms ease-out forwards; }

  /* Urgent pulse */
  @keyframes gb-urgent-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    50% { box-shadow: 0 0 14px 4px rgba(220,38,38,0.35); }
  }

  /* Attention pulse (smart reposition) */
  @keyframes gb-attention-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0); }
    50% { box-shadow: 0 0 16px 6px rgba(184,134,11,0.25); }
  }

  @media (prefers-reduced-motion: reduce) {
    .gb-breathe, .gb-glow-breathe, .gb-float,
    .gb-bounce, .gb-wobble, .gb-celebrate,
    .gb-entrance, .gb-hover-tilt,
    .gb-ctx-deadlines, .gb-sonar { animation: none !important; }
  }
`;

const HOVER_MESSAGES = [
  "¿En qué te ayudo?",
  "Tengo ideas para ti ✦",
  "¡Pregúntame algo!",
  "Analicemos tu portfolio",
  "¿Revisamos los plazos?",
];

export function GeniusAmbientBadge() {
  const {
    suggestions,
    unreadCount,
    hasUrgent,
    isLoading,
    preferences,
    userName,
    dismiss,
    markShown,
    markActioned,
  } = useGeniusAmbient();

  const [panelOpen, setPanelOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [hoverMsg, setHoverMsg] = useState<string | null>(null);
  const [showSonar, setShowSonar] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [counterWobble, setCounterWobble] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [firstVisitTooltip, setFirstVisitTooltip] = useState(false);

  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();
  const { setBadgeSide, toggleChat, isOpen: chatIsOpen } = useGeniusSidebar();
  const location = useLocation();
  const badgeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverMsgIdx = useRef(0);
  const prevUnreadRef = useRef(unreadCount);
  const lastInteractionRef = useRef(Date.now());

  const isCompact = preferences.copilot_size === "compact";
  const badgeSize = isCompact ? 44 : isMobile ? 48 : 56;

  // Click callback — passed into hook so pointerUp calls it directly
  const handleBadgeClick = useCallback(() => {
    lastInteractionRef.current = Date.now();
    toggleChat();
  }, [toggleChat]);

  const {
    position,
    isDraggingRef,
    showAttention,
    didDragEnd,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useGeniusBadgePosition(badgeSize, isMobile, handleBadgeClick);

  // Sync badge side to sidebar context
  useEffect(() => {
    setBadgeSide(position.side);
  }, [position.side, setBadgeSide]);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById(BADGE_CSS_ID)) return;
    const style = document.createElement("style");
    style.id = BADGE_CSS_ID;
    style.textContent = BADGE_CSS;
    document.head.appendChild(style);
  }, []);

  // Close insight panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (badgeRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return;
      setPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPanelOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen]);

  // Daily greeting
  useEffect(() => {
    if (!preferences.greeting_enabled || !userName) return;
    const today = new Date().toISOString().slice(0, 10);
    if (preferences.last_greeted_date === today) return;
    const timer = setTimeout(() => {
      setShowGreeting(true);
      setTimeout(() => setShowGreeting(false), 6000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [preferences.greeting_enabled, preferences.last_greeted_date, userName]);

  // B) Attention bounce every 30s if idle
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current < 25_000) return;
      if (chatIsOpen || isDraggingRef.current) return;
      setBouncing(true);
      setShowSonar(true);
      setTimeout(() => setBouncing(false), 700);
      setTimeout(() => setShowSonar(false), 1100);
    }, 30_000);
    return () => clearInterval(interval);
  }, [chatIsOpen, isDraggingRef]);

  // D) Counter wobble on unread increase
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && unreadCount > 0) {
      setCounterWobble(true);
      setTimeout(() => setCounterWobble(false), 1600);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // G) First-visit entrance (session)
  useEffect(() => {
    try {
      if (sessionStorage.getItem("genius-greeted")) return;
      sessionStorage.setItem("genius-greeted", "1");
      setIsFirstVisit(true);
      setTimeout(() => {
        setIsFirstVisit(false);
        setFirstVisitTooltip(true);
        setTimeout(() => setFirstVisitTooltip(false), 3500);
      }, 900);
    } catch { /* noop */ }
  }, []);

  const handleDismiss = useCallback((id: string) => dismiss(id), [dismiss]);
  const handleAction = useCallback((id: string) => { markActioned(id); setPanelOpen(false); }, [markActioned]);
  const handleShown = useCallback((id: string) => markShown(id), [markShown]);

  // Hover handlers
  const onHoverIn = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setHoverMsg(HOVER_MESSAGES[hoverMsgIdx.current % HOVER_MESSAGES.length]);
    hoverMsgIdx.current++;
  }, []);
  const onHoverOut = useCallback(() => setHoverMsg(null), []);

  if (!preferences.copilot_visible) return null;

  // Avatar state
  let avatarState: "idle" | "thinking" | "alert" = "idle";
  if (!isOnline) avatarState = "idle";
  else if (hasUrgent) avatarState = "alert";
  else if (unreadCount > 0) avatarState = "thinking";

  const tooltipText = !isOnline
    ? "GENIUS — sin conexión"
    : `GENIUS — ${unreadCount} insights pendientes`;

  const greetingText = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  })();

  const isLeft = position.side === "left";

  // F) Contextual class based on route
  const pathname = location.pathname;
  let ctxClass = "";
  if (pathname.startsWith("/app/plazos")) ctxClass = "gb-ctx-deadlines";
  else if (pathname.startsWith("/app/genius")) ctxClass = "gb-ctx-genius";

  // Mobile: fixed, no drag
  if (isMobile) {
    return (
      <div ref={badgeRef} className="fixed z-[9999]" style={{ bottom: 80, right: 24 }}>
        <button
          onClick={() => toggleChat()}
          aria-label={tooltipText}
          className={`relative rounded-full flex items-center justify-center cursor-pointer gb-breathe gb-glow-breathe ${ctxClass}`}
          style={{ width: badgeSize, height: badgeSize, borderRadius: "50%", border: "2px solid transparent" }}
        >
          <div className="gb-float w-full h-full">
            <GeniusAvatar variant="genius" size="lg" state={avatarState} showSparkle breathing className="w-full h-full" />
          </div>
          {unreadCount > 0 && (
            <span className={`absolute flex items-center justify-center rounded-full text-white font-bold ${counterWobble ? "gb-wobble" : ""}`}
              style={{ top: -4, right: -4, width: 20, height: 20, fontSize: 11, background: hasUrgent ? "#DC2626" : "#B8860B" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Desktop: draggable + alive
  return (
    <>
      <div
        ref={(node) => {
          (badgeRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          elementRef.current = node;
        }}
        className="fixed z-[9999]"
        style={{ top: 0, left: 0, cursor: "grab", touchAction: "none", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
      >
        {/* Sonar ring */}
        {showSonar && <div className="gb-sonar" />}

        <div
          role="button"
          aria-label={tooltipText}
          className={`relative rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 ${
            bouncing ? "gb-bounce" : didDragEnd ? "gb-celebrate" : isFirstVisit ? "gb-entrance" : "gb-breathe"
          } gb-glow-breathe ${ctxClass}`}
          style={{
            width: badgeSize,
            height: badgeSize,
            border: "2px solid transparent",
            borderRadius: "50%",
            transition: "box-shadow 200ms ease",
            pointerEvents: "none",
          }}
        >
          <div className={`gb-float w-full h-full rounded-full overflow-hidden ${hoverMsg ? "gb-hover-tilt" : ""}`}>
            <GeniusAvatar variant="genius" size="lg" state={avatarState} showSparkle breathing className="w-full h-full" />
          </div>

          {/* Unread counter */}
          {unreadCount > 0 && (
            <span className={`absolute flex items-center justify-center rounded-full text-white font-bold ${counterWobble ? "gb-wobble" : ""}`}
              style={{ top: -4, right: -4, width: 20, height: 20, fontSize: 11, background: hasUrgent ? "#DC2626" : "#B8860B" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* C) Hover personality tooltip */}
        {hoverMsg && !chatIsOpen && !panelOpen && !isDraggingRef.current && (
          <div
            className="absolute gb-tooltip-in"
            style={{
              bottom: badgeSize + 10,
              [isLeft ? "left" : "right"]: 0,
              whiteSpace: "nowrap",
              background: "white",
              border: "1px solid #E7E5E4",
              borderRadius: 10,
              padding: "6px 12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
              fontWeight: 500,
              color: "#0F1729",
              pointerEvents: "none",
            }}
          >
            {hoverMsg}
          </div>
        )}

        {/* G) First-visit tooltip */}
        {firstVisitTooltip && (
          <div
            className="absolute gb-tooltip-in"
            style={{
              bottom: badgeSize + 10,
              [isLeft ? "left" : "right"]: 0,
              whiteSpace: "nowrap",
              background: "white",
              border: "1px solid #E7E5E4",
              borderRadius: 10,
              padding: "8px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 13,
              fontWeight: 600,
              color: "#0F1729",
            }}
          >
            ¡Hola! Soy GENIUS, tu copiloto ✦
          </div>
        )}

        {/* Daily greeting bubble */}
        {showGreeting && !panelOpen && !isDraggingRef.current && (
          <div
            className="absolute"
            style={{
              bottom: badgeSize + 12,
              [isLeft ? "left" : "right"]: 0,
              width: 260,
              background: "white",
              border: "1px solid #E7E5E4",
              borderRadius: 12,
              padding: "12px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              animation: "gb-greeting-in 0.3s ease-out",
            }}
          >
            <p className="text-[13px] font-medium" style={{ color: "#0F1729" }}>
              {greetingText}, {userName}. ✦
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "#78716c" }}>
              Tienes {unreadCount} insight{unreadCount !== 1 ? "s" : ""} pendiente
              {unreadCount !== 1 ? "s" : ""}.
            </p>
          </div>
        )}

        {/* Insight panel */}
        {panelOpen && !isDraggingRef.current && (
          <div
            ref={panelRef}
            className="absolute"
            style={{ bottom: badgeSize + 12, [isLeft ? "left" : "right"]: 0 }}
          >
            <GeniusInsightPanel
              suggestions={suggestions}
              isLoading={isLoading}
              suggestionsEnabled={preferences.suggestions_enabled}
              onClose={() => setPanelOpen(false)}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onShown={handleShown}
            />
          </div>
        )}
      </div>
    </>
  );
}
