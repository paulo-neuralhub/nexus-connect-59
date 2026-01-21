import { useMatterActivity } from '@/hooks/use-realtime-collab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, MessageSquare, CheckCircle, Clock, 
  User, Edit, Plus, Loader2, Activity, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  updated: Edit,
  status_changed: Edit,
  comment_added: MessageSquare,
  document_uploaded: FileText,
  document_signed: FileText,
  task_created: Plus,
  task_completed: CheckCircle,
  deadline_added: Clock,
  deadline_completed: CheckCircle,
  time_logged: Clock,
  assigned: User,
  note_added: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: 'bg-green-500',
  updated: 'bg-blue-500',
  status_changed: 'bg-purple-500',
  comment_added: 'bg-primary',
  document_uploaded: 'bg-amber-500',
  document_signed: 'bg-emerald-500',
  task_created: 'bg-cyan-500',
  task_completed: 'bg-green-500',
  deadline_added: 'bg-orange-500',
  deadline_completed: 'bg-green-500',
  time_logged: 'bg-slate-500',
  assigned: 'bg-indigo-500',
  note_added: 'bg-pink-500',
};

interface Props {
  matterId: string;
  maxItems?: number;
  compact?: boolean;
}

export function MatterActivityFeed({ matterId, maxItems = 30, compact = false }: Props) {
  const { data: activities, isLoading } = useMatterActivity(matterId, maxItems);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Sin actividad reciente</p>
        <p className="text-sm">La actividad del expediente aparecerá aquí</p>
      </div>
    );
  }

  const content = (
    <ScrollArea className={compact ? "h-[300px]" : "h-[400px]"}>
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4 py-2">
          {activities.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.activity_type] || AlertCircle;
            const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-muted';
            
            return (
              <div key={activity.id} className="flex gap-4 relative animate-fade-in">
                {/* Icon */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm",
                  index === 0 ? colorClass : "bg-muted",
                  index === 0 && "text-white"
                )}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 -mt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={activity.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {activity.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {activity.user?.full_name || 'Sistema'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activity.description}
                  </p>
                  
                  {/* Show changes if any */}
                  {activity.changes && Object.keys(activity.changes).length > 0 && activity.changes.field && (
                    <div className="mt-1 text-xs bg-muted/50 rounded px-2 py-1 inline-block">
                      <span className="line-through text-muted-foreground">
                        {String(activity.changes.old_value || '')}
                      </span>
                      <span className="mx-1">→</span>
                      <span className="font-medium text-foreground">
                        {String(activity.changes.new_value || '')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Actividad
          <span className="text-muted-foreground font-normal text-sm">
            ({activities.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
