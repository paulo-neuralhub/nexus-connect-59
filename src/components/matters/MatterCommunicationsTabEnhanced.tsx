/**
 * MatterCommunicationsTab - Tab de comunicaciones del expediente mejorada
 * Con header, filtros, timeline vertical y modales mejorados
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Mail, MessageCircle, Phone, FileText, StickyNote,
  Plus, ChevronDown, ChevronRight, Check, CheckCheck,
  ArrowUpRight, ArrowDownLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { EnhancedEmailComposeModal } from './EnhancedEmailComposeModal';
import { WhatsAppStyleModal } from './WhatsAppStyleModal';
import { LogCallModal } from './LogCallModal';

interface MatterCommunicationsTabProps {
  matterId: string;
  matterReference?: string;
  matterTitle?: string;
  matterType?: string;
  jurisdiction?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
}

type ChannelFilter = 'all' | 'email' | 'whatsapp' | 'call' | 'note';

interface Communication {
  id: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  body_preview: string | null;
  received_at: string | null;
  created_at: string;
  email_from: string | null;
  email_to: string[] | null;
  whatsapp_from: string | null;
  whatsapp_to: string | null;
}

const CHANNEL_CONFIG: Record<string, { icon: typeof Mail; color: string; bg: string; label: string }> = {
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Email' },
  whatsapp: { icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'WhatsApp' },
  call: { icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Llamada' },
  note: { icon: StickyNote, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Nota' },
};

export function MatterCommunicationsTab({
  matterId,
  matterReference = '',
  matterTitle,
  matterType,
  jurisdiction,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
}: MatterCommunicationsTabProps) {
  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch communications
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['matter-communications', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('id, channel, direction, subject, body_preview, received_at, created_at, email_from, email_to, whatsapp_from, whatsapp_to')
        .eq('matter_id', matterId)
        .order('received_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Communication[];
    },
    enabled: !!matterId,
  });

  // Filter communications
  const filteredComms = useMemo(() => {
    if (filter === 'all') return communications;
    return communications.filter(c => c.channel === filter);
  }, [communications, filter]);

  // Count by channel
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: communications.length, email: 0, whatsapp: 0, call: 0, note: 0 };
    communications.forEach(c => {
      if (result[c.channel] !== undefined) result[c.channel]++;
    });
    return result;
  }, [communications]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filters: { value: ChannelFilter; label: string; icon?: typeof Mail }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'email', label: 'Emails', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'call', label: 'Llamadas', icon: Phone },
    { value: 'note', label: 'Notas', icon: StickyNote },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' }}
          >
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0a2540' }}>Comunicaciones</h3>
              <NeoBadge value={communications.length} color="cyan" size="sm" />
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Historial de emails, WhatsApp y llamadas
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowEmailModal(true)}
            className="gap-1.5"
          >
            <Mail className="h-4 w-4" />
            + Email
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowWhatsAppModal(true)}
            className="gap-1.5 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            + WhatsApp
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowCallModal(true)}
            className="gap-1.5"
          >
            <StickyNote className="h-4 w-4" />
            + Nota
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              filter === f.value 
                ? "bg-cyan-100 text-cyan-700 border border-cyan-200" 
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            {f.icon && <f.icon className="h-3.5 w-3.5" />}
            {f.label}
            {counts[f.value] > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 rounded text-xs",
                filter === f.value ? "bg-cyan-200/50" : "bg-slate-200"
              )}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div 
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: 'linear-gradient(to bottom, rgba(0,180,216,0.3), rgba(0,180,216,0.05))' }}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredComms.length === 0 ? (
          <div className="text-center py-12 ml-12">
            <Mail className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Sin comunicaciones</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Las comunicaciones de este expediente aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComms.map((comm) => {
              const config = CHANNEL_CONFIG[comm.channel] || CHANNEL_CONFIG.note;
              const Icon = config.icon;
              const isExpanded = expandedId === comm.id;
              const dateStr = comm.received_at || comm.created_at;
              const isInbound = comm.direction === 'inbound';

              return (
                <Collapsible 
                  key={comm.id} 
                  open={isExpanded} 
                  onOpenChange={() => toggleExpand(comm.id)}
                >
                  <div className="flex items-start gap-3 ml-0.5">
                    {/* Timeline dot */}
                    <div 
                      className={cn(
                        "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        config.bg
                      )}
                      style={{ border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Content card */}
                    <CollapsibleTrigger asChild>
                      <div 
                        className="flex-1 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
                        style={{ 
                          background: 'white', 
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className={cn(config.bg, config.color, "text-[10px] px-1.5 py-0")}>
                                {config.label}
                              </Badge>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                {isInbound ? (
                                  <>
                                    <ArrowDownLeft className="h-3 w-3" />
                                    Recibido
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="h-3 w-3" />
                                    Enviado
                                  </>
                                )}
                              </span>
                              {comm.channel === 'whatsapp' && !isInbound && (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              )}
                            </div>

                            {/* Subject/title */}
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a2540' }} className="truncate">
                              {comm.subject || `${config.label} - ${format(new Date(dateStr), 'dd MMM yyyy', { locale: es })}`}
                            </p>

                            {/* Preview */}
                            {comm.body_preview && (
                              <p 
                                style={{ fontSize: '12px', color: '#64748b' }} 
                                className={cn("mt-1", isExpanded ? "" : "line-clamp-2")}
                              >
                                {comm.body_preview}
                              </p>
                            )}

                            {/* Sender/recipient info */}
                            {(comm.email_from || comm.email_to) && (
                              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                {isInbound ? `De: ${comm.email_from}` : `Para: ${comm.email_to?.join(', ')}`}
                              </p>
                            )}
                          </div>

                          {/* Time and expand */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })}
                            </span>
                            <ChevronRight 
                              className={cn(
                                "h-4 w-4 text-slate-400 transition-transform",
                                isExpanded && "rotate-90"
                              )} 
                            />
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>

                  {/* Expanded content */}
                  <CollapsibleContent>
                    <div className="ml-[52px] mt-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <p style={{ fontSize: '11px', color: '#64748b' }}>
                          {format(new Date(dateStr), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                        <div className="flex gap-2">
                          {comm.channel === 'email' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              Responder
                            </Button>
                          )}
                          {comm.channel === 'whatsapp' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              Continuar chat
                            </Button>
                          )}
                        </div>
                      </div>
                      <div 
                        className="p-3 rounded-lg bg-white border text-sm text-slate-700 whitespace-pre-wrap"
                        style={{ fontSize: '13px', lineHeight: 1.6 }}
                      >
                        {comm.body_preview || 'Sin contenido disponible'}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedEmailComposeModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        matterId={matterId}
        matterReference={matterReference}
        matterTitle={matterTitle}
        matterType={matterType}
        clientName={clientName || undefined}
        clientEmail={clientEmail || undefined}
        jurisdiction={jurisdiction}
      />

      <WhatsAppStyleModal
        open={showWhatsAppModal}
        onOpenChange={setShowWhatsAppModal}
        matterId={matterId}
        matterReference={matterReference}
        matterTitle={matterTitle}
        matterType={matterType}
        jurisdiction={jurisdiction}
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
      />

      <LogCallModal
        open={showCallModal}
        onOpenChange={setShowCallModal}
        matterId={matterId}
        contactName={clientName || undefined}
      />
    </div>
  );
}
