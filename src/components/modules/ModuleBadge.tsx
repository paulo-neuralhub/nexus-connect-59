// =============================================
// COMPONENTE: ModuleBadge
// Badge individual de módulo con estado visual
// =============================================

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ModuleVisualStatus } from '@/types/modules';

interface ModuleBadgeProps {
  name: string;
  shortName?: string | null;
  icon: LucideIcon;
  status: ModuleVisualStatus;
  trialDaysRemaining?: number;
}

export function ModuleBadge({
  name,
  shortName,
  icon: Icon,
  status,
  trialDaysRemaining,
}: ModuleBadgeProps) {
  const isAccessible = status === 'active' || status === 'trial';
  const isLocked = status === 'locked' || status === 'unavailable';
  const isComingSoon = status === 'coming_soon';

  // Tooltip content based on status
  const getTooltipContent = () => {
    if (status === 'active') return `${name} - Activo`;
    if (status === 'trial') return `${name} - Trial (${trialDaysRemaining} días)`;
    if (status === 'coming_soon') return `${name} - Próximamente`;
    if (status === 'unavailable') return `${name} - No disponible`;
    return `${name} - No incluido en tu plan`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            // Active state - uniform soft blue (primary)
            isAccessible && 'bg-primary/10 text-primary border border-primary/20',
            // Inactive/Locked state - gray
            (isLocked || isComingSoon) && 'bg-muted/60 text-muted-foreground border border-border/50',
          )}
        >
          <Icon className="h-3 w-3 shrink-0" />
          
          <span className="truncate max-w-[70px]">
            {shortName || name}
          </span>

          {/* Trial indicator */}
          {status === 'trial' && trialDaysRemaining !== undefined && (
            <span className="ml-0.5 rounded bg-primary/20 px-1 py-0.5 text-[9px] font-semibold">
              {trialDaysRemaining}d
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}
