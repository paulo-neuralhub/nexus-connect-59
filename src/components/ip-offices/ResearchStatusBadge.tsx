import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchInfo {
  status: string;
  research_completed_at: string | null;
  auto_confidence_score: number;
}

interface Props {
  research?: ResearchInfo | null;
  compact?: boolean;
}

export function ResearchStatusBadge({ research, compact }: Props) {
  if (!research) {
    return compact ? (
      <span className="text-xs text-muted-foreground">Sin investigar</span>
    ) : (
      <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>
    );
  }
  const { status, research_completed_at, auto_confidence_score } = research;
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) +
      " " + date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  if (status === "completed") {
    return compact ? (
      <span className="text-xs text-emerald-600">{research_completed_at ? formatDate(research_completed_at) : "Completada"}</span>
    ) : (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs text-emerald-600 font-medium">{research_completed_at ? formatDate(research_completed_at) : "Completada"}</span>
        {auto_confidence_score > 0 && <span className="text-xs text-muted-foreground">· {auto_confidence_score}%</span>}
      </div>
    );
  }
  if (status === "partial") {
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs text-amber-600">{research_completed_at ? formatDate(research_completed_at) : "Parcial"}</span>
        {auto_confidence_score > 0 && !compact && <span className="text-xs text-muted-foreground">· {auto_confidence_score}%</span>}
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive">Fallida</span></div>
    );
  }
  return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" /> {status === "researching" ? "En curso" : "Pendiente"}</Badge>;
}
