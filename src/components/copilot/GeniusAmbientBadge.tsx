// ============================================================
// GENIUS Ambient Badge — Draggable + context-aware floating badge
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { GeniusAvatar } from "./GeniusAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGeniusAmbient } from "@/hooks/copilot/useGeniusAmbient";
import { GeniusInsightPanel } from "./GeniusInsightPanel";
import { useIsMobile, useNetworkStatus } from "@/hooks/use-mobile";
import { useGeniusBadgePosition } from "@/hooks/copilot/useGeniusBadgePosition";
import { useGeniusSidebar } from "@/contexts/genius-sidebar-context";

const BADGE_CSS_ID = "genius-ambient-css";
const BADGE_CSS = `
  @keyframes genius-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  @keyframes genius-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0); }
    50% { box-shadow: 0 0 12px 4px rgba(184,134,11,0.3); }
  }
  @keyframes genius-urgent-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    50% { box-shadow: 0 0 14px 4px rgba(220,38,38,0.35); }
  }
  @keyframes genius-thinking {
    0% { border-color: #3B82F6; }
    33% { border-color: #B8860B; }
    66% { border-color: #3B82F6; }
    100% { border-color: #B8860B; }
  }
  @keyframes genius-greeting-in {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes genius-attention-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0); }
    50% { box-shadow: 0 0 16px 6px rgba(184,134,11,0.25); }
  }
  @media (prefers-reduced-motion: reduce) {
    .genius-badge, .genius-badge-glow, .genius-badge-urgent {
      animation: none !important;
    }
  }
`;

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
  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();
  const { setBadgeSide, toggleChat } = useGeniusSidebar();
  const badgeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isCompact = preferences.copilot_size === "compact";
  const badgeSize = isCompact ? 44 : isMobile ? 48 : 56;

  const {
    position,
    isDraggingRef,
    showAttention,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    wasClick,
  } = useGeniusBadgePosition(badgeSize, isMobile);

  // Sync badge side to sidebar context
  useEffect(() => {
    setBadgeSide(position.side);
  }, [position.side, setBadgeSide]);

  // Inject CSS
  useEffect(() => {
    if (document.getElementById(BADGE_CSS_ID)) return;
    const style = document.createElement("style");
    style.id = BADGE_CSS_ID;
    style.textContent = BADGE_CSS;
    document.head.appendChild(style);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        badgeRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen]);

  // Daily greeting
  useEffect(() => {
    if (!preferences.greeting_enabled || !userName) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastGreeted = preferences.last_greeted_date;
    if (lastGreeted === today) return;

    const timer = setTimeout(() => {
      setShowGreeting(true);
      setTimeout(() => setShowGreeting(false), 6000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [preferences.greeting_enabled, preferences.last_greeted_date, userName]);

  const handleDismiss = useCallback((id: string) => dismiss(id), [dismiss]);
  const handleAction = useCallback((id: string) => {
    markActioned(id);
    setPanelOpen(false);
  }, [markActioned]);
  const handleShown = useCallback((id: string) => markShown(id), [markShown]);

  const handleClick = useCallback(() => {
    if (!wasClick()) return; // was a drag, ignore
    setPanelOpen((v) => !v);
  }, [wasClick]);

  if (!preferences.copilot_visible) return null;

  // Badge state animation (applied to the inner avatar wrapper)
  let avatarState: "idle" | "thinking" | "alert" = "idle";
  if (!isOnline) {
    avatarState = "idle";
  } else if (hasUrgent) {
    avatarState = "alert";
  } else if (unreadCount > 0) {
    avatarState = "thinking";
  }

  const tooltipText = !isOnline
    ? "GENIUS — sin conexión"
    : `GENIUS — ${unreadCount} insights pendientes`;

  const greetingText = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  })();

  const isLeft = position.side === "left";

  // Mobile: fixed bottom-right, no dragging
  if (isMobile) {
    return (
      <>
        <div
          ref={badgeRef}
          className="fixed z-[9999]"
          style={{ bottom: 80, right: 24 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                aria-label={tooltipText}
                className="relative rounded-full flex items-center justify-center cursor-pointer"
                style={{ width: badgeSize, height: badgeSize }}
              >
                <GeniusAvatar variant="genius" size="lg" state={avatarState} showSparkle breathing className="w-full h-full" />
                {unreadCount > 0 && (
                  <span className="absolute flex items-center justify-center rounded-full text-white font-bold"
                    style={{ top: -4, right: -4, width: 20, height: 20, fontSize: 11, background: hasUrgent ? "#DC2626" : "#B8860B" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">{tooltipText}</TooltipContent>
          </Tooltip>
          {panelOpen && (
            <div ref={panelRef} style={{ position: "fixed", left: 0, right: 0, bottom: 0 }}>
              <GeniusInsightPanel suggestions={suggestions} isLoading={isLoading} suggestionsEnabled={preferences.suggestions_enabled}
                onClose={() => setPanelOpen(false)} onDismiss={handleDismiss} onAction={handleAction} onShown={handleShown} />
            </div>
          )}
        </div>
      </>
    );
  }

  // Desktop: draggable badge
  return (
    <>
      <div
        ref={(node) => {
          (badgeRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          elementRef.current = node;
        }}
        className="fixed z-[9999]"
        style={{
          top: 0,
          left: 0,
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              aria-label={tooltipText}
              className="relative rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
              style={{
                width: badgeSize,
                height: badgeSize,
                boxShadow: isDragging
                  ? "0 8px 32px rgba(0,0,0,0.2)"
                  : showAttention
                  ? undefined
                  : "0 2px 12px rgba(0,0,0,0.1)",
                animation: showAttention ? "genius-attention-pulse 1s ease-in-out 2" : undefined,
                transition: "box-shadow 200ms ease",
              }}
            >
              <GeniusAvatar variant="genius" size="lg" state={avatarState} showSparkle breathing className="w-full h-full" />
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center rounded-full text-white font-bold"
                  style={{ top: -4, right: -4, width: 20, height: 20, fontSize: 11, background: hasUrgent ? "#DC2626" : "#B8860B" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {!isDragging && (
            <TooltipContent side={isLeft ? "right" : "left"} className="text-xs">
              {tooltipText}
            </TooltipContent>
          )}
        </Tooltip>

        {/* Greeting bubble */}
        {showGreeting && !panelOpen && !isDragging && (
          <div
            className="absolute bg-white border border-[#E7E5E4] rounded-xl px-4 py-3 shadow-lg"
            style={{
              bottom: badgeSize + 12,
              [isLeft ? "left" : "right"]: 0,
              width: 260,
              animation: "genius-greeting-in 0.3s ease-out",
            }}
          >
            <p className="text-[13px] font-medium text-[#0F1729]">
              {greetingText}, {userName}. ✦
            </p>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Tienes {unreadCount} insight{unreadCount !== 1 ? "s" : ""} pendiente
              {unreadCount !== 1 ? "s" : ""}.
            </p>
          </div>
        )}

        {/* Panel */}
        {panelOpen && !isDragging && (
          <div
            ref={panelRef}
            className="absolute"
            style={{
              bottom: badgeSize + 12,
              [isLeft ? "left" : "right"]: 0,
            }}
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
