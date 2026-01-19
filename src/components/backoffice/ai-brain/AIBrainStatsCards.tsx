import { Card, CardContent } from '@/components/ui/card';
import { Cpu, DollarSign, Clock, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AIBrainStatsCardsProps {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgLatency: number;
  p95Latency?: number;
  successRate: number;
  isLoading?: boolean;
}

export function AIBrainStatsCards({
  totalTokens,
  inputTokens,
  outputTokens,
  totalCost,
  avgLatency,
  p95Latency,
  successRate,
  isLoading
}: AIBrainStatsCardsProps) {
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens (Este mes)</p>
              <p className="text-2xl font-bold">{formatTokens(totalTokens)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTokens(inputTokens)} in / {formatTokens(outputTokens)} out
              </p>
            </div>
            <Cpu className="h-8 w-8 text-primary opacity-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coste Total</p>
              <p className="text-2xl font-bold">€{totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Latencia Promedio</p>
              <p className="text-2xl font-bold">{avgLatency > 0 ? `${(avgLatency / 1000).toFixed(1)}s` : 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                P95: {p95Latency ? `${(p95Latency / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary opacity-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </div>
            <Shield className="h-8 w-8 text-primary opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
