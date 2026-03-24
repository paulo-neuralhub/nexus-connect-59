/**
 * DealDetailModal — "Luxury Legal Tech" single-column commercial card (560px)
 * Dark gradient header + premium body with elevated cards + micro-animations
 */
import { useMemo, useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  RotateCcw, Calendar, Lock, UserCheck,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCountUp } from "@/hooks/use-count-up";

import { useUpdateCRMDeal, useDeleteCRMDeal } from "@/hooks/crm/v2/deals";
import { useCreateCRMInteraction, useCRMInteractions } from "@/hooks/crm/v2/interactions";
import { useCRMTasks, useCompleteCRMTask, useCreateCRMTask } from "@/hooks/crm/v2/tasks";
import { useMatterDeadlines } from "@/hooks/use-matter-deadlines";
import type { CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import { QuickActivityDialog } from "./QuickActivityDialog";
import { DealLinkedMatter } from "./DealLinkedMatter";

/* ── Types ── */
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

/* ── Constants ── */
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

/** Dark gradient backgrounds per pipeline */
const PIPELINE_GRADIENTS: Record<string, string> = {
  "#3B82F6": "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1E40AF 100%)",
  "#8B5CF6": "linear-gradient(135deg, #0F172A 0%, #2D1B69 60%, #4C1D95 100%)",
  "#0EA5E9": "linear-gradient(135deg, #0F172A 0%, #0C4A6E 60%, #0369A1 100%)",
  "#EF4444": "linear-gradient(135deg, #0F172A 0%, #450A0A 60%, #991B1B 100%)",
  "#14B8A6": "linear-gradient(135deg, #0F172A 0%, #042F2E 60%, #0F766E 100%)",
};

const ACTIVITY_ICONS: Record<string, string> = {
  email: "✉️", call: "📞", meeting: "📅", note: "💬", whatsapp: "💬",
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

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash % 360)}, 55%, 45%)`;
}

function probColor(p: number): string {
  if (p >= 100) return "#16A34A";
  if (p > 70) return "#22C55E";
  if (p > 30) return "#F59E0B";
  return "#EF4444";
}

/* ── Gradient separator ── */
function GradientDivider() {
  return (
    <div
      className="h-px mx-6"
      style={{
        background: "linear-gradient(90deg, transparent, #E2E8F0 20%, #E2E8F0 80%, transparent)",
      }}
    />
  );
}

/* ── Stage Stepper (dark theme) ── */
function StageStepper({
  stages,
  currentStageId,
  pipelineColor,
  animated,
}: {
  stages: CRMPipelineStage[];
  currentStageId: string;
  pipelineColor: string;
  animated: boolean;
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
    visible = [...indices].sort((a, b) => a - b).map((i) => sorted[i]);
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-3 px-1">
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
                className="h-[2px] w-5 sm:w-7 origin-left"
                style={{
                  backgroundColor: isPast || isActive ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)",
                  ...(animated ? {
                    animation: `stepper-draw 400ms ease-in-out ${200 + i * 80}ms both`,
                  } : {}),
                }}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isWon && "bg-emerald-500 text-white",
                  isLost && "bg-red-500 text-white",
                )}
                style={{
                  ...(isPast ? {
                    backgroundColor: "white",
                    color: pipelineColor,
                  } : {}),
                  ...(isActive && !isWon && !isLost ? {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "2px solid white",
                    boxShadow: "0 0 0 4px rgba(255,255,255,0.2)",
                  } : {}),
                  ...(!isPast && !isActive ? {
                    border: "2px solid rgba(255,255,255,0.2)",
                    backgroundColor: "transparent",
                  } : {}),
                }}
              >
                {isPast ? (
                  <Check className="w-3 h-3" />
                ) : isWon ? (
                  <Trophy className="w-3 h-3" />
                ) : isActive ? (
                  <Circle className="w-2 h-2 fill-white text-white" />
                ) : null}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-[10px] leading-tight text-center max-w-[60px] truncate"
                  style={{
                    color: isActive ? "white" : isPast ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                    fontWeight: isActive ? 700 : isPast ? 500 : 400,
                  }}
                >
                  {stage.name}
                </span>
                {stage.lock_type === "matter_driven" && (
                  <Lock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                )}
                {stage.lock_type === "confirm" && (
                  <AlertTriangle className="w-2.5 h-2.5" style={{ color: "rgba(255,200,50,0.6)" }} />
                )}
                {stage.lock_type === "admin_only" && (
                  <UserCheck className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Animated metric number ── */
function AnimatedMetric({ value, prefix = "", suffix = "", color, large }: {
  value: number; prefix?: string; suffix?: string; color?: string; large?: boolean;
}) {
  const animated = useCountUp(value, 700, true);
  return (
    <span
      className={cn(
        "font-black tracking-tight",
        large ? "text-[32px] leading-none" : "text-2xl"
      )}
      style={{
        color: color ?? "#0F172A",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.03em",
      }}
    >
      {prefix}{animated.toLocaleString("es-ES")}{suffix}
    </span>
  );
}

/* ══════════════════════════════════════ */
/*            MAIN COMPONENT             */
/* ══════════════════════════════════════ */
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
  const [isAnimated, setIsAnimated] = useState(false);

  // trigger entrance animations on open
  useEffect(() => {
    if (open) {
      setIsAnimated(false);
      const t = setTimeout(() => setIsAnimated(true), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

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
  const headerGradient = PIPELINE_GRADIENTS[pipelineColor] ?? "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)";

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
      items.push({ id: d.id, type: "deadline", title: d.title, daysLeft: days, isUrgent: days < 7, isWarning: days >= 7 && days <= 30 });
    });
    sortedTasks.slice(0, 5).forEach((t: any) => {
      const days = t.due_date ? differenceInDays(new Date(t.due_date), new Date()) : null;
      items.push({ id: t.id, type: "task", title: t.title, daysLeft: days, isUrgent: days !== null && days < 7, isWarning: days !== null && days >= 7 && days <= 30 });
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
  const closeDaysLeft = deal.expected_close_date ? differenceInDays(new Date(deal.expected_close_date), new Date()) : null;
  const closeIsPast = closeDaysLeft !== null && closeDaysLeft < 0;
  const closeIsNear = closeDaysLeft !== null && closeDaysLeft >= 0 && closeDaysLeft < 30;
  const dealTypeRaw = deal.deal_type ?? deal.opportunity_type ?? null;
  const dealTypeLabel = dealTypeRaw ? (DEAL_TYPE_LABELS[dealTypeRaw] ?? dealTypeRaw.replace(/_/g, " ")) : "—";
  const amountRaw = deal.amount_eur ?? deal.amount ?? 0;

  return (
    <>
      {/* Inline keyframes for stepper line drawing */}
      <style>{`
        @keyframes stepper-draw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-[560px] w-[95vw] max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col border-0"
          style={{
            borderRadius: 16,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.18), 0 64px 128px rgba(0,0,0,0.12)",
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{deal.name ?? "Deal"}</DialogTitle>
            <DialogDescription>Ficha comercial del deal</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>

            {/* ═══ DARK GRADIENT HEADER ═══ */}
            <div
              className="relative px-6 pt-6 pb-4 space-y-3"
              style={{
                background: headerGradient,
                transition: "opacity 200ms ease-out",
                opacity: isAnimated ? 1 : 0,
              }}
            >
              {/* Subtle dot texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "repeat",
                }}
              />

              {/* Pipeline badge */}
              <Badge
                className="relative text-[11px] uppercase tracking-[0.08em] font-semibold border-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                {pipelineName ?? "Pipeline"}
              </Badge>

              {/* Deal title */}
              <h2
                className="relative text-[24px] leading-tight line-clamp-2"
                style={{
                  color: "white",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {deal.name}
                {deal.jurisdiction_code && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400, fontSize: 16, marginLeft: 8 }}>
                    — {deal.jurisdiction_code.toUpperCase()}
                  </span>
                )}
              </h2>

              {/* Current stage indicator */}
              {stage && (
                <div className="relative flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color ?? pipelineColor }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 14 }}>
                    {stage.name}
                  </span>
                </div>
              )}

              {/* Urgent deadline banner */}
              {closeDaysLeft !== null && closeDaysLeft < 7 && (
                <div
                  className="relative rounded-lg px-3 py-2 flex items-center gap-2 text-white text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.25)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {closeIsPast ? "Cierre vencido" : `Cierre en ${closeDaysLeft} días`}
                </div>
              )}

              {/* Stepper on dark background */}
              {stages.length > 0 && (deal.pipeline_stage_id ?? deal.stage_id) && (
                <StageStepper
                  stages={stages}
                  currentStageId={(deal.pipeline_stage_id ?? deal.stage_id)!}
                  pipelineColor={pipelineColor}
                  animated={isAnimated}
                />
              )}
            </div>

            {/* ═══ BODY — White with elevated cards ═══ */}
            <div className="bg-background">

              {/* ── INFORMACIÓN COMERCIAL ── */}
              <div
                className="px-6 py-5 space-y-3"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 200ms ease-out 300ms, transform 200ms ease-out 300ms",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Información comercial
                </p>

                {/* Primary metrics card */}
                <div
                  className="rounded-[14px] p-4"
                  style={{
                    background: "#FAFAFA",
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <div className="grid grid-cols-3 gap-4">
                    {/* Valor */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-medium">Valor</p>
                      {amountRaw > 0 ? (
                        <AnimatedMetric value={amountRaw} suffix=" €" large />
                      ) : (
                        <span className="text-[32px] font-black text-muted-foreground/40 leading-none">—</span>
                      )}
                    </div>

                    {/* Probabilidad */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-medium">Probabilidad</p>
                      {probability != null ? (
                        <>
                          <AnimatedMetric value={probability} suffix="%" color={probColor(probability)} large />
                          <div
                            className="h-[3px] w-full rounded-full overflow-hidden mt-1"
                            style={{ backgroundColor: `${probColor(probability)}33` }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: isAnimated ? `${Math.min(probability, 100)}%` : "0%",
                                backgroundColor: probColor(probability),
                                transition: "width 600ms ease-out 400ms",
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-[32px] font-black text-muted-foreground/40 leading-none">—</span>
                      )}
                    </div>

                    {/* Cierre */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-medium">Cierre</p>
                      <p
                        className="text-sm font-bold mt-2"
                        style={{
                          color: closeIsPast ? "#EF4444" : closeIsNear ? "#F59E0B" : "#0F172A",
                        }}
                      >
                        {deal.expected_close_date
                          ? format(new Date(deal.expected_close_date), "d MMM yyyy", { locale: es })
                          : "—"}
                        {closeIsPast && <span className="text-xs ml-1 opacity-80">(vencido)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Type + Jurisdiction badges */}
                  <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-border/40">
                    {dealTypeRaw && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: `${pipelineColor}15`,
                          color: pipelineColor,
                        }}
                      >
                        {dealTypeLabel}
                      </span>
                    )}
                    {deal.jurisdiction_code && (
                      <span
                        className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#475569",
                        }}
                      >
                        {deal.jurisdiction_code}
                      </span>
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
              </div>

              <GradientDivider />

              {/* ── CLIENTE ── */}
              <div
                className="px-6 py-5 group/client transition-colors"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 200ms ease-out 380ms, transform 200ms ease-out 380ms, background-color 150ms",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Cliente
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0" style={{ borderRadius: 12 }}>
                    <AvatarFallback
                      className="text-[15px] font-bold text-white"
                      style={{
                        backgroundColor: avatarColor,
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}
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
                  <div className="flex items-center gap-1 shrink-0">
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

              <GradientDivider />

              {/* ── PRÓXIMAS ACCIONES ── */}
              <div
                className="px-6 py-5 space-y-3"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 200ms ease-out 460ms, transform 200ms ease-out 460ms",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximas acciones
                </p>

                {actionItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin acciones pendientes</p>
                    <p className="text-xs text-muted-foreground/60">Sé el primero en registrar una acción</p>
                    <div className="flex gap-2">
                      {(["email", "call", "note"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setActivityType(type)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors font-medium text-muted-foreground"
                        >
                          {type === "email" ? "📧 Email" : type === "call" ? "📞 Llamada" : "📝 Nota"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actionItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          item.isUrgent && "border-l-[3px] border-l-red-500",
                          item.isWarning && "border-l-[3px] border-l-amber-500",
                          !item.isUrgent && !item.isWarning && "bg-muted/30"
                        )}
                        style={{
                          backgroundColor: item.isUrgent ? "#FEF2F2" : item.isWarning ? "#FFFBEB" : undefined,
                        }}
                      >
                        {item.type === "deadline" ? (
                          <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", item.isUrgent ? "text-red-500" : "text-amber-500")} />
                        ) : (
                          <button
                            onClick={() => completeTask.mutate(item.id)}
                            className={cn(
                              "mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              item.isUrgent ? "border-red-300 hover:border-red-500" : "border-border hover:border-primary"
                            )}
                          >
                            <Check className="w-2.5 h-2.5 opacity-0 hover:opacity-40" />
                          </button>
                        )}
                        <span className={cn("flex-1 min-w-0 truncate", item.isUrgent && "font-semibold")}>
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
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <GradientDivider />

              {/* ── ACTIVIDAD RECIENTE ── */}
              <div
                className="px-6 py-5 space-y-3"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 200ms ease-out 540ms, transform 200ms ease-out 540ms",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actividad reciente
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("email")}>+ Email</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("call")}>+ Llamada</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setActivityType("note")}>+ Nota</Button>
                  </div>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sé el primero en registrar actividad</p>
                    <div className="flex gap-2">
                      {(["email", "call", "note"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setActivityType(type)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors font-medium text-muted-foreground"
                        >
                          {type === "email" ? "📧 Email" : type === "call" ? "📞 Llamada" : "📝 Nota"}
                        </button>
                      ))}
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
                            {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: false, locale: es }) : ""}
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
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">Ver todo →</Button>
                )}
              </div>

              <GradientDivider />

              {/* ── EXPEDIENTE VINCULADO ── */}
              <div
                className="px-6 py-5"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 200ms ease-out 620ms, transform 200ms ease-out 620ms",
                }}
              >
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
                  className="text-[13px] text-destructive/60 hover:text-destructive flex items-center gap-1 transition-colors"
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
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2 rounded-lg transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #16A34A, #22C55E)",
                    boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(34,197,94,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(34,197,94,0.4)";
                  }}
                  onClick={async () => {
                    const wonStage = stages.find((s) => s.is_won_stage);
                    if (wonStage) {
                      await updateDeal.mutateAsync({ id: deal.id, data: { stage_id: wonStage.id } as any });
                    }
                  }}
                  disabled={updateDeal.isPending}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Marcar ganado
                </button>
              ) : isWon ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const firstStage = [...stages].sort((a, b) => a.position - b.position)[0];
                    if (firstStage) {
                      await updateDeal.mutateAsync({ id: deal.id, data: { stage_id: firstStage.id } as any });
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
