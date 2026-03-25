// ============================================================
// IP-NEXUS — Unified Inbox (3-panel layout on communications route)
// Merges incoming_messages data with communications channel sidebar
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrganization } from '@/hooks/useOrganization';
import { useInboxMessages, useClientMatters, useClientActivities, type InboxMessage } from '@/hooks/use-inbox';
import { fromTable } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProcessMessage } from '@/hooks/use-process-message';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail, MessageCircle, Globe, Phone, ArrowLeft, Inbox as InboxIcon,
  Archive, UserPlus, Send, Bot, ExternalLink, Plug, CheckCircle2,
  AlertCircle, User, ClipboardList, HelpCircle, FileText, ArrowRight,
  Clock, Briefcase, Loader2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Hook: linked instruction for a message ───
function useLinkedInstruction(messageId: string | null) {
  return useQuery({
    queryKey: ['linked-instruction', messageId],
    queryFn: async () => {
      if (!messageId) return null;
      const { data, error } = await fromTable('bulk_instructions')
        .select('id, title, status, total_targets, executed_count')
        .eq('source_message_id', messageId)
        .maybeSingle();
      if (error) return null;
      return data as { id: string; title: string; status: string; total_targets: number | null; executed_count: number | null } | null;
    },
    enabled: !!messageId,
    staleTime: 60_000,
  });
}

// ─── Category color helpers ───
function getCategoryStyles(msg: InboxMessage, isSelected: boolean) {
  if (isSelected) {
    return {
      bg: 'bg-[#EFF6FF]',
      border: 'border-l-[3px] border-l-[#2563EB]',
      shadow: 'shadow-[inset_0_0_0_1px_#BFDBFE]',
    };
  }
  const cat = msg.ai_category;
  const isUrgent = cat === 'urgent' || (msg.ai_urgency_score != null && msg.ai_urgency_score >= 7);

  if (cat === 'instruction') {
    return { bg: 'bg-[#F9F5FF]', border: 'border-l-[3px] border-l-[#8B5CF6]', shadow: '' };
  }
  if (isUrgent) {
    return { bg: 'bg-[#FFF5F5]', border: 'border-l-[3px] border-l-[#EF4444]', shadow: '' };
  }
  if (cat === 'query') {
    return { bg: 'bg-[#F0F9FF]', border: 'border-l-[3px] border-l-[#0EA5E9]', shadow: '' };
  }
  if (cat === 'admin') {
    return { bg: 'bg-[#F8FAFC]', border: 'border-l-[3px] border-l-[#94A3B8]', shadow: '' };
  }
  return { bg: '', border: 'border-l-[3px] border-l-transparent', shadow: '' };
}

// ─── Channel icon helper ───
function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  switch (channel) {
    case 'email': return <Mail className={cn('h-4 w-4 text-primary', className)} />;
    case 'whatsapp': return <MessageCircle className={cn('h-4 w-4 text-green-500', className)} />;
    case 'portal': return <Globe className={cn('h-4 w-4 text-violet-500', className)} />;
    case 'phone': return <Phone className={cn('h-4 w-4 text-muted-foreground', className)} />;
    default: return <Mail className={cn('h-4 w-4 text-muted-foreground', className)} />;
  }
}

// ─── Urgency badge ───
function UrgencyBadge({ score }: { score: number | null }) {
  if (!score || score < 5) return null;
  if (score >= 9) return <Badge className="bg-destructive/10 text-destructive text-[10px] border-0">🚨 Crítico</Badge>;
  if (score >= 7) return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-[10px] border-0">⚠️ Urgente</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[10px] border-0">⚡ Alto</Badge>;
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
function MessageListItem({ msg, isSelected, onSelect, onAnalyze, isAnalyzing }: {
  msg: InboxMessage; isSelected: boolean; onSelect: () => void;
  onAnalyze?: (id: string) => void; isAnalyzing?: boolean;
}) {
  const navigate = useNavigate();
  const { data: linkedInstruction } = useLinkedInstruction(msg.id);
  const timeAgo = msg.created_at
    ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: es })
    : '';
  const styles = getCategoryStyles(msg, isSelected);
  const canAnalyze = !msg.ai_category && onAnalyze;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-b-[#F1F5F9] transition-colors hover:bg-accent/50',
        styles.bg, styles.border, styles.shadow,
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
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <CategoryBadge category={msg.ai_category} />
        {msg.ai_confidence != null && (
          <span className="text-[10px] text-muted-foreground">{Math.round(msg.ai_confidence * 100)}%</span>
        )}
        <UrgencyBadge score={msg.ai_urgency_score} />
        {linkedInstruction && (
          <span
            onClick={(e) => { e.stopPropagation(); navigate('/app/instructions'); }}
            className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] cursor-pointer hover:bg-[#BBF7D0] transition-colors"
          >
            ✅ → Ver en Instrucciones
          </span>
        )}
        {canAnalyze && (
          <span
            onClick={(e) => { e.stopPropagation(); onAnalyze(msg.id); }}
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 cursor-pointer transition-colors',
              'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300',
              isAnalyzing && 'opacity-60 pointer-events-none'
            )}
          >
            {isAnalyzing ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles className="h-3 w-3" /> 🤖 Analizar</>
            )}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Linked instruction section for detail panel ───
