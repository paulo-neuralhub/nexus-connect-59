// ============================================================
// IP-NEXUS — Inbox Page (3-panel layout)
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageTitle } from '@/contexts/page-context';
import { useInboxMessages, useClientMatters, useClientActivities, type InboxMessage } from '@/hooks/use-inbox';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail, MessageCircle, Globe, Phone, ArrowLeft, Inbox as InboxIcon,
  Archive, UserPlus, Send, ChevronDown, Bot, ExternalLink, Plug, CheckCircle2, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Channel icon helper ───
function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  switch (channel) {
    case 'email': return <Mail className={cn('h-4 w-4 text-blue-500', className)} />;
    case 'whatsapp': return <MessageCircle className={cn('h-4 w-4 text-green-500', className)} />;
    case 'portal': return <Globe className={cn('h-4 w-4 text-violet-500', className)} />;
    case 'phone': return <Phone className={cn('h-4 w-4 text-muted-foreground', className)} />;
    default: return <Mail className={cn('h-4 w-4 text-muted-foreground', className)} />;
  }
}

// ─── Urgency badge ───
function UrgencyBadge({ score }: { score: number | null }) {
  if (!score || score < 5) return null;
  if (score >= 9) return <Badge className="bg-red-100 text-red-700 text-[10px] border-0">🚨 Crítico</Badge>;
  if (score >= 7) return <Badge className="bg-orange-100 text-orange-700 text-[10px] border-0">⚠️ Urgente</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">⚡ Alto</Badge>;
}

// ─── Category badge ───
function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const map: Record<string, { label: string; emoji: string }> = {
    instruction: { label: 'Instrucción', emoji: '📋' },
    query: { label: 'Consulta', emoji: '❓' },
    urgent: { label: 'Urgente', emoji: '🚨' },
    admin: { label: 'Admin', emoji: '📄' },
  };
  const info = map[category] || { label: category, emoji: '📨' };
  return (
    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
      🤖 {info.emoji} {info.label}
    </span>
  );
}

// ─── Message list item ───
function MessageListItem({
  msg,
  isSelected,
  onSelect,
}: {
  msg: InboxMessage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const timeAgo = msg.created_at
    ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: es })
    : '';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 border-b transition-colors hover:bg-accent/50',
        isSelected && 'bg-blue-50 dark:bg-blue-950/30 border-l-[3px] border-l-blue-500',
        !isSelected && 'border-l-[3px] border-l-transparent'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <ChannelIcon channel={msg.channel} />
        <span className="font-medium text-sm truncate flex-1">{msg.sender_name || 'Desconocido'}</span>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">hace {timeAgo}</span>
      </div>
      {msg.account?.name && (
        <p className="text-xs text-muted-foreground truncate mb-0.5">{msg.account.name}</p>
      )}
      <p className="text-sm text-foreground truncate">{msg.subject || '(Sin asunto)'}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <CategoryBadge category={msg.ai_category} />
        {msg.ai_confidence != null && (
          <span className="text-[10px] text-muted-foreground">{Math.round(msg.ai_confidence * 100)}%</span>
        )}
        <UrgencyBadge score={msg.ai_urgency_score} />
      </div>
    </button>
  );
}

