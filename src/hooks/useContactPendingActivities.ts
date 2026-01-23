import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";

export interface PendingActivityItem {
  id: string;
  title: string;
  dueDate: string;
  isUrgent: boolean;
}

export function useContactPendingActivities(contactId: string) {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  const { data: pendingActivities = [] } = useQuery({
    queryKey: ["contact-pending-activities", organizationId, contactId],
    queryFn: async () => {
      if (!organizationId || !contactId) return [] as PendingActivityItem[];
      const { data, error } = await fromTable("crm_tasks")
        .select("id, title, due_date, priority")
        .eq("organization_id", organizationId)
        .eq("contact_id", contactId)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;

      return (data ?? []).map((task: any) => {
        const due = task.due_date ? new Date(task.due_date) : null;
        const isUrgent = !!due && (isPast(due) || (isToday(due) && (task.priority === "high" || task.priority === "urgent")));

        let dueLabel = "Sin fecha";
        if (due) {
          if (isToday(due)) dueLabel = `Hoy ${format(due, "HH:mm", { locale: es })}`;
          else if (isTomorrow(due)) dueLabel = "Mañana";
          else dueLabel = format(due, "d MMM", { locale: es });
        }

        return {
          id: task.id,
          title: task.title,
          dueDate: dueLabel,
          isUrgent,
        } satisfies PendingActivityItem;
      });
    },
    enabled: !!organizationId && !!contactId,
  });

  const complete = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await fromTable("crm_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-pending-activities", organizationId, contactId] });
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
    },
  });

  return {
    pendingActivities,
    markAsComplete: complete.mutate,
    completingId: complete.variables,
  };
}
