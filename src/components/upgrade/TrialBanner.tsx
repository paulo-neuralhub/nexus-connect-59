/**
 * TRIAL BANNER
 * Shows trial status and days remaining using tenant_feature_flags
 */

import { useTenantFeatureFlags } from "@/hooks/use-module-access";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { ModuleCode } from "@/lib/modules/module-registry";

export function TrialBanner() {
  const navigate = useNavigate();
  const { data: flags } = useTenantFeatureFlags();

  if (!flags?.is_in_trial || !flags?.trial_ends_at) return null;

  const daysLeft = Math.ceil(
    (new Date(flags.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 3;

  return (
    <div 
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 text-sm",
        isUrgent 
          ? "bg-destructive/10 text-destructive border-b border-destructive/20"
          : "bg-primary/10 text-primary border-b border-primary/20"
      )}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span>
          Tu período de prueba termina en{" "}
          <strong>{daysLeft} día{daysLeft !== 1 ? 's' : ''}</strong>
        </span>
      </div>

      <Button 
        size="sm" 
        variant={isUrgent ? "destructive" : "default"}
        onClick={() => navigate('/app/settings/billing')}
      >
        <Sparkles className="h-4 w-4 mr-1" />
        Actualizar ahora
      </Button>
    </div>
  );
}

/**
 * Module-specific trial indicator
 */
interface ModuleTrialIndicatorProps {
  moduleCode: ModuleCode;
  className?: string;
}

export function ModuleTrialIndicator({ moduleCode, className }: ModuleTrialIndicatorProps) {
  const { data: flags } = useTenantFeatureFlags();

  if (!flags?.is_in_trial || !flags?.trial_ends_at) return null;

  const daysLeft = Math.ceil(
    (new Date(flags.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 3;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
        isUrgent 
          ? "bg-destructive/10 text-destructive"
          : "bg-yellow-500/10 text-yellow-600",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {daysLeft}d restantes
    </div>
  );
}
