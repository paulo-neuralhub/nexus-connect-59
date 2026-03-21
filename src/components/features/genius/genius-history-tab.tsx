/**
 * Genius History Tab — Conversation history list
 */
import { useConversations } from '@/hooks/use-genius';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function GeniusHistoryTab() {
  const { data: conversations = [], isLoading } = useConversations();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>;
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No hay conversaciones en el historial</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Card key={conv.id} className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {conv.title || 'Conversación sin título'}
                </p>
                {conv.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{conv.agent_type}</span>
                <span>· {conv.message_count} mensajes</span>
                <span>
                  · {formatDistanceToNow(new Date(conv.last_message_at || conv.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {conv.agent_type}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
