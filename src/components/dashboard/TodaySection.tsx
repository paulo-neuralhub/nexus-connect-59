// =============================================
// COMPONENTE: TodaySection
// Tareas y plazos del día
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TodayItem {
  id: string;
  type: 'deadline' | 'task' | 'alert';
  title: string;
  subtitle?: string;
  time?: string;
  priority: 'high' | 'medium' | 'low';
  matterId?: string;
  matterName?: string;
  completed?: boolean;
}

export function TodaySection() {
  const navigate = useNavigate();
  
  // TODO: Reemplazar con datos reales
  const [items, setItems] = useState<TodayItem[]>([
    {
      id: '1',
      type: 'deadline',
      title: 'Vence plazo oposición marca ACME',
      subtitle: 'Exp. 2024-M-0047',
      time: '17:00',
      priority: 'high',
      matterId: '123',
      matterName: 'ACME Corp',
    },
    {
      id: '2',
      type: 'deadline',
      title: 'Renovación marca BETA',
      subtitle: 'Exp. 2024-M-0023',
      time: '23:59',
      priority: 'medium',
      matterId: '124',
    },
    {
      id: '3',
      type: 'task',
      title: 'Preparar informe vigilancia mensual',
      subtitle: 'Cliente: García Industries',
      priority: 'medium',
      completed: false,
    },
    {
      id: '4',
      type: 'task',
      title: 'Revisar solicitud patente PCT',
      subtitle: 'Exp. 2024-P-0012',
      priority: 'low',
      completed: false,
    },
    {
      id: '5',
      type: 'alert',
      title: 'Spider: 3 marcas similares detectadas',
      subtitle: 'Vigilancia: NEXUS',
      priority: 'high',
    },
  ]);

  const handleToggleTask = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deadlines = items.filter(i => i.type === 'deadline');
  const tasks = items.filter(i => i.type === 'task');
  const alerts = items.filter(i => i.type === 'alert');

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {items.filter(i => !i.completed).length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigate('/app/docket')}>
            Ver todo
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-3 pt-0">
        {/* Plazos urgentes */}
        {deadlines.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              Plazos ({deadlines.length})
            </div>
            <div className="space-y-1">
              {deadlines.slice(0, 2).map(item => (
                <TodayItemRow 
                  key={item.id} 
                  item={item} 
                  onClick={() => item.matterId && navigate(`/app/docket/${item.matterId}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tareas */}
        {tasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Tareas ({tasks.filter(t => !t.completed).length}/{tasks.length})
            </div>
            <div className="space-y-1">
              {tasks.slice(0, 2).map(item => (
                <TaskItemRow 
                  key={item.id} 
                  item={item} 
                  onToggle={() => handleToggleTask(item.id)}
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
              {alerts.slice(0, 1).map(item => (
                <TodayItemRow 
                  key={item.id} 
                  item={item} 
                  onClick={() => navigate('/app/spider')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Sparkles className="h-6 w-6 text-green-500 mb-1" />
            <p className="text-xs font-medium text-foreground">¡Todo al día!</p>
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
  item, 
  onClick 
}: { 
  item: TodayItem; 
  onClick?: () => void;
}) {
  const priorityColors = {
    high: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
    medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
    low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-2 rounded border-l-2 cursor-pointer hover:opacity-80 transition-opacity",
        priorityColors[item.priority]
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">
          {item.title}
        </p>
      </div>
      {item.time && (
        <Badge variant="outline" className="ml-2 shrink-0 text-[10px] px-1.5 py-0">
          {item.time}
        </Badge>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
    </div>
  );
}

// =============================================
// Subcomponente: TaskItemRow
// =============================================

function TaskItemRow({ 
  item, 
  onToggle 
}: { 
  item: TodayItem; 
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors">
      <Checkbox 
        checked={item.completed} 
        onCheckedChange={onToggle}
        className="h-3 w-3"
      />
      <p className={cn(
        "text-xs font-medium transition-all truncate flex-1",
        item.completed && "line-through text-muted-foreground"
      )}>
        {item.title}
      </p>
    </div>
  );
}
