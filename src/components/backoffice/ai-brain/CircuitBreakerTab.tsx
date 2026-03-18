// ============================================================
// IP-NEXUS AI BRAIN - ENHANCED CIRCUIT BREAKER TAB
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, Shield, Activity, AlertTriangle, CheckCircle, 
  XCircle, Power, PowerOff, Clock, TrendingUp, TrendingDown 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useProviderHealthStats, 
  useToggleCircuitBreaker, 
  useResetProviderHealth,
  ProviderHealthStats 
} from '@/hooks/ai-brain/useAIHealthMonitor';

const HEALTH_STATUS_CONFIG = {
  healthy: { 
    bg: 'bg-green-500/10', 
    text: 'text-green-600', 
    icon: CheckCircle, 
    label: 'Healthy',
    border: 'border-green-200'
  },
  degraded: { 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-600', 
    icon: AlertTriangle, 
    label: 'Degraded',
    border: 'border-yellow-200'
  },
  down: { 
    bg: 'bg-red-500/10', 
    text: 'text-red-600', 
    icon: XCircle, 
    label: 'Down',
    border: 'border-red-200'
  },
  unknown: { 
    bg: 'bg-gray-500/10', 
    text: 'text-gray-500', 
    icon: Activity, 
    label: 'Unknown',
    border: 'border-gray-200'
  },
};

interface ProviderCardProps {
  provider: ProviderHealthStats;
  onToggleCircuit: (open: boolean) => void;
  onReset: () => void;
  isToggling: boolean;
  isResetting: boolean;
}

function ProviderCard({ 
  provider, 
  onToggleCircuit, 
  onReset, 
  isToggling, 
  isResetting 
}: ProviderCardProps) {
  const config = HEALTH_STATUS_CONFIG[provider.health_status] || HEALTH_STATUS_CONFIG.unknown;
  const StatusIcon = config.icon;
  
  const totalRequests = (provider.success_count_1h || 0) + (provider.error_count_1h || 0);
  const successRate = totalRequests > 0 
    ? Math.round((provider.success_count_1h || 0) / totalRequests * 100) 
    : 0;

  return (
    <div className={`p-4 border rounded-lg ${config.border} ${provider.circuit_open ? 'bg-red-50/50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <StatusIcon className={`h-5 w-5 ${config.text}`} />
          </div>
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            <code className="text-xs text-muted-foreground">{provider.code}</code>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${config.bg} ${config.text} border-0`}>
            {config.label}
          </Badge>
          {provider.circuit_open && (
            <Badge variant="destructive" className="gap-1">
              <Power className="h-3 w-3" />
              Circuit Open
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Latency</p>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {provider.health_latency_ms ? `${provider.health_latency_ms}ms` : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Success (1h)</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="font-medium text-green-600">
              {provider.success_count_1h || 0}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Errors (1h)</p>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className={`font-medium ${(provider.error_count_1h || 0) > 0 ? 'text-red-600' : ''}`}>
              {provider.error_count_1h || 0}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Consecutive Failures</p>
          <span className={`font-medium ${(provider.consecutive_failures || 0) > 0 ? 'text-orange-600' : ''}`}>
            {provider.consecutive_failures || 0}
          </span>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <div className="flex items-center gap-2">
            <Progress value={successRate} className="h-2 flex-1" />
            <span className="text-xs font-medium">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Circuit breaker status */}
      {provider.circuit_open && provider.circuit_opened_at && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Circuit Breaker Open</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Opened {formatDistanceToNow(new Date(provider.circuit_opened_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      )}

      {/* Last error */}
      {provider.last_error_at && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Last Error</span>
            <span className="text-xs text-orange-500">
              {formatDistanceToNow(new Date(provider.last_error_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          {provider.last_error_message && (
            <p className="text-xs text-orange-600 mt-1 font-mono truncate">
              {provider.last_error_message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          Last check: {provider.last_health_check_at 
            ? formatDistanceToNow(new Date(provider.last_health_check_at), { addSuffix: true, locale: es })
            : 'Never'}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReset}
            disabled={isResetting}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
            Reset
          </Button>
          
          {provider.circuit_open ? (
            <Button 
              variant="default"
              size="sm"
              onClick={() => onToggleCircuit(false)}
              disabled={isToggling}
            >
              <PowerOff className="h-4 w-4 mr-1" />
              Close Circuit
            </Button>
          ) : (
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => onToggleCircuit(true)}
              disabled={isToggling}
            >
              <Power className="h-4 w-4 mr-1" />
              Open Circuit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CircuitBreakerTab() {
  const { data: providers, isLoading, error } = useProviderHealthStats();
  const toggleCircuit = useToggleCircuitBreaker();
  const resetHealth = useResetProviderHealth();
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Monitor & Circuit Breaker</CardTitle>
          <CardDescription>Real-time provider health and circuit breaker management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Monitor & Circuit Breaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Error loading health data</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const healthy = providers?.filter(p => p.health_status === 'healthy' && !p.circuit_open).length || 0;
  const degraded = providers?.filter(p => p.health_status === 'degraded').length || 0;
  const down = providers?.filter(p => p.health_status === 'down' || p.circuit_open).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Health Monitor & Circuit Breaker
            </CardTitle>
            <CardDescription>
              Real-time provider health and automatic fallback management
            </CardDescription>
          </div>
          
          {/* Summary badges */}
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {healthy} Healthy
            </Badge>
            {degraded > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {degraded} Degraded
              </Badge>
            )}
            {down > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                {down} Down
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!providers || providers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No providers configured</p>
            <p className="text-sm">Add AI providers to start monitoring</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onToggleCircuit={(open) => {
                  setActiveProviderId(provider.id);
                  toggleCircuit.mutate({ providerId: provider.id, open });
                }}
                onReset={() => {
                  setActiveProviderId(provider.id);
                  resetHealth.mutate(provider.id);
                }}
                isToggling={toggleCircuit.isPending && activeProviderId === provider.id}
                isResetting={resetHealth.isPending && activeProviderId === provider.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
