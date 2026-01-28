/**
 * CRM Tasks - Grid de tarjetas con urgencia
 */

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMTasks, useCompleteCRMTask } from "@/hooks/crm/v2/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskFormModal } from "@/components/features/crm/v2/TaskFormModal";
import {
  CheckSquare,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Mail,
  User,
  Building2,
  Briefcase,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type TaskRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  account?: { id: string; name?: string | null } | null;
  contact?: { id: string; full_name?: string | null } | null;
  deal?: { id: string; name?: string | null } | null;
  assigned_to?: { id: string; full_name?: string | null } | null;
};

type UrgencyLevel = "overdue" | "today" | "tomorrow" | "week" | "later";
type FilterTab = "all" | "overdue" | "today" | "week" | "completed";

// Colores de urgencia
const URGENCY_COLORS: Record<UrgencyLevel, { border: string; badge: string; badgeText: string; dot: string }> = {
  overdue: { border: "border-l-red-500", badge: "bg-red-100", badgeText: "text-red-700", dot: "bg-red-500" },
  today: { border: "border-l-red-500", badge: "bg-red-100", badgeText: "text-red-700", dot: "bg-red-500" },
  tomorrow: { border: "border-l-orange-500", badge: "bg-orange-100", badgeText: "text-orange-700", dot: "bg-orange-500" },
  week: { border: "border-l-yellow-500", badge: "bg-yellow-100", badgeText: "text-yellow-700", dot: "bg-yellow-500" },
  later: { border: "border-l-green-500", badge: "bg-green-100", badgeText: "text-green-700", dot: "bg-green-500" },
};

function getUrgencyLevel(dueDate: string | null | undefined): UrgencyLevel {
  if (!dueDate) return "later";
  const date = parseISO(dueDate);
  if (isPast(date) && !isToday(date)) return "overdue";
  if (isToday(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  if (differenceInDays(date, new Date()) <= 7) return "week";
  return "later";
}

function getUrgencyLabel(dueDate: string | null | undefined): string {
  if (!dueDate) return "Sin fecha";
  const date = parseISO(dueDate);
  const level = getUrgencyLevel(dueDate);
  
  if (level === "overdue") return `VENCIDA ${format(date, "d MMM", { locale: es })}`;
  if (level === "today") return `HOY ${format(date, "HH:mm")}`;
  if (level === "tomorrow") return `MAÑANA ${format(date, "HH:mm")}`;
  return format(date, "EEE d MMM", { locale: es });
}

function TaskCard({ task, onComplete }: { task: TaskRow; onComplete: () => void }) {
  const [completing, setCompleting] = useState(false);
  const isCompleted = task.status === "completed";
  const urgency = getUrgencyLevel(task.due_date);
  const colors = URGENCY_COLORS[urgency];

  const handleComplete = () => {
    setCompleting(true);
    onComplete();
    // Animation will happen via state change
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-lg overflow-hidden transition-all duration-300",
        "hover:shadow-md",
        isCompleted && "opacity-50",
        completing && "scale-95 opacity-50"
      )}
    >
      {/* Colored Left Border */}
      <div className={cn("border-l-4", colors.border, "h-full")}>
        <div className="p-4">
          {/* Urgency Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={cn("text-xs font-medium", colors.badge, colors.badgeText)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", colors.dot)} />
              {getUrgencyLabel(task.due_date)}
            </Badge>
            {task.priority === "high" && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* Checkbox + Title */}
          <div className="flex items-start gap-3 mb-3">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleComplete}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-foreground",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title || "Tarea sin título"}
              </h4>
            </div>
          </div>

          {/* Related Info */}
          <div className="space-y-1.5 text-xs text-muted-foreground mb-3 border-t pt-3">
            {task.account?.name && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{task.account.name}</span>
              </div>
            )}
            {task.contact?.full_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{task.contact.full_name}</span>
              </div>
            )}
            {task.deal?.name && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{task.deal.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground mb-3">
              <p className="line-clamp-2">{task.description}</p>
            </div>
          )}

          {/* Actions + Assigned */}
          <div className="flex items-center justify-between pt-3 border-t">
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Llamar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 hover:bg-green-500 hover:text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>WhatsApp</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 hover:bg-purple-500 hover:text-white"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Email</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            {task.assigned_to?.full_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span>{task.assigned_to.full_name.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMV2TasksList() {
  usePageTitle("Tareas");
  const [params] = useSearchParams();
  const accountId = params.get("account") ?? undefined;
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // Fetch all tasks (including completed for the completed tab)
  const { data: allTasks, isLoading } = useCRMTasks({
    account_id: accountId,
    status: tab === "completed" ? ["completed"] : ["pending", "in_progress"],
  });

  const complete = useCompleteCRMTask();

  // Count tasks by urgency for tab badges
  const counts = useMemo(() => {
    const tasks = (allTasks ?? []) as TaskRow[];
    return {
      overdue: tasks.filter(t => getUrgencyLevel(t.due_date) === "overdue" && t.status !== "completed").length,
      today: tasks.filter(t => getUrgencyLevel(t.due_date) === "today" && t.status !== "completed").length,
      week: tasks.filter(t => ["today", "tomorrow", "week"].includes(getUrgencyLevel(t.due_date)) && t.status !== "completed").length,
    };
  }, [allTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let tasks = (allTasks ?? []) as TaskRow[];

    // Tab filter
    if (tab === "overdue") {
      tasks = tasks.filter(t => getUrgencyLevel(t.due_date) === "overdue");
    } else if (tab === "today") {
      tasks = tasks.filter(t => getUrgencyLevel(t.due_date) === "today");
    } else if (tab === "week") {
      tasks = tasks.filter(t => ["today", "tomorrow", "week"].includes(getUrgencyLevel(t.due_date)));
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.account?.name?.toLowerCase().includes(q)
      );
    }

    return tasks;
  }, [allTasks, tab, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tareas</h1>
          <p className="text-muted-foreground">Gestiona tus pendientes</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Vencidas
            {counts.overdue > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                {counts.overdue}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Hoy
            {counts.today > 0 && (
              <Badge className="ml-1 text-xs px-1.5 py-0 bg-red-100 text-red-700">
                {counts.today}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-1.5">
            Esta semana
            {counts.week > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {counts.week}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
            Completadas
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
            placeholder="Buscar tarea..."
            className="pl-9"
          />
        </div>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Asignado a" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="me">Mis tareas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[240px] rounded-lg" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-14 px-6 text-center border rounded-lg bg-muted/30">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckSquare className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-lg">
            {tab === "completed" ? "Sin tareas completadas" : "Sin tareas pendientes"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {tab === "completed" ? "Las tareas completadas aparecerán aquí." : "¡Excelente! No tienes tareas pendientes."}
          </p>
          {tab !== "completed" && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear tarea
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => complete.mutate(task.id)}
            />
          ))}
        </div>
      )}

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} defaultAccountId={accountId} />
    </div>
  );
}
