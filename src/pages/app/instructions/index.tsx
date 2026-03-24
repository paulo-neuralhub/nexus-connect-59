// @ts-nocheck
import { useState } from 'react';
import { ClipboardList, Plus, Filter, ChevronDown, ChevronUp, Mail, Phone, Globe, MessageCircle, Video, FileText, AlertTriangle, CheckCircle2, Circle, Clock, Send, Search as SearchIcon, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstructions, type InstructionFilter, type Instruction } from '@/hooks/use-instructions';
import { NewInstructionModal } from '@/components/features/instructions/NewInstructionModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const SOURCE_ICONS: Record<string, any> = {
  email: Mail,
  whatsapp: MessageCircle,
  portal: Globe,
  phone: Phone,
  meeting: Video,
  letter: FileText,
};

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  phone: 'Teléfono',
  meeting: 'Reunión',
  letter: 'Carta',
};

const TYPE_LABELS: Record<string, string> = {
  trademark_registration: 'Marca',
  patent_application: 'Patente',
  renewal: 'Renovación',
  opposition: 'Oposición',
  surveillance: 'Vigilancia',
  assignment: 'Cesión',
  design: 'Diseño',
  other: 'Otro',
};

function getUrgencyStyle(instruction: Instruction) {
  const isDeadlineCritical = instruction.deadline_date &&
    new Date(instruction.deadline_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  if (instruction.is_urgent && isDeadlineCritical) {
    return { border: 'border-l-4 border-l-red-500', bg: 'bg-red-50/50', badge: '🔴 CRÍTICO', badgeClass: 'bg-red-100 text-red-700' };
  }
  if (instruction.is_urgent) {
    return { border: 'border-l-4 border-l-amber-400', bg: '', badge: '🟡 URGENTE', badgeClass: 'bg-amber-100 text-amber-700' };
  }
  return { border: 'border-l-4 border-l-muted', bg: '', badge: null, badgeClass: '' };
}

function InstructionCard({ instruction }: { instruction: Instruction }) {
  const [expanded, setExpanded] = useState(false);
  const urgency = getUrgencyStyle(instruction);
  const executedCount = instruction.executed_count || 0;
  const totalTargets = instruction.total_targets || instruction.items?.length || 0;
  const SourceIcon = SOURCE_ICONS[instruction.source || ''] || Mail;

  const processChecklist = [
    { label: 'Instrucción recibida', done: true, date: instruction.created_at },
    { label: 'Acuse de recibo enviado', done: !!instruction.acknowledgement_sent_at, date: instruction.acknowledgement_sent_at },
    { label: 'Conflictos verificados', done: !!instruction.conflict_checked, date: null },
    { label: 'Presupuesto enviado', done: !!instruction.quote_sent_at, date: instruction.quote_sent_at },
    { label: 'Presupuesto aprobado', done: !!instruction.quote_approved_at, date: instruction.quote_approved_at },
    { label: 'Expedientes creados', done: executedCount > 0, date: null },
  ];

  const warnings: { label: string; color: string }[] = [];
  if (!instruction.conflict_checked) warnings.push({ label: '⚠️ Conflicto no verificado', color: 'bg-amber-100 text-amber-700' });
  if (!instruction.acknowledgement_sent_at) warnings.push({ label: '📨 Sin acuse de recibo', color: 'bg-blue-100 text-blue-700' });
  if (!instruction.quote_sent_at && instruction.conflict_checked) warnings.push({ label: '💶 Sin presupuesto', color: 'bg-orange-100 text-orange-700' });

  return (
    <div className={cn(
      'rounded-xl border bg-card shadow-sm transition-all hover:shadow-md',
      urgency.border,
      urgency.bg,
    )}>
      {/* Collapsed header */}
      <button
        className="w-full text-left p-4 focus:outline-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {urgency.badge && (
                <Badge variant="secondary" className={cn('text-[10px] font-bold', urgency.badgeClass)}>
                  {urgency.badge}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                {TYPE_LABELS[instruction.instruction_type] || instruction.instruction_type}
              </Badge>
              <span className="text-sm font-semibold text-foreground truncate">
                {instruction.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{instruction.account?.name || 'Sin cliente'}</span>
              <span>·</span>
              <span>{instruction.created_at ? formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true, locale: es }) : ''}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <SourceIcon className="h-3 w-3" />
                <span>{SOURCE_LABELS[instruction.source || ''] || instruction.source}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground">
                🌍 {totalTargets} jurisdicciones
              </span>
              <span className="text-xs text-muted-foreground">
                📋 {executedCount}/{totalTargets} ejecutadas
              </span>
            </div>
            {warnings.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {warnings.map((w, i) => (
                  <Badge key={i} variant="secondary" className={cn('text-[10px]', w.color)}>
                    {w.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="pt-1">
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          {/* Original description */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Descripción original del cliente
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 text-sm italic text-foreground/80 leading-relaxed">
              "{instruction.description}"
            </div>
          </div>

          {/* Items */}
          {instruction.items && instruction.items.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Items (jurisdicciones/materias)
              </h4>
              <div className="border rounded-lg divide-y">
                {instruction.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{item.jurisdiction_code || '—'}</span>
                      <span className="text-muted-foreground">{item.specific_instruction || 'Pendiente'}</span>
                    </div>
                    <Badge variant={item.status === 'executed' ? 'default' : 'secondary'} className="text-[10px]">
                      {item.status || 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process checklist */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Checklist de proceso
            </h4>
            <div className="space-y-1.5">
              {processChecklist.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={cn(step.done ? 'text-foreground' : 'text-muted-foreground')}>
                    {step.label}
                  </span>
                  {step.done && step.date && (
                    <span className="text-[10px] text-muted-foreground">
                      ({formatDistanceToNow(new Date(step.date), { addSuffix: true, locale: es })})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-2">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <Send className="h-3.5 w-3.5" /> Enviar Acuse
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <SearchIcon className="h-3.5 w-3.5" /> Verificar Conflictos
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Generar Presupuesto
            </Button>
            <Button size="sm" variant="default" className="text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Ejecutar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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

      {/* Tabs */}
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
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
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

      {/* Modal */}
      <NewInstructionModal open={showNewModal} onOpenChange={setShowNewModal} />
    </div>
  );
}