function LinkedInstructionSection({ messageId }: { messageId: string }) {
  const navigate = useNavigate();
  const { data: instruction } = useLinkedInstruction(messageId);
  if (!instruction) return null;

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    in_progress: 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    partially_executed: 'Parcialmente ejecutada',
  };

  return (
    <div className="mt-4 rounded-[10px] border border-[#86EFAC] bg-[#F0FDF4] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
        <CheckCircle2 className="h-4 w-4" />
        INSTRUCCIÓN GENERADA
      </div>
      <p className="text-xs text-muted-foreground">
        Este mensaje generó la siguiente instrucción:
      </p>
      <div className="space-y-1">
        <p className="text-sm font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#15803D]" />
          {instruction.title}
        </p>
        <p className="text-xs text-muted-foreground">
          Status: {statusLabels[instruction.status] || instruction.status}
          {instruction.total_targets ? ` · ${instruction.total_targets} jurisdicciones` : ''}
        </p>
      </div>
      <Button
        variant="link"
        size="sm"
        className="text-[#15803D] p-0 h-auto text-xs font-medium"
        onClick={() => navigate('/app/instructions')}
      >
        Ver instrucción completa <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

// ─── Detail panel ───
function MessageDetail({ msg, organizationId, onBack }: {
  msg: InboxMessage; organizationId: string | undefined; onBack?: () => void;
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

      <ScrollArea className="flex-1 p-4">
        <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.body || '(Sin contenido)'}
        </div>

        {msg.ai_category && (
          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
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

        {/* Linked instruction section */}
        <LinkedInstructionSection messageId={msg.id} />
      </ScrollArea>

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

// ─── CRM Context panel (enhanced) ───
function CRMContextPanel({ msg }: { msg: InboxMessage }) {
  const navigate = useNavigate();
  const { data: matters = [] } = useClientMatters(msg.account_id);
  const { data: activities = [] } = useClientActivities(msg.account_id);

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

  const initials = (msg.account?.name || msg.sender_name || 'X').substring(0, 2).toUpperCase();
  const lastActivity = activities[0] as { id: string; type: string; subject: string; created_at: string } | undefined;

  return (
    <div className="p-4 space-y-4">
      {/* Client card */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{msg.account?.name || msg.sender_name}</p>
            {msg.sender_email && (
              <p className="text-xs text-muted-foreground truncate">{msg.sender_email}</p>
            )}
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

      {/* Active matters */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="h-3 w-3" />
          Expedientes activos
        </h4>
        {matters.length > 0 ? (
          matters.map((m: any) => (
            <button
              key={m.id}
              className="w-full text-left rounded-md border p-2.5 hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/app/expedientes/${m.id}`)}
            >
              <div className="flex items-center gap-2 mb-0.5">
                {m.type && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{m.type}</Badge>
                )}
                <span className="text-xs font-medium truncate">{m.reference_number || m.title}</span>
              </div>
              {m.title && m.reference_number && (
                <p className="text-[11px] text-muted-foreground truncate">{m.title}</p>
              )}
              {m.status && (
                <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0 h-4">{m.status}</Badge>
              )}
            </button>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin expedientes activos</p>
        )}
      </div>

      {/* Last activity */}
      {lastActivity && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Último contacto
          </h4>
          <div className="rounded-md border p-2.5">
            <p className="text-xs font-medium truncate">{lastActivity.subject || lastActivity.type}</p>
            <p className="text-[11px] text-muted-foreground">
              {lastActivity.type} · {lastActivity.created_at
                ? formatDistanceToNow(new Date(lastActivity.created_at), { addSuffix: true, locale: es })
                : ''}
            </p>
          </div>
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
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#F8FAFC]">
      <InboxIcon className="h-16 w-16 text-[#CBD5E1] mb-4" />
      <h3 className="text-base font-semibold mb-1">Selecciona un mensaje</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">
        Haz click en cualquier mensaje de la lista para ver el análisis completo de IP-GENIUS y gestionar la comunicación.
      </p>
    </div>
  );
}

// ─── Channel sidebar (left panel in desktop) ───
interface ChannelSidebarProps {
  messages: InboxMessage[];
  channelFilter: string | null;
  onChannelChange: (ch: string | null) => void;
  statusFilter: string | null;
  onStatusChange: (s: string | null) => void;
  categoryFilter: string | null;
  onCategoryChange: (c: string | null) => void;
}

function ChannelSidebar({
  messages, channelFilter, onChannelChange,
  statusFilter, onStatusChange, categoryFilter, onCategoryChange,
}: ChannelSidebarProps) {
  const totalPending = messages.filter(m => m.status === 'pending' || m.status === 'awaiting_approval').length;

  const channels: { key: string | null; label: string; icon: React.ElementType }[] = [
    { key: null, label: 'Todos', icon: InboxIcon },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'phone', label: 'Llamadas', icon: Phone },
  ];

  const getCount = (ch: string | null) => {
    if (ch === null) return messages.length;
    return messages.filter(m => m.channel === ch).length;
  };

  const categoryBadgeColors: Record<string, string> = {
    urgent: 'bg-[#FEE2E2] text-[#DC2626]',
    instruction: 'bg-[#F3E8FF] text-[#7C3AED]',
    query: 'bg-[#E0F2FE] text-[#0284C7]',
    admin: 'bg-[#F1F5F9] text-[#64748B]',
  };

  const categories = [
    { key: 'urgent', label: 'Urgentes', icon: AlertCircle, color: 'text-[#EF4444]', getBadge: () => messages.filter(m => (m.ai_urgency_score ?? 0) >= 7).length },
    { key: 'instruction', label: 'Instrucciones', icon: ClipboardList, color: 'text-[#8B5CF6]', getBadge: () => messages.filter(m => m.ai_category === 'instruction').length },
    { key: 'query', label: 'Consultas', icon: HelpCircle, color: 'text-[#0EA5E9]', getBadge: () => messages.filter(m => m.ai_category === 'query').length },
    { key: 'admin', label: 'Administrativo', icon: FileText, color: 'text-[#94A3B8]', getBadge: () => messages.filter(m => m.ai_category === 'admin').length },
  ];

  return (
    <div className="flex flex-col h-full p-3 space-y-1">
      <div className="flex items-center gap-2 px-2 mb-2">
        <h3 className="text-base font-bold">Inbox</h3>
        {totalPending > 0 && (
          <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1.5">
            {totalPending}
          </Badge>
        )}
      </div>

      {/* CANALES */}
      <h4 className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-2 mb-1">
        Canales
      </h4>
      {channels.map(({ key, label, icon: Icon }) => {
        const count = getCount(key);
        const isActive = channelFilter === key && !categoryFilter;
        return (
          <button
            key={label}
            onClick={() => { onChannelChange(key); onCategoryChange(null); onStatusChange(null); }}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-left',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
          </button>
        );
      })}

      {/* FILTROS RÁPIDOS */}
      <div className="border-t border-[#F1F5F9] my-2" />
      <h4 className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-2 mb-1">
        Filtros
      </h4>
      <button
        onClick={() => onStatusChange(statusFilter === 'assigned' ? null : 'assigned')}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-left',
          statusFilter === 'assigned'
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <User className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Asignados a mí</span>
      </button>
      <button
        onClick={() => onStatusChange(statusFilter === 'no-matter' ? null : 'no-matter')}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-left',
          statusFilter === 'no-matter'
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Sin expediente</span>
      </button>

      {/* CATEGORÍAS IA */}
      <div className="border-t border-[#F1F5F9] my-2" />
      <h4 className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-2 mb-1">
        Categorías IA
      </h4>
      {categories.map(({ key, label, icon: Icon, color, getBadge }) => {
        const count = getBadge();
        const isActive = categoryFilter === key;
        return (
          <button
            key={key}
            onClick={() => {
              onCategoryChange(isActive ? null : key);
              onChannelChange(null);
              onStatusChange(null);
            }}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-left',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? '' : color)} />
            <span className="flex-1 truncate">{label}</span>
            {count > 0 && (
              <span className={cn(
                'text-[10px] font-medium rounded-full px-1.5 py-0 min-w-[20px] text-center',
                categoryBadgeColors[key] || 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ───
export default function CommunicationsUnifiedPage() {
  const isMobile = useIsMobile();
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const { organizationId } = useOrganization();

  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const { data: messages = [], isLoading } = useInboxMessages(channelFilter, statusFilter);
  const { processMessage, processAllPending, processingId, processingAll } = useProcessMessage();

  const unanalyzedCount = useMemo(() => messages.filter(m => !m.ai_category && m.status === 'pending').length, [messages]);

  // Apply category filter client-side
  const filteredMessages = useMemo(() => {
    if (!categoryFilter) return messages;
    if (categoryFilter === 'urgent') return messages.filter(m => (m.ai_urgency_score ?? 0) >= 7);
    return messages.filter(m => m.ai_category === categoryFilter);
  }, [messages, categoryFilter]);

  const selectedMsg = useMemo(() => filteredMessages.find(m => m.id === selectedId) || null, [filteredMessages, selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileView('detail');
  }, [isMobile]);

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

  // ─── Message list (used in mobile and as middle content) ───
  const messageList = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Analyze all header */}
      {unanalyzedCount > 0 && (
        <div className="px-3 py-2 border-b bg-amber-50/50 dark:bg-amber-950/10 flex items-center justify-between gap-2">
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {unanalyzedCount} mensaje{unanalyzedCount > 1 ? 's' : ''} sin analizar
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => processAllPending()}
            disabled={processingAll}
          >
            {processingAll ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1" /> 🤖 Analizar todos</>
            )}
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : filteredMessages.length === 0 ? (
          <EmptyStateNoMessages />
        ) : (
          filteredMessages.map(msg => (
            <MessageListItem
              key={msg.id}
              msg={msg}
              isSelected={msg.id === selectedId}
              onSelect={() => handleSelect(msg.id)}
              onAnalyze={processMessage}
              isAnalyzing={processingId === msg.id || processingAll}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );

  // ─── Mobile: list only ───
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Inbox</h2>
            {filteredMessages.length > 0 && (
              <Badge variant="secondary" className="text-xs">{filteredMessages.length}</Badge>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { key: null, label: 'Todos' },
              { key: 'email', label: '✉️ Email' },
              { key: 'whatsapp', label: '💬 WA' },
            ].map(t => (
              <Button
                key={t.key ?? 'all'}
                variant={channelFilter === t.key ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => { setChannelFilter(t.key); setCategoryFilter(null); }}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>
        {messageList}
      </div>
    );
  }

  // ─── Desktop: 3 panels ───
  return (
    <div className="h-[calc(100vh-14rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Col 1 — Channel sidebar */}
      {!isTablet && (
        <div className="w-[240px] border-r bg-muted/30 flex-shrink-0 overflow-y-auto">
          <ChannelSidebar
            messages={messages}
            channelFilter={channelFilter}
            onChannelChange={setChannelFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />
        </div>
      )}

      {/* Col 2 — Message list */}
      <div className="w-[340px] border-r flex-shrink-0 flex flex-col">
        {isTablet && (
          <div className="p-3 border-b">
            <div className="flex gap-1 flex-wrap">
              {[
                { key: null, label: 'Todos' },
                { key: 'email', label: '✉️' },
                { key: 'whatsapp', label: '💬' },
                { key: 'phone', label: '📞' },
              ].map(t => (
                <button
                  key={t.key ?? 'all'}
                  onClick={() => { setChannelFilter(t.key); setCategoryFilter(null); }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    channelFilter === t.key && !categoryFilter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messageList}
      </div>

      {/* Col 3 — Detail */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        {selectedMsg ? (
          <MessageDetail msg={selectedMsg} organizationId={organizationId} />
        ) : (
          <EmptyDetailState />
        )}
      </div>

      {/* Col 4 — CRM context */}
      <div className="w-[280px] flex-shrink-0 overflow-y-auto">
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
