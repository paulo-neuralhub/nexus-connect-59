// ============================================================
// IP-NEXUS — Unified Inbox (redesigned 3+1 panel layout v2)
// ============================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOrganization } from '@/hooks/useOrganization';
import { useInboxMessages, useClientMatters, useClientActivities, useFilteredMessages, useFilteredCount, type InboxMessage } from '@/hooks/use-inbox';
import { fromTable } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProcessMessage } from '@/hooks/use-process-message';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import {
  Mail, MessageCircle, Phone, ArrowLeft, Inbox as InboxIcon,
  Archive, UserPlus, Send, Bot, ExternalLink, Plug, CheckCircle2,
  AlertCircle, User, ClipboardList, HelpCircle, FileText, ArrowRight,
  Clock, Briefcase, Loader2, Sparkles, Eye, EyeOff, Menu, X,
  ShieldBan, Ban, RotateCcw, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ─── localStorage helpers ───
function savePanelSizes(sizes: number[]) {
  try { localStorage.setItem('inbox-panel-sizes', JSON.stringify(sizes)); } catch { /* silent */ }
}
function loadPanelSizes(): number[] | null {
  try { const s = localStorage.getItem('inbox-panel-sizes'); return s ? JSON.parse(s) : null; } catch { return null; }
}
function loadPrivateMode(): boolean {
  try { return localStorage.getItem('inbox-private-mode') === 'true'; } catch { return false; }
}
function savePrivateMode(v: boolean) {
  try { localStorage.setItem('inbox-private-mode', v ? 'true' : 'false'); } catch { /* silent */ }
}

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

// ─── Detect HTML in body ───
function isHtmlContent(text: string | null): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

// ─── Channel icon helper ───
function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  switch (channel) {
    case 'email': return <Mail className={cn('h-4 w-4 text-primary', className)} />;
    case 'whatsapp': return <MessageCircle className={cn('h-4 w-4 text-green-500', className)} />;
    case 'phone': return <Phone className={cn('h-4 w-4 text-muted-foreground', className)} />;
    default: return <Mail className={cn('h-4 w-4 text-muted-foreground', className)} />;
  }
}

