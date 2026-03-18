// =============================================
// COMPONENTE: RecentActivity
// Timeline de actividad reciente (datos reales)
// =============================================

import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRecentActivityData } from '@/hooks/use-dashboard-charts';

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivityData();

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      matter_created: <Plus className="h-4 w-4" />,
      matter_updated: <Edit className="h-4 w-4" />,
      client_added: <User className="h-4 w-4" />,
      email_sent: <Mail className="h-4 w-4" />,
      call_made: <Phone className="h-4 w-4" />,
      alert: <AlertTriangle className="h-4 w-4" />,
      task_completed: <CheckCircle className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      matter_created: 'bg-primary/10 text-primary',
      matter_updated: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
      client_added: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      email_sent: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
      call_made: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      alert: 'bg-destructive/10 text-destructive',
      task_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">
          Actividad reciente
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs">
          Ver todo
        </Button>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                {/* Icono */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  getActivityColor(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                    {activity.user && (
                      <>
                        <span>•</span>
                        <span>{activity.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No hay actividad reciente</p>
            <p className="text-xs text-muted-foreground/70">
              Las acciones en expedientes y CRM aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
