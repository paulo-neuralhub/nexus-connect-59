// ============================================================
// MessagePane — Messages list + composer for a channel
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Send, Paperclip, Briefcase, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { InternalChannel, InternalMsg, StaffNotification } from '@/hooks/communications/use-internal-chat';
import { useIndexMessage, useMarkNotificationRead } from '@/hooks/communications/use-internal-chat';

interface Props {
  channel: InternalChannel;
  messages: InternalMsg[];
  isLoading: boolean;
  onSend: (content: string) => void;
  isSending: boolean;
  currentUserId?: string;
  notifications: StaffNotification[];
}

const CLASSIFICATION_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  matter_relevant: { label: 'Relevante', variant: 'default' },
  action_required: { label: 'Acción requerida', variant: 'destructive' },
  operational: { label: 'Operativo', variant: 'secondary' },
  social: { label: 'Social', variant: 'outline' },
};

export function MessagePane({
  channel,
  messages,
  isLoading,
  onSend,
  isSending,
  currentUserId,
  notifications,
}: Props) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const indexMessage = useIndexMessage();
  const markRead = useMarkNotificationRead();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing broadcast
  useEffect(() => {
    if (!channel.id) return;
    const ch = supabase
      .channel(`typing:${channel.organization_id}:${channel.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name } = payload.payload as { user_id: string; user_name: string };
        if (user_id === currentUserId) return;
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.set(user_id, user_name);
          return next;
        });
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(user_id);
            return next;
          });
        }, 3000);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channel.id, channel.organization_id, currentUserId]);

  const emitTyping = useCallback(() => {
    if (!channel.id || !currentUserId) return;
    const ch = supabase.channel(`typing:${channel.organization_id}:${channel.id}`);
    ch.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, user_name: 'Tú' } });
  }, [channel.id, channel.organization_id, currentUserId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(emitTyping, 500);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  // Find indexing suggestion notifications for messages in this channel
  const indexingSuggestions = notifications.filter(n =>
    n.type === 'chat_indexing_suggestion' && n.action_url
  );

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-4 py-2.5 border-b bg-card flex items-center gap-2">
        <span className="text-sm font-medium text-foreground truncate">{channel.name}</span>
        {channel.matter_id && (
          <Badge variant="outline" className="text-[10px] h-5 gap-1">
            <Briefcase className="h-3 w-3" />
            Expediente
          </Badge>
        )}
        {channel.description && (
          <span className="text-xs text-muted-foreground ml-2 truncate hidden md:inline">
            {channel.description}
          </span>
        )}
      </div>

      {/* Indexing suggestion banner */}
      {indexingSuggestions.length > 0 && (
        <div className="px-4 py-2 bg-accent/50 border-b border-accent space-y-1">
          {indexingSuggestions.slice(0, 2).map(notif => {
            // Extract matter_id from action_url
            const matterMatch = notif.action_url?.match(/matters\/([^?]+)/);
            const messageMatch = notif.action_url?.match(/index_message=([^&]+)/);
            const matterId = matterMatch?.[1];
            const messageId = messageMatch?.[1];

            return (
              <div key={notif.id} className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="flex-1 text-foreground truncate">{notif.title}</span>
                {matterId && messageId && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
                      onClick={() => {
                        indexMessage.mutate({ message_id: messageId, matter_id: matterId, decision: 'indexed' });
                        markRead.mutate(notif.id);
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" /> Indexar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-muted-foreground"
                      onClick={() => {
                        indexMessage.mutate({ message_id: messageId, matter_id: matterId, decision: 'rejected' });
                        markRead.mutate(notif.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-2/3" />
          ))
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sin mensajes. ¡Sé el primero en escribir! 💬
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUserId;
            const sender = msg.sender;
            const senderName = sender
              ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
              : 'Usuario';
            const initials = senderName.charAt(0).toUpperCase();
            const classif = msg.ai_classification && CLASSIFICATION_BADGES[msg.ai_classification];
            const isOnline = sender?.chat_status === 'online';

            return (
              <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border border-background" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{senderName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{sender?.chat_status || 'offline'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}>
                  {!isMe && (
                    <p className="text-[11px] font-semibold mb-0.5 opacity-70">{senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={cn(
                    'flex items-center gap-1.5 mt-1',
                    isMe ? 'justify-end' : 'justify-start'
                  )}>
                    {classif && msg.ai_classification !== 'pending_classification' && (
                      <Badge
                        variant={classif.variant}
                        className="h-3.5 text-[8px] px-1 py-0"
                      >
                        {classif.label}
                      </Badge>
                    )}
                    {msg.user_indexing_decision === 'indexed' && (
                      <Badge variant="default" className="h-3.5 text-[8px] px-1 py-0 bg-primary">
                        ✓ Indexado
                      </Badge>
                    )}
                    <span className={cn(
                      'text-[10px]',
                      isMe ? 'opacity-60' : 'text-muted-foreground'
                    )}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
            </div>
            <span>
              {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'está' : 'están'} escribiendo...
            </span>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 py-3 border-t bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 text-sm"
            disabled={isSending}
          />
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
