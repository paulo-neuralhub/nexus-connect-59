import { TrendingUp, Users, Phone, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { ProfessionalCard, CardHeader } from '@/components/ui/professional-card';
import type { BackofficeVoipGlobalStats } from '@/types/voip';
import { formatEur } from './format';

export function VoipOverviewTab({ stats, isLoading }: { stats: BackofficeVoipGlobalStats | null; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <div className={cn('grid gap-4', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}>
        <StatCard
          label="Organizaciones activas"
          value={isLoading ? '…' : String(stats?.active_organizations ?? 0)}
          icon={Users}
          variant="blue"
        />
        <StatCard
          label="Llamadas (mes)"
          value={isLoading ? '…' : String(stats?.total_calls ?? 0)}
          icon={Phone}
          variant="purple"
        />
        <StatCard
          label="Coste (Twilio)"
          value={isLoading ? '…' : formatEur(stats?.total_cost_cents ?? 0)}
          icon={DollarSign}
          variant="orange"
        />
        <StatCard
          label="Margen (mes)"
          value={isLoading ? '…' : formatEur(stats?.total_margin_cents ?? 0)}
          icon={TrendingUp}
          variant="emerald"
          change={`${stats?.margin_percentage ?? 0}%`}
        />
      </div>

      <ProfessionalCard>
        <CardHeader title="Rentabilidad mensual" subtitle="Resumen del periodo actual" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Coste total</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{formatEur(stats?.total_cost_cents ?? 0)}</div>
          </div>
          <div className="rounded-xl border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Ingresos</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{formatEur(stats?.total_revenue_cents ?? 0)}</div>
          </div>
          <div className="rounded-xl border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Beneficio</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{formatEur(stats?.total_margin_cents ?? 0)}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stats?.margin_percentage ?? 0}% margen</div>
          </div>
        </div>
      </ProfessionalCard>
    </div>
  );
}
