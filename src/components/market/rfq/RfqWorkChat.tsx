// src/components/market/rfq/RfqWorkChat.tsx
import { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Paperclip, 
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useRfqWorkMessages, useSendRfqWorkMessage, type RfqWorkMessage } from '@/hooks/market/useRfqWorkflow';

interface RfqWorkChatProps {
  requestId: string;
  currentUserId: string;
  isReadOnly?: boolean;
}

export function RfqWorkChat({ requestId, currentUserId, isReadOnly = false }: RfqWorkChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading, refetch } = useRfqWorkMessages(requestId);
  const sendMessage = useSendRfqWorkMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    await sendMessage.mutateAsync({
      requestId,
      message: message.trim(),
    });

    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: RfqWorkMessage, index: number) => {
    const isOwn = msg.sender_id === currentUserId;
    const isSystem = msg.is_system;
    const sender = msg.sender;
    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground max-w-[80%] whitespace-pre-wrap">
            {msg.message}
          </div>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={cn(
          'flex gap-2 mb-2',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {!isOwn && showAvatar && (
          <Avatar className="h-8 w-8 mt-1 shrink-0">
            <AvatarImage src={sender?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {sender?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}

        <div className={cn(
          'max-w-[70%] space-y-1',
          isOwn ? 'items-end' : 'items-start'
        )}>
          {showAvatar && !isOwn && (
            <span className="text-xs text-muted-foreground ml-1">
              {sender?.full_name || 'Usuario'}
            </span>
          )}
          
          <div className={cn(
            'rounded-2xl px-4 py-2',
            isOwn 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-muted rounded-bl-md'
          )}>
            {/* Attachment */}
            {msg.attachment_url && (
              <a 
                href={msg.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline mb-2"
              >
                <FileText className="h-4 w-4" />
                {msg.attachment_name || 'Archivo adjunto'}
              </a>
            )}
            
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          </div>
          
          <div className={cn(
            'flex items-center gap-1 text-xs text-muted-foreground',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span>
              {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
            </span>
            {isOwn && msg.read_at && (
              <CheckCircle className="h-3 w-3 text-primary" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Mensajes del Trabajo</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No hay mensajes aún</p>
              <p className="text-sm">Inicia la conversación</p>
            </div>
          ) : (
            messages.map((msg, idx) => renderMessage(msg, idx))
          )}
        </div>

        {/* Input area */}
        {!isReadOnly && (
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
              
              <Button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
