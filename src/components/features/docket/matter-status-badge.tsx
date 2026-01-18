import { Badge } from '@/components/ui/badge';
import { MATTER_STATUSES } from '@/lib/constants/matters';
import type { MatterStatus } from '@/types/matters';

interface MatterStatusBadgeProps {
  status: MatterStatus;
}

export function MatterStatusBadge({ status }: MatterStatusBadgeProps) {
  const config = MATTER_STATUSES[status];
  if (!config) return null;
  
  return (
    <Badge 
      variant="outline"
      style={{ 
        backgroundColor: `${config.color}20`, 
        color: config.color,
        borderColor: `${config.color}40`
      }}
    >
      {config.label}
    </Badge>
  );
}
