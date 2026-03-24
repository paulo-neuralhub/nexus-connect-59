/**
 * DealLinkedMatter — Shows linked matter info or link/create buttons
 */

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ExternalLink, Link2, Plus, Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  matterId: string | null | undefined;
  dealName?: string;
  accountId?: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  trademark: { label: "Marca", color: "#8B5CF6" },
  patent: { label: "Patente", color: "#0EA5E9" },
  design: { label: "Diseño", color: "#F59E0B" },
  utility_model: { label: "Modelo Utilidad", color: "#10B981" },
  copyright: { label: "Copyright", color: "#EC4899" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Activo", bg: "bg-emerald-100", text: "text-emerald-700" },
  pending: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  registered: { label: "Registrada", bg: "bg-green-100", text: "text-green-700" },
  filed: { label: "Presentada", bg: "bg-blue-100", text: "text-blue-700" },
  examination: { label: "En examen", bg: "bg-orange-100", text: "text-orange-700" },
  closed: { label: "Cerrado", bg: "bg-gray-100", text: "text-gray-600" },
  cancelled: { label: "Cancelado", bg: "bg-red-100", text: "text-red-700" },
};

function useDealMatter(matterId: string | null | undefined) {
  return useQuery({
    queryKey: ["deal-linked-matter", matterId],
    queryFn: async () => {
      if (!matterId) return null;
      const { data, error } = await fromTable("matters")
        .select(`
          id, reference, title, type, status,
          jurisdiction, jurisdiction_code,
          application_number, filing_date,
          next_renewal_date,
          deadlines:matter_deadlines(id, title, deadline_date, status, priority)
        `)
        .eq("id", matterId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!matterId,
  });
}

export function DealLinkedMatter({ matterId, dealName, accountId }: Props) {
  const navigate = useNavigate();
  const { data: matter, isLoading } = useDealMatter(matterId);

  if (!matterId) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Expediente vinculado
        </p>
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin expediente vinculado</p>
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/app/expedientes/nuevo")}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Crear expediente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Expediente vinculado
        </p>
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!matter) return null;

  const typeConf = TYPE_CONFIG[matter.type ?? ""] ?? { label: matter.type ?? "—", color: "#64748B" };
  const statusConf = STATUS_CONFIG[matter.status ?? ""] ?? { label: matter.status ?? "—", bg: "bg-gray-100", text: "text-gray-600" };

  // Next deadline
  const pendingDeadlines = ((matter as any).deadlines ?? [])
    .filter((d: any) => d.status !== "completed" && d.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());
  const nextDeadline = pendingDeadlines[0];
  const daysUntil = nextDeadline ? differenceInDays(new Date(nextDeadline.deadline_date), new Date()) : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-muted-foreground" />
        Expediente vinculado
      </p>
      <Card className="border-l-[3px]" style={{ borderLeftColor: typeConf.color }}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {matter.reference ?? matter.application_number ?? "—"}
              </p>
              <p className="font-semibold text-sm truncate mt-0.5">{matter.title}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Badge
                className="text-[10px]"
                style={{ backgroundColor: `${typeConf.color}20`, color: typeConf.color, border: `1px solid ${typeConf.color}30` }}
              >
                {typeConf.label}
              </Badge>
              <Badge className={`text-[10px] ${statusConf.bg} ${statusConf.text}`}>
                {statusConf.label}
              </Badge>
            </div>
          </div>

          {/* Jurisdiction + Filing */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {matter.jurisdiction_code && (
              <span>{matter.jurisdiction_code.toUpperCase()}</span>
            )}
            {matter.filing_date && (
              <span>Presentación: {format(new Date(matter.filing_date), "dd/MM/yyyy")}</span>
            )}
          </div>

          {/* Next deadline */}
          {nextDeadline && (
            <div
              className="flex items-center gap-2 text-xs rounded-md px-3 py-2"
              style={{
                backgroundColor: daysUntil !== null && daysUntil < 7 ? "#fef2f2" : "#f0fdf4",
                color: daysUntil !== null && daysUntil < 7 ? "#b91c1c" : "#15803d",
              }}
            >
              {daysUntil !== null && daysUntil < 7 ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">
                {nextDeadline.title}: {format(new Date(nextDeadline.deadline_date), "dd MMM yyyy", { locale: es })}
                {daysUntil !== null && (
                  <span className="ml-1 opacity-75">
                    ({daysUntil < 0 ? `hace ${Math.abs(daysUntil)} días` : `en ${daysUntil} días`})
                  </span>
                )}
              </span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/app/expedientes/${matter.id}`)}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Ver expediente completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
