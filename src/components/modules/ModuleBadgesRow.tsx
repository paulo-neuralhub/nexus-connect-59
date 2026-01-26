// =============================================
// COMPONENTE: ModuleBadgesRow
// Fila de badges de módulos activos en el header
// =============================================

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModuleBadge } from './ModuleBadge';
import { useModules } from '@/hooks/useModules';
import type { ModuleWithStatus } from '@/types/modules';

// Helper to get Lucide icon by name
function getLucideIcon(iconName: string | null): LucideIcons.LucideIcon {
  if (!iconName) return LucideIcons.Box;
  const icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (typeof icon === 'function') {
    return icon as LucideIcons.LucideIcon;
  }
  return LucideIcons.Box;
}

export function ModuleBadgesRow() {
  const navigate = useNavigate();
  const { 
    modulesWithStatus, 
    isLoading,
  } = useModules();

  // Get all modules to display (active first, then inactive in gray)
  const { activeModules, inactiveModules } = useMemo(() => {
    const active = modulesWithStatus.filter(
      m => m.visual_status === 'active' || m.visual_status === 'trial'
    );
    const inactive = modulesWithStatus.filter(
      m => m.visual_status === 'locked' || m.visual_status === 'unavailable'
    );
    return {
      activeModules: active.slice(0, 6), // Limit active to 6
      inactiveModules: inactive.slice(0, 4), // Show up to 4 inactive
    };
  }, [modulesWithStatus]);

  const handleExploreClick = () => {
    navigate('/app/modules');
  };

  if (isLoading) {
    return (
      <div className="flex h-10 items-center gap-2 border-t border-border/50 px-4">
        <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (activeModules.length === 0 && inactiveModules.length === 0) {
    return (
      <div className="flex h-9 items-center justify-between border-t border-border/50 px-4">
        <p className="text-xs text-muted-foreground">
          No tienes módulos configurados
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExploreClick}
          className="h-6 gap-1 text-xs text-primary"
        >
          <Sparkles className="h-3 w-3" />
          Explorar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-9 items-center gap-2 border-t border-border/50">
      <ScrollArea className="flex-1">
        <div className="flex items-center gap-1 px-4 py-1">
          {/* Active modules first */}
          {activeModules.map((module) => (
            <ModuleBadge
              key={module.code}
              name={module.name}
              shortName={module.short_name}
              icon={getLucideIcon(module.icon_lucide)}
              status={module.visual_status}
              trialDaysRemaining={module.trial_days_remaining}
            />
          ))}
          
          {/* Separator if both exist */}
          {activeModules.length > 0 && inactiveModules.length > 0 && (
            <div className="mx-1 h-4 w-px bg-border" />
          )}
          
          {/* Inactive modules in gray */}
          {inactiveModules.map((module) => (
            <ModuleBadge
              key={module.code}
              name={module.name}
              shortName={module.short_name}
              icon={getLucideIcon(module.icon_lucide)}
              status={module.visual_status}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>

      {/* Link to explore more modules */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExploreClick}
            className="mr-3 h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">Más</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Ver todos los módulos
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
