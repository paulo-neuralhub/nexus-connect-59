// ============================================================
// CoPilotGuide — Step-by-step guide overlay
// Highlights UI elements and shows contextual copilot messages
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { Compass, Sparkles, X, ChevronRight, SkipForward } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCopilot, type GuideStep } from '@/hooks/use-copilot';

export function CoPilotGuide() {
  const {
    activeGuide,
    currentStep,
    guideSteps,
    nextStep,
    dismissGuide,
    isPro,
    name,
    panelState,
  } = useCopilot();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step: GuideStep | undefined = guideSteps[currentStep];

  // Find and highlight the target element
  useEffect(() => {
    if (!step?.target_selector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(step.target_selector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    return () => clearInterval(interval);
  }, [step?.target_selector, currentStep]);

  if (panelState !== 'guide' || !activeGuide || !step) return null;

  const totalSteps = guideSteps.length;
  const isLast = currentStep >= totalSteps - 1;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dark overlay with cutout */}
        <div className="absolute inset-0 bg-foreground/40 pointer-events-auto" onClick={dismissGuide} />

        {/* Highlight ring around target */}
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

        {/* Guide tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            'absolute z-[52] pointer-events-auto',
            'w-80 rounded-xl shadow-2xl border bg-background overflow-hidden'
          )}
          style={{
            top: targetRect
              ? Math.min(targetRect.bottom + 16, window.innerHeight - 220)
              : '50%',
            left: targetRect
              ? Math.min(Math.max(targetRect.left, 16), window.innerWidth - 340)
              : '50%',
            transform: targetRect ? undefined : 'translate(-50%, -50%)',
          }}
        >
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between px-4 py-2.5',
            isPro
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
              : 'bg-[#1E293B] text-white'
          )}>
            <div className="flex items-center gap-2">
              {isPro ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Compass className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">{name}</span>
            </div>
            <button onClick={dismissGuide} className="p-1 hover:bg-white/10 rounded">
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

            {/* Progress */}
            <div className="flex items-center gap-1.5 mt-3 mb-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full flex-1 transition-colors',
                    i <= currentStep
                      ? isPro ? 'bg-amber-500' : 'bg-[#1E293B]'
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
