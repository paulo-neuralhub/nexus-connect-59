// ============================================================
// IP-NEXUS HELP - FEATURE GUIDE
// Prompt P78: Contextual Help System
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGuideProgress } from "@/hooks/help/useGuideProgress";

export interface FeatureGuideStep {
  title: string;
  description: string;
  image?: string;
}

interface FeatureGuideProps {
  featureKey: string;
  title: string;
  steps: FeatureGuideStep[];
  onComplete?: () => void;
  className?: string;
}

export function FeatureGuide({
  featureKey,
  title,
  steps,
  onComplete,
  className,
}: FeatureGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const completedKey = `guide_completed_${featureKey}`;
  const skippedKey = `guide_skipped_${featureKey}`;

  const { status, enabled: dbEnabled, markCompleted, markSkipped } = useGuideProgress(featureKey);

  // Local fallback (also keeps UX snappy even if offline)
  const [localStatus, setLocalStatus] = useState<"completed" | "skipped" | undefined>(() => {
    if (localStorage.getItem(completedKey) === "true") return "completed";
    if (localStorage.getItem(skippedKey) === "true") return "skipped";
    return undefined;
  });

  const effectiveStatus = dbEnabled ? status : localStatus;

  // If DB says completed/skipped, reflect it locally too.
  useEffect(() => {
    if (!dbEnabled || !status) return;
    if (status === "completed") localStorage.setItem(completedKey, "true");
    if (status === "skipped") localStorage.setItem(skippedKey, "true");
    setLocalStatus(status);
  }, [dbEnabled, status, completedKey, skippedKey]);

  const step = useMemo(() => steps[currentStep], [steps, currentStep]);
  const isLastStep = currentStep === Math.max(0, steps.length - 1);

  if (effectiveStatus || steps.length === 0) return null;

  const handleComplete = () => {
    localStorage.setItem(completedKey, "true");
    setLocalStatus("completed");
    if (dbEnabled) markCompleted();
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(skippedKey, "true");
    setLocalStatus("skipped");
    if (dbEnabled) markSkipped();
  };

  return (
    <Card className={cn("w-full border border-warning/20 bg-warning/10 shadow-sm", className)}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold truncate">{title}</CardTitle>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Paso {currentStep + 1}/{steps.length}
              </span>
            </div>
            {step ? (
              <p className="text-xs text-muted-foreground leading-snug truncate">
                <span className="font-medium text-foreground/90">{step.title}:</span> {step.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
              disabled={currentStep === 0}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {isLastStep ? (
              <Button size="sm" onClick={handleComplete} className="h-8">
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setCurrentStep((c) => Math.min(steps.length - 1, c + 1))}
                className="h-8"
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkip}
              aria-label="Cerrar guía"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
