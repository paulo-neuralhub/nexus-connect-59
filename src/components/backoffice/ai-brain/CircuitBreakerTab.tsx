import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Shield } from 'lucide-react';
import { AICircuitBreakerState, AIProvider } from '@/types/ai-brain.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CircuitBreakerTabProps {
  circuitStates: AICircuitBreakerState[];
  providers: AIProvider[];
  isLoading: boolean;
  onReset: (providerId: string) => void;
  onForceOpen: (providerId: string) => void;
}

export function CircuitBreakerTab({ 
  circuitStates, 
  providers,
  isLoading, 
  onReset,
  onForceOpen 
}: CircuitBreakerTabProps) {
  const getCircuitBadge = (state: string) => {
    switch (state) {
      case 'closed':
        return <Badge className="bg-green-500/10 text-green-600">🟢 CLOSED</Badge>;
      case 'half_open':
        return <Badge className="bg-yellow-500/10 text-yellow-600">🟡 HALF-OPEN</Badge>;
      case 'open':
        return <Badge className="bg-red-500/10 text-red-600">🔴 OPEN</Badge>;
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

  const getProviderName = (providerId: string | null | undefined) => {
    if (!providerId) return 'Unknown';
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Circuit Breaker Status</CardTitle>
          <CardDescription>Monitoreo en tiempo real del estado de los circuitos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit Breaker Status</CardTitle>
        <CardDescription>Monitoreo en tiempo real del estado de los circuitos</CardDescription>
      </CardHeader>
      <CardContent>
        {circuitStates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay circuit breakers configurados</p>
            <p className="text-sm">Los circuit breakers se crean automáticamente por provider</p>
          </div>
        ) : (
          <div className="space-y-4">
            {circuitStates.map((circuit) => (
              <div key={circuit.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{getProviderName(circuit.provider_id)}</span>
                    {getCircuitBadge(circuit.state)}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onReset(circuit.provider_id!)}
                      disabled={circuit.state === 'closed'}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onForceOpen(circuit.provider_id!)}
                      disabled={circuit.state === 'open'}
                    >
                      Force Open
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="font-medium">{circuit.total_requests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failures</p>
                    <p className={`font-medium ${circuit.total_failures > 0 ? 'text-destructive' : ''}`}>
                      {circuit.total_failures}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Latency</p>
                    <p className="font-medium">
                      {circuit.avg_latency_ms ? `${(circuit.avg_latency_ms / 1000).toFixed(2)}s` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">P95 Latency</p>
                    <p className="font-medium">
                      {circuit.p95_latency_ms ? `${(circuit.p95_latency_ms / 1000).toFixed(2)}s` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Failure</p>
                    <p className="font-medium text-sm">
                      {circuit.last_failure_at 
                        ? formatDistanceToNow(new Date(circuit.last_failure_at), { addSuffix: true, locale: es })
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between text-sm text-muted-foreground">
                  <span>Failure Threshold: {circuit.failure_threshold}</span>
                  <span>Success Threshold: {circuit.success_threshold}</span>
                  <span>Open Duration: {circuit.open_duration_ms / 1000}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
