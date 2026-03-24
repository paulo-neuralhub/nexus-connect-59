/**
 * DealDetailModal — Modal centrado con layout 2 columnas
 * Reemplaza el Sheet lateral anterior
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelineItem } from "@/components/ui/timeline-item";
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
  Edit2, Trash2, Phone, Mail, User, Trophy, Check, Plus,
  ExternalLink, Calendar, AlertTriangle, Briefcase, FileText,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { useUpdateCRMDeal, useDeleteCRMDeal } from "@/hooks/crm/v2/deals";
import { useCreateCRMInteraction, useCRMInteractions } from "@/hooks/crm/v2/interactions";
import { useCRMTasks, useCompleteCRMTask, useCreateCRMTask } from "@/hooks/crm/v2/tasks";
import type { CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import { PipelineProgressBar } from "@/components/features/crm/shared/PipelineProgressBar";
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
  owner?: { id: string; full_name?: string | null } | null;
  pipeline_stage?: { id: string; name: string; color: string; probability: number; is_won_stage: boolean; is_lost_stage: boolean } | null;
};

function formatEUR(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

/** Pipeline color map */
const PIPELINE_COLORS: Record<string, string> = {
  "b0100001-0000-0000-0000-000000000001": "#3B82F6",
  "b0100002-0000-0000-0000-000000000002": "#8B5CF6",
  "b0100003-0000-0000-0000-000000000003": "#0EA5E9",
  "b0100004-0000-0000-0000-000000000004": "#EF4444",
  "b0100005-0000-0000-0000-000000000005": "#14B8A6",
};

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

  const stage = useMemo(
    () => stages.find((s) => s.id === (deal?.pipeline_stage_id ?? deal?.stage_id)) ?? deal?.pipeline_stage ?? null,
    [stages, deal]
  );

  const { data: interactions = [] } = useCRMInteractions({ deal_id: deal?.id ?? undefined });
  const { data: tasks = [] } = useCRMTasks({ deal_id: deal?.id ?? undefined, status: ["pending", "in_progress"] });
  const completeTask = useCompleteCRMTask();
  const createTask = useCreateCRMTask();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const probability = deal?.probability_pct ?? deal?.probability ?? stage?.probability ?? null;
  const pipelineColor = deal?.pipeline_id ? PIPELINE_COLORS[deal.pipeline_id] ?? "#64748B" : "#64748B";

  const accountName = deal?.account?.name ?? deal?.account_name_cache ?? "Sin cuenta";
  const contactName = deal?.contact?.name ?? deal?.contact?.full_name ?? null;
  const initials = (accountName ?? "??").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  // Sorted tasks
  const sortedTasks = useMemo(
    () => [...tasks].sort((a: any, b: any) => {
      const ad = a?.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b?.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    }),
    [tasks]
  );

  async function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title || !deal) return;
    await createTask.mutateAsync({ title, status: "pending", deal_id: deal.id });
    setNewTaskTitle("");
  }

  if (!deal) return null;

  const isWon = stage?.is_won_stage ?? false;
  const isLost = stage?.is_lost_stage ?? false;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-[860px] w-[95vw] max-h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{deal.name ?? "Deal"}</DialogTitle>
            <DialogDescription>Detalle del deal</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            {/* ═══ LEFT COLUMN (55%) ═══ */}
            <ScrollArea className="flex-1 md:w-[55%] md:border-r">
              <div className="p-6 space-y-5">
                {/* Pipeline badge */}
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

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
                  {deal.name}
                </h2>

                {/* Pipeline Progress */}
                {stages.length > 0 && (deal.pipeline_stage_id ?? deal.stage_id) && (
                  <div className="bg-muted/30 rounded-lg px-4 py-2.5">
                    <PipelineProgressBar
                      stages={stages}
                      currentStageId={(deal.pipeline_stage_id ?? deal.stage_id)!}
                      onStageClick={async (stageId) => {
                        if (stageId !== (deal.pipeline_stage_id ?? deal.stage_id)) {
                          await updateDeal.mutateAsync({
                            id: deal.id,
                            data: { stage_id: stageId } as any,
                          });
                        }
                      }}
                    />
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto px-0 gap-0">
                    <TabsTrigger value="resumen" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-sm px-4 py-2.5">
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="actividad" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-sm px-4 py-2.5">
                      Actividad
                    </TabsTrigger>
                    <TabsTrigger value="tareas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-sm px-4 py-2.5">
                      Tareas
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-sm px-4 py-2.5">
                      Documentos
                    </TabsTrigger>
                  </TabsList>

                  {/* ── TAB: Resumen ── */}
                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Importe</p>
                        <p className="text-base font-semibold">{formatEUR(deal.amount_eur ?? deal.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Probabilidad</p>
                        <p className="text-base font-semibold">{probability != null ? `${probability}%` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cierre estimado</p>
                        <p className="text-base">
                          {deal.expected_close_date
                            ? format(new Date(deal.expected_close_date), "d MMM yyyy", { locale: es })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                        <p className="text-base capitalize">{deal.deal_type ?? deal.opportunity_type ?? "—"}</p>
                      </div>
                      {deal.jurisdiction_code && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Jurisdicción</p>
                          <p className="text-base uppercase">{deal.jurisdiction_code}</p>
                        </div>
                      )}
                    </div>

                    {deal.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                          <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
                        </div>
                      </>
                    )}

                    {deal.notes && (
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Notas internas</p>
                        <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-2">
                      <span>Creado: {deal.created_at ? formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale: es }) : "—"}</span>
                      <span>Responsable: {deal.owner?.full_name ?? "—"}</span>
                    </div>
                  </TabsContent>

                  {/* ── TAB: Actividad ── */}
                  <TabsContent value="actividad" className="mt-4 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setActivityType("email")}>+ Email</Button>
                      <Button size="sm" variant="outline" onClick={() => setActivityType("call")}>+ Llamada</Button>
                      <Button size="sm" variant="outline" onClick={() => setActivityType("note")}>+ Nota</Button>
                      <Button size="sm" variant="outline" onClick={() => setActivityType("meeting")}>+ Reunión</Button>
                    </div>

                    {interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Sin actividad registrada.</p>
                    ) : (
                      <div className="space-y-2">
                        {interactions.slice(0, 20).map((i: any) => (
                          <TimelineItem
                            key={i.id}
                            type={(i.channel ?? "note") as any}
                            title={i.subject ?? "Interacción"}
                            description={i.content ?? undefined}
                            time={i.created_at}
                            user={i.assigned_to?.full_name ? { name: i.assigned_to.full_name } : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ── TAB: Tareas ── */}
                  <TabsContent value="tareas" className="mt-4 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Nueva tarea…"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                      />
                      <Button variant="outline" onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {sortedTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Sin tareas pendientes.</p>
                    ) : (
                      <div className="space-y-2">
                        {sortedTasks.map((t: any) => (
                          <button
                            key={t.id}
                            type="button"
                            className="w-full flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-left hover:bg-accent/50"
                            onClick={() => completeTask.mutate(t.id)}
                            disabled={completeTask.isPending}
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border bg-background">
                              <Check className="h-3.5 w-3.5 opacity-80" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm text-foreground">{t.title}</span>
                              {t.due_date && (
                                <span className="block text-xs text-muted-foreground">Vence: {t.due_date}</span>
                              )}
                            </span>
                            {t.priority && (
                              <Badge variant={t.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                                {t.priority}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ── TAB: Documentos ── */}
                  <TabsContent value="documentos" className="mt-4">
                    {deal.matter_id ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Los documentos están vinculados al expediente asociado.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/expedientes/${deal.matter_id}`)}
                        >
                          <FileText className="w-4 h-4 mr-1.5" />
                          Ver documentos del expediente
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          Vincula un expediente para ver sus documentos
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* ═══ RIGHT COLUMN (45%) ═══ */}
            <ScrollArea className="md:w-[45%] bg-muted/20">
              <div className="p-6 space-y-5">
                {/* Métricas */}
                <div className="rounded-xl border bg-background p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">💶 Valor</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">
                      {formatEUR(deal.amount_eur ?? deal.amount)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">📊 Probabilidad</p>
                      <span className="text-sm font-semibold">{probability != null ? `${probability}%` : "—"}</span>
                    </div>
                    {probability != null && (
                      <Progress
                        value={probability}
                        className="h-2 mt-2"
                      />
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">📅 Cierre estimado</p>
                    <p className="text-sm font-medium mt-0.5">
                      {deal.expected_close_date
                        ? format(new Date(deal.expected_close_date), "d MMM yyyy", { locale: es })
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="rounded-xl border bg-background p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 bg-primary/10">
                      <AvatarFallback className="text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{accountName}</p>
                      {contactName && (
                        <p className="text-xs text-muted-foreground truncate">{contactName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {deal.contact?.phone && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a href={`tel:${deal.contact.phone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" /> Llamar
                        </a>
                      </Button>
                    )}
                    {deal.contact?.email && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a href={`mailto:${deal.contact.email}`}>
                          <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                        </a>
                      </Button>
                    )}
                    {deal.account?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { navigate(`/app/crm/v2/accounts/${deal.account!.id}`); onClose(); }}
                      >
                        <User className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expediente vinculado */}
                <DealLinkedMatter
                  matterId={deal.matter_id}
                  dealName={deal.name ?? undefined}
                  accountId={deal.account?.id}
                />

                {/* Acciones */}
                <div className="rounded-xl border bg-background p-4 space-y-2">
                  {!isWon && !isLost && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                      <Trophy className="h-4 w-4 mr-2" />
                      Marcar como ganado
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { onEdit(deal.id); onClose(); }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar deal
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={deleteDeal.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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
                </div>

                {/* Tareas pendientes (summary) */}
                {sortedTasks.length > 0 && (
                  <div className="rounded-xl border bg-background p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Tareas pendientes ({sortedTasks.length})
                    </p>
                    {sortedTasks.slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {sortedTasks.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{sortedTasks.length - 3} más</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
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
