/**
 * Portal Live Chat Panel — /app/portal/live-chat
 * Despacho-side live chat management with agent availability
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/contexts/organization-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, Send, Loader2, Bell, 
  Phone, Clock, User, Volume2, VolumeX 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PortalLiveChatPanel() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const [isAvailable, setIsAvailable] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevChatCountRef = useRef(0);

  // Get current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Chat queue
  const { data: chatSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['portal-live-chat-sessions', orgId],
    queryFn: async () => {
      const { data } = await fromTable('portal_chat_sessions')
        .select('*, crm_accounts(name, email)')
        .eq('organization_id', orgId)
        .in('mode', ['waiting_human', 'human'])
        .is('closed_at', null)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 5000,
  });

  // Notification sound for new chats
  useEffect(() => {
    const currentCount = chatSessions?.length || 0;
    if (currentCount > prevChatCountRef.current && prevChatCountRef.current > 0 && soundEnabled) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIj2markup notification sound');
        }
        // Simple beep using Web Audio API
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 200);
      } catch { /* audio not available */ }
    }
    prevChatCountRef.current = currentCount;
  }, [chatSessions?.length, soundEnabled]);

  // Messages for selected session
  const { data: messages } = useQuery({
    queryKey: ['portal-live-chat-messages', selectedSession],
    queryFn: async () => {
      if (!selectedSession || !orgId) return [];
      const session = chatSessions?.find((s: any) => s.id === selectedSession);
      if (!session) return [];

      const { data } = await fromTable('portal_chat_messages')
        .select('*')
        .eq('organization_id', orgId)
        .eq('crm_account_id', session.crm_account_id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedSession && !!orgId,
    refetchInterval: 3000,
  });

  // Toggle availability
  const toggleAvailability = useCallback(async (available: boolean) => {
    if (!currentUserId || !orgId) return;

    await fromTable('portal_agent_availability')
      .upsert({
        organization_id: orgId,
        agent_id: currentUserId,
        status: available ? 'online' : 'offline',
        last_heartbeat_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,agent_id' });

    setIsAvailable(available);

    if (available) {
      // Start heartbeat
      heartbeatRef.current = setInterval(async () => {
        await fromTable('portal_agent_availability')
          .update({ last_heartbeat_at: new Date().toISOString() })
          .eq('agent_id', currentUserId)
          .eq('organization_id', orgId);
      }, 30000);
    } else {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    }
  }, [currentUserId, orgId]);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUserId && orgId) {
        navigator.sendBeacon && fromTable('portal_agent_availability')
          .update({ status: 'offline' })
          .eq('agent_id', currentUserId)
          .eq('organization_id', orgId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // Set offline on component unmount
      if (currentUserId && orgId) {
        fromTable('portal_agent_availability')
          .update({ status: 'offline' })
          .eq('agent_id', currentUserId)
          .eq('organization_id', orgId)
          .then(() => {});
      }
    };
  }, [currentUserId, orgId]);

  // Take chat
  const takeChat = async (sessionId: string) => {
    if (!currentUserId) return;

    await fromTable('portal_chat_sessions')
      .update({
        mode: 'human',
        assigned_agent_id: currentUserId,
        human_joined_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await fromTable('portal_agent_availability')
      .update({ current_active_chats: (chatSessions?.filter((s: any) => s.assigned_agent_id === currentUserId).length || 0) + 1 })
      .eq('agent_id', currentUserId)
      .eq('organization_id', orgId);

    setSelectedSession(sessionId);
    queryClient.invalidateQueries({ queryKey: ['portal-live-chat-sessions'] });
    toast.success('Chat asignado');
  };

  // Send message
  const handleSend = async () => {
    if (!messageInput.trim() || !selectedSession || !orgId) return;

    const session = chatSessions?.find((s: any) => s.id === selectedSession);
    if (!session) return;

    await fromTable('portal_chat_messages')
      .insert({
        organization_id: orgId,
        crm_account_id: session.crm_account_id,
        sender_type: 'agent',
        sender_user_id: currentUserId,
        sender_name: 'Equipo',
        content: messageInput,
        content_type: 'text',
        read_by_agent: true,
      });

    setMessageInput('');
    queryClient.invalidateQueries({ queryKey: ['portal-live-chat-messages'] });
  };

  // Realtime subscription
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel('live-chat-agent')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portal_chat_sessions',
        filter: `organization_id=eq.${orgId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['portal-live-chat-sessions'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'portal_chat_messages',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['portal-live-chat-messages'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId, queryClient]);

  const waitingCount = chatSessions?.filter((s: any) => s.mode === 'waiting_human').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat en vivo</h1>
          <p className="text-muted-foreground">Atiende las consultas de tus clientes del portal</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Switch checked={isAvailable} onCheckedChange={toggleAvailability} />
            <span className="text-sm font-medium">
              {isAvailable ? (
                <Badge className="bg-green-100 text-green-700">En línea</Badge>
              ) : (
                <Badge variant="outline">Desconectado</Badge>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Chat Queue */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Cola de chats
              {waitingCount > 0 && (
                <Badge variant="destructive" className="text-xs">{waitingCount} esperando</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-60px)]">
              {sessionsLoading ? (
                <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : chatSessions?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">Sin chats activos</p>
                </div>
              ) : (
                chatSessions?.map((session: any) => (
                  <div
                    key={session.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedSession === session.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {session.crm_accounts?.name || 'Cliente'}
                      </span>
                      <Badge variant={session.mode === 'waiting_human' ? 'destructive' : 'outline'} className="text-xs">
                        {session.mode === 'waiting_human' ? 'Esperando' : 'Activo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{session.crm_accounts?.email}</p>
                    {session.mode === 'waiting_human' && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => { e.stopPropagation(); takeChat(session.id); }}
                      >
                        Tomar este chat
                      </Button>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedSession ? (
            <>
              <CardHeader className="border-b py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {chatSessions?.find((s: any) => s.id === selectedSession)?.crm_accounts?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {chatSessions?.find((s: any) => s.id === selectedSession)?.crm_accounts?.name || 'Cliente'}
                    </p>
                    <p className="text-xs text-muted-foreground">Chat en vivo</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages?.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[75%] rounded-lg p-3 text-sm ${
                          msg.sender_type === 'client' ? 'bg-muted' :
                          msg.sender_type === 'ai' ? 'bg-purple-50 border border-purple-200' :
                          'bg-primary text-primary-foreground'
                        }`}>
                          {msg.sender_type === 'ai' && (
                            <p className="text-xs text-purple-500 mb-1 font-medium">🤖 IA</p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe tu respuesta..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button onClick={handleSend} disabled={!messageInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Selecciona un chat</p>
                <p className="text-sm">de la cola para empezar a atender</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
