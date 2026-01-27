// =============================================
// COMPONENTE: TodaySection
// Tareas y plazos del día (datos reales)
// =============================================

import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTodayData } from '@/hooks/use-dashboard-charts';

export function TodaySection() {
  const navigate = useNavigate();
  const { data, isLoading } = useTodayData();

  const deadlines = data?.deadlines || [];
  const alerts = data?.alerts || [];
  const totalItems = deadlines.length + alerts.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="space-y-2">
            <div className="h-10 animate-pulse bg-muted rounded" />
            <div className="h-10 animate-pulse bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            {totalItems > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {totalItems}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigate('/app/docket')}>
            Ver todo
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-3 pt-0">
        {/* Plazos */}
        {deadlines.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              Plazos ({deadlines.length})
            </div>
            <div className="space-y-1">
              {deadlines.slice(0, 3).map(item => (
                <TodayItemRow 
                  key={item.id} 
                  title={item.title}
                  time={item.time}
                  priority={item.priority}
                  onClick={() => item.matterId && navigate(`/app/docket/${item.matterId}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Alertas ({alerts.length})
            </div>
            <div className="space-y-1">
              {alerts.slice(0, 2).map(item => (
                <TodayItemRow 
                  key={item.id} 
                  title={item.title}
                  priority={item.priority}
                  onClick={() => navigate('/app/spider')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {totalItems === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Sparkles className="h-6 w-6 text-green-500 mb-1" />
            <p className="text-xs font-medium text-foreground">¡Todo al día!</p>
            <p className="text-[10px] text-muted-foreground">Sin plazos ni alertas pendientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Subcomponente: TodayItemRow
// =============================================

function TodayItemRow({ 
  title,
  time,
  priority,
  onClick 
}: { 
  title: string;
  time?: string;
  priority: 'high' | 'medium' | 'low';
  onClick?: () => void;
}) {
  const priorityColors = {
    high: 'border-l-destructive bg-destructive/10',
    medium: 'border-l-warning bg-warning/10',
    low: 'border-l-primary bg-primary/10',
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-2 rounded border-l-2 cursor-pointer hover:opacity-80 transition-opacity",
        priorityColors[priority]
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">
          {title}
        </p>
      </div>
      {time && (
        <Badge variant="outline" className="ml-2 shrink-0 text-[10px] px-1.5 py-0">
          {time}
        </Badge>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
    </div>
  );
}
