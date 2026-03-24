/**
 * DealDetailModal — Single-column commercial card modal (560px)
 * Sections: Header+Stepper → Info → Client → Actions → Activity → Matter → Footer
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit2, Trash2, Phone, Mail, Trophy, Check, Plus,
  ChevronRight, AlertTriangle, Circle, MessageSquare,
  RotateCcw, Calendar,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { useUpdateCRMDeal, useDeleteCRMDeal } from "@/hooks/crm/v2/deals";
import { useCreateCRMInteraction, useCRMInteractions } from "@/hooks/crm/v2/interactions";
import { useCRMTasks, useCompleteCRMTask, useCreateCRMTask } from "@/hooks/crm/v2/tasks";
import { useMatterDeadlines } from "@/hooks/use-matter-deadlines";
import type { CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import { QuickActivityDialog } from "./QuickActivityDialog";
import { DealLinkedMatter } from "./DealLinkedMatter";

type Deal = {
  id: string;
  name?: string | null;
  stage?: string | null;
  stage_id?: string | null;
  pipeline_stage_id?: string | null;
  pipeline_id?: string | null;
  deal_type?: string | null;
  opportunity_type?: string | null;
  jurisdiction_code?: string | null;
  amount?: number | null;
  amount_eur?: number | null;
  probability_pct?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  matter_id?: string | null;
  description?: string | null;
  notes?: string | null;
  account_name_cache?: string | null;
  account?: { id: string; name?: string | null } | null;
  contact?: { id: string; name?: string | null; full_name?: string | null; email?: string | null; phone?: string | null } | null;
  owner?: { id: string; full_name?: string | null; avatar_url?: string | null } | null;
  pipeline_stage?: { id: string; name: string; color: string; probability: number; is_won_stage: boolean; is_lost_stage: boolean } | null;
};

function formatEUR(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

const PIPELINE_COLORS: Record<string, string> = {
  "b0100001-0000-0000-0000-000000000001": "#3B82F6",
  "b0100002-0000-0000-0000-000000000002": "#8B5CF6",
  "b0100003-0000-0000-0000-000000000003": "#0EA5E9",
  "b0100004-0000-0000-0000-000000000004": "#EF4444",
  "b0100005-0000-0000-0000-000000000005": "#14B8A6",
};

const ACTIVITY_ICONS: Record<string, string> = {
  email: "✉️",
  call: "📞",
  meeting: "📅",
  note: "💬",
  whatsapp: "💬",
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  trademark_registration: "Registro de Marca",
  trademark_opposition: "Oposición de Marca",
  trademark_renewal: "Renovación de Marca",
  patent_filing: "Solicitud de Patente",
  patent_prosecution: "Prosecution de Patente",
  design_registration: "Registro de Diseño",
  copyright_registration: "Registro de Copyright",
  ip_litigation: "Litigio PI",
  ip_portfolio: "Portfolio PI",
  consulting: "Consultoría",
  licensing: "Licenciamiento",
};

/** Generate stable color from string hash */
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 45%)`;
}

function probColor(p: number): string {
  if (p < 30) return "#EF4444";
  if (p <= 70) return "#F59E0B";
  return "#22C55E";
}

/* ── Stage Stepper ── */
function StageStepper({
  stages,
  currentStageId,
  pipelineColor,
}: {
  stages: CRMPipelineStage[];
  currentStageId: string;
  pipelineColor: string;
}) {
  const sorted = useMemo(() => [...stages].sort((a, b) => a.position - b.position), [stages]);
  const currentIdx = sorted.findIndex((s) => s.id === currentStageId);

  const maxVisible = 6;
  let visible = sorted;
  if (sorted.length > maxVisible) {
    const indices = new Set<number>();
    indices.add(0);
    indices.add(1);
    if (currentIdx > 0) indices.add(currentIdx - 1);
    indices.add(currentIdx);
    if (currentIdx < sorted.length - 1) indices.add(currentIdx + 1);
    indices.add(sorted.length - 2);
    indices.add(sorted.length - 1);
    const sortedIndices = [...indices].sort((a, b) => a - b);
    visible = sortedIndices.map((i) => sorted[i]);
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2 px-1">
      {visible.map((stage, i) => {
        const realIdx = sorted.findIndex((s) => s.id === stage.id);
        const isPast = realIdx < currentIdx;
        const isActive = stage.id === currentStageId;
        const isWon = stage.is_won_stage && isActive;
        const isLost = stage.is_lost_stage && isActive;

        return (
          <div key={stage.id} className="flex items-center">
            {i > 0 && (
              <div
                className="h-[2px] w-5 sm:w-7 transition-colors"
                style={{
                  backgroundColor: isPast || isActive
                    ? `${pipelineColor}99`
                    : "#E2E8F0",
                }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isPast && "text-white",
                  isActive && !isWon && !isLost && "text-white",
                  isWon && "bg-emerald-500 text-white",
                  isLost && "bg-destructive text-white",
                  !isPast && !isActive && "bg-white border-2"
                )}
                style={{
                  ...(isPast ? { backgroundColor: pipelineColor } : {}),
                  ...(isActive && !isWon && !isLost
                    ? {
                        backgroundColor: pipelineColor,
                        boxShadow: `0 0 0 3px ${pipelineColor}4D`,
                      }
                    : {}),
                  ...(!isPast && !isActive ? { borderColor: "#CBD5E1" } : {}),
                }}
              >
                {isPast ? (
                  <Check className="w-3 h-3" />
                ) : isWon ? (
                  <Trophy className="w-3 h-3" />
                ) : isActive ? (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                ) : null}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight text-center max-w-[60px] truncate",
                  isActive ? "font-bold" : isPast ? "font-medium" : "font-normal"
                )}
                style={{
                  color: isActive
                    ? pipelineColor
                    : isPast
                    ? `${pipelineColor}CC`
                    : "#94A3B8",
                }}
              >
                {stage.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DealDetailModal({
  deal,
  open,
  onClose,
  stages,
  onEdit,
  pipelineName,
}: {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
  stages: CRMPipelineStage[];
  onEdit: (dealId: string) => void;
  pipelineName?: string;
}) {
  const navigate = useNavigate();
  const updateDeal = useUpdateCRMDeal();
  const deleteDeal = useDeleteCRMDeal();
  const createInteraction = useCreateCRMInteraction();

  const [activityType, setActivityType] = useState<"email" | "call" | "meeting" | "note" | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const stage = useMemo(
    () => stages.find((s) => s.id === (deal?.pipeline_stage_id ?? deal?.stage_id)) ?? deal?.pipeline_stage ?? null,
    [stages, deal]
  );

  const { data: interactions = [] } = useCRMInteractions({ deal_id: deal?.id ?? undefined });
  const { data: tasks = [] } = useCRMTasks({ deal_id: deal?.id ?? undefined, status: ["pending", "in_progress"] });
  const { data: deadlines = [] } = useMatterDeadlines(deal?.matter_id ?? "");
  const completeTask = useCompleteCRMTask();
  const createTask = useCreateCRMTask();

  const probability = deal?.probability_pct ?? deal?.probability ?? stage?.probability ?? null;
  const pipelineColor = deal?.pipeline_id ? PIPELINE_COLORS[deal.pipeline_id] ?? "#64748B" : "#64748B";

  const accountName = deal?.account?.name ?? deal?.account_name_cache ?? "Sin cuenta";
  const contactName = deal?.contact?.name ?? deal?.contact?.full_name ?? null;
  const initials = (accountName ?? "??").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  const avatarColor = hashColor(accountName);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a: any, b: any) => {
      const ad = a?.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b?.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    }),
    [tasks]
  );

  const pendingDeadlines = useMemo(
    () => deadlines.filter((d) => !d.is_completed).slice(0, 3),
    [deadlines]
  );

  const actionItems = useMemo(() => {
    const items: { id: string; type: "task" | "deadline"; title: string; daysLeft: number | null; isUrgent: boolean; isWarning: boolean }[] = [];
    pendingDeadlines.forEach((d) => {
      const days = differenceInDays(new Date(d.due_date), new Date());
      items.push({
        id: d.id,
        type: "deadline",
        title: d.title,
        daysLeft: days,
        isUrgent: days < 7,
        isWarning: days >= 7 && days <= 30,
      });
    });
    sortedTasks.slice(0, 5).forEach((t: any) => {
      const days = t.due_date ? differenceInDays(new Date(t.due_date), new Date()) : null;
      items.push({
        id: t.id,
        type: "task",
        title: t.title,
        daysLeft: days,
        isUrgent: days !== null && days < 7,
        isWarning: days !== null && days >= 7 && days <= 30,
      });
    });
    return items.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [pendingDeadlines, sortedTasks]);

  async function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title || !deal) return;
    await createTask.mutateAsync({ title, status: "pending", deal_id: deal.id });
    setNewTaskTitle("");
  }

  if (!deal) return null;

  const isWon = stage?.is_won_stage ?? false;
  const isLost = stage?.is_lost_stage ?? false;
  const recentActivities = interactions.slice(0, 3);

  // Close date urgency
  const closeDaysLeft = deal.expected_close_date
    ? differenceInDays(new Date(deal.expected_close_date), new Date())
    : null;
  const closeIsPast = closeDaysLeft !== null && closeDaysLeft < 0;
  const closeIsNear = closeDaysLeft !== null && closeDaysLeft >= 0 && closeDaysLeft < 30;

  // Deal type label
  const dealTypeRaw = deal.deal_type ?? deal.opportunity_type ?? null;
  const dealTypeLabel = dealTypeRaw ? (DEAL_TYPE_LABELS[dealTypeRaw] ?? dealTypeRaw.replace(/_/g, " ")) : "—";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-[560px] w-[95vw] max-h-[85vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{deal.name ?? "Deal"}</DialogTitle>
            <DialogDescription>Ficha comercial del deal</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-0">

              {/* ═══ HEADER with pipeline color tint ═══ */}
              <div
                className="p-6 pb-4 space-y-3"
                style={{
                  background: `${pipelineColor}0F`,
                  borderBottom: `2px solid ${pipelineColor}33`,
                }}
              >
                <Badge
                  className="text-[11px] uppercase tracking-[0.08em] font-semibold border-0"
                  style={{
                    backgroundColor: `${pipelineColor}1F`,
                    color: pipelineColor,
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {pipelineName ?? "Pipeline"}
                </Badge>

                <h2
                  className="text-[22px] font-bold leading-tight line-clamp-2"
                  style={{ color: "#0F172A" }}
                >
                  {deal.name}
                  {deal.jurisdiction_code && (
                    <span className="text-muted-foreground font-normal text-base ml-2">
                      — {deal.jurisdiction_code.toUpperCase()}
                    </span>
                  )}
                </h2>

                {stage && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color ?? pipelineColor }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: stage.color ?? pipelineColor }}
                    >
                      {stage.name}
                    </span>
                  </div>
                )}

                {/* Stepper */}
                {stages.length > 0 && (deal.pipeline_stage_id ?? deal.stage_id) && (
                  <StageStepper
                    stages={stages}
                    currentStageId={(deal.pipeline_stage_id ?? deal.stage_id)!}
                    pipelineColor={pipelineColor}
                  />
                )}
              </div>

              <Separator className="opacity-0" />

              {/* ═══ INFORMACIÓN COMERCIAL ═══ */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Información comercial
                </p>

                {/* Primary metrics — large cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[10px] border bg-white p-3 space-y-1" style={{ borderColor: "#E2E8F0" }}>
                    <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Valor</p>
                    <p className="text-2xl font-extrabold" style={{ color: "#0F172A" }}>
                      {formatEUR(deal.amount_eur ?? deal.amount)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border bg-white p-3 space-y-1" style={{ borderColor: "#E2E8F0" }}>
                    <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Probabilidad</p>
                    <p className="text-2xl font-extrabold" style={{ color: "#0F172A" }}>
                      {probability != null ? `${probability}%` : "—"}
                    </p>
                    {probability != null && (
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(probability, 100)}%`,
                            backgroundColor: probColor(probability),
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="rounded-[10px] border bg-white p-3 space-y-1" style={{ borderColor: "#E2E8F0" }}>
                    <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Cierre</p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        closeIsPast && "text-destructive",
                        closeIsNear && !closeIsPast && "text-amber-600"
                      )}
                      style={!closeIsPast && !closeIsNear ? { color: "#0F172A" } : undefined}
                    >
                      {deal.expected_close_date
                        ? format(new Date(deal.expected_close_date), "d MMM yyyy", { locale: es })
                        : "—"}
                      {closeIsPast && <span className="text-xs ml-1">(vencido)</span>}
                    </p>
                  </div>
                </div>

                {/* Secondary fields */}
                <div className="flex items-center gap-2 flex-wrap">
                  {dealTypeRaw && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {dealTypeLabel}
                    </Badge>
                  )}
                  {deal.jurisdiction_code && (
                    <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wide">
                      {deal.jurisdiction_code}
                    </Badge>
                  )}
                  {deal.owner?.full_name && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {deal.owner.full_name.split(" ").map((w) => w[0]).join("").substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{deal.owner.full_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* ═══ CLIENTE ═══ */}
              <div className="px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Cliente
                </p>
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-11 w-11 shrink-0 rounded-[10px]"
                    style={{
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}
                  >
                    <AvatarFallback
                      className="text-sm font-bold text-white rounded-[10px]"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[15px] truncate" style={{ color: "#0F172A" }}>
                      {accountName}
                    </p>
                    {contactName && (
                      <p className="text-[13px] text-muted-foreground truncate">{contactName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {deal.contact?.phone && (
                      <a
                        href={`tel:${deal.contact.phone}`}
                        title={deal.contact.phone}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Phone className="h-[18px] w-[18px] text-muted-foreground" />
                      </a>
                    )}
                    {deal.contact?.email && (
                      <a
                        href={`mailto:${deal.contact.email}`}
                        title={deal.contact.email}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Mail className="h-[18px] w-[18px] text-muted-foreground" />
                      </a>
                    )}
                    <button
                      onClick={() => setActivityType("note")}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      title="Nota"
                    >
                      <MessageSquare className="h-[18px] w-[18px] text-muted-foreground" />
                    </button>
                    {deal.account?.id && (
                      <button
                        onClick={() => { navigate(`/app/crm/v2/accounts/${deal.account!.id}`); onClose(); }}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                        title="Ver perfil"
                      >
                        <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ PRÓXIMAS ACCIONES ═══ */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximas acciones
                </p>

                {actionItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin acciones pendientes</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("email")}>
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("call")}>
                        <Phone className="h-3 w-3 mr-1" /> Llamada
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("note")}>
                        <MessageSquare className="h-3 w-3 mr-1" /> Nota
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actionItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          item.isUrgent && "bg-red-50 dark:bg-red-950/20 border-l-[3px] border-l-red-500",
                          item.isWarning && "bg-amber-50 dark:bg-amber-950/20 border-l-[3px] border-l-amber-500",
                          !item.isUrgent && !item.isWarning && "bg-muted/40"
                        )}
                      >
                        {item.type === "deadline" ? (
                          <AlertTriangle
                            className={cn(
                              "w-4 h-4 mt-0.5 shrink-0",
                              item.isUrgent ? "text-red-500" : "text-amber-500"
                            )}
                          />
                        ) : (
                          <button
                            onClick={() => item.type === "task" && completeTask.mutate(item.id)}
                            className={cn(
                              "mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              item.isUrgent
                                ? "border-red-300 hover:border-red-500"
                                : "border-border hover:border-primary"
                            )}
                          >
                            <Check className="w-2.5 h-2.5 opacity-0 hover:opacity-40" />
                          </button>
                        )}
                        <span className={cn(
                          "flex-1 min-w-0 truncate",
                          item.isUrgent && "font-semibold"
                        )}>
                          {item.title}
                        </span>
                        {item.daysLeft !== null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0 font-medium",
                              item.isUrgent && "border-red-300 text-red-600 bg-red-50",
                              item.isWarning && "border-amber-300 text-amber-600 bg-amber-50"
                            )}
                          >
                            {item.daysLeft < 0 ? `hace ${Math.abs(item.daysLeft)}d` : `${item.daysLeft}d`}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="+ Añadir tarea…"
                    className="h-8 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim() || createTask.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* ═══ ACTIVIDAD RECIENTE ═══ */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actividad reciente
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("email")}>+ Email</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("call")}>+ Llamada</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("note")}>+ Nota</Button>
                  </div>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("email")}>
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("call")}>
                        <Phone className="h-3 w-3 mr-1" /> Llamada
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActivityType("note")}>
                        <MessageSquare className="h-3 w-3 mr-1" /> Nota
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentActivities.map((a: any) => {
                      const icon = ACTIVITY_ICONS[a.channel ?? a.type ?? "note"] ?? "📝";
                      return (
                        <div key={a.id} className="flex items-center gap-2.5 text-sm">
                          <span className="text-base shrink-0">{icon}</span>
                          <span className="text-muted-foreground text-xs shrink-0">
                            {a.created_at
                              ? formatDistanceToNow(new Date(a.created_at), { addSuffix: false, locale: es })
                              : ""}
                          </span>
                          <span className="flex-1 min-w-0 truncate">
                            {a.subject ?? a.content ?? "Interacción"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {interactions.length > 3 && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Ver todo →
                  </Button>
                )}
              </div>

              <Separator />

              {/* ═══ EXPEDIENTE VINCULADO ═══ */}
              <div className="px-6 py-5">
                <DealLinkedMatter
                  matterId={deal.matter_id}
                  dealName={deal.name ?? undefined}
                  accountId={deal.account?.id}
                />
              </div>
            </div>
          </div>

          {/* ═══ FIXED FOOTER ═══ */}
          <div className="border-t bg-background px-6 py-3 flex items-center justify-between shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="text-[13px] text-destructive/70 hover:text-destructive flex items-center gap-1 transition-colors"
                  disabled={deleteDeal.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar deal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el deal permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      await deleteDeal.mutateAsync(deal.id);
                      onClose();
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onEdit(deal.id); onClose(); }}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>

              {!isWon && !isLost ? (
                <Button
                  size="sm"
                  className="text-white font-semibold px-5"
                  style={{ backgroundColor: "#22C55E" }}
                  onClick={async () => {
                    const wonStage = stages.find((s) => s.is_won_stage);
                    if (wonStage) {
                      await updateDeal.mutateAsync({
                        id: deal.id,
                        data: { stage_id: wonStage.id } as any,
                      });
                    }
                  }}
                  disabled={updateDeal.isPending}
                >
                  <Trophy className="h-3.5 w-3.5 mr-1.5" />
                  Marcar ganado
                </Button>
              ) : isWon ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const firstStage = [...stages].sort((a, b) => a.position - b.position)[0];
                    if (firstStage) {
                      await updateDeal.mutateAsync({
                        id: deal.id,
                        data: { stage_id: firstStage.id } as any,
                      });
                    }
                  }}
                  disabled={updateDeal.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reabrir deal
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickActivityDialog
        open={activityType !== null}
        onOpenChange={(v) => setActivityType(v ? activityType : null)}
        title={
          activityType === "email" ? "Nuevo email"
            : activityType === "call" ? "Nueva llamada"
              : activityType === "meeting" ? "Nueva reunión"
                : "Nueva nota"
        }
        submitLabel="Registrar"
        onSubmit={async ({ subject, content }) => {
          const channel = activityType ?? "note";
          await createInteraction.mutateAsync({
            channel,
            subject,
            content,
            account_id: deal.account?.id ?? null,
            contact_id: deal.contact?.id ?? null,
            metadata: { deal_id: deal.id },
          });
        }}
      />
    </>
  );
}
