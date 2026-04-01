// ============================================================
// GENIUS Ambient Badge — Fixed-position floating badge
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { GeniusAvatar } from "./GeniusAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGeniusAmbient } from "@/hooks/copilot/useGeniusAmbient";
import { GeniusInsightPanel } from "./GeniusInsightPanel";
import { useIsMobile, useNetworkStatus } from "@/hooks/use-mobile";

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
  const badgeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  if (!preferences.copilot_visible) return null;

  const isCompact = preferences.copilot_size === "compact";
  const badgeSize = isCompact ? 44 : isMobile ? 48 : 56;
  const isLeft = preferences.copilot_position === "bottom-left";

  // Badge state
  let badgeAnimation = "genius-breathe 4s ease-in-out infinite";
  let borderColor = "transparent";
  if (!isOnline) {
    badgeAnimation = "none";
    borderColor = "#9CA3AF";
  } else if (hasUrgent) {
    badgeAnimation = "genius-urgent-pulse 2s ease-in-out infinite";
    borderColor = "#DC2626";
  } else if (unreadCount > 0) {
    badgeAnimation = "genius-glow 3s ease-in-out infinite";
    borderColor = "#B8860B";
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

  return (
    <>
      {/* Badge */}
      <div
        ref={badgeRef}
        className="fixed z-50"
        style={{
          bottom: isMobile ? 80 : 24,
          [isLeft ? "left" : "right"]: 24,
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              aria-label={tooltipText}
              className="relative rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
              style={{
                width: badgeSize,
                height: badgeSize,
              }}
            >
              <GeniusAvatar
                variant="genius"
                size="lg"
                state={badgeAnimation ? "thinking" : "idle"}
                showSparkle
                showBadge={false}
                breathing
                className="w-full h-full"
              />

              {/* Unread counter */}
              {unreadCount > 0 && (
                <span
                  className="absolute flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    fontSize: 11,
                    background: hasUrgent ? "#DC2626" : "#B8860B",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>

        {/* Greeting bubble */}
        {showGreeting && !panelOpen && (
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
        {panelOpen && (
          <div
            ref={panelRef}
            className="absolute"
            style={{
              bottom: badgeSize + 12,
              [isLeft ? "left" : "right"]: 0,
              ...(isMobile
                ? { position: "fixed", left: 0, right: 0, bottom: 0 }
                : {}),
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
