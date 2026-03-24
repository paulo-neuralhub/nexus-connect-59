// @ts-nocheck
import { useState } from 'react';
import { ClipboardList, Plus, ChevronDown, ChevronUp, Mail, Phone, Globe, MessageCircle, Video, FileText, Send, Search as SearchIcon, DollarSign, Zap, CheckCircle2, Circle, Clock, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useInstructions, type InstructionFilter, type Instruction } from '@/hooks/use-instructions';
import { NewInstructionModal } from '@/components/features/instructions/NewInstructionModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/* ── Constants ── */

const SOURCE_ICONS: Record<string, any> = {
  email: Mail, whatsapp: MessageCircle, portal: Globe,
  phone: Phone, meeting: Video, letter: FileText,
};

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email', whatsapp: 'WhatsApp', portal: 'Portal',
  phone: 'Teléfono', meeting: 'Reunión', letter: 'Carta',
};

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  trademark_registration: { label: 'Marca', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
  trademark_renewal:      { label: 'Renovación', bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]' },
  renewal:                { label: 'Renovación', bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]' },
  patent_application:     { label: 'Patente', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' },
  patent_prosecution:     { label: 'Patente', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' },
  patent_renewal:         { label: 'Anualidades', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  opposition:             { label: 'Oposición', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' },
  surveillance:           { label: 'Vigilancia', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
  assignment:             { label: 'Cesión', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
  design:                 { label: 'Diseño', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
  other:                  { label: 'Otro', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
};

const JURISDICTION_FLAGS: Record<string, string> = {
  EU: '🇪🇺', ES: '🇪🇸', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', PT: '🇵🇹', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', CA: '🇨🇦', AR: '🇦🇷', WO: '🌍',
  EP: '🇪🇺', PCT: '🌍',
};

const ITEM_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', label: 'Pendiente' },
  confirmed: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', label: 'Confirmado' },
  executed:  { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Ejecutado' },
};

/* ── Helpers ── */

function getUrgencyBorder(instruction: Instruction) {
  const isDeadlineCritical = instruction.deadline_date &&
    new Date(instruction.deadline_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  if (instruction.is_urgent && isDeadlineCritical)
    return { borderClass: 'border-l-[4px] border-l-[#EF4444]', badge: '🔴 CRÍTICO', badgeBg: 'bg-[#FEF2F2]', badgeText: 'text-[#DC2626]' };
  if (instruction.is_urgent)
    return { borderClass: 'border-l-[4px] border-l-[#F59E0B]', badge: '🟡 URGENTE', badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]' };
  return { borderClass: 'border-l-[4px] border-l-[#E2E8F0]', badge: null, badgeBg: '', badgeText: '' };
}

function getProgressColor(pct: number) {
  if (pct < 33) return 'bg-[#EF4444]';
  if (pct < 66) return 'bg-[#F59E0B]';
  return 'bg-[#22C55E]';
}

/* ── InstructionCard ── */

function InstructionCard({ instruction }: { instruction: Instruction }) {
  const [expanded, setExpanded] = useState(false);
  const urgency = getUrgencyBorder(instruction);
  const executedCount = instruction.executed_count || 0;
  const totalTargets = instruction.total_targets || instruction.items?.length || 0;
  const SourceIcon = SOURCE_ICONS[instruction.source || ''] || Mail;
  const typeConf = TYPE_CONFIG[instruction.instruction_type] || TYPE_CONFIG.other;

  const processChecklist = [
    { label: 'Instrucción recibida', done: true, date: instruction.created_at },
    { label: 'Acuse de recibo enviado', done: !!instruction.acknowledgement_sent_at, date: instruction.acknowledgement_sent_at },
    { label: 'Conflictos verificados', done: !!instruction.conflict_checked, date: null },
    { label: 'Presupuesto enviado', done: !!instruction.quote_sent_at, date: instruction.quote_sent_at },
    { label: 'Presupuesto aprobado', done: !!instruction.quote_approved_at, date: instruction.quote_approved_at },
    { label: 'Expedientes creados', done: executedCount > 0, date: null },
  ];
  const completedSteps = processChecklist.filter(s => s.done).length;
  const progressPct = Math.round((completedSteps / processChecklist.length) * 100);
  const allDone = completedSteps === processChecklist.length;

  const warnings: { label: string; bg: string; text: string }[] = [];
  if (!instruction.conflict_checked) warnings.push({ label: '⚠️ Conflicto no verificado', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' });
  if (!instruction.acknowledgement_sent_at) warnings.push({ label: '📨 Sin acuse de recibo', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' });
  if (!instruction.quote_sent_at && instruction.conflict_checked) warnings.push({ label: '💶 Sin presupuesto', bg: 'bg-[#FFF7ED]', text: 'text-[#C2410C]' });

  const clientInitials = (instruction.account?.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'rounded-[16px] border border-[#E2E8F0] bg-white overflow-hidden transition-shadow duration-200',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
        urgency.borderClass,
      )}
    >
      {/* ── Header (clickable) ── */}
      <button
        className="w-full text-left focus:outline-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badge row */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {urgency.badge && (
                  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold', urgency.badgeBg, urgency.badgeText)}>
                    {urgency.badge}
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]',
                  typeConf.bg, typeConf.text,
                )}>
                  {typeConf.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[16px] font-bold text-[#0F172A] leading-snug truncate">
                {instruction.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-1.5 text-[13px] text-[#64748B]">
                <span
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: '#6366F1' }}
                >
                  {clientInitials}
                </span>
                <span className="font-medium truncate">{instruction.account?.name || 'Sin cliente'}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>{instruction.created_at ? formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true, locale: es }) : ''}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span className="inline-flex items-center gap-1">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {SOURCE_LABELS[instruction.source || ''] || instruction.source}
                </span>
              </div>
            </div>

            <div className="pt-2">
              {expanded
                ? <ChevronUp className="h-4 w-4 text-[#94A3B8]" />
                : <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
              }
            </div>
          </div>
        </div>

        {/* ── Metrics row (always visible) ── */}
        <div className="mx-6 mb-4 flex items-center rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] divide-x divide-[#E2E8F0]">
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-[#475569]">
            <span>🌍</span>
            <span className="font-semibold text-[#0F172A]">{totalTargets}</span>
            <span>jur.</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-[#475569]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
            <span className="font-semibold text-[#0F172A]">{executedCount}/{totalTargets}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-[#475569]">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#0F172A]">{instruction.estimated_total ? `${instruction.estimated_total.toLocaleString()} €` : '—'}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-[#475569]">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#0F172A]">
              {instruction.created_at
                ? `${Math.max(1, Math.round((Date.now() - new Date(instruction.created_at).getTime()) / 86400000))} días`
                : '—'
              }
            </span>
          </div>
        </div>
      </button>

      {/* ── Warning pills ── */}
      {warnings.length > 0 && (
        <div className="flex gap-2 px-6 pb-4 flex-wrap">
          {warnings.map((w, i) => (
            <span key={i} className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium', w.bg, w.text)}>
              {w.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-[#F1F5F9]">
          <div className="px-6 py-5 space-y-5">

            {/* Original description */}
            {instruction.description && (
              <div>
                <h4 className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">
                  Descripción original
                </h4>
                <div className="bg-[#F8FAFC] border-l-[3px] border-l-[#CBD5E1] rounded-r-lg px-4 py-3 relative">
                  <Quote className="absolute top-2 left-3 h-6 w-6 text-[#CBD5E1] opacity-40" />
                  <p className="italic text-[13px] text-[#475569] leading-relaxed pl-5">
                    {instruction.description}
                  </p>
                </div>
              </div>
            )}

            {/* Jurisdiction items */}
            {instruction.items && instruction.items.length > 0 && (
              <div>
                <h4 className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">
                  Jurisdicciones
                </h4>
                <div className="rounded-lg border border-[#E2E8F0] overflow-hidden divide-y divide-[#F1F5F9]">
                  {instruction.items.map((item) => {
                    const code = (item.jurisdiction_code || '').toUpperCase();
                    const flag = JURISDICTION_FLAGS[code] || '🏳️';
                    const st = ITEM_STATUS_STYLE[item.status || 'pending'] || ITEM_STATUS_STYLE.pending;
                    return (
                      <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[18px] leading-none shrink-0">{flag}</span>
                          <span className="text-[13px] font-bold text-[#0F172A] shrink-0">{code}</span>
                          <span className="text-[13px] text-[#475569] truncate">
                            {item.specific_instruction || 'Pendiente de detalle'}
                          </span>
                        </div>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0', st.bg, st.text)}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Process progress */}
            <div>
              <h4 className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-[0.08em] mb-3">
                Proceso
              </h4>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[#64748B]">{completedSteps} de {processChecklist.length} completados</span>
                  <span className="text-[12px] font-semibold text-[#0F172A]">{progressPct}%</span>
                </div>
                <div className="h-1 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progressPct))}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              {/* Steps */}
              <div className="space-y-2">
                {processChecklist.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {step.done ? (
                      <CheckCircle2 className="h-[18px] w-[18px] text-[#22C55E] shrink-0" />
                    ) : (
                      <Circle className="h-[18px] w-[18px] text-[#CBD5E1] shrink-0" />
                    )}
                    <span className={cn('text-[13px]', step.done ? 'text-[#15803D] font-medium' : 'text-[#94A3B8]')}>
                      {step.label}
                    </span>
                    {step.done && step.date && (
                      <span className="text-[11px] text-[#94A3B8] ml-auto shrink-0">
                        {formatDistanceToNow(new Date(step.date), { addSuffix: true, locale: es })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {allDone ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-4 py-2 text-[13px] font-semibold text-[#15803D]">
                  <CheckCircle2 className="h-4 w-4" />
                  Instrucción completada
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                {/* Secondary */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[12px] gap-1.5 h-8 rounded-lg border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]">
                    <Send className="h-3.5 w-3.5" /> Enviar Acuse
                  </Button>
                  <Button size="sm" variant="outline" className="text-[12px] gap-1.5 h-8 rounded-lg border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]">
                    <SearchIcon className="h-3.5 w-3.5" /> Verificar Conflictos
                  </Button>
                </div>
                {/* Primary */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[12px] gap-1.5 h-8 rounded-lg border-[#3B82F6] text-[#2563EB] hover:bg-[#EFF6FF]">
                    <DollarSign className="h-3.5 w-3.5" /> Presupuesto
                  </Button>
                  <Button size="sm" className="text-[12px] gap-1.5 h-8 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                    <Zap className="h-3.5 w-3.5" /> Ejecutar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ── */

export default function InstructionsPage() {
  const [filter, setFilter] = useState<InstructionFilter>('all');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const { data: instructions = [], isLoading } = useInstructions(filter);

  const pendingCount = instructions.filter(i =>
    i.status === 'draft' || i.status === 'sent' || !i.conflict_checked || !i.quote_sent_at
  ).length;

  const filtered = search
    ? instructions.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase()) ||
        i.account?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : instructions;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Instrucciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Encargos de clientes y mandatos activos
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Instrucción
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as InstructionFilter)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              Pendientes de acción
              {pendingCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress">En curso</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        <Input
          placeholder="Buscar instrucciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-[16px] bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground">No hay instrucciones</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Crea tu primera instrucción para gestionar encargos de clientes
          </p>
          <Button onClick={() => setShowNewModal(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Nueva Instrucción
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(instruction => (
            <InstructionCard key={instruction.id} instruction={instruction} />
          ))}
        </div>
      )}

      <NewInstructionModal open={showNewModal} onOpenChange={setShowNewModal} />
    </div>
  );
}
