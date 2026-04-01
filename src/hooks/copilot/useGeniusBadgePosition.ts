// ============================================================
// useGeniusBadgePosition — Draggable + smart-positioning hook
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
const MANUAL_DRAG_COOLDOWN = 60_000; // 60s

const SMART_POSITIONS: Record<string, BadgePosition> = {
  "/app/expedientes/": { side: "right", y: 0.4 }, // fraction
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
  // Check specific routes first (longest match)
  const sorted = Object.keys(SMART_POSITIONS).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) {
      return SMART_POSITIONS[route];
    }
  }
  return { side: "right", y: 0.6 };
}

export function useGeniusBadgePosition(badgeSize: number, isMobile: boolean) {
  const location = useLocation();

  // The "rendered" position state — only updated on mount, drag-end, and smart-reposition
  const defaultPos = loadPosition() ?? { side: "right" as const, y: window.innerHeight * 0.7 };
  const [position, setPosition] = useState<BadgePosition>(defaultPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAttention, setShowAttention] = useState(false);

  // Refs for drag math (no re-renders during drag)
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ px: number; py: number; bx: number; by: number } | null>(null);
  const totalDistRef = useRef(0);
  const dragActivatedRef = useRef(false);
  const lastManualDragRef = useRef(0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  // Convert position to pixel coords
  const getPixelCoords = useCallback((pos: BadgePosition): { x: number; y: number } => {
    const x = pos.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
    const y = clampY(pos.y, badgeSize);
    return { x, y };
  }, [badgeSize]);

  // Apply transform to element
  const applyTransform = useCallback((x: number, y: number, scale = 1) => {
    if (!elementRef.current) return;
    elementRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  // Initialize position on mount
  useEffect(() => {
    if (isMobile) return;
    const coords = getPixelCoords(position);
    posRef.current = coords;
    applyTransform(coords.x, coords.y);
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      px: e.clientX,
      py: e.clientY,
      bx: posRef.current.x,
      by: posRef.current.y,
    };
    totalDistRef.current = 0;
    dragActivatedRef.current = false;
  }, [isMobile]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || isMobile) return;
    const dx = e.clientX - dragStartRef.current.px;
    const dy = e.clientY - dragStartRef.current.py;
    totalDistRef.current = Math.sqrt(dx * dx + dy * dy);

    if (totalDistRef.current < DRAG_THRESHOLD) return;

    if (!dragActivatedRef.current) {
      dragActivatedRef.current = true;
      setIsDragging(true);
    }

    const newX = dragStartRef.current.bx + dx;
    const newY = clampY(dragStartRef.current.by + dy, badgeSize);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      posRef.current = { x: newX, y: newY };
      applyTransform(newX, newY, 1.1);
    });
  }, [isMobile, badgeSize, applyTransform]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || isMobile) return;
    const wasDrag = dragActivatedRef.current;
    dragStartRef.current = null;

    if (!wasDrag) {
      setIsDragging(false);
      return; // was a click, handled by onClick
    }

    // Snap to nearest edge
    const midX = window.innerWidth / 2;
    const side: "left" | "right" = posRef.current.x + badgeSize / 2 < midX ? "left" : "right";
    const finalX = side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
    const finalY = clampY(posRef.current.y, badgeSize);

    // Animate snap
    setIsAnimating(true);
    const el = elementRef.current;
    if (el) {
      el.style.transition = "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      applyTransform(finalX, finalY, 1);
      const onEnd = () => {
        el.style.transition = "";
        setIsAnimating(false);
      };
      el.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(onEnd, 350); // fallback
    }

    posRef.current = { x: finalX, y: finalY };
    const newPos: BadgePosition = { side, y: finalY };
    setPosition(newPos);
    savePosition(newPos);
    lastManualDragRef.current = Date.now();
    setIsDragging(false);
  }, [isMobile, badgeSize, applyTransform]);

  // Was the pointer event a click (not a drag)?
  const wasClick = useCallback(() => {
    return !dragActivatedRef.current;
  }, []);

  // Smart repositioning on route change
  useEffect(() => {
    if (isMobile) return;
    if (Date.now() - lastManualDragRef.current < MANUAL_DRAG_COOLDOWN) return;

    const smart = getSmartPosition(location.pathname);
    // Convert fraction y to pixels
    const targetY = clampY(Math.round(window.innerHeight * smart.y), badgeSize);
    const targetX = smart.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;

    const newPos: BadgePosition = { side: smart.side, y: targetY };

    // Animate
    const el = elementRef.current;
    if (el) {
      setIsAnimating(true);
      el.style.transition = "transform 500ms ease-in-out";
      applyTransform(targetX, targetY);
      const onEnd = () => {
        el.style.transition = "";
        setIsAnimating(false);
        // Attention pulse
        setShowAttention(true);
        setTimeout(() => setShowAttention(false), 2000);
      };
      el.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(onEnd, 550);
    }

    posRef.current = { x: targetX, y: targetY };
    setPosition(newPos);
    savePosition(newPos);
  }, [location.pathname, isMobile, badgeSize, applyTransform]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-clamp on resize
  useEffect(() => {
    if (isMobile) return;
    const handler = () => {
      const clamped = clampY(posRef.current.y, badgeSize);
      const x = position.side === "left" ? EDGE_PADDING : window.innerWidth - badgeSize - EDGE_PADDING;
      posRef.current = { x, y: clamped };
      applyTransform(x, clamped);
      setPosition((p) => ({ ...p, y: clamped }));
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isMobile, badgeSize, position.side, applyTransform]);

  return {
    position,
    isDragging,
    isAnimating,
    showAttention,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    wasClick,
  };
}
