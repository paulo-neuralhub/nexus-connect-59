// ============================================================
// IP-NEXUS — Thread Detail with virtualized message timeline
// ============================================================

import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail, MessageCircle, Phone, Shield, AlertTriangle,
  Paperclip, CheckCheck, Check, Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CommThread, CommMessage, CommTenantConfig } from '@/types/communications';
import { CommComposer } from './CommComposer';

interface Props {
  thread: CommThread;
  messages: CommMessage[];
  isLoading: boolean;
  config: CommTenantConfig | null | undefined;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'read':
      return <Eye className="h-3 w-3 text-primary" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-primary" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'failed':
    case 'bounced':
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">
        {format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CallMessageCard({ msg }: { msg: CommMessage }) {
  return (
    <div className="mx-auto max-w-md my-2">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Phone className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {msg.sender_type === 'user' ? '📞 Llamada saliente' : '📞 Llamada entrante'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{msg.body}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(msg.created_at), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CommThreadDetail({ thread, messages, isLoading, config }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 20,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
            <Skeleton className="h-16 w-64 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {thread.subject || 'Sin asunto'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-4">
                {thread.channel === 'email' && '✉️ Email'}
                {thread.channel === 'whatsapp' && '💬 WhatsApp'}
                {thread.channel === 'call' && '📞 Llamada'}
                {thread.channel === 'sms' && '📱 SMS'}
                {thread.channel === 'internal' && '🏠 Interno'}
              </Badge>
              <Badge
                variant={thread.status === 'open' ? 'default' : 'secondary'}
                className="text-[10px] h-4"
              >
                {thread.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Matter binding */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {thread.matter ? (
            <Badge variant="outline" className="text-xs">
              📋 {thread.matter.reference_number || thread.matter.title}
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md">
              <AlertTriangle className="h-3 w-3" />
              Sin expediente asignado
            </div>
          )}
          {thread.crm_account && (
            <Badge variant="outline" className="text-xs">
              🏢 {thread.crm_account.name}
            </Badge>
          )}
        </div>

        {/* Low confidence warning */}
        {thread.auto_indexed && thread.indexing_confidence === 'low' && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md">
            <AlertTriangle className="h-3 w-3" />
            Indexación automática — baja confianza. ¿Es correcto?
          </div>
        )}
      </div>

      {/* Messages timeline - virtualized */}
      <div ref={parentRef} className="flex-1 overflow-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sin mensajes en este hilo
          </div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => {
              const msg = messages[vItem.index];
              const isOutbound = msg.sender_type === 'user' || msg.sender_type === 'bot';
              const isCall = msg.channel === 'call';

              // Date separator logic
              const prevMsg = vItem.index > 0 ? messages[vItem.index - 1] : null;
              const showDate = !prevMsg ||
                format(new Date(msg.created_at), 'yyyy-MM-dd') !==
                format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

              return (
                <div
                  key={msg.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vItem.start}px)`,
                  }}
                >
                  {showDate && <DateSeparator date={msg.created_at} />}

                  {isCall ? (
                    <CallMessageCard msg={msg} />
                  ) : (
                    <div className={cn('flex mb-2', isOutbound ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5',
                          isOutbound
                            ? 'bg-primary/10 text-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md',
                          msg.is_legally_critical && 'border-l-2 border-amber-400'
                        )}
                      >
                        {/* Sender name for inbound */}
                        {!isOutbound && (
                          <p className="text-xs font-semibold text-primary mb-1">
                            {msg.sender_name}
                          </p>
                        )}

                        {/* Body */}
                        {msg.body_html ? (
                          <div
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: msg.body_html }}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.body || '—'}</p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            {msg.attachments.length} adjunto(s)
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                          {msg.is_legally_critical && (
                            <Shield className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                          {isOutbound && <StatusIcon status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <CommComposer thread={thread} config={config} />
    </div>
  );
}
