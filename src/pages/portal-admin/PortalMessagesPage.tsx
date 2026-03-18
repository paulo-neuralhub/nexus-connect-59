/**
 * Portal Messages Admin Page - Bandeja de mensajes del portal
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, MessageSquare, Send, Mail, 
  MailOpen, Clock, FileText, User, ArrowLeft
} from 'lucide-react';

interface PortalMessage {
  id: string;
  portal_id: string;
  portal_user_id: string | null;
  matter_id: string | null;
  thread_id: string | null;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  body: string;
  status: string;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
  portal_user?: {
    name: string | null;
    email: string;
  } | null;
  portal?: {
    client?: {
      full_name: string | null;
      company_name: string | null;
    } | null;
  } | null;
  matter?: {
    reference: string;
    title: string;
  } | null;
}

interface Thread {
  thread_id: string;
  subject: string;
  last_message: string;
  last_date: string;
  unread_count: number;
  client_name: string;
  matter_reference?: string;
  messages: PortalMessage[];
}

export default function PortalMessagesPage() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['portal-admin-messages', currentOrganization?.id, statusFilter],
    queryFn: async (): Promise<PortalMessage[]> => {
      if (!currentOrganization?.id) return [];

      const { data: portals } = await supabase
        .from('client_portals')
        .select('id')
        .eq('organization_id', currentOrganization.id);

      if (!portals?.length) return [];

      const portalIds = portals.map(p => p.id);

      let query = supabase
        .from('portal_messages')
        .select(`
          id,
          portal_id,
          portal_user_id,
          matter_id,
          thread_id,
          direction,
          subject,
          body,
          status,
          read_at,
          replied_at,
          created_at,
          portal_user:portal_users(name, email),
          portal:client_portals(
            client:contacts(full_name, company_name)
          ),
          matter:matters(reference, title)
        `)
        .in('portal_id', portalIds)
        .order('created_at', { ascending: false });

      if (statusFilter === 'unread') {
        query = query.is('read_at', null).eq('direction', 'inbound');
      } else if (statusFilter === 'unreplied') {
        query = query.is('replied_at', null).eq('direction', 'inbound');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as unknown as PortalMessage[]) || [];
    },
    enabled: !!currentOrganization?.id,
  });

  // Group messages by thread
  const threads: Thread[] = (() => {
    if (!messages?.length) return [];

    const threadsMap = new Map<string, Thread>();

    for (const msg of messages) {
      const threadId = msg.thread_id || msg.id;
      
      if (!threadsMap.has(threadId)) {
        const clientName = 
          msg.portal?.client?.company_name || 
          msg.portal?.client?.full_name ||
          msg.portal_user?.name ||
          msg.portal_user?.email ||
          'Cliente';

        threadsMap.set(threadId, {
          thread_id: threadId,
          subject: msg.subject || 'Sin asunto',
          last_message: msg.body.substring(0, 100),
          last_date: msg.created_at,
          unread_count: 0,
          client_name: clientName,
          matter_reference: msg.matter?.reference,
          messages: [],
        });
      }

      const thread = threadsMap.get(threadId)!;
      thread.messages.push(msg);

      if (msg.direction === 'inbound' && !msg.read_at) {
        thread.unread_count++;
      }

      // Update last message if this is newer
      if (new Date(msg.created_at) > new Date(thread.last_date)) {
        thread.last_message = msg.body.substring(0, 100);
        thread.last_date = msg.created_at;
      }
    }

    // Filter by search
    let result = Array.from(threadsMap.values());
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.subject.toLowerCase().includes(searchLower) ||
        t.client_name.toLowerCase().includes(searchLower) ||
        t.matter_reference?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by last date
    result.sort((a, b) => new Date(b.last_date).getTime() - new Date(a.last_date).getTime());

    return result;
  })();

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from('portal_messages')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read' 
        })
        .in('id', messageIds)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-admin-messages'] });
    },
  });

  // Send reply
  const sendReply = async () => {
    if (!selectedThread || !replyText.trim()) return;

    setIsSending(true);
    try {
      const firstMessage = selectedThread.messages[0];
      
      const { error } = await supabase
        .from('portal_messages')
        .insert({
          portal_id: firstMessage.portal_id,
          thread_id: selectedThread.thread_id,
          matter_id: firstMessage.matter_id,
          direction: 'outbound',
          subject: `Re: ${selectedThread.subject}`,
          body: replyText,
          status: 'sent',
        });

      if (error) throw error;

      // Mark original as replied
      await supabase
        .from('portal_messages')
        .update({ 
          replied_at: new Date().toISOString(),
          status: 'replied' 
        })
        .eq('thread_id', selectedThread.thread_id)
        .eq('direction', 'inbound')
        .is('replied_at', null);

      toast.success('Respuesta enviada');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['portal-admin-messages'] });

      // Refresh selected thread
      const updatedThread = threads.find(t => t.thread_id === selectedThread.thread_id);
      if (updatedThread) setSelectedThread(updatedThread);

    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setIsSending(false);
    }
  };

  // Handle thread selection
  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    
    // Mark unread messages as read
    const unreadIds = thread.messages
      .filter(m => m.direction === 'inbound' && !m.read_at)
      .map(m => m.id);
    
    if (unreadIds.length) {
      markAsRead.mutate(unreadIds);
    }
  };

  const unreadCount = threads.reduce((sum, t) => sum + t.unread_count, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Mensajes del Portal
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} sin leer</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Mensajes de tus clientes desde el portal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Thread list */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar mensajes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                  <SelectItem value="unreplied">Sin responder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!threads.length ? (
              <div className="p-8">
                <EmptyState
                  icon={<MessageSquare className="h-12 w-12" />}
                  title="Sin mensajes"
                  description="No hay mensajes de clientes todavía"
                />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {threads.map((thread) => (
                    <button
                      key={thread.thread_id}
                      onClick={() => handleSelectThread(thread)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedThread?.thread_id === thread.thread_id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {thread.unread_count > 0 && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <span className="font-medium truncate">
                              {thread.client_name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {thread.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {thread.last_message}...
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(thread.last_date), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </div>
                      </div>
                      {thread.matter_reference && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {thread.matter_reference}
                          </Badge>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Message detail */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<Mail className="h-12 w-12" />}
                title="Selecciona una conversación"
                description="Elige una conversación de la lista para ver los mensajes"
              />
            </div>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedThread.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {selectedThread.client_name}
                      {selectedThread.matter_reference && (
                        <>
                          <span>•</span>
                          <FileText className="h-4 w-4" />
                          {selectedThread.matter_reference}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSelectedThread(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedThread.messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.direction === 'outbound' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback>
                              {msg.direction === 'inbound' 
                                ? (msg.portal_user?.name?.[0] || 'C')
                                : 'D'
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[75%] rounded-lg p-3 ${
                              msg.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            <p 
                              className={`text-xs mt-2 ${
                                msg.direction === 'outbound' 
                                  ? 'text-primary-foreground/70' 
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Reply input */}
                <div className="p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe tu respuesta..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button 
                      onClick={sendReply}
                      disabled={!replyText.trim() || isSending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Enviando...' : 'Enviar respuesta'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
