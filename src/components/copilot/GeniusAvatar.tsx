// ============================================================
// GeniusAvatar — Reusable AI copilot avatar with CSS animations
// ============================================================

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface GeniusAvatarProps {
  variant?: "nexus" | "genius";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  state?: "idle" | "thinking" | "alert" | "success" | "error" | "greeting";
  breathing?: boolean;
  showSparkle?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  className?: string;
}

const SIZE_MAP = { xs: 24, sm: 32, md: 48, lg: 64, xl: 96 } as const;
const SPARKLE_SIZE = { xs: 10, sm: 12, md: 16, lg: 20, xl: 24 } as const;

const CSS_ID = "genius-avatar-css";
const CSS = `
@keyframes genius-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
@keyframes genius-think-border {
  0%   { border-color: #3B82F6; }
  33%  { border-color: #B8860B; }
  66%  { border-color: #3B82F6; }
  100% { border-color: #B8860B; }
}
@keyframes genius-alert-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
  50%      { box-shadow: 0 0 10px 3px rgba(220,38,38,0.3); }
}
@keyframes genius-success {
  0%   { transform: scale(1); border-color: #059669; }
  30%  { transform: scale(1.08); }
  100% { transform: scale(1); border-color: #059669; }
}
@keyframes genius-greet {
  0%, 100% { transform: translateY(0); }
  25%      { transform: translateY(-3px); }
  50%      { transform: translateY(0); }
  75%      { transform: translateY(-2px); }
}
@keyframes sparkle-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes genius-badge-pop {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.genius-avatar--breathing { animation: genius-breathe 4s ease-in-out infinite; will-change: transform; }
.genius-avatar--idle      { border-color: hsl(var(--border)); }
.genius-avatar--thinking  { animation: genius-breathe 4s ease-in-out infinite, genius-think-border 2s linear infinite; will-change: transform, border-color; }
.genius-avatar--alert     { border-color: #DC2626; animation: genius-breathe 4s ease-in-out infinite, genius-alert-glow 2s ease-in-out infinite; will-change: transform, box-shadow; }
.genius-avatar--success   { border-color: #059669; animation: genius-success 0.6s ease-out forwards; }
.genius-avatar--error     { border-color: #DC2626; opacity: 0.7; animation: none !important; }
.genius-avatar--greeting  { border-color: #B8860B; animation: genius-greet 1s ease-out; }
.genius-sparkle--thinking { animation: sparkle-rotate 2s linear infinite; }
.genius-badge--pop        { animation: genius-badge-pop 0.3s ease-out; }

@media (prefers-reduced-motion: reduce) {
  .genius-avatar--breathing,
  .genius-avatar--thinking,
  .genius-avatar--alert,
  .genius-avatar--greeting { animation: none !important; }
  .genius-sparkle--thinking { animation: none !important; }
  .genius-avatar--thinking { border-color: #B8860B; border-style: dashed; }
  .genius-avatar--alert    { border-color: #DC2626; border-width: 3px; }
  .genius-avatar--success  { border-color: #059669; border-width: 3px; animation: none !important; }
}
`;

export function GeniusAvatar({
  variant = "genius",
  size = "md",
  state = "idle",
  breathing = true,
  showSparkle = true,
  showBadge = false,
  badgeCount = 0,
  className,
}: GeniusAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const prevCount = useRef(badgeCount);
  const [badgePop, setBadgePop] = useState(false);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // Badge pop animation on count change
  useEffect(() => {
    if (badgeCount > 0 && badgeCount !== prevCount.current) {
      setBadgePop(true);
      const t = setTimeout(() => setBadgePop(false), 350);
      prevCount.current = badgeCount;
      return () => clearTimeout(t);
    }
    prevCount.current = badgeCount;
  }, [badgeCount]);

  const px = SIZE_MAP[size];
  const sparklePx = SPARKLE_SIZE[size];
  const imgSrc = variant === "nexus" ? "/assets/copilot-nexus-avatar.jpeg" : "/assets/copilot-genius-avatar.jpeg";
  const initial = variant === "nexus" ? "N" : "G";
  const altText = variant === "nexus" ? "NEXUS copilot" : "GENIUS copilot";

  const stateClass = `genius-avatar--${state}`;
  const breatheClass = breathing && state !== "error" ? "genius-avatar--breathing" : "";

  // If state has its own animation, don't double-apply breathing
  const animClass = state === "idle"
    ? `genius-avatar--idle ${breatheClass}`
    : stateClass;

  const displayCount = badgeCount > 9 ? "9+" : String(badgeCount);

  return (
    <div
      className={cn("relative inline-flex flex-shrink-0", className)}
      style={{ width: px, height: px }}
    >
      {/* Main circle */}
      <div
        className={cn(
          "rounded-full border-2 overflow-hidden bg-[hsl(var(--background-warm,40_20%_98%))]",
          animClass,
        )}
        style={{ width: px, height: px }}
      >
        {imgError ? (
          <div
            className="w-full h-full flex items-center justify-center font-semibold"
            style={{
              background: "#B8860B",
              color: "#0F1729",
              fontSize: px * 0.4,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {initial}
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={altText}
            width={px}
            height={px}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Sparkle overlay */}
      {showSparkle && size !== "xs" && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-white shadow-sm",
            state === "thinking" && "genius-sparkle--thinking",
          )}
          style={{
            width: sparklePx,
            height: sparklePx,
            bottom: 0,
            right: 0,
            fontSize: sparklePx * 0.6,
            color: "#B8860B",
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ✦
        </span>
      )}

      {/* Badge counter */}
      {showBadge && badgeCount > 0 && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full text-white font-bold",
            badgePop && "genius-badge--pop",
          )}
          style={{
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: "0 4px",
            fontSize: 10,
            fontFamily: "Inter, sans-serif",
            background: "#DC2626",
            lineHeight: 1,
          }}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
}
