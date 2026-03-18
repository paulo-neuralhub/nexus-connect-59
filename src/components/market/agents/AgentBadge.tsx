import { 
  Trophy, 
  Zap, 
  BadgeCheck, 
  Shield, 
  Star, 
  FileText, 
  Tag, 
  Languages, 
  Globe,
  LucideIcon
} from 'lucide-react';
import { MarketBadge, BADGE_CONFIG } from '@/types/market-users';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const BADGE_ICONS: Record<string, LucideIcon> = {
  Trophy,
  Zap,
  BadgeCheck,
  Shield,
  Star,
  FileText,
  Tag,
  Languages,
  Globe,
};

interface AgentBadgeProps {
  badge: MarketBadge;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function AgentBadge({ badge, size = 'md', showLabel = true }: AgentBadgeProps) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;
  
  const Icon = BADGE_ICONS[config.icon] || Star;
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  const badgeSizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={cn(
            "gap-1 cursor-default",
            config.bgColor,
            config.color,
            badgeSizes[size]
          )}
        >
          <Icon className={iconSizes[size]} />
          {showLabel && <span>{config.labelEs}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.labelEs}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface AgentBadgeListProps {
  badges: MarketBadge[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AgentBadgeList({ badges, max = 5, size = 'md' }: AgentBadgeListProps) {
  const displayBadges = badges.slice(0, max);
  const remaining = badges.length - max;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge) => (
        <AgentBadge key={badge} badge={badge} size={size} />
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
