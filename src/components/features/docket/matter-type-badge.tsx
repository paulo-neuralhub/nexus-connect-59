import { Badge } from '@/components/ui/badge';
import { MATTER_TYPES } from '@/lib/constants/matters';
import type { MatterType } from '@/types/matters';
import { Tag, Lightbulb, Palette, Globe, Copyright, File, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Tag,
  Lightbulb,
  Palette,
  Globe,
  Copyright,
  File,
};

interface MatterTypeBadgeProps {
  type: MatterType;
}

export function MatterTypeBadge({ type }: MatterTypeBadgeProps) {
  const config = MATTER_TYPES[type];
  if (!config) return null;
  
  const Icon = iconMap[config.icon];
  
  return (
    <Badge 
      variant="outline"
      style={{ 
        backgroundColor: `${config.color}20`, 
        color: config.color,
        borderColor: `${config.color}40`
      }}
      className="gap-1"
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
