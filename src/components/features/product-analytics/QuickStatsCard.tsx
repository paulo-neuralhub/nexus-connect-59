import { Monitor, Smartphone, Tablet, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsSummary } from '@/types/analytics';

interface QuickStatsCardProps {
  summary?: AnalyticsSummary;
  devices?: { desktop: number; mobile: number; tablet: number };
  isLoading?: boolean;
}

export function QuickStatsCard({ summary, devices, isLoading }: QuickStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Bounce Rate</span>
            </div>
            <p className="text-xl font-bold">{summary?.avgBounceRate || 0}%</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">MAU</span>
            </div>
            <p className="text-xl font-bold">{summary?.latestMAU?.toLocaleString() || 0}</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Monitor className="h-4 w-4" />
              <span className="text-xs">Desktop</span>
            </div>
            <p className="text-xl font-bold">{devices?.desktop || 0}%</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Smartphone className="h-4 w-4" />
              <span className="text-xs">Mobile</span>
            </div>
            <p className="text-xl font-bold">{devices?.mobile || 0}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
