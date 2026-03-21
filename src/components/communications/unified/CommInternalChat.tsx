/**
 * CommInternalChat — Internal team chat with Realtime
 * Channels filtered by organization_id (CRITICAL for multi-tenant)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Hash, Users, Send, Paperclip, AtSign,
  MessageSquare, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Room {
  room_id: string;
  room_type: string;
  label: string;
  unread: number;
}

interface InternalMessage {
  id: string;
  organization_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: string;
  mentions: string[];
  attachments: unknown[];
  read_by: Record<string, string>;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
}

export function CommInternalChat() {
  const { organizationId } = useOrganization();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<string>('general:all');
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [mobileView, setMobileView] = useState<'rooms' | 'chat'>('rooms');

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await fromTable('profiles')
        .select('id, first_name, last_name')
        .eq('id', user.id)
        .single();
      return data;
    },
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['comm-internal-rooms', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      // Get distinct rooms from messages
      const { data } = await fromTable('comm_internal_messages')
        .select('room_id, room_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      const roomMap = new Map<string, Room>();
      // Default rooms
      roomMap.set('general:all', { room_id: 'general:all', room_type: 'general', label: '# General', unread: 0 });
      roomMap.set('general:notices', { room_id: 'general:notices', room_type: 'general', label: '# Avisos', unread: 0 });

      for (const r of data || []) {
        if (!roomMap.has(r.room_id)) {
          const label = r.room_type === 'matter'
            ? `📋 ${r.room_id.replace('matter:', '').slice(0, 8)}`
            : r.room_type === 'direct'
              ? '💬 DM'
              : `# ${r.room_id.split(':').pop()}`;
          roomMap.set(r.room_id, { room_id: r.room_id, room_type: r.room_type, label, unread: 0 });
        }
      }
      return Array.from(roomMap.values());
    },
    enabled: !!organizationId,
  });

  // Fetch messages for active room
  const { data: messages = [], isLoading: messagesLoading } = useQuery<InternalMessage[]>({
    queryKey: ['comm-internal-messages', organizationId, activeRoom],
    queryFn: async () => {
      if (!organizationId || !activeRoom) return [];
      const { data, error } = await fromTable('comm_internal_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('room_id', activeRoom)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && !!activeRoom,
  });

  // REALTIME — Messages (CRITICAL: organization_id filter)
  useEffect(() => {
    if (!organizationId || !activeRoom) return;

    const channel = supabase
      .channel(`internal_msg:${organizationId}:${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comm_internal_messages',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if ((payload.new as any).room_id === activeRoom) {
            qc.invalidateQueries({ queryKey: ['comm-internal-messages', organizationId, activeRoom] });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, activeRoom, qc]);

  // REALTIME — Typing indicator (broadcast, no persistence)
  useEffect(() => {
    if (!organizationId || !activeRoom) return;

    const channel = supabase
      .channel(`typing:${organizationId}:${activeRoom}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name } = payload.payload as { user_id: string; user_name: string };
        if (user_id === currentUser?.id) return;
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.set(user_id, user_name);
          return next;
        });
        // Clear after 3s
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(user_id);
            return next;
          });
        }, 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, activeRoom, currentUser?.id]);

  // Send typing broadcast
  const emitTyping = useCallback(() => {
    if (!organizationId || !activeRoom || !currentUser) return;
    const channel = supabase.channel(`typing:${organizationId}:${activeRoom}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: currentUser.id,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
        room_id: activeRoom,
      },
    });
  }, [organizationId, activeRoom, currentUser]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!organizationId || !currentUser) throw new Error('No session');
      const { error } = await fromTable('comm_internal_messages').insert({
        organization_id: organizationId,
        room_id: activeRoom,
        room_type: activeRoom.startsWith('general:') ? 'general' : activeRoom.startsWith('matter:') ? 'matter' : 'direct',
        sender_id: currentUser.id,
        sender_name: `${currentUser.first_name} ${currentUser.last_name}`.trim() || 'Usuario',
        content: text,
        content_type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      qc.invalidateQueries({ queryKey: ['comm-internal-messages', organizationId, activeRoom] });
    },
    onError: (e: Error) => toast.error('Error: ' + e.message),
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      // Throttle typing indicator
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(emitTyping, 500);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectRoom = (roomId: string) => {
    setActiveRoom(roomId);
    if (isMobile) setMobileView('chat');
  };

  // ── Room sidebar ──────────────────────────────────────
  const RoomsSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat interno
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {rooms.map(room => (
            <button
              key={room.room_id}
              onClick={() => selectRoom(room.room_id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                activeRoom === room.room_id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="truncate">{room.label}</span>
              {room.unread > 0 && (
                <Badge variant="destructive" className="h-4 min-w-[16px] text-[10px] px-1">
                  {room.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // ── Chat view ─────────────────────────────────────────
  const ChatView = () => (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="px-4 py-2.5 border-b bg-card flex items-center gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileView('rooms')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {rooms.find(r => r.room_id === activeRoom)?.label || activeRoom}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {messagesLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-2/3" />
          ))
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sin mensajes. ¡Sé el primero en escribir! 💬
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && (
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {msg.sender_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}>
                  {!isMe && (
                    <p className="text-[11px] font-semibold mb-0.5 opacity-70">{msg.sender_name}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn(
                    'text-[10px] mt-1 text-right',
                    isMe ? 'opacity-60' : 'text-muted-foreground'
                  )}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
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

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Layout ────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        {mobileView === 'rooms' ? <RoomsSidebar /> : <ChatView />}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex rounded-xl border bg-card overflow-hidden">
      <div className="w-[240px] border-r flex-shrink-0">
        <RoomsSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatView />
      </div>
    </div>
  );
}
