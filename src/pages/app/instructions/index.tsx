// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, ChevronDown, Mail, Phone, Globe, MessageCircle, Video, FileText, Send, Search as SearchIcon, DollarSign, Zap, CheckCircle2, Circle, Clock, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; gradient: string; actionBg: string; actionHover: string }> = {
  trademark_registration: { label: 'Marca', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]', gradient: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', actionBg: 'bg-[#7C3AED]', actionHover: 'hover:bg-[#6D28D9]' },
  trademark_renewal:      { label: 'Renovación', bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]', gradient: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', actionBg: 'bg-[#0D9488]', actionHover: 'hover:bg-[#0F766E]' },
  renewal:                { label: 'Renovación', bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]', gradient: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', actionBg: 'bg-[#0D9488]', actionHover: 'hover:bg-[#0F766E]' },
  patent_application:     { label: 'Patente', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', gradient: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', actionBg: 'bg-[#2563EB]', actionHover: 'hover:bg-[#1D4ED8]' },
  patent_prosecution:     { label: 'Patente', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', gradient: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', actionBg: 'bg-[#2563EB]', actionHover: 'hover:bg-[#1D4ED8]' },
  patent_renewal:         { label: 'Anualidades', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', gradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', actionBg: 'bg-[#D97706]', actionHover: 'hover:bg-[#B45309]' },
  opposition:             { label: 'Oposición', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', gradient: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', actionBg: 'bg-[#DC2626]', actionHover: 'hover:bg-[#B91C1C]' },
  surveillance:           { label: 'Vigilancia', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', gradient: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', actionBg: 'bg-[#475569]', actionHover: 'hover:bg-[#334155]' },
  assignment:             { label: 'Cesión', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', gradient: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', actionBg: 'bg-[#475569]', actionHover: 'hover:bg-[#334155]' },
  design:                 { label: 'Diseño', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]', gradient: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', actionBg: 'bg-[#7C3AED]', actionHover: 'hover:bg-[#6D28D9]' },
  other:                  { label: 'Otro', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', gradient: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', actionBg: 'bg-[#475569]', actionHover: 'hover:bg-[#334155]' },
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

