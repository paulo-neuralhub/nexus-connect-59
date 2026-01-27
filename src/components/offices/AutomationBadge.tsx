// src/components/offices/AutomationBadge.tsx
// User-friendly automation indicator for IP offices

import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Bot, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTOMATION_CONFIG = {
  A: { 
    label: 'Totalmente automatizado',
    shortLabel: '100%',
    bgColor: 'bg-green-100 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    barColor: 'bg-green-500',
    icon: Zap,
  },
  B: { 
    label: 'Altamente automatizado',
    shortLabel: '75%',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    barColor: 'bg-emerald-500',
    icon: Bot,
  },
  C: { 
    label: 'Parcialmente automatizado',
    shortLabel: '50%',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    barColor: 'bg-yellow-500',
    icon: AlertTriangle,
  },
  D: { 
    label: 'Automatización básica',
    shortLabel: '25%',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    barColor: 'bg-orange-500',
    icon: AlertTriangle,
  },
  E: { 
    label: 'Requiere acción manual',
    shortLabel: '0%',
    bgColor: 'bg-red-100 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    barColor: 'bg-red-500',
    icon: X,
  },
} as const;

interface Capability {
  available: boolean;
  method: 'api' | 'web' | 'manual';
  notes?: string;
}

interface AutomationBadgeProps {
  level: 'A' | 'B' | 'C' | 'D' | 'E';
  percentage: number;
  capabilities?: Record<string, Capability>;
  variant?: 'badge' | 'bar' | 'compact';
  showTooltip?: boolean;
}

const CAPABILITY_LABELS_USER: Record<string, string> = {
  filing: 'Solicitudes automáticas',
  search: 'Búsqueda integrada',
  payment: 'Pagos online',
  documentUpload: 'Subida de documentos',
  statusTracking: 'Seguimiento automático',
  renewal: 'Renovaciones',
  opposition: 'Oposiciones',
  niceClassification: 'Clasificación Nice',
};

export function AutomationBadge({ 
  level, 
  percentage, 
  capabilities = {},
  variant = 'badge',
  showTooltip = true,
}: AutomationBadgeProps) {
  const config = AUTOMATION_CONFIG[level] || AUTOMATION_CONFIG.E;
  const Icon = config.icon;

  // Categorize capabilities for user display
  const automated = Object.entries(capabilities)
    .filter(([_, cap]) => cap?.available && cap?.method === 'api')
    .map(([key]) => CAPABILITY_LABELS_USER[key] || key);

  const semiAutomated = Object.entries(capabilities)
    .filter(([_, cap]) => cap?.available && cap?.method === 'web')
    .map(([key]) => CAPABILITY_LABELS_USER[key] || key);

  const manual = Object.entries(capabilities)
    .filter(([_, cap]) => !cap?.available || cap?.method === 'manual')
    .map(([key]) => CAPABILITY_LABELS_USER[key] || key);

  const content = (
    <div className="space-y-3 max-w-xs">
      <div className="font-medium flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', config.barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {percentage}% automatizado
        </p>
      </div>

      {/* What you can do from IP-NEXUS */}
      {automated.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-600 mb-1">
            ✓ Puedes hacer desde IP-NEXUS:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {automated.map(item => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Semi-automated */}
      {semiAutomated.length > 0 && (
        <div>
          <p className="text-xs font-medium text-yellow-600 mb-1">
            ⚡ Generamos documentos para:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {semiAutomated.map(item => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual */}
      {manual.length > 0 && level !== 'A' && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            ✎ Requiere acción manual:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {manual.slice(0, 3).map(item => (
              <li key={item}>• {item}</li>
            ))}
            {manual.length > 3 && (
              <li className="text-muted-foreground/70">
                +{manual.length - 3} más
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  // Badge variant
  if (variant === 'badge') {
    const badge = (
      <Badge 
        variant="outline"
        className={cn(
          'text-xs font-medium gap-1 cursor-default',
          config.bgColor,
          config.textColor,
          config.borderColor,
        )}
      >
        <Icon className="h-3 w-3" />
        {config.shortLabel}
      </Badge>
    );

    if (!showTooltip) return badge;

    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="p-3 bg-popover border shadow-lg"
          >
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Bar variant (for cards)
  if (variant === 'bar') {
    const bar = (
      <div className="space-y-1 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className={cn('font-medium', config.textColor)}>
            {config.label}
          </span>
          <span className={config.textColor}>{percentage}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', config.barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );

    if (!showTooltip) return bar;

    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="cursor-default">{bar}</div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="p-3 bg-popover border shadow-lg"
          >
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-medium cursor-default',
            config.textColor,
          )}>
            <Icon className="h-3.5 w-3.5" />
            {percentage}%
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="p-3 bg-popover border shadow-lg"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