// ─── Detail panel ───
function MessageDetail({
  msg,
  organizationId,
  onBack,
}: {
  msg: InboxMessage;
  organizationId: string | undefined;
  onBack?: () => void;
}) {
  const [reply, setReply] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();

  const handleArchive = async () => {
    await fromTable('incoming_messages').update({ status: 'archived' }).eq('id', msg.id);
    toast.success('Mensaje archivado');
    qc.invalidateQueries({ queryKey: ['inbox-messages'] });
    qc.invalidateQueries({ queryKey: ['inbox-count'] });
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fromTable('activities').insert({
        organization_id: organizationId,
        type: 'email',
        subject: `Re: ${msg.subject || ''}`,
        content: reply,
        contact_id: msg.contact_id,
        owner_type: 'system',
      });
      await fromTable('incoming_messages').update({ status: 'replied' }).eq('id', msg.id);
      toast.success('✅ Respuesta enviada');
      setReply('');
      setShowReply(false);
      qc.invalidateQueries({ queryKey: ['inbox-messages'] });
      qc.invalidateQueries({ queryKey: ['inbox-count'] });
    } catch {
      toast.error('Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <ChannelIcon channel={msg.channel} className="h-5 w-5" />
          <span className="text-lg font-semibold">{msg.sender_name || 'Desconocido'}</span>
          <UrgencyBadge score={msg.ai_urgency_score} />
        </div>
        <p className="text-sm text-muted-foreground">
          {msg.sender_email || msg.sender_phone || ''}
          {msg.created_at && ` · ${format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale: es })}`}
        </p>
        {msg.subject && <h3 className="font-medium">{msg.subject}</h3>}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 p-4">
        <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.body || '(Sin contenido)'}
        </div>

        {/* AI Analysis */}
        {msg.ai_category && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-amber-600" />
              IP-GENIUS analizó este mensaje
            </div>
            {msg.ai_summary && <p className="text-sm text-muted-foreground">{msg.ai_summary}</p>}
            {msg.ai_confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confianza:</span>
                <div className="flex-1 h-2 bg-muted rounded-full max-w-[200px]">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.round(msg.ai_confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(msg.ai_confidence * 100)}%</span>
              </div>
            )}
            {msg.ai_proposed_action && (
              <p className="text-xs text-muted-foreground">
                <strong>Acción propuesta:</strong> {msg.ai_proposed_action}
              </p>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-1" /> Archivar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowReply(v => !v)}>
            <Send className="h-4 w-4 mr-1" /> Responder
          </Button>
        </div>
        {showReply && (
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
            />
            <Button size="sm" onClick={handleReply} disabled={sending || !reply.trim()}>
              {sending ? 'Enviando...' : 'Enviar respuesta'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CRM Context panel ───
function CRMContextPanel({ msg }: { msg: InboxMessage }) {
  const navigate = useNavigate();
  const { data: matters = [] } = useClientMatters(msg.account_id);

  if (!msg.account_id && !msg.account) {
    return (
      <div className="p-4 space-y-4 text-center">
        <div className="rounded-full bg-muted p-3 w-fit mx-auto">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Remitente no identificado</p>
        <p className="text-xs text-muted-foreground">
          {msg.sender_name} no está vinculado a ningún cliente.
        </p>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline">Crear contacto nuevo</Button>
          <Button size="sm" variant="outline">Vincular a cliente existente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Client card */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {(msg.account?.name || msg.sender_name || 'X').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{msg.account?.name || msg.sender_name}</p>
          </div>
        </div>
        <Button
          variant="link"
          size="sm"
          className="text-xs p-0 h-auto"
          onClick={() => msg.account_id && navigate(`/app/crm/accounts/${msg.account_id}`)}
        >
          Ver perfil → <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Recent matters */}
      {matters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expedientes</h4>
          {matters.map((m: any) => (
            <button
              key={m.id}
              className="w-full text-left rounded-md border p-2 hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/app/expedientes/${m.id}`)}
            >
              <p className="text-xs font-medium truncate">{m.reference_number || m.title}</p>
              <p className="text-[11px] text-muted-foreground">{m.status} · {m.type}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty states ───
function EmptyStateNoIntegration() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Plug className="h-16 w-16 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Conecta tus canales</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Conecta Gmail o WhatsApp para recibir mensajes de clientes automáticamente.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/app/settings/integrations')}>Conectar Gmail</Button>
        <Button variant="outline" onClick={() => navigate('/app/settings/integrations')}>Conectar WhatsApp</Button>
      </div>
    </div>
  );
}

function EmptyStateNoMessages() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-4 mb-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Todo al día</h3>
      <p className="text-sm text-muted-foreground">No hay mensajes pendientes. Buen trabajo 🎉</p>
    </div>
  );
}

function EmptyDetailState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <InboxIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">Selecciona un mensaje</p>
    </div>
  );
}

// ─── Main page ───
export default function InboxPage() {
  usePageTitle('Inbox');
  const isMobile = useIsMobile();
  const { organizationId } = useOrganization();

  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const { data: messages = [], isLoading } = useInboxMessages(channelFilter, statusFilter);

  const selectedMsg = useMemo(() => messages.find(m => m.id === selectedId) || null, [messages, selectedId]);

  // Channel counts
  const counts = useMemo(() => {
    const all = messages.length;
    const email = messages.filter(m => m.channel === 'email').length;
    const whatsapp = messages.filter(m => m.channel === 'whatsapp').length;
    const portal = messages.filter(m => m.channel === 'portal').length;
    const aiPending = messages.filter(m => m.status === 'awaiting_approval').length;
    return { all, email, whatsapp, portal, aiPending };
  }, [messages]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileView('detail');
  }, [isMobile]);

  // ─── Tab pills ───
  const tabs = [
    { key: null, label: 'Todos', count: counts.all },
    { key: 'email', label: 'Email', count: counts.email },
    { key: 'whatsapp', label: 'WhatsApp', count: counts.whatsapp },
    { key: 'portal', label: 'Portal', count: counts.portal },
  ];

  const statusTabs = [
    { key: null, label: 'Todos' },
    { key: 'urgent', label: 'Urgentes' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'processed', label: 'Procesados' },
  ];

  // ─── Mobile detail ───
  if (isMobile && mobileView === 'detail' && selectedMsg) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <MessageDetail
          msg={selectedMsg}
          organizationId={organizationId}
          onBack={() => { setMobileView('list'); setSelectedId(null); }}
        />
      </div>
    );
  }

  // ─── List panel content ───
  const listPanel = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">Inbox</h2>
          {counts.all > 0 && (
            <Badge variant="secondary" className="text-xs">{counts.all}</Badge>
          )}
        </div>
        {/* Channel tabs */}
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <Button
              key={t.key ?? 'all'}
              variant={channelFilter === t.key ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setChannelFilter(t.key)}
            >
              {t.label} {t.count > 0 && <span className="ml-1 opacity-70">{t.count}</span>}
            </Button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map(t => (
            <Button
              key={t.key ?? 'all-status'}
              variant={statusFilter === t.key ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-6"
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : messages.length === 0 ? (
          <EmptyStateNoMessages />
        ) : (
          messages.map(msg => (
            <MessageListItem
              key={msg.id}
              msg={msg}
              isSelected={msg.id === selectedId}
              onSelect={() => handleSelect(msg.id)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );

  // ─── Mobile: list only ───
  if (isMobile) {
    return <div className="h-[calc(100vh-8rem)]">{listPanel}</div>;
  }

  // ─── Desktop: 3 panels ───
  return (
    <div className="h-[calc(100vh-12rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Left: list 30% */}
      <div className="w-[30%] min-w-[280px] max-w-[380px] border-r flex-shrink-0 flex flex-col">
        {listPanel}
      </div>

      {/* Center: detail 45% */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        {selectedMsg ? (
          <MessageDetail msg={selectedMsg} organizationId={organizationId} />
        ) : (
          <EmptyDetailState />
        )}
      </div>

      {/* Right: CRM context 25% */}
      <div className="w-[25%] min-w-[240px] max-w-[320px] flex-shrink-0 overflow-y-auto">
        {selectedMsg ? (
          <CRMContextPanel msg={selectedMsg} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
            Contexto CRM
          </div>
        )}
      </div>
    </div>
  );
}
