// ============================================================
// CoPilotGuide — Step-by-step guide with avatar movement
// Avatar physically moves near target elements via CSS transitions
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronRight, SkipForward } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCopilot, type GuideStep } from '@/hooks/use-copilot';

// ── Avatar position calculator ──────────────────────────────

function calcAvatarPosition(selector: string | null): { x: number; y: number } | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const avatarSize = 60;
  const gap = 12;

  let x = rect.right + gap;
  let y = rect.top + (rect.height / 2) - (avatarSize / 2);

  // If overflows right, place left
  if (x + avatarSize > window.innerWidth - 16) {
    x = rect.left - avatarSize - gap;
  }
  // Clamp vertically
  y = Math.max(12, Math.min(y, window.innerHeight - avatarSize - 12));
  // Clamp horizontally
  x = Math.max(12, x);

  return { x, y };
}

// ── Tooltip position calculator ─────────────────────────────

function calcTooltipPosition(
  targetRect: DOMRect | null,
  avatarPos: { x: number; y: number } | null
): { top: number; left: number } {
  if (targetRect) {
    return {
      top: Math.min(targetRect.bottom + 16, window.innerHeight - 240),
      left: Math.min(Math.max(targetRect.left, 16), window.innerWidth - 340),
    };
  }
  if (avatarPos) {
    return { top: avatarPos.y + 72, left: Math.max(16, avatarPos.x - 120) };
  }
  return { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 };
}

export function CoPilotGuide() {
  const {
    activeGuide,
    currentStep,
    guideSteps,
    nextStep,
    dismissGuide,
    isPro,
    name,
    avatarUrl,
    panelState,
  } = useCopilot();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [avatarPos, setAvatarPos] = useState<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const step: GuideStep | undefined = guideSteps[currentStep];

  // Find target, move avatar, apply highlight
  useEffect(() => {
    // Clean up previous highlight
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!step?.target_selector) {
      setTargetRect(null);
      setAvatarPos(null);
      return;
    }

    const findAndHighlight = () => {
      const el = document.querySelector(step.target_selector!);
      if (!el) {
        setTargetRect(null);
        setAvatarPos(null);
        return;
      }

      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate avatar position near target
      const pos = calcAvatarPosition(step.target_selector);
      setAvatarPos(pos);

      // Apply highlight class
      el.classList.add('copilot-guide-highlight');
      cleanupRef.current = () => el.classList.remove('copilot-guide-highlight');
    };

    // Initial find + poll for dynamic elements
    findAndHighlight();
    const interval = setInterval(findAndHighlight, 800);

    return () => {
      clearInterval(interval);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [step?.target_selector, currentStep]);

  if (panelState !== 'guide' || !activeGuide || !step) return null;

  const totalSteps = guideSteps.length;
  const isLast = currentStep >= totalSteps - 1;
  const tooltipPos = calcTooltipPosition(targetRect, avatarPos);

  return (
    <>
      {/* Guide highlight CSS */}
      <style>{`
        .copilot-guide-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px ${isPro ? '#F59E0B' : '#1E293B'}, 
                      0 0 0 8px ${isPro ? 'rgba(245,158,11,0.3)' : 'rgba(30,41,59,0.3)'};
          border-radius: inherit;
          transition: box-shadow 300ms ease;
        }
      `}</style>

      {/* Overlay backdrop */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-foreground/40 pointer-events-auto"
          onClick={dismissGuide}
        />

        {/* Highlight cutout ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              borderRadius: 8,
              boxShadow: `0 0 0 4000px rgba(0,0,0,0.4), 0 0 0 3px ${isPro ? '#F59E0B' : '#1E293B'}`,
              zIndex: 51,
            }}
          />
        )}

        {/* Floating avatar — moves physically */}
        {avatarPos && (
          <motion.div
            className="absolute z-[53] pointer-events-none"
            animate={{ x: avatarPos.x, y: avatarPos.y }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, duration: 0.6 }}
            style={{ width: 60, height: 60 }}
          >
            <div
              className={cn(
                'w-[60px] h-[60px] rounded-full overflow-hidden border-2 shadow-lg',
                isPro ? 'border-amber-400' : 'border-[#1E293B]',
                'opacity-60'
              )}
            >
              <GuideAvatar src={avatarUrl} name={name} />
            </div>
            {/* Pulse ring */}
            <div
              className={cn(
                'absolute inset-0 rounded-full animate-ping',
                isPro ? 'border-2 border-amber-400/40' : 'border-2 border-[#1E293B]/40'
              )}
              style={{ animationDuration: '2s' }}
            />
          </motion.div>
        )}

        {/* Guide tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-[52] pointer-events-auto w-80 rounded-xl shadow-2xl border bg-background overflow-hidden"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between px-4 py-2.5',
              isPro
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-[#1E293B] text-white'
            )}
          >
            <div className="flex items-center gap-2">
              <GuideAvatar src={avatarUrl} name={name} size={24} />
              <span className="text-sm font-semibold">{name}</span>
            </div>
            <button
              onClick={dismissGuide}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {step.title}
            </h4>
            {step.copilot_message && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.copilot_message}
              </p>
            )}

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-3 mb-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full flex-1 transition-colors',
                    i <= currentStep
                      ? isPro
                        ? 'bg-amber-500'
                        : 'bg-[#1E293B]'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Paso {currentStep + 1} de {totalSteps}
              </span>
              <div className="flex items-center gap-2">
                {step.is_skippable && !isLast && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={dismissGuide}
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Saltar
                  </Button>
                )}
                <Button
                  size="sm"
                  className={cn(
                    'h-7 text-xs',
                    isPro
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-[#1E293B] hover:bg-[#334155] text-white'
                  )}
                  onClick={nextStep}
                >
                  {isLast ? 'Terminar' : 'Siguiente'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Guide Avatar (small helper) ─────────────────────────────

function GuideAvatar({
  src,
  name,
  size = 60,
}: {
  src: string;
  name: string;
  size?: number;
}) {
  const [error, setError] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (error || !src) {
    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-full h-full object-cover rounded-full"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
      draggable={false}
    />
  );
}
