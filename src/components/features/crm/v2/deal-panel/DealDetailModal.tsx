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
import { Progress } from "@/components/ui/progress";
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
  ExternalLink, ChevronRight, AlertTriangle, Circle,
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

  // Show max 6 stages, collapse middle if more
  const maxVisible = 6;
  let visible = sorted;
  let collapsed = false;
  if (sorted.length > maxVisible) {
    // Show first 2, current ±1, last 2
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
    collapsed = true;
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
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
                className="h-0.5 w-4 sm:w-6"
                style={{ backgroundColor: isPast || isActive ? pipelineColor : "hsl(var(--border))" }}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 transition-all",
                  isPast && "border-transparent text-white",
                  isActive && !isWon && !isLost && "border-transparent text-white scale-110",
                  isWon && "border-transparent bg-emerald-500 text-white scale-110",
                  isLost && "border-transparent bg-destructive text-white scale-110",
                  !isPast && !isActive && "border-border bg-background text-muted-foreground"
                )}
                style={
                  isPast
                    ? { backgroundColor: pipelineColor }
                    : isActive && !isWon && !isLost
                    ? { backgroundColor: pipelineColor }
                    : undefined
                }
              >
                {isPast ? <Check className="w-3 h-3" /> : isWon ? <Trophy className="w-3 h-3" /> : isActive ? <Circle className="w-2.5 h-2.5 fill-current" /> : null}
              </div>
              <span
                className={cn(
                  "text-[9px] leading-tight text-center max-w-[56px] truncate",
                  isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
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

  const sortedTasks = useMemo(
    () => [...tasks].sort((a: any, b: any) => {
      const ad = a?.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b?.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    }),
    [tasks]
  );

  // Pending deadlines from matter
  const pendingDeadlines = useMemo(
    () => deadlines.filter((d) => !d.is_completed).slice(0, 3),
    [deadlines]
  );

  // Merge tasks + deadlines for "Próximas acciones"
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

          {/* Scrollable content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-0">

              {/* ═══ HEADER ═══ */}
              <div className="space-y-3 pb-5">
                <Badge
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{
                    backgroundColor: `${pipelineColor}18`,
                    color: pipelineColor,
                    border: `1px solid ${pipelineColor}30`,
                  }}
                >
                  {pipelineName ?? "Pipeline"}
                </Badge>

                <h2 className="text-[22px] font-bold text-foreground leading-tight line-clamp-2">
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
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color ?? pipelineColor }}
                    />
                    <span className="text-sm text-muted-foreground">{stage.name}</span>
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

              <Separator />

              {/* ═══ INFORMACIÓN COMERCIAL ═══ */}
              <div className="py-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Información comercial
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Valor</p>
                    <p className="text-base font-bold">{formatEUR(deal.amount_eur ?? deal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Probabilidad</p>
                    <p className="text-base font-bold">{probability != null ? `${probability}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Cierre</p>
                    <p className="text-sm font-medium">
                      {deal.expected_close_date
                        ? format(new Date(deal.expected_close_date), "d MMM yyyy", { locale: es })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Tipo</p>
                    <p className="text-sm capitalize">{deal.deal_type ?? deal.opportunity_type ?? "—"}</p>
                  </div>
                  {deal.jurisdiction_code && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Jurisdicción</p>
                      <p className="text-sm uppercase">{deal.jurisdiction_code}</p>
                    </div>
                  )}
                  {deal.owner?.full_name && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Responsable</p>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {deal.owner.full_name.split(" ").map((w) => w[0]).join("").substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{deal.owner.full_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* ═══ CLIENTE ═══ */}
              <div className="py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Cliente
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0" style={{ backgroundColor: `${pipelineColor}20` }}>
                    <AvatarFallback
                      className="text-sm font-semibold"
                      style={{ color: pipelineColor }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{accountName}</p>
                    {contactName && (
                      <p className="text-xs text-muted-foreground truncate">{contactName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {deal.contact?.phone && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <a href={`tel:${deal.contact.phone}`} title={deal.contact.phone}>
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </Button>
                    )}
                    {deal.contact?.email && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <a href={`mailto:${deal.contact.email}`} title={deal.contact.email}>
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </Button>
                    )}
                    {deal.account?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { navigate(`/app/crm/v2/accounts/${deal.account!.id}`); onClose(); }}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ PRÓXIMAS ACCIONES ═══ */}
              <div className="py-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximas acciones
                </p>

                {actionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin acciones pendientes.</p>
                ) : (
                  <div className="space-y-2">
                    {actionItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm",
                          item.isUrgent && "bg-destructive/5",
                          item.isWarning && "bg-amber-50 dark:bg-amber-950/20",
                          !item.isUrgent && !item.isWarning && "bg-muted/40"
                        )}
                      >
                        {item.type === "deadline" ? (
                          <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", item.isUrgent ? "text-destructive" : "text-amber-500")} />
                        ) : (
                          <button
                            onClick={() => item.type === "task" && completeTask.mutate(item.id)}
                            className="mt-0.5 shrink-0 w-4 h-4 rounded border border-border hover:border-primary flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 opacity-0 hover:opacity-40" />
                          </button>
                        )}
                        <span className="flex-1 min-w-0 truncate">{item.title}</span>
                        {item.daysLeft !== null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0",
                              item.isUrgent && "border-destructive/30 text-destructive bg-destructive/10",
                              item.isWarning && "border-amber-400/30 text-amber-600 bg-amber-50"
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
              <div className="py-5 space-y-3">
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
                  <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
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
              <div className="py-5">
                <DealLinkedMatter
                  matterId={deal.matter_id}
                  dealName={deal.name ?? undefined}
                  accountId={deal.account?.id}
                />
              </div>
            </div>
          </ScrollArea>

          {/* ═══ FIXED FOOTER ═══ */}
          <div className="border-t bg-background px-6 py-3 flex items-center justify-between shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  disabled={deleteDeal.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Eliminar
                </Button>
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

              {!isWon && !isLost && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
              )}
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
