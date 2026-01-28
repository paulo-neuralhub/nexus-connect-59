/**
 * CRM Activities - Timeline visual profesional
 */

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMInteractions } from "@/hooks/crm/v2/interactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InteractionFormModal } from "@/components/features/crm/v2/InteractionFormModal";
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  FileText,
  Plus,
  Search,
  Building2,
  Briefcase,
  User,
  Paperclip,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

type InteractionRow = {
  id: string;
  created_at?: string | null;
  channel?: string | null;
  direction?: string | null;
  status?: string | null;
  subject?: string | null;
  content?: string | null;
  duration_seconds?: number | null;
  attachments?: string[] | null;
  created_by_name?: string | null;
  account?: { id: string; name?: string | null } | null;
  contact?: { id: string; full_name?: string | null } | null;
  deal?: { id: string; name?: string | null } | null;
};

type ActivityType = "all" | "call" | "email" | "whatsapp" | "meeting" | "note";

// Iconos y colores por tipo
const CHANNEL_CONFIG: Record<string, { icon: typeof Phone; color: string; bgColor: string; label: string }> = {
  call: { icon: Phone, color: "text-blue-600", bgColor: "bg-blue-100", label: "Llamada" },
  phone: { icon: Phone, color: "text-blue-600", bgColor: "bg-blue-100", label: "Llamada" },
  email: { icon: Mail, color: "text-purple-600", bgColor: "bg-purple-100", label: "Email" },
  whatsapp: { icon: MessageCircle, color: "text-green-600", bgColor: "bg-green-100", label: "WhatsApp" },
  meeting: { icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-100", label: "Reunión" },
  note: { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100", label: "Nota" },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins} min` : `${secs} seg`;
}

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "HOY";
  if (isYesterday(date)) return "AYER";
  return format(date, "EEEE d MMMM yyyy", { locale: es }).toUpperCase();
}

function ActivityCard({ interaction }: { interaction: InteractionRow }) {
  const channel = interaction.channel?.toLowerCase() ?? "note";
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.note;
  const Icon = config.icon;
  const time = interaction.created_at ? format(parseISO(interaction.created_at), "HH:mm") : "—";

  return (
    <div className="bg-card border rounded-lg p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex gap-4">
        {/* Time Badge */}
        <div className="flex flex-col items-center shrink-0">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          <Badge variant="outline" className="mt-2 text-xs font-mono">
            {time}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-medium text-foreground">
                {interaction.subject || `${config.label} con ${interaction.contact?.full_name || "contacto"}`}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                {interaction.account?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {interaction.account.name}
                  </span>
                )}
                {interaction.deal?.name && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {interaction.deal.name}
                  </span>
                )}
              </div>
            </div>
            {interaction.duration_seconds && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {formatDuration(interaction.duration_seconds)}
              </Badge>
            )}
          </div>

          {/* Content/Notes */}
          {interaction.content && (
            <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground mb-3">
              <p className="whitespace-pre-wrap line-clamp-3">{interaction.content}</p>
            </div>
          )}

          {/* Attachments */}
          {interaction.attachments && interaction.attachments.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="font-medium">{interaction.attachments.length} archivo(s) adjunto(s)</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{interaction.created_by_name || "Sistema"}</span>
            </div>
            <div className="flex items-center gap-1">
              {channel === "call" || channel === "phone" ? (
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  <Phone className="w-3 h-3" />
                  Rellamar
                </Button>
              ) : channel === "email" ? (
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Ver email
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                <Plus className="w-3 h-3" />
                Crear tarea
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMV2InteractionsList() {
  usePageTitle("Actividades");
  const [params] = useSearchParams();
  const accountId = params.get("account") ?? undefined;
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ActivityType>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const { data, isLoading, refetch } = useCRMInteractions(accountId ? { account_id: accountId } : undefined);

  // Filter and group by date
  const groupedActivities = useMemo(() => {
    let filtered = (data ?? []) as InteractionRow[];
    
    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(i => {
        const channel = i.channel?.toLowerCase() ?? "";
        if (typeFilter === "call") return channel === "call" || channel === "phone";
        return channel === typeFilter;
      });
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.subject?.toLowerCase().includes(q) ||
        i.content?.toLowerCase().includes(q) ||
        i.account?.name?.toLowerCase().includes(q) ||
        i.contact?.full_name?.toLowerCase().includes(q)
      );
    }

    // Group by date
    const groups: Record<string, InteractionRow[]> = {};
    filtered.forEach(item => {
      if (!item.created_at) return;
      const dayKey = startOfDay(parseISO(item.created_at)).toISOString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(item);
    });

    // Sort groups by date descending
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, items]) => ({
        date: dateKey,
        label: getDateLabel(items[0]?.created_at ?? dateKey),
        items,
      }));
  }, [data, typeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Actividades</h1>
          <p className="text-muted-foreground">Timeline de comunicaciones y acciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Type Tabs */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ActivityType)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="call" className="gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Llamadas
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Emails
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="meeting" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Reuniones
          </TabsTrigger>
          <TabsTrigger value="note" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Notas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">Todo</SelectItem>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : groupedActivities.length === 0 ? (
        <div className="py-14 px-6 text-center border rounded-lg bg-muted/30">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-lg">Sin actividades</p>
          <p className="text-sm text-muted-foreground mb-4">No hay actividades registradas con estos filtros.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar actividad
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map(group => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {group.label}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Activities */}
              <div className="space-y-3">
                {group.items.map(interaction => (
                  <ActivityCard key={interaction.id} interaction={interaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <InteractionFormModal open={showForm} onClose={() => setShowForm(false)} defaultAccountId={accountId} />
    </div>
  );
}
