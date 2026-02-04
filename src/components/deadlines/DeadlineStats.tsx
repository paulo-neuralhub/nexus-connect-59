// ============================================================
// IP-NEXUS - DEADLINE STATS COMPONENT
// Summary cards for deadline dashboard with NeoBadge
// ============================================================

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NeoBadge } from '@/components/ui/neo-badge';
import type { DeadlineStats } from '@/hooks/useDeadlines';
export type { DeadlineStats };

// Color mapping for deadline stats
const STAT_COLORS: Record<string, string> = {
  overdue: '#ef4444',   // red
  today: '#f59e0b',     // amber
  week: '#f59e0b',      // amber
  month: '#10b981',     // green
};

interface DeadlineStatsCardsProps {
  stats: DeadlineStats;
  isLoading?: boolean;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, color, isActive, onClick }: StatCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all border border-black/[0.06] rounded-[14px] hover:border-[rgba(0,180,216,0.15)] ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      style={{ background: '#f1f4f9' }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <NeoBadge
            value={value}
            color={value > 0 ? color : '#94a3b8'}
            size="md"
          />
          <div>
            <p 
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: '#0a2540' }}
            >
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeadlineStatsCards({ stats, isLoading, activeFilter, onFilterChange }: DeadlineStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} style={{ background: '#f1f4f9' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-[46px] w-[46px] rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="VENCIDOS"
        value={stats.overdue}
        color={STAT_COLORS.overdue}
        isActive={activeFilter === 'overdue'}
        onClick={() => onFilterChange?.('overdue')}
      />
      <StatCard
        label="HOY"
        value={stats.today}
        color={STAT_COLORS.today}
        isActive={activeFilter === 'today'}
        onClick={() => onFilterChange?.('today')}
      />
      <StatCard
        label="7 DÍAS"
        value={stats.thisWeek}
        color={STAT_COLORS.week}
        isActive={activeFilter === 'week'}
        onClick={() => onFilterChange?.('week')}
      />
      <StatCard
        label="30 DÍAS"
        value={stats.thisMonth}
        color={STAT_COLORS.month}
        isActive={activeFilter === 'month'}
        onClick={() => onFilterChange?.('month')}
      />
    </div>
  );
}

// Inline stats for widgets with NeoBadge
export function DeadlineStatsInline({ stats, isLoading }: { stats: DeadlineStats; isLoading?: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-6 w-48" />;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <NeoBadge value={stats.overdue} color={STAT_COLORS.overdue} size="sm" />
        <span className="text-xs text-muted-foreground">vencidos</span>
      </div>
      <div className="flex items-center gap-2">
        <NeoBadge value={stats.today} color={STAT_COLORS.today} size="sm" />
        <span className="text-xs text-muted-foreground">hoy</span>
      </div>
      <div className="flex items-center gap-2">
        <NeoBadge value={stats.thisWeek} color={STAT_COLORS.week} size="sm" />
        <span className="text-xs text-muted-foreground">esta semana</span>
      </div>
    </div>
  );
}
