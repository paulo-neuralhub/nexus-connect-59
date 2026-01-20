import { CommCategory } from '@/types/legal-ops';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bot, User, AlertCircle } from 'lucide-react';

const CATEGORY_CONFIG: Record<CommCategory, { 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  legal: { 
    label: 'Legal', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50' 
  },
  administrative: { 
    label: 'Admin', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/50' 
  },
  commercial: { 
    label: 'Comercial', 
    color: 'text-purple-700 dark:text-purple-300', 
    bgColor: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50' 
  },
  urgent: { 
    label: 'Urgente', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/50' 
  },
  general: { 
    label: 'General', 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/50' 
  }
};

interface AIClassificationBadgeProps {
  category: CommCategory;
  confidence?: number | null;
  isManual?: boolean;
  size?: 'sm' | 'md';
  showConfidence?: boolean;
}

export function AIClassificationBadge({
  category,
  confidence,
  isManual = false,
  size = 'md',
  showConfidence = true
}: AIClassificationBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  
  const confidenceLevel = confidence 
    ? confidence >= 0.85 ? 'alta' 
      : confidence >= 0.70 ? 'media' 
      : 'baja'
    : null;

  const tooltipContent = isManual 
    ? 'Clasificación manual'
    : `Clasificación automática por IA${confidenceLevel ? ` (confianza ${confidenceLevel})` : ''}. Esta clasificación es una sugerencia y puede editarse.`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary"
            className={`
              ${config.bgColor} ${config.color} 
              ${size === 'sm' ? 'text-xs h-5 px-1.5' : 'text-xs h-6 px-2'}
              cursor-help border-0
            `}
          >
            {isManual ? (
              <User className={size === 'sm' ? 'w-2.5 h-2.5 mr-0.5' : 'w-3 h-3 mr-1'} />
            ) : (
              <Bot className={size === 'sm' ? 'w-2.5 h-2.5 mr-0.5' : 'w-3 h-3 mr-1'} />
            )}
            {config.label}
            {showConfidence && confidence && !isManual && (
              <span className="ml-1 opacity-70">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-start gap-2">
            {!isManual && confidence && confidence < 0.70 && (
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-xs">{tooltipContent}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
