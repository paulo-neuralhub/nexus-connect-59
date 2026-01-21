import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'amber';
  isLoading?: boolean;
}

const colorClasses = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-accent/10 text-accent-foreground',
  purple: 'bg-secondary/20 text-secondary-foreground',
  amber: 'bg-muted text-muted-foreground',
};

export function KPICard({ title, value, icon: Icon, trend = 0, color, isLoading }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          
          {trend !== 0 && (
            <span className={cn(
              'flex items-center text-sm font-medium',
              trend > 0 ? 'text-accent-foreground' : 'text-destructive'
            )}>
              {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
