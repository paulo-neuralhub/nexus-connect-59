// =====================================================
// IP-NEXUS - CLIENT TIMELINE (PROMPT 27)
// Timeline de actividad del cliente
// =====================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  X,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  CheckSquare,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  User,
  Video,
  Briefcase,
} from 'lucide-react';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineEvent {
  id: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'task' | 'document' | 'matter' | 'system';
  title: string;
  description: string;
  created_at: string;
  created_by: {
    full_name: string;
    avatar_url: string;
  } | null;
  metadata?: Record<string, unknown>;
}

interface ClientTimelineProps {
  clientId: string;
  onClose?: () => void;
}

type ActivityType = 'note' | 'email' | 'call' | 'meeting';

export function ClientTimeline({ clientId, onClose }: ClientTimelineProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState<{ type: ActivityType; content: string }>({
    type: 'note',
    content: '',
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['client-timeline', clientId, filter],
    queryFn: async () => {
      let query = fromTable('activity_log')
        .select(`
          id,
          action,
          title,
          description,
          created_at,
          created_by:users!activity_log_created_by_fkey(
            full_name,
            avatar_url
          ),
          metadata
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((e: any) => ({
        id: e.id,
        type: mapActionToType(e.action),
        title: e.title || 'Actividad',
        description: e.description || '',
        created_at: e.created_at,
        created_by: e.created_by,
        metadata: e.metadata,
      })) as TimelineEvent[];
    },
    enabled: !!clientId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { type: ActivityType; content: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', userData.user?.id)
        .single();

      if (!membership) throw new Error('No organization found');

      const { error } = await fromTable('activity_log').insert({
        client_id: clientId,
        organization_id: membership.organization_id,
        entity_type: 'client',
        entity_id: clientId,
        action: data.type,
        title: getActivityTitle(data.type),
        description: data.content,
        created_by: userData.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-timeline', clientId] });
      setNewActivity({ type: 'note', content: '' });
      setShowAddForm(false);
      toast({ title: 'Actividad registrada' });
    },
    onError: () => {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    },
  });

  const handleAddActivity = () => {
    if (!newActivity.content.trim()) return;
    addMutation.mutate(newActivity);
  };

  const typeIcons: Record<string, React.ElementType> = {
    note: MessageSquare,
    email: Mail,
    call: Phone,
    meeting: Video,
    task: CheckSquare,
    document: FileText,
    matter: Briefcase,
    system: Clock,
  };

  const typeColors: Record<string, string> = {
    note: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    email: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    call: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    task: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400',
    document: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    matter: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400',
    system: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Timeline
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-1 mt-2">
          {(['all', 'note', 'email', 'call'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todo' : f === 'note' ? 'Notas' : f === 'email' ? 'Emails' : 'Llamadas'}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Formulario añadir actividad */}
        {showAddForm && (
          <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex gap-1">
              {(['note', 'email', 'call', 'meeting'] as ActivityType[]).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <Button
                    key={type}
                    variant={newActivity.type === type ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setNewActivity({ ...newActivity, type })}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
            <Textarea
              placeholder="Añade una nota, registro de llamada..."
              value={newActivity.content}
              onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
              rows={3}
              className="text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewActivity({ type: 'note', content: '' });
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddActivity}
                disabled={addMutation.isPending || !newActivity.content.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                {addMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de eventos */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay actividad registrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const Icon = typeIcons[event.type] || MessageSquare;
              const colorClass = typeColors[event.type] || typeColors.system;

              return (
                <div key={event.id} className="flex gap-3 group">
                  <div className={cn('p-2 rounded-lg h-fit', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {event.created_by && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.created_by.full_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function mapActionToType(action: string): TimelineEvent['type'] {
  const mapping: Record<string, TimelineEvent['type']> = {
    note: 'note',
    email: 'email',
    call: 'call',
    meeting: 'meeting',
    task: 'task',
    document_created: 'document',
    matter_created: 'matter',
  };
  return mapping[action] || 'system';
}

function getActivityTitle(type: ActivityType): string {
  const titles: Record<ActivityType, string> = {
    note: 'Nota',
    email: 'Email',
    call: 'Llamada',
    meeting: 'Reunión',
  };
  return titles[type] || 'Actividad';
}
