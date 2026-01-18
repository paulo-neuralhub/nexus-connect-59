import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACTIVITY_TYPES } from '@/lib/constants/crm';
import type { Activity, ActivityType } from '@/types/crm';
import { 
  Mail, Phone, MessageCircle, Calendar, FileText, 
  CheckSquare, ArrowRightLeft, File, UserPlus, 
  Trophy, XCircle, Circle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  FileText,
  CheckSquare,
  ArrowRightLeft,
  File,
  UserPlus,
  Trophy,
  XCircle,
  Circle,
};

interface Props {
  activities: Activity[];
  onAddActivity?: () => void;
  isLoading?: boolean;
}

export function ActivityTimeline({ activities, onAddActivity, isLoading }: Props) {
  // Agrupar por fecha
  const grouped = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-3">No hay actividades registradas</p>
        {onAddActivity && (
          <Button variant="outline" size="sm" onClick={onAddActivity}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir actividad
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onAddActivity && (
        <Button variant="outline" size="sm" onClick={onAddActivity} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Nueva actividad
        </Button>
      )}
      
      {Object.entries(grouped).map(([date, dayActivities]) => (
        <div key={date}>
          {/* Fecha */}
          <div className="text-sm font-medium text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </div>
          
          {/* Actividades del día */}
          <div className="space-y-4 relative">
            {/* Línea vertical */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
            
            {dayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config = ACTIVITY_TYPES[activity.type as ActivityType] || ACTIVITY_TYPES.other;
  const IconComponent = ICON_MAP[config.icon] || Circle;
  
  return (
    <div className="flex gap-3 relative">
      {/* Icono */}
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10",
          "border-2 border-background"
        )}
        style={{ backgroundColor: `${config.color}20` }}
      >
        <IconComponent className="w-4 h-4" style={{ color: config.color }} />
      </div>
      
      {/* Contenido */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">
            {config.label}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(activity.created_at), 'HH:mm')}
          </span>
        </div>
        
        {activity.subject && (
          <p className="text-sm text-foreground mt-0.5">{activity.subject}</p>
        )}
        
        {activity.content && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.content}</p>
        )}
        
        {/* Detalles específicos según tipo */}
        {activity.type === 'email' && activity.direction && (
          <p className="text-xs text-muted-foreground mt-1">
            {activity.direction === 'outbound' ? '→' : '←'} {activity.email_to?.join(', ')}
          </p>
        )}
        
        {activity.type === 'call' && activity.call_duration && (
          <p className="text-xs text-muted-foreground mt-1">
            Duración: {Math.floor(activity.call_duration / 60)}:{(activity.call_duration % 60).toString().padStart(2, '0')} min
            {activity.call_outcome && ` · ${activity.call_outcome}`}
          </p>
        )}
        
        {activity.type === 'meeting' && activity.meeting_location && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {activity.meeting_location}
          </p>
        )}
        
        {activity.type === 'stage_change' && activity.metadata && (
          <p className="text-xs text-muted-foreground mt-1">
            Cambio de etapa en el pipeline
          </p>
        )}
      </div>
    </div>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateStr === format(today, 'yyyy-MM-dd')) return 'Hoy';
  if (dateStr === format(yesterday, 'yyyy-MM-dd')) return 'Ayer';
  return format(date, "d 'de' MMMM", { locale: es });
}
