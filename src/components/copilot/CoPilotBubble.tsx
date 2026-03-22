// ============================================================
// CoPilotBubble — Draggable avatar bubble with 5 visual states
// States: standby, attentive, speaking, urgent, guide
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BubbleVisualState } from '@/hooks/use-copilot';

interface CoPilotBubbleProps {
  isPro: boolean;
  name: string;
  avatarUrl: string;
  urgentCount: number;
  bubbleState: BubbleVisualState;
  showGreeting: boolean;
  greetingText?: string;
  dragPosition: { x: number; y: number } | null;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onDismissGreeting: () => void;
}

// ── Bubble state styling ────────────────────────────────────

const BUBBLE_RING: Record<BubbleVisualState, string> = {
  standby: '',
  attentive: 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-background',
  speaking: 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
  urgent: 'ring-2 ring-destructive/70 ring-offset-2 ring-offset-background',
  guide: 'ring-2 ring-blue-400/60 ring-offset-2 ring-offset-background',
};

const BUBBLE_GLOW: Record<BubbleVisualState, string> = {
  standby: '',
  attentive: '0 0 16px 4px hsla(45, 93%, 47%, 0.25)',
  speaking: '0 0 16px 4px hsla(var(--primary), 0.25)',
  urgent: '0 0 20px 6px hsla(0, 84%, 60%, 0.35)',
  guide: '0 0 16px 4px hsla(217, 91%, 60%, 0.25)',
};

const BREATHE_SPEED: Record<BubbleVisualState, number> = {
  standby: 3,
  attentive: 2,
  speaking: 1.2,
  urgent: 0.8,
  guide: 2.5,
};

// ── Greeting messages ───────────────────────────────────────

function getGreetingMessage(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `¡Buenos días! Soy ${name}, tu asistente.`;
  if (hour < 18) return `¡Buenas tardes! ${name} listo para ayudarte.`;
  return `¡Buenas noches! ${name} a tu servicio.`;
}

// ── Component ───────────────────────────────────────────────

export function CoPilotBubble({
  isPro,
  name,
  avatarUrl,
  urgentCount,
  bubbleState,
  showGreeting,
  greetingText,
  dragPosition,
  onClick,
  onDragEnd,
  onDismissGreeting,
}: CoPilotBubbleProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    moved: false,
  });
  const bubbleRef = useRef<HTMLButtonElement>(null);

  const greeting = greetingText || getGreetingMessage(name);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const breatheSpeed = BREATHE_SPEED[bubbleState];
  const size = isPro ? 56 : 52;

  // ── Drag handlers ───────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, moved: false };
    setIsDragging(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.moved && bubbleRef.current) {
      // Calculate position from bottom-right
      const rect = bubbleRef.current.getBoundingClientRect();
      const x = window.innerWidth - rect.right;
      const y = window.innerHeight - rect.bottom;
      onDragEnd(Math.max(0, x), Math.max(0, y));
    }
    setIsDragging(false);
  }, [onDragEnd]);

  const handleClick = useCallback(() => {
    if (!dragRef.current.moved) {
      onClick();
    }
  }, [onClick]);

  // ── Position style ──────────────────────────────────────
  const positionStyle = dragPosition
    ? { right: dragPosition.x, bottom: dragPosition.y }
    : {};

  return (
    <>
      {/* Greeting tooltip */}
      <AnimatePresence>
        {showGreeting && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute bottom-[72px] right-0 z-50"
            style={positionStyle}
          >
            <div
              className={cn(
                'relative px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium max-w-[240px] cursor-pointer',
                isPro
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-[#1E293B] text-white'
              )}
              onClick={() => {
                onDismissGreeting();
                onClick();
              }}
            >
              {greeting}
              {/* Arrow */}
              <div
                className={cn(
                  'absolute -bottom-1.5 right-5 h-3 w-3 rotate-45',
                  isPro ? 'bg-orange-500' : 'bg-[#1E293B]'
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bubble */}
      <motion.button
        ref={bubbleRef}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{ scale: 0.8, opacity: 0 }}
        whileHover={isDragging ? {} : { scale: 1.08 }}
        whileTap={isDragging ? {} : { scale: 0.95 }}
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          dragRef.current.moved = true;
          setIsDragging(true);
        }}
        onDragEnd={(_, info) => {
          if (bubbleRef.current) {
            const rect = bubbleRef.current.getBoundingClientRect();
            const x = Math.max(0, window.innerWidth - rect.right);
            const y = Math.max(0, window.innerHeight - rect.bottom);
            onDragEnd(x, y);
          }
          setTimeout(() => setIsDragging(false), 100);
        }}
        onClick={handleClick}
        title={name}
        className={cn(
          'relative rounded-full shadow-lg flex items-center justify-center transition-shadow overflow-hidden cursor-grab active:cursor-grabbing',
          BUBBLE_RING[bubbleState],
          isPro
            ? 'hover:shadow-amber-500/30 hover:shadow-xl'
            : 'hover:shadow-xl'
        )}
        style={{
          width: size,
          height: size,
          boxShadow: BUBBLE_GLOW[bubbleState] || undefined,
          animation: `copilot-breathe ${breatheSpeed}s ease-in-out infinite`,
        }}
      >
        {/* Avatar image or fallback */}
        {!avatarError ? (
          <img
            src={avatarUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover rounded-full"
            onError={() => setAvatarError(true)}
            draggable={false}
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center text-sm font-bold text-white',
              isPro
                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                : 'bg-[#1E293B]'
            )}
          >
            {initials}
          </div>
        )}

        {/* Speaking pulse overlay */}
        {bubbleState === 'speaking' && (
          <div className="absolute inset-0 rounded-full bg-white/10 animate-ping pointer-events-none" />
        )}

        {/* PRO badge */}
        {isPro && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-300 text-amber-900 rounded-full shadow-sm z-10">
            PRO
          </span>
        )}

        {/* Urgent badge */}
        {urgentCount > 0 && (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center z-10">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {urgentCount > 9 ? '9+' : urgentCount}
            </span>
          </span>
        )}

        {/* Attentive indicator (subtle pulse dot) */}
        {bubbleState === 'attentive' && urgentCount === 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 z-10">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400 border-2 border-background" />
          </span>
        )}
      </motion.button>

      {/* Breathing animation keyframes */}
      <style>{`
        @keyframes copilot-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </>
  );
}
