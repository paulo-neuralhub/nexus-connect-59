import * as React from "react";
import {
  Calendar,
  CheckSquare,
  Filter,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineItem } from "@/components/ui/timeline-item";
import { PendingActivity } from "@/components/ui/pending-activity";
import { DateSeparator } from "@/components/ui/date-separator";
import { useContactTimeline, type TimelineType } from "@/hooks/useContactTimeline";
import { useContactPendingActivities } from "@/hooks/useContactPendingActivities";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCRMInteraction } from "@/hooks/crm/v2/interactions";
import { InteractionFormModal } from "@/components/features/crm/v2/InteractionFormModal";
import { TaskFormModal } from "@/components/features/crm/v2/TaskFormModal";

type FilterType = "all" | Exclude<TimelineType, "task" | "system">;

const filterOptions: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "Todo", icon: "📋" },
  { value: "email", label: "Emails", icon: "✉️" },
  { value: "call", label: "Llamadas", icon: "📞" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "note", label: "Notas", icon: "📝" },
  { value: "meeting", label: "Reuniones", icon: "📅" },
];

export interface ContactTimelineProps {
  contactId: string;
  accountId?: string | null;
}

export function ContactTimeline({ contactId, accountId }: ContactTimelineProps) {
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [interactionOpen, setInteractionOpen] = React.useState(false);
  const [taskOpen, setTaskOpen] = React.useState(false);

  const createInteraction = useCreateCRMInteraction();

  const { groupedActivities, activities, isLoading, refetch, fetchNextPage, hasNextPage } =
    useContactTimeline(contactId, filter === "all" ? "all" : (filter as any));

  const { pendingActivities, markAsComplete } = useContactPendingActivities(contactId);

  const handleAddComment = async () => {
    if (!comment.trim() || !accountId) return;

    await createInteraction.mutateAsync({
      account_id: accountId,
      contact_id: contactId,
      channel: "note",
      direction: "outbound",
      subject: "Nota",
      content: comment.trim(),
      status: "sent",
    });

    setComment("");
    refetch();
  };

  return (
    <ProfessionalCard padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background-card px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Actividad</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Actualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Filter */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilterMenu((v) => !v)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {filter === "all" ? "Filtrar" : filterOptions.find((f) => f.value === filter)?.label}
            </Button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-background-card shadow-lg">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      filter === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span aria-hidden>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 border-b border-border bg-background-card px-4 py-3">
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => setInteractionOpen(true)}
        >
          <Phone className="h-4 w-4" />
          Llamada
        </Button>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => setInteractionOpen(true)}
        >
          <Calendar className="h-4 w-4" />
          Reunión
        </Button>
        <Button variant="secondary" className="gap-2" onClick={() => setTaskOpen(true)}>
          <CheckSquare className="h-4 w-4" />
          Tarea
        </Button>
      </div>

      {/* Pending */}
      {pendingActivities.length > 0 && (
        <div className="border-b border-border p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ⚡ Por hacer ({pendingActivities.length})
          </div>
          <div className="space-y-3">
            {pendingActivities.map((a) => (
              <PendingActivity
                key={a.id}
                title={a.title}
                dueDate={a.dueDate}
                isUrgent={a.isUrgent}
                onComplete={() => markAsComplete(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comment input */}
      <div className="border-b border-border p-4">
        <div className="relative">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={accountId ? "Añadir comentario..." : "Selecciona una cuenta para comentar"}
            disabled={!accountId}
            className="min-h-[84px] resize-none bg-muted pr-20"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Adjuntar" disabled>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!accountId || !comment.trim() || createInteraction.isPending}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay actividad registrada
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedActivities).map(([dateGroup, items]) => (
              <div key={dateGroup}>
                <DateSeparator date={dateGroup} />
                <div className="space-y-3">
                  {items.map((activity) => (
                    <TimelineItem
                      key={activity.id}
                      type={activity.type}
                      title={activity.title}
                      description={activity.description}
                      time={activity.timestamp}
                      user={activity.user}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasNextPage && (
              <Button variant="ghost" className="w-full" onClick={() => fetchNextPage()}>
                Cargar más...
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <InteractionFormModal
        open={interactionOpen}
        onClose={() => setInteractionOpen(false)}
        defaultAccountId={accountId ?? undefined}
      />
      <TaskFormModal open={taskOpen} onClose={() => setTaskOpen(false)} defaultAccountId={accountId ?? undefined} />
    </ProfessionalCard>
  );
}
