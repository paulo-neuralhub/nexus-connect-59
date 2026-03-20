/**
 * CRM Account Detail — Tab: Actividades / Timeline
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Phone, MessageCircle, Calendar, FileText, Plus, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  activity_type: string;
  subject?: string | null;
  description?: string | null;
  activity_date: string;
  contact?: { id: string; full_name: string } | null;
  creator?: { id: string; first_name: string | null; last_name: string | null } | null;
}

interface Props {
  activities: Activity[];
  onAddActivity?: () => void;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  email: { icon: Mail, color: "text-blue-500 bg-blue-500/10" },
  call: { icon: Phone, color: "text-emerald-500 bg-emerald-500/10" },
  whatsapp: { icon: MessageCircle, color: "text-green-500 bg-green-500/10" },
  meeting: { icon: Calendar, color: "text-violet-500 bg-violet-500/10" },
  note: { icon: StickyNote, color: "text-amber-500 bg-amber-500/10" },
  document: { icon: FileText, color: "text-cyan-500 bg-cyan-500/10" },
};

export function AccountActivitiesTab({ activities, onAddActivity }: Props) {
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
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

        {activities.map(a => {
          const t = TYPE_ICON[a.activity_type] ?? TYPE_ICON.note;
          const Icon = t.icon;
          return (
            <div key={a.id} className="relative flex gap-3 py-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10", t.color)}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{a.subject || a.activity_type}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(a.activity_date), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                {a.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>
                )}
                {(a.contact || a.creator) && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    {a.contact && <Badge variant="secondary" className="text-[10px] h-4">{a.contact.full_name}</Badge>}
                    {a.creator && <span>por {[a.creator.first_name, a.creator.last_name].filter(Boolean).join(" ")}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
