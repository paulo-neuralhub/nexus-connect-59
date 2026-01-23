import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";

export type TimelineType = "email" | "call" | "whatsapp" | "note" | "meeting" | "task" | "system";

export interface TimelineActivity {
  id: string;
  type: TimelineType;
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown> | null;
}

const PAGE_SIZE = 20;

export function useContactTimeline(contactId: string, filter: TimelineType | "all" = "all") {
  const { organizationId } = useOrganization();

  const query = useInfiniteQuery({
    queryKey: ["contact-timeline", organizationId, contactId, filter],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId || !contactId) return [] as TimelineActivity[];

      // Source of truth for activity timeline in CRM v2 is crm_interactions.
      // We map channel -> TimelineType and reuse the same feed for filtering/grouping.
      let q = fromTable("crm_interactions")
        .select(
          "id, channel, direction, subject, content, created_at, status, assigned_to:users!assigned_to(id,full_name,avatar_url)"
        )
        .eq("organization_id", organizationId)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filter !== "all") q = q.eq("channel", filter);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => {
        const type = (row.channel as TimelineType) || "note";
        const title = row.subject || channelTitle(type, row.direction);
        const description = row.content || undefined;

        return {
          id: row.id,
          type,
          title,
          description,
          timestamp: new Date(row.created_at),
          user: row.assigned_to?.full_name
            ? { name: row.assigned_to.full_name, avatar: row.assigned_to.avatar_url ?? undefined }
            : undefined,
          metadata: { status: row.status } as Record<string, unknown>,
        } satisfies TimelineActivity;
      });
    },
    getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length : undefined),
    initialPageParam: 0,
    enabled: !!organizationId && !!contactId,
  });

  const activities = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, TimelineActivity[]> = {};
    for (const activity of activities) {
      const key = getDateGroupKey(activity.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    }
    return groups;
  }, [activities]);

  return {
    activities,
    groupedActivities,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
  };
}

function getDateGroupKey(date: Date): string {
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  if (isThisWeek(date)) return format(date, "EEEE", { locale: es });
  return format(date, "d MMMM yyyy", { locale: es });
}

function channelTitle(type: TimelineType, direction?: string | null): string {
  const dir = direction === "inbound" ? "recibido" : direction === "outbound" ? "enviado" : "";
  switch (type) {
    case "email":
      return `Email ${dir}`.trim();
    case "call":
      return `Llamada ${dir}`.trim();
    case "whatsapp":
      return `WhatsApp ${dir}`.trim();
    case "meeting":
      return "Reunión";
    case "note":
      return "Nota";
    default:
      return "Actividad";
  }
}