// ─── Urgency badge ───
function UrgencyBadge({ score }: { score: number | null }) {
  if (!score || score < 5) return null;
  if (score >= 9) return <Badge className="bg-destructive/10 text-destructive text-[10px] border-0">🚨 Crítico</Badge>;
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

// ─── Category card styles ───
function getCategoryCardClasses(msg: InboxMessage, isSelected: boolean) {
  if (isSelected) {
    return 'bg-[#EFF6FF] border-[#BFDBFE] shadow-[0_2px_8px_rgba(59,130,246,0.15)]';
  }
  const cat = msg.ai_category;
  const isUrgent = cat === 'urgent' || (msg.ai_urgency_score != null && msg.ai_urgency_score >= 7);
  if (cat === 'instruction') return 'bg-[#F9F5FF] border-[#DDD6FE]';
  if (isUrgent) return 'bg-[#FFF5F5] border-[#FECACA]';
  if (cat === 'query') return 'bg-[#F0F9FF] border-[#BAE6FD]';
  return 'bg-white border-[#E2E8F0]';
}

// ─── Message list item (card style) ───
function MessageListItem({ msg, isSelected, onSelect, onAnalyze, isAnalyzing, privateMode }: {
  msg: InboxMessage; isSelected: boolean; onSelect: () => void;
  onAnalyze?: (id: string) => void; isAnalyzing?: boolean; privateMode?: boolean;
}) {
  const navigate = useNavigate();
  const { data: linkedInstruction } = useLinkedInstruction(msg.id);
  const timeAgo = msg.created_at
    ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: es })
    : '';
  const canAnalyze = !msg.ai_category && onAnalyze;
  const cardClasses = getCategoryCardClasses(msg, isSelected);

  const bodyPreview = privateMode ? '••••••••••••••••••' : (msg.body || '').slice(0, 80);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-[10px] border p-3 mx-2 my-1 transition-all duration-150 cursor-pointer',
        'hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
        isSelected && 'translate-y-0',
        cardClasses,
      )}
      style={{ minHeight: 72, width: 'calc(100% - 16px)' }}
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
      {/* Body preview - 1 line */}
      {bodyPreview && (
        <p className="text-[13px] text-[#9CA3AF] truncate mt-0.5">{bodyPreview}</p>
      )}
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
    draft: 'Borrador', sent: 'Enviada', in_progress: 'En curso',
    completed: 'Completada', cancelled: 'Cancelada', partially_executed: 'Parcialmente ejecutada',
  };

  return (
    <div className="mt-4 rounded-[10px] border border-[#86EFAC] bg-[#F0FDF4] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
        <CheckCircle2 className="h-4 w-4" /> INSTRUCCIÓN GENERADA
      </div>
      <p className="text-xs text-muted-foreground">Este mensaje generó la siguiente instrucción:</p>
      <div className="space-y-1">
        <p className="text-sm font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#15803D]" /> {instruction.title}
        </p>
        <p className="text-xs text-muted-foreground">
          Status: {statusLabels[instruction.status] || instruction.status}
          {instruction.total_targets ? ` · ${instruction.total_targets} jurisdicciones` : ''}
        </p>
      </div>
      <Button variant="link" size="sm" className="text-[#15803D] p-0 h-auto text-xs font-medium"
        onClick={() => navigate('/app/instructions')}>
        Ver instrucción completa <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

// ─── Detail panel ───
function MessageDetail({ msg, organizationId, onBack, onAnalyze, isAnalyzing }: {
  msg: InboxMessage; organizationId: string | undefined; onBack?: () => void;
  onAnalyze?: (id: string) => void; isAnalyzing?: boolean;
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

  // Render body: HTML sanitized or plain text
  const renderBody = () => {
    if (!msg.body) return <p className="text-sm text-muted-foreground italic">(Sin contenido)</p>;
    if (isHtmlContent(msg.body)) {
      return (
        <div
          className="text-sm prose prose-sm max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.body) }}
        />
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>;
  };

  return (
    <div className="flex flex-col h-full bg-white"
      style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.08), inset 1px 0 0 rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="border-b border-[#F1F5F9] px-6 py-5"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <ChannelIcon channel={msg.channel} className="h-5 w-5" />
          <span className="text-lg font-semibold">{msg.sender_name || 'Desconocido'}</span>
          <UrgencyBadge score={msg.ai_urgency_score} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {msg.sender_email || msg.sender_phone || ''}
          {msg.created_at && ` · ${format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale: es })}`}
        </p>
        {msg.subject && <h3 className="font-medium mt-1">{msg.subject}</h3>}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {renderBody()}
        </div>

        {/* IP-GENIUS card */}
        {msg.ai_category && (
          <div className="mx-6 mb-4 rounded-[10px] border border-[#FDE68A] p-4 space-y-2"
            style={{ background: 'linear-gradient(135deg, #FFFBF0, #FFF7E0)' }}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-amber-600" />
              IP-GENIUS analizó este mensaje
            </div>
            {msg.ai_summary && <p className="text-sm text-muted-foreground">{msg.ai_summary}</p>}
            {msg.ai_confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confianza:</span>
                <div className="flex-1 h-2 bg-muted rounded-full max-w-[200px]">
                  <div className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.round(msg.ai_confidence * 100)}%` }} />
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

        {/* Linked instruction */}
        <div className="px-6">
          <LinkedInstructionSection messageId={msg.id} />
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {onAnalyze && (
            <Button variant="outline" size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => onAnalyze(msg.id)} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analizando...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> {msg.ai_category ? '🤖 Re-analizar' : '🤖 Analizar'}</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-1" /> Archivar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowReply(v => !v)}>
            <Send className="h-4 w-4 mr-1" /> Responder
          </Button>
        </div>
        {showReply && (
          <div className="space-y-2">
            <Textarea value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Escribe tu respuesta..." rows={3} />
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
  const { data: activities = [] } = useClientActivities(msg.account_id);

  if (!msg.account_id && !msg.account) {
    return (
      <div className="p-4 space-y-4 text-center">
        <div className="rounded-full bg-muted p-3 w-fit mx-auto">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Remitente no identificado</p>
        <p className="text-xs text-muted-foreground">{msg.sender_name} no está vinculado a ningún cliente.</p>
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
    <div className="p-2 space-y-2">
      {/* Client card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{msg.account?.name || msg.sender_name}</p>
            {msg.sender_email && <p className="text-xs text-muted-foreground truncate">{msg.sender_email}</p>}
          </div>
        </div>
        <Button variant="link" size="sm" className="text-xs p-0 h-auto"
          onClick={() => msg.account_id && navigate(`/app/crm/accounts/${msg.account_id}`)}>
          Ver perfil → <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Matters */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="h-3 w-3" /> Expedientes activos
        </h4>
        {matters.length > 0 ? matters.map((m: any) => (
          <button key={m.id}
            className="w-full text-left rounded-md border p-2 hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/app/expedientes/${m.id}`)}>
            <div className="flex items-center gap-2 mb-0.5">
              {m.type && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{m.type}</Badge>}
              <span className="text-xs font-medium truncate">{m.reference_number || m.title}</span>
            </div>
            {m.title && m.reference_number && <p className="text-[11px] text-muted-foreground truncate">{m.title}</p>}
            {m.status && <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0 h-4">{m.status}</Badge>}
          </button>
        )) : (
          <p className="text-xs text-muted-foreground italic">Sin expedientes activos</p>
        )}
      </div>

      {/* Last activity */}
      {lastActivity && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Último contacto
          </h4>
          <div className="rounded-md border p-2">
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
function EmptyDetailState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#F8FAFC]">
      <InboxIcon className="h-16 w-16 text-[#CBD5E1] mb-4" />
      <h3 className="text-base font-semibold mb-1">Selecciona un mensaje</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">
        Haz click en cualquier mensaje de la lista para ver el análisis completo de IP-GENIUS.
      </p>
    </div>
  );
}

function EmptyStateNoMessages() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="rounded-full bg-green-100 p-4 mb-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Todo al día</h3>
      <p className="text-sm text-muted-foreground">No hay mensajes pendientes. Buen trabajo 🎉</p>
    </div>
  );
}

