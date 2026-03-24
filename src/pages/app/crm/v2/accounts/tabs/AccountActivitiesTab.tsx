/**
 * CRM Account Detail — Tab: Actividades / Timeline
 * Queries the `activities` table via contact_ids linked to this account
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Mail, Phone, MessageCircle, Calendar, FileText, Plus, StickyNote, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface Activity {
  id: string;
  type: string;
  subject?: string | null;
  content?: string | null;
  created_at: string;
  contact?: { id: string; name: string } | null;
}

interface Props {
  accountId: string;
  onAddActivity?: () => void;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  email: { icon: Mail, color: "text-blue-500 bg-blue-500/10" },
  call: { icon: Phone, color: "text-emerald-500 bg-emerald-500/10" },
  whatsapp: { icon: MessageCircle, color: "text-green-500 bg-green-500/10" },
  meeting: { icon: Calendar, color: "text-violet-500 bg-violet-500/10" },
  note: { icon: StickyNote, color: "text-amber-500 bg-amber-500/10" },
  document: { icon: FileText, color: "text-cyan-500 bg-cyan-500/10" },
  task: { icon: Clock, color: "text-orange-500 bg-orange-500/10" },
};

function useAccountActivities(accountId: string, page: number) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-account-activities-v2", organizationId, accountId, page],
    queryFn: async () => {
      if (!organizationId) return { data: [] as Activity[], hasMore: false };

      // 1. Get contact IDs from crm_contacts for this account
      const { data: contacts } = await fromTable("crm_contacts")
        .select("id")
        .eq("account_id", accountId)
        .eq("organization_id", organizationId);

      const contactIds = (contacts ?? []).map((c: any) => c.id);
      if (contactIds.length === 0) return { data: [] as Activity[], hasMore: false };

      // 2. Query activities table by those contact_ids
      const { data, error } = await (supabase.from("activities") as any)
        .select(`
          id, type, subject, content, created_at,
          contact:contacts!activities_contact_id_fkey(id, name)
        `)
        .in("contact_id", contactIds)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .range(0, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      const rows = (data ?? []) as Activity[];
      return { data: rows, hasMore: rows.length === (page + 1) * PAGE_SIZE };
    },
    enabled: !!organizationId && !!accountId,
  });
}

export function AccountActivitiesTab({ accountId, onAddActivity }: Props) {
  const [page, setPage] = useState(0);
  const { data: result, isLoading } = useAccountActivities(accountId, page);
  const activities = result?.data ?? [];
  const hasMore = result?.hasMore ?? false;

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground mb-4">Sin actividades registradas</p>
        <Button size="sm" onClick={onAddActivity}>
          <Plus className="w-4 h-4 mr-2" /> Registrar actividad
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{activities.length} actividad(es)</h3>
        <Button size="sm" variant="outline" onClick={onAddActivity}>
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      <div className="relative pl-6 space-y-1">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

        {activities.map(a => {
          const t = TYPE_ICON[a.type] ?? TYPE_ICON.note;
          const Icon = t.icon;
          return (
            <div key={a.id} className="relative flex gap-3 py-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10", t.color)}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{a.subject || a.type}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(a.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                {a.content && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
                )}
                {a.contact && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-4">{a.contact.name}</Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
}
