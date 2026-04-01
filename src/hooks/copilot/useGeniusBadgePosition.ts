// ============================================================
// useGeniusBadgePosition — Draggable + smart-positioning hook
// Zero React state updates during drag — refs + direct DOM only
// ============================================================

import { useRef, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export interface BadgePosition {
  side: "left" | "right";
  y: number; // px from top
}

const STORAGE_KEY = "genius-badge-position";
const EDGE_PADDING = 16;
const TOP_MIN = 80;
const BOTTOM_MIN = 80;
const DRAG_THRESHOLD = 5;
const MANUAL_DRAG_COOLDOWN = 60_000;

const SMART_POSITIONS: Record<string, BadgePosition> = {
  "/app/expedientes/": { side: "right", y: 0.4 },
  "/app/plazos":       { side: "right", y: 0.3 },
  "/app/genius":       { side: "left",  y: 0.5 },
  "/app/crm":          { side: "right", y: 0.5 },
  "/app/spider":       { side: "right", y: 0.35 },
  "/app/dashboard":    { side: "right", y: 0.7 },
  "/app":              { side: "right", y: 0.7 },
};

function loadPosition(): BadgePosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && (p.side === "left" || p.side === "right") && typeof p.y === "number") return p;
  } catch { /* noop */ }
  return null;
}

function savePosition(pos: BadgePosition) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch { /* noop */ }
}

function clampY(y: number, badgeSize: number): number {
  const maxY = window.innerHeight - BOTTOM_MIN - badgeSize;
  return Math.max(TOP_MIN, Math.min(y, maxY));
}

function getSmartPosition(pathname: string): BadgePosition {
  const sorted = Object.keys(SMART_POSITIONS).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) return SMART_POSITIONS[route];
  }
  return { side: "right", y: 0.6 };
}

export function useGeniusBadgePosition(badgeSize: number, isMobile: boolean, onClickCallback?: () => void) {
  const location = useLocation();

  const defaultPos = loadPosition() ?? { side: "right" as const, y: window.innerHeight * 0.7 };
  // position state — updated ONLY on mount, drag-end, smart-reposition. Never during drag.
  const [position, setPosition] = useState<BadgePosition>(defaultPos);
  const [showAttention, setShowAttention] = useState(false);
  const [didDragEnd, setDidDragEnd] = useState(false); // triggers post-drag celebration

  // All drag state lives in refs — zero re-renders during drag
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragActivatedRef = useRef(false);
  const lastManualDragRef = useRef(0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // for click distance calc
  const onClickRef = useRef(onClickCallback);
  onClickRef.current = onClickCallback;

  const getPixelCoords = useCallback((pos: BadgePosition): { x: number; y: number } => {
    const x = pos.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
    const y = clampY(pos.y, badgeSize);
    return { x, y };
  }, [badgeSize]);

  // Initialize position on mount
  useEffect(() => {
    if (isMobile) return;
    const coords = getPixelCoords(position);
    posRef.current = coords;
    if (elementRef.current) {
      elementRef.current.style.transform = `translate3d(${coords.x}px, ${coords.y}px, 0)`;
    }
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer handlers (zero state updates during drag) ──────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    // Don't call e.preventDefault() — it blocks click events
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    offsetRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
    isDraggingRef.current = false;
    dragActivatedRef.current = false;
  }, [isMobile]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current === null || isMobile) return;

    const newX = e.clientX - offsetRef.current.x;
    const newY = e.clientY - offsetRef.current.y;

    // Check threshold before activating drag
    if (!dragActivatedRef.current) {
      const dx = newX - posRef.current.x;
      const dy = newY - posRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      dragActivatedRef.current = true;
      isDraggingRef.current = true;

      // Apply drag styles directly to DOM — no React state
      const el = elementRef.current;
      if (el) {
        el.style.willChange = "transform";
        el.style.cursor = "grabbing";
      }
      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";
    }

    // RAF-throttled DOM update — no React involved
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const clampedY = clampY(newY, badgeSize);
      posRef.current = { x: newX, y: clampedY };
      if (elementRef.current) {
        elementRef.current.style.transform = `translate3d(${newX}px, ${clampedY}px, 0) scale(1.1)`;
      }
    });
  }, [isMobile, badgeSize]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current === null || isMobile) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    pointerIdRef.current = null;

    document.body.style.userSelect = "";
    document.body.style.touchAction = "";

    const wasDrag = dragActivatedRef.current;
    isDraggingRef.current = false;
    dragActivatedRef.current = false;

    if (!wasDrag) {
      // It was a click! Calculate distance to be sure
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        onClickRef.current?.();
      }
      return;
    }

    // Snap to nearest edge
    const midX = window.innerWidth / 2;
    const side: "left" | "right" = posRef.current.x + badgeSize / 2 < midX ? "left" : "right";
    const finalX = side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
    const finalY = clampY(posRef.current.y, badgeSize);

    const el = elementRef.current;
    if (el) {
      el.style.transition = "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(1)`;

      const cleanup = () => {
        el.style.transition = "";
        el.style.willChange = "";
        el.style.cursor = "grab";
      };
      el.addEventListener("transitionend", cleanup, { once: true });
      setTimeout(cleanup, 350);
    }

    posRef.current = { x: finalX, y: finalY };
    lastManualDragRef.current = Date.now();

    const newPos: BadgePosition = { side, y: finalY };
    setPosition(newPos);
    savePosition(newPos);

    // Trigger post-drag celebration
    setDidDragEnd(true);
    setTimeout(() => setDidDragEnd(false), 400);
  }, [isMobile, badgeSize]);

  // Expose a ref-based check (no state) for click vs drag distinction
  const wasClick = useCallback(() => !dragActivatedRef.current, []);

  // Smart repositioning on route change
  useEffect(() => {
    if (isMobile) return;
    if (Date.now() - lastManualDragRef.current < MANUAL_DRAG_COOLDOWN) return;

    const smart = getSmartPosition(location.pathname);
    const targetY = clampY(Math.round(window.innerHeight * smart.y), badgeSize);
    const targetX = smart.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;

    const el = elementRef.current;
    if (el) {
      el.style.transition = "transform 500ms ease-in-out";
      el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      const onEnd = () => {
        el.style.transition = "";
        setShowAttention(true);
        setTimeout(() => setShowAttention(false), 2000);
      };
      el.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(onEnd, 550);
    }

    posRef.current = { x: targetX, y: targetY };
    const newPos: BadgePosition = { side: smart.side, y: targetY };
    setPosition(newPos);
    savePosition(newPos);
  }, [location.pathname, isMobile, badgeSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-clamp on resize
  useEffect(() => {
    if (isMobile) return;
    const handler = () => {
      const clamped = clampY(posRef.current.y, badgeSize);
      const x = position.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
      posRef.current = { x, y: clamped };
      if (elementRef.current) {
        elementRef.current.style.transform = `translate3d(${x}px, ${clamped}px, 0)`;
      }
      setPosition((p) => ({ ...p, y: clamped }));
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isMobile, badgeSize, position.side]);

  return {
    position,
    isDraggingRef,
    showAttention,
    didDragEnd,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
