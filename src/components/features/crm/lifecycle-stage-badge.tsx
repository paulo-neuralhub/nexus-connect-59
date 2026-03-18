import { Badge } from '@/components/ui/badge';
import { LIFECYCLE_STAGES } from '@/lib/constants/crm';
import type { LifecycleStage } from '@/types/crm';

interface Props {
  stage: LifecycleStage | string;
  size?: 'sm' | 'default';
}

export function LifecycleStageBadge({ stage, size = 'default' }: Props) {
  const config = LIFECYCLE_STAGES[stage as LifecycleStage] || { 
    label: stage, 
    color: '#6B7280' 
  };

  return (
    <Badge 
      variant="secondary"
      className={size === 'sm' ? 'text-xs px-1.5 py-0' : ''}
      style={{ 
        backgroundColor: `${config.color}20`,
        color: config.color,
        borderColor: `${config.color}40`,
      }}
    >
      {config.label}
    </Badge>
  );
}
