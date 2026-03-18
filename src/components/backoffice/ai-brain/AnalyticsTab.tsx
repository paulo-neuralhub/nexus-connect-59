import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { AIAnalyticsSummary } from '@/types/ai-brain.types';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsTabProps {
  analytics: AIAnalyticsSummary | null;
  isLoading: boolean;
}

export function AnalyticsTab({ analytics, isLoading }: AnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || (analytics.byProvider.length === 0 && analytics.byTask.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Analytics</CardTitle>
          <CardDescription>Métricas de consumo y costes por provider y task</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay datos de uso aún</p>
            <p className="text-sm">Los analytics se mostrarán cuando haya requests de IA</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Usage by Provider</CardTitle>
          <CardDescription>Distribución de costes por proveedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.byProvider.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{item.provider}</span>
                  <span className="text-sm font-medium">
                    €{item.cost.toFixed(2)} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} />
                <p className="text-xs text-muted-foreground mt-1">
                  {item.requests.toLocaleString()} requests
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage by Task</CardTitle>
          <CardDescription>Distribución de costes por tarea</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.byTask.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{item.task}</span>
                  <span className="text-sm font-medium">
                    €{item.cost.toFixed(2)} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} />
                <p className="text-xs text-muted-foreground mt-1">
                  {item.requests.toLocaleString()} requests
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