// ─── CAMBIO 1: Dark sidebar ───
interface ChannelSidebarProps {
  messages: InboxMessage[];
  channelFilter: string | null;
  onChannelChange: (ch: string | null) => void;
  statusFilter: string | null;
  onStatusChange: (s: string | null) => void;
  categoryFilter: string | null;
  onCategoryChange: (c: string | null) => void;
  filteredCount?: number;
  showFiltered?: boolean;
  onToggleFiltered?: () => void;
}

function ChannelSidebar({
  messages, channelFilter, onChannelChange,
  statusFilter, onStatusChange, categoryFilter, onCategoryChange,
  filteredCount, showFiltered, onToggleFiltered,
}: ChannelSidebarProps) {
  const totalPending = messages.filter(m => m.status === 'pending' || m.status === 'awaiting_approval').length;

  const channels: { key: string | null; label: string; icon: React.ElementType }[] = [
    { key: null, label: 'Todos', icon: InboxIcon },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'phone', label: 'Llamadas', icon: Phone },
  ];

  const getCount = (ch: string | null) => ch === null ? messages.length : messages.filter(m => m.channel === ch).length;

  const categories = [
    { key: 'urgent', label: 'Urgentes', dotColor: '#FCA5A5', getBadge: () => messages.filter(m => (m.ai_urgency_score ?? 0) >= 7).length },
    { key: 'instruction', label: 'Instrucciones', dotColor: '#C4B5FD', getBadge: () => messages.filter(m => m.ai_category === 'instruction').length },
    { key: 'query', label: 'Consultas', dotColor: '#93C5FD', getBadge: () => messages.filter(m => m.ai_category === 'query').length },
    { key: 'admin', label: 'Admin', dotColor: 'rgba(255,255,255,0.5)', getBadge: () => messages.filter(m => m.ai_category === 'admin').length },
  ];

  const isActiveItem = (key: string | null, type: 'channel' | 'category' | 'status') => {
    if (type === 'channel') return channelFilter === key && !categoryFilter && !statusFilter;
    if (type === 'category') return categoryFilter === key;
    return statusFilter === key;
  };

  const itemClass = (active: boolean) => cn(
    'flex items-center gap-2.5 w-full rounded-md px-4 py-2 text-sm transition-all duration-150 text-left mx-2',
    active
      ? 'font-semibold'
      : 'hover:bg-white/[0.08]',
  );

  const itemStyle = (active: boolean): React.CSSProperties => ({
    color: active ? 'white' : 'rgba(255,255,255,0.75)',
    backgroundColor: active ? 'rgba(255,255,255,0.15)' : undefined,
    width: 'calc(100% - 16px)',
  });

  return (
    <div className="flex flex-col h-full py-3 space-y-0.5 overflow-y-auto"
      style={{ background: '#0f4c75', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Title */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <h3 className="text-base font-bold text-white">Inbox</h3>
        {totalPending > 0 && (
          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[20px] text-center text-white"
            style={{ backgroundColor: '#DC2626' }}>
            {totalPending}
          </span>
        )}
      </div>

      {/* Canales */}
      <p className="px-4 mb-1 uppercase tracking-[0.1em]"
        style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10 }}>Canales</p>
      {channels.map(({ key, label, icon: Icon }) => {
        const count = getCount(key);
        const active = isActiveItem(key, 'channel');
        return (
          <button key={label}
            onClick={() => { onChannelChange(key); onCategoryChange(null); onStatusChange(null); }}
            className={itemClass(active)} style={itemStyle(active)}>
            <Icon className="h-4 w-4 flex-shrink-0" style={{ opacity: 0.8 }} />
            <span className="flex-1 truncate">{label}</span>
            {count > 0 && (
              <span className="text-xs rounded-full px-1.5 min-w-[20px] text-center"
                style={{ background: 'rgba(255,255,255,0.20)', color: 'white', fontSize: 10 }}>
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Separator */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />

      {/* Filtros */}
      <p className="px-4 mb-1 uppercase tracking-[0.1em]"
        style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10 }}>Filtros</p>
      {[
        { key: 'assigned', label: 'Asignados a mí', icon: User },
        { key: 'no-matter', label: 'Sin expediente', icon: AlertCircle },
      ].map(({ key, label, icon: Icon }) => {
        const active = isActiveItem(key, 'status');
        return (
          <button key={key}
            onClick={() => { onStatusChange(statusFilter === key ? null : key); onCategoryChange(null); }}
            className={itemClass(active)} style={itemStyle(active)}>
            <Icon className="h-4 w-4 flex-shrink-0" style={{ opacity: 0.8 }} />
            <span className="flex-1 truncate">{label}</span>
          </button>
        );
      })}

      {/* Separator */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />

      {/* Categorías IA */}
      <p className="px-4 mb-1 uppercase tracking-[0.1em]"
        style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10 }}>Categorías IA</p>
      {categories.map(({ key, label, dotColor, getBadge }) => {
        const count = getBadge();
        const active = isActiveItem(key, 'category');
        return (
          <button key={key}
            onClick={() => { onCategoryChange(active ? null : key); onChannelChange(null); onStatusChange(null); }}
            className={itemClass(active)} style={itemStyle(active)}>
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
            <span className="flex-1 truncate">{label}</span>
            {count > 0 && key === 'urgent' ? (
              <span className="text-[10px] font-medium rounded-full px-1.5 min-w-[20px] text-center text-white"
                style={{ backgroundColor: '#DC2626' }}>{count}</span>
            ) : count > 0 ? (
              <span className="text-xs rounded-full px-1.5 min-w-[20px] text-center"
                style={{ background: 'rgba(255,255,255,0.20)', color: 'white', fontSize: 10 }}>{count}</span>
            ) : null}
          </button>
        );
      })}

      {/* Separator */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />

      {/* Filtrados (spam/promo/notification) */}
      <p className="px-4 mb-1 uppercase tracking-[0.1em]"
        style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10 }}>Sistema</p>
      <button
        onClick={() => onToggleFiltered?.()}
        className={itemClass(!!showFiltered)} style={itemStyle(!!showFiltered)}>
        <ShieldBan className="h-4 w-4 flex-shrink-0" style={{ opacity: 0.8 }} />
        <span className="flex-1 truncate">Filtrados</span>
        {(filteredCount ?? 0) > 0 && (
          <span className="text-xs rounded-full px-1.5 min-w-[20px] text-center"
            style={{ background: 'rgba(255,255,255,0.20)', color: 'white', fontSize: 10 }}>
            {filteredCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export default function CommunicationsUnifiedPage() {
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktopSmall = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isDesktopLarge = useMediaQuery('(min-width: 1280px)');
  const { organizationId } = useOrganization();

  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [privateMode, setPrivateMode] = useState(loadPrivateMode);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crmSheetOpen, setCrmSheetOpen] = useState(false);
  const [showFiltered, setShowFiltered] = useState(false);

  const { data: messages = [], isLoading } = useInboxMessages(channelFilter, statusFilter);
  const { data: filteredMsgs = [], isLoading: filteredLoading } = useFilteredMessages();
  const { data: filteredTodayCount = 0 } = useFilteredCount();
  const qcMain = useQueryClient();
  const { processMessage, processAllPending, processingId, processingAll } = useProcessMessage();

  const unanalyzedCount = useMemo(() => messages.filter(m => !m.ai_category && m.status === 'pending').length, [messages]);

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

  const togglePrivateMode = useCallback(() => {
    setPrivateMode(prev => { const next = !prev; savePrivateMode(next); return next; });
  }, []);

  const handleToggleFiltered = useCallback(() => {
    setShowFiltered(prev => !prev);
    setSelectedId(null);
    setChannelFilter(null);
    setCategoryFilter(null);
    setStatusFilter(null);
  }, []);

  const handleMarkNotSpam = useCallback(async (msgId: string) => {
    await fromTable('incoming_messages')
      .update({ status: 'pending', ai_category: null })
      .eq('id', msgId);
    toast.success('Mensaje restaurado — será re-analizado');
    qcMain.invalidateQueries({ queryKey: ['inbox-filtered'] });
    qcMain.invalidateQueries({ queryKey: ['inbox-filtered-count'] });
    qcMain.invalidateQueries({ queryKey: ['inbox-messages'] });
    qcMain.invalidateQueries({ queryKey: ['inbox-count'] });
  }, [qcMain]);

  // ─── Saved panel sizes ───
  const savedSizes = loadPanelSizes();

  // ─── Filtered messages view ───
  const filteredListContent = (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-[#F1F5F9]">
      <div className="bg-white border-b border-[#F1F5F9] px-4 py-3 flex items-center justify-between gap-2"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          <ShieldBan className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">🚫 Filtrados</span>
          <Badge variant="secondary" className="text-xs">{filteredMsgs.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7"
          onClick={() => setShowFiltered(false)}>
          ← Volver al Inbox
        </Button>
      </div>
      <div className="px-3 py-2 bg-muted/50 border-b">
        <p className="text-xs text-muted-foreground">
          Mensajes clasificados como spam, promoción o notificación por IP-GENIUS.
          Puedes restaurarlos si fueron filtrados incorrectamente.
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : filteredMsgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
            <p className="text-sm font-medium">Sin mensajes filtrados</p>
            <p className="text-xs text-muted-foreground mt-1">No se ha detectado spam ni promociones</p>
          </div>
        ) : (
          <div className="py-1 space-y-1">
            {filteredMsgs.map(msg => {
              const catLabel = msg.ai_category === 'spam' ? '🚫 Spam'
                : msg.ai_category === 'promo' ? '📢 Promoción'
                : msg.ai_category === 'notification' ? '🔔 Notificación'
                : msg.ai_category || 'Filtrado';
              const timeAgo = msg.created_at
                ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: es })
                : '';
              return (
                <div key={msg.id}
                  className="mx-2 rounded-lg border border-muted bg-white p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={msg.channel} />
                    <span className="text-sm font-medium truncate flex-1">{msg.sender_name || msg.sender_email || 'Desconocido'}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{catLabel}</Badge>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">hace {timeAgo}</span>
                  </div>
                  <p className="text-sm truncate">{msg.subject || '(Sin asunto)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{(msg.body || '').slice(0, 100)}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => handleMarkNotSpam(msg.id)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> No es spam
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Message list content ───
  const messageListContent = (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-[#F1F5F9]">
      {/* Header */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 py-3 flex items-center justify-between gap-2"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          {/* Hamburger for tablet */}
          {isTablet && (
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <span className="text-sm font-semibold">{filteredMessages.length} mensajes</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Private mode toggle */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePrivateMode}
            title={privateMode ? 'Desactivar modo privado' : 'Activar modo privado'}>
            {privateMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {/* Analyze all banner */}
      {unanalyzedCount > 0 && (
        <div className="px-3 py-2 border-b bg-amber-50/80 flex items-center justify-between gap-2">
          <span className="text-xs text-amber-700">{unanalyzedCount} sin analizar</span>
          <Button variant="outline" size="sm"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => processAllPending()} disabled={processingAll}>
            {processingAll ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1" /> 🤖 Analizar todos</>
            )}
          </Button>
        </div>
      )}
      {/* Tablet channel filter chips */}
      {isTablet && (
        <div className="px-3 py-2 border-b bg-white flex gap-1 flex-wrap">
          {[
            { key: null, label: 'Todos' },
            { key: 'email', label: '✉️ Email' },
            { key: 'whatsapp', label: '💬 WA' },
            { key: 'phone', label: '📞' },
          ].map(t => (
            <button key={t.key ?? 'all'}
              onClick={() => { setChannelFilter(t.key); setCategoryFilter(null); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                channelFilter === t.key && !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[10px]" />)}
          </div>
        ) : filteredMessages.length === 0 ? (
          <EmptyStateNoMessages />
        ) : (
          <div className="py-1">
            {filteredMessages.map(msg => (
              <MessageListItem
                key={msg.id} msg={msg}
                isSelected={msg.id === selectedId}
                onSelect={() => handleSelect(msg.id)}
                onAnalyze={processMessage}
                isAnalyzing={processingId === msg.id || processingAll}
                privateMode={privateMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Mobile detail ───
  if (isMobile && mobileView === 'detail' && selectedMsg) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <MessageDetail msg={selectedMsg} organizationId={organizationId}
          onBack={() => { setMobileView('list'); setSelectedId(null); }}
          onAnalyze={processMessage} isAnalyzing={processingId === selectedMsg.id} />
      </div>
    );
  }

  // ─── Mobile: list only ───
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="p-3 border-b space-y-2 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Inbox</h2>
            <Badge variant="secondary" className="text-xs">{filteredMessages.length}</Badge>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePrivateMode}>
              {privateMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { key: null, label: 'Todos' },
              { key: 'email', label: '✉️ Email' },
              { key: 'whatsapp', label: '💬 WA' },
            ].map(t => (
              <Button key={t.key ?? 'all'}
                variant={channelFilter === t.key ? 'default' : 'outline'}
                size="sm" className="text-xs h-7"
                onClick={() => { setChannelFilter(t.key); setCategoryFilter(null); }}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>
        {messageListContent}
      </div>
    );
  }

  // ─── Desktop / Tablet: Multi-panel ───
  const showSidebar = isDesktopSmall || isDesktopLarge;
  const showCRMPanel = isDesktopLarge;

  return (
    <div className="h-[calc(100vh-14rem)] min-h-0 flex rounded-xl border overflow-hidden">
      {/* Col 1 — Dark sidebar (desktop only) */}
      {showSidebar && (
        <div className="w-[220px] flex-shrink-0 overflow-y-auto">
          <ChannelSidebar
            messages={messages}
            channelFilter={channelFilter} onChannelChange={setChannelFilter}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
          />
        </div>
      )}

      {/* Tablet sidebar sheet */}
      {isTablet && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetHeader className="sr-only"><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <ChannelSidebar
              messages={messages}
              channelFilter={channelFilter} onChannelChange={(ch) => { setChannelFilter(ch); setSidebarOpen(false); }}
              statusFilter={statusFilter} onStatusChange={(s) => { setStatusFilter(s); setSidebarOpen(false); }}
              categoryFilter={categoryFilter} onCategoryChange={(c) => { setCategoryFilter(c); setSidebarOpen(false); }}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Col 2 + 3: Resizable panels */}
      <ResizablePanelGroup direction="horizontal" className="h-full"
        onLayout={(sizes) => savePanelSizes(sizes)}>
        <ResizablePanel
          className="min-h-0"
          defaultSize={savedSizes?.[0] ?? 32}
          minSize={22} maxSize={45}>
          {messageListContent}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel className="min-h-0" defaultSize={savedSizes?.[1] ?? 68}>
          <div className="flex h-full">
            {/* Detail */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              {selectedMsg ? (
                <MessageDetail msg={selectedMsg} organizationId={organizationId}
                  onAnalyze={processMessage} isAnalyzing={processingId === selectedMsg.id} />
              ) : (
                <EmptyDetailState />
              )}
              {/* CRM floating button for 1024-1280 */}
              {isDesktopSmall && selectedMsg && (
                <Button
                  className="absolute bottom-20 right-4 shadow-lg z-10"
                  size="sm"
                  onClick={() => setCrmSheetOpen(true)}>
                  <User className="h-4 w-4 mr-1" /> 👤 Ver cliente
                </Button>
              )}
            </div>

            {/* Col 4 — CRM panel (>1280px) */}
            {showCRMPanel && (
              <div className="w-[260px] flex-shrink-0 overflow-y-auto border-l border-[#E2E8F0]"
                style={{ background: '#F8FAFC' }}>
                {selectedMsg ? <CRMContextPanel msg={selectedMsg} /> : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                    Contexto CRM
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* CRM slide-in sheet for 1024-1280 */}
      {isDesktopSmall && (
        <Sheet open={crmSheetOpen} onOpenChange={setCrmSheetOpen}>
          <SheetContent side="right" className="w-[300px] p-0" style={{ background: '#F8FAFC' }}>
            <SheetHeader className="sr-only"><SheetTitle>Cliente</SheetTitle></SheetHeader>
            {selectedMsg && <CRMContextPanel msg={selectedMsg} />}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
