/**
 * MatterActivityTab - Timeline + Comments for a matter
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, History } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MatterActivityTabProps {
  matterId: string;
}

function getEventIcon(eventType?: string): string {
  const t = eventType?.toLowerCase() || '';
  if (t.includes('email')) return '✉️';
  if (t.includes('whatsapp')) return '💬';
  if (t.includes('call') || t.includes('phone')) return '📞';
  if (t.includes('document') || t === 'filing') return '📄';
  if (t.includes('deadline') || t.includes('plazo')) return '📅';
  if (t.includes('status')) return '✅';
  if (t.includes('comment') || t.includes('note')) return '💬';
  if (t.includes('create')) return '🆕';
  return '📌';
}

export function MatterActivityTab({ matterId }: MatterActivityTabProps) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Load activity log + comments combined
  const { data: activities, isLoading } = useQuery({
    queryKey: ['matter-activity', matterId],
    queryFn: async () => {
      const client: any = supabase;
      
      // Try matter_activity first, fallback to activity_log
      const [activityRes, commentsRes] = await Promise.all([
        client
          .from('activity_log')
          .select('*')
          .eq('matter_id', matterId)
          .order('created_at', { ascending: false })
          .limit(50),
        client
          .from('matter_comments')
          .select('*')
          .eq('matter_id', matterId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const items: Array<{
        id: string;
        type: 'activity' | 'comment';
        title: string;
        description?: string;
        created_at: string;
        created_by?: string;
        user_name?: string;
      }> = [];

      // Map activities
      (activityRes.data || []).forEach((a: any) => {
        items.push({
          id: a.id,
          type: 'activity',
          title: a.title || a.action || 'Actividad',
          description: a.description,
          created_at: a.created_at,
          created_by: a.created_by,
        });
      });

      // Map comments
      (commentsRes.data || []).forEach((c: any) => {
        items.push({
          id: c.id,
          type: 'comment',
          title: c.content || c.comment || '',
          description: undefined,
          created_at: c.created_at,
          created_by: c.user_id || c.created_by,
          user_name: c.user_name,
        });
      });

      // Sort by date desc
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    },
    enabled: !!matterId,
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const client: any = supabase;
      const { error } = await client
        .from('matter_comments')
        .insert({
          matter_id: matterId,
          organization_id: currentOrganization!.id,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-activity', matterId] });
      setComment('');
      toast.success('Comentario añadido');
    },
    onError: () => toast.error('Error al añadir comentario'),
  });

  const handleSubmitComment = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed);
  };

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <Card className="border-slate-200">
        <CardContent className="pt-4 pb-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Añade un comentario sobre este expediente..."
            className="min-h-[80px] resize-none border-slate-200"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!comment.trim() || addComment.isPending}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Comentar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando actividad...</div>
          ) : !activities?.length ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground">Sin actividad registrada</p>
              <p className="text-sm text-slate-400 mt-1">Los cambios y comentarios aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map((item, i) => (
                <div key={item.id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0",
                      item.type === 'comment' ? "bg-blue-100" : "bg-slate-100"
                    )}>
                      {item.type === 'comment' ? '💬' : getEventIcon(item.title)}
                    </div>
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>

                  {/* Content */}
                  <div className={cn("pb-5 flex-1 min-w-0", i === activities.length - 1 && "pb-0")}>
                    {item.type === 'comment' ? (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {item.user_name || 'Usuario'} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