function getUrgencyInfo(instruction: Instruction) {
  const isDeadlineCritical = instruction.deadline_date &&
    new Date(instruction.deadline_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  if (instruction.is_urgent && isDeadlineCritical)
    return { borderTop: true, badge: '● CRÍTICO', badgeBg: 'bg-[#FEF2F2]', badgeText: 'text-[#DC2626]', badgeBorder: 'border border-[#FECACA]' };
  if (instruction.is_urgent)
    return { borderTop: true, badge: '● URGENTE', badgeBg: 'bg-[#FEF2F2]', badgeText: 'text-[#DC2626]', badgeBorder: 'border border-[#FECACA]' };
  return { borderTop: false, badge: null, badgeBg: '', badgeText: '', badgeBorder: '' };
}

function getProgressColor(pct: number) {
  if (pct < 33) return '#EF4444';
  if (pct < 66) return '#F59E0B';
  return '#22C55E';
}

/* ── Expandable wrapper ── */

function ExpandableSection({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight);
  }, [expanded, children]);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-[250ms] ease-in-out"
      style={{ maxHeight: expanded ? height : 0, opacity: expanded ? 1 : 0 }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

/* ── InstructionCard ── */

function InstructionCard({ instruction }: { instruction: Instruction }) {
  const [expanded, setExpanded] = useState(false);
  const urgency = getUrgencyInfo(instruction);
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
  const ageDays = instruction.created_at ? Math.max(1, Math.round((Date.now() - new Date(instruction.created_at).getTime()) / 86400000)) : null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden transition-all duration-200',
        'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]',
        'hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px',
      )}
    >
      {/* ── ZONA 1: Header con gradiente ── */}
      <button
        className="w-full text-left focus:outline-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="relative px-5 pt-5 pb-4"
          style={{ background: typeConf.gradient }}
        >
          {/* Border-top rojo si urgente */}
          {urgency.borderTop && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#EF4444]" />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn(
                  'inline-flex items-center rounded-md px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.06em]',
                  typeConf.bg, typeConf.text,
                )}>
                  {typeConf.label}
                </span>
                {urgency.badge && (
                  <span className={cn('inline-flex items-center rounded-md px-2.5 py-[3px] text-[11px] font-bold', urgency.badgeBg, urgency.badgeText, urgency.badgeBorder)}>
                    {urgency.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-[18px] font-bold text-[#0F172A] leading-snug mb-2">
                {instruction.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                <span
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: '#6366F1' }}
                >
                  {clientInitials}
                </span>
                <span className="font-medium truncate">{instruction.account?.name || 'Sin cliente'}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span className="inline-flex items-center gap-1">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {SOURCE_LABELS[instruction.source || ''] || instruction.source}
                </span>
                <span className="text-[#CBD5E1]">·</span>
                <span>{instruction.created_at ? formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true, locale: es }) : ''}</span>
              </div>
            </div>

            <div className="pt-1">
              <ChevronDown className={cn('h-5 w-5 text-[#94A3B8] transition-transform duration-200', expanded && 'rotate-180')} />
            </div>
          </div>
        </div>
      </button>

      {/* ── ZONA 2: KPI grid ── */}
      <div className="border-t border-b border-[#F1F5F9] bg-[#FAFAFA]">
        <div className="grid grid-cols-4 divide-x divide-[#F1F5F9]">
          <div className="flex flex-col items-center justify-center py-3 px-2">
            <span className="text-[20px] font-extrabold text-[#0F172A] tabular-nums">
              {totalTargets}
            </span>
            <span className="text-[11px] text-[#94A3B8] uppercase tracking-[0.04em] mt-0.5">Jurisd.</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2">
            <span className="text-[20px] font-extrabold text-[#0F172A] tabular-nums">
              {executedCount}<span className="text-[14px] font-normal text-[#94A3B8]"> / {totalTargets}</span>
            </span>
            <span className="text-[11px] text-[#94A3B8] uppercase tracking-[0.04em] mt-0.5">Ejecutadas</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2">
            <span className="text-[20px] font-extrabold text-[#0F172A] tabular-nums">
              {instruction.estimated_total ? `${instruction.estimated_total.toLocaleString()}€` : '—'}
            </span>
            <span className="text-[11px] text-[#94A3B8] uppercase tracking-[0.04em] mt-0.5">Presup.</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2">
            <span className="text-[20px] font-extrabold text-[#0F172A] tabular-nums">
              {ageDays ? `${ageDays}d` : '—'}
            </span>
            <span className="text-[11px] text-[#94A3B8] uppercase tracking-[0.04em] mt-0.5">Antigüedad</span>
          </div>
        </div>

        {/* Warning pills */}
        {warnings.length > 0 && (
          <div className="flex gap-2 px-5 pb-3 pt-1 flex-wrap">
            {warnings.map((w, i) => (
              <span key={i} className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium', w.bg, w.text)}>
                {w.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── ZONA 3: Expandible ── */}
      <ExpandableSection expanded={expanded}>
        <div className="px-5 py-5 space-y-5">

          {/* Descripción original */}
          {instruction.description && (
            <div>
              <h4 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">
                Descripción original
              </h4>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-[14px] relative">
                <span className="text-[48px] leading-[0] text-[#CBD5E1] font-serif absolute top-5 left-3 select-none" aria-hidden>
                  ❝
                </span>
                <p className="italic text-[13px] text-[#475569] leading-relaxed pl-8 pr-2">
                  {instruction.description}
                </p>
              </div>
            </div>
          )}

          {/* Jurisdicciones */}
          {instruction.items && instruction.items.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">
                Jurisdicciones
              </h4>
              <div className="space-y-1.5">
                {instruction.items.map((item) => {
                  const code = (item.jurisdiction_code || '').toUpperCase();
                  const flag = JURISDICTION_FLAGS[code] || '🏳️';
                  const st = ITEM_STATUS_STYLE[item.status || 'pending'] || ITEM_STATUS_STYLE.pending;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white hover:bg-[#F8FAFC] rounded-lg px-3 py-2.5 border border-[#F1F5F9] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[20px] leading-none shrink-0">{flag}</span>
                        <span className="text-[13px] font-bold text-[#0F172A] shrink-0">{code}</span>
                        <span className="text-[13px] text-[#475569] truncate">
                          {item.specific_instruction || 'Pendiente de detalle'}
                        </span>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0', st.bg, st.text)}>
                        {item.status === 'executed' && <CheckCircle2 className="h-3 w-3" />}
                        {item.status !== 'executed' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proceso — Timeline */}
          <div>
            <h4 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-3">
              Proceso
            </h4>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[#64748B]">{completedSteps} de {processChecklist.length} pasos completados</span>
                <span className="text-[12px] font-bold text-[#0F172A]">{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: getProgressColor(progressPct) }}
                />
              </div>
            </div>
            {/* Timeline */}
            <div className="relative pl-5">
              {/* Vertical connector line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#E2E8F0]" />
              <div className="space-y-3">
                {processChecklist.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div className="absolute -left-5 top-0.5">
                      {step.done ? (
                        <div className="w-4 h-4 rounded-full bg-[#22C55E] flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#CBD5E1] bg-white" />
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className={cn('text-[13px]', step.done ? 'text-[#15803D] font-medium' : 'text-[#94A3B8]')}>
                        {step.label}
                      </span>
                      {step.done && step.date && (
                        <span className="text-[11px] text-[#94A3B8] shrink-0 ml-2">
                          {formatDistanceToNow(new Date(step.date), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* ── ZONA 4: Footer acciones ── */}
      <ExpandableSection expanded={expanded}>
        <div className="bg-[#F8FAFC] border-t border-[#F1F5F9] px-5 py-3">
          {allDone ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-4 py-2 text-[13px] font-semibold text-[#15803D]">
                <CheckCircle2 className="h-4 w-4" />
                Instrucción completada
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Secondary */}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-[12px] gap-1.5 h-8 rounded-lg text-[#475569]">
                  <Send className="h-3.5 w-3.5" /> Acuse
                </Button>
                <Button size="sm" variant="ghost" className="text-[12px] gap-1.5 h-8 rounded-lg text-[#475569]">
                  <SearchIcon className="h-3.5 w-3.5" /> Conflictos
                </Button>
              </div>
              {/* Primary */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-[12px] gap-1.5 h-8 rounded-lg border-[#3B82F6] text-[#2563EB] hover:bg-[#EFF6FF]">
                  <DollarSign className="h-3.5 w-3.5" /> Presupuesto
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    'text-[12px] gap-1.5 h-8 rounded-lg text-white shadow-none',
                    instruction.is_urgent ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : cn(typeConf.actionBg, typeConf.actionHover),
                  )}
                >
                  <Zap className="h-3.5 w-3.5" /> Ejecutar
                </Button>
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>
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
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-[#F1F5F9] px-8 py-6">
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] flex items-center gap-2.5">
              <ClipboardList className="h-7 w-7 text-[#3B82F6]" />
              Instrucciones
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1">Encargos de clientes y mandatos</p>
          </div>
          <Button
            onClick={() => setShowNewModal(true)}
            className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-[10px] font-semibold shadow-none h-10 px-5"
          >
            <Plus className="h-4 w-4" />
            Nueva Instrucción
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[860px] mx-auto px-8 py-6">

        {/* Tabs + search */}
        <div className="flex items-center gap-4 flex-wrap mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: 'pending' as const, label: 'Pendientes', count: pendingCount },
              { value: 'in_progress' as const, label: 'En curso', count: 0 },
              { value: 'completed' as const, label: 'Completadas', count: 0 },
              { value: 'all' as const, label: 'Todas', count: 0 },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                  filter === tab.value
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] border border-transparent',
                )}
              >
                {tab.label}
                {tab.value === 'pending' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold px-1.5">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Input
            placeholder="Buscar instrucciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded-lg"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
            <ClipboardList className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#475569]">No hay instrucciones</h3>
            <p className="text-[14px] text-[#94A3B8] mt-1">
              Crea tu primera instrucción para gestionar encargos
            </p>
            <Button
              onClick={() => setShowNewModal(true)}
              className="mt-5 gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-[10px] shadow-none"
            >
              <Plus className="h-4 w-4" /> Nueva Instrucción
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(instruction => (
              <InstructionCard key={instruction.id} instruction={instruction} />
            ))}
          </div>
        )}
      </div>

      <NewInstructionModal open={showNewModal} onOpenChange={setShowNewModal} />
    </div>
  );
}
