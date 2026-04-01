/**
 * Sección "Inteligencia de Tasas" — lee jurisdiction_change_patterns
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, CheckCircle2, XCircle, ExternalLink, Sparkles, Copy, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  officeId: string;
  officeName?: string;
}

interface ChangePattern {
  id: string;
  change_type: string;
  avg_change_interval_days: number | null;
  interval_variance_days: number | null;
  typical_change_months: number[] | null;
  typical_change_magnitude_pct: number | null;
  known_change_dates: string[] | null;
  gives_advance_notice: boolean | null;
  advance_notice_days: number | null;
  announcement_url: string | null;
  signal_search_terms: string[] | null;
  legal_framework: string | null;
  requires_legislative_change: boolean | null;
  confidence_in_pattern: number | null;
  notes: string | null;
  last_pattern_review: string | null;
  source: string | null;
  researched_at: string | null;
  research_sources: unknown;
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function frequencyLabel(days: number | null): string {
  if (days == null) return "No determinada";
  if (days <= 1) return "Diario ⚠️";
  if (days <= 30) return "Mensual";
  if (days <= 91) return "Trimestral";
  if (days <= 182) return "Semestral";
  if (days <= 365) return "Anual";
  if (days <= 730) return "Bienal";
  if (days <= 1825) return `Poco frecuente (~${Math.round(days / 365)} años)`;
  return "Muy estable (>5 años)";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (c >= 0.6) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export function useOfficeFeeIntelligence(officeId: string | null) {
  return useQuery({
    queryKey: ["office-fee-intelligence", officeId],
    queryFn: async () => {
      if (!officeId) return [];
      const { data, error } = await (supabase
        .from("jurisdiction_change_patterns" as any)
        .select("*")
        .eq("ipo_office_id", officeId)
        .order("change_type") as any);
      if (error) throw error;
      return (data ?? []) as ChangePattern[];
    },
    enabled: !!officeId,
  });
}

export function IPOfficeFeeIntelligence({ officeId, officeName }: Props) {
  const { data: patterns, isLoading } = useOfficeFeeIntelligence(officeId);
  const [expandedNotes, setExpandedNotes] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!patterns || patterns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Sin datos de inteligencia de tasas para esta oficina
          </p>
        </CardContent>
      </Card>
    );
  }

  const p = patterns[0];
  const isVolatile = p.avg_change_interval_days != null && p.avg_change_interval_days <= 1;
  const confidencePct = p.confidence_in_pattern != null ? Math.round(p.confidence_in_pattern * 100) : null;
  
  const notesHasAlert = p.notes ? /ALERTA|CRÍTICO|CRITICO/i.test(p.notes) : false;

  return (
    <div className="space-y-3">
      {isVolatile && (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tasas con volatilidad máxima</AlertTitle>
          <AlertDescription>
            Las tasas de esta jurisdicción fluctúan diariamente.
            No presupuestar sin cotización directa con abogado local.
            {confidencePct != null && ` Confianza de datos: ${confidencePct}%.`}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Inteligencia de Tasas
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {p.last_pattern_review && (
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {formatDate(p.last_pattern_review)}
                </Badge>
              )}
              {confidencePct != null && (
                <Badge variant="outline" className={cn("text-[10px]", confidenceColor(p.confidence_in_pattern!))}>
                  {confidencePct}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patrón de cambio */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patrón de Cambio</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Frecuencia:</span>
                <p className="font-medium">{frequencyLabel(p.avg_change_interval_days)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Magnitud típica:</span>
                {p.typical_change_magnitude_pct != null ? (
                  <Badge variant="outline" className={cn("text-xs mt-0.5",
                    p.typical_change_magnitude_pct > 20 ? "bg-red-50 text-red-700 border-red-200" :
                    p.typical_change_magnitude_pct > 5 ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {p.typical_change_magnitude_pct > 20 ? "Alto riesgo" :
                     p.typical_change_magnitude_pct > 5 ? "Moderado" : "Bajo"} +{p.typical_change_magnitude_pct}%
                  </Badge>
                ) : (
                  <p className="text-muted-foreground text-xs">No determinada</p>
                )}
              </div>
            </div>

            {p.typical_change_months && p.typical_change_months.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Meses típicos de cambio:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.typical_change_months.map(m => (
                    <Badge key={m} variant="secondary" className="text-[10px]">
                      {MONTH_NAMES[m - 1] || `Mes ${m}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              {p.gives_advance_notice ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Da preaviso de {p.advance_notice_days ?? "?"} días</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-600">Sin preaviso oficial</span>
                </>
              )}
            </div>
          </div>

          {/* Marco Legal */}
          {(p.legal_framework || p.requires_legislative_change != null) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Marco Legal</h4>
              {p.legal_framework && (
                <p className="text-sm">{p.legal_framework}</p>
              )}
              {p.requires_legislative_change != null && (
                <Badge variant="outline" className={cn("text-xs",
                  p.requires_legislative_change
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                  {p.requires_legislative_change ? "Requiere cambio legislativo" : "Cambio administrativo"}
                </Badge>
              )}
            </div>
          )}

          {/* Notas del investigador */}
          {p.notes && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas del Investigador</h4>
              <div className={cn(
                "text-sm rounded-md p-2",
                notesHasAlert ? "bg-red-50 border border-red-200 text-red-800" : "bg-muted/50"
              )}>
                <p className={cn(!expandedNotes && "line-clamp-3")}>{p.notes}</p>
                {p.notes.length > 200 && (
                  <button
                    onClick={() => setExpandedNotes(!expandedNotes)}
                    className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                  >
                    {expandedNotes ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Más</>}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Monitorización */}
          {(p.announcement_url || (p.signal_search_terms && p.signal_search_terms.length > 0)) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monitorización</h4>
              {p.announcement_url && (
                <a
                  href={p.announcement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Ver anuncios oficiales <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {p.signal_search_terms && p.signal_search_terms.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Términos de búsqueda para alertas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.signal_search_terms.map((term, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => navigator.clipboard.writeText(term)}
                        title="Click para copiar"
                      >
                        {term}
                        <Copy className="h-2 w-2 ml-1 opacity-50" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historial */}
          {p.known_change_dates && p.known_change_dates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historial</h4>
              {p.known_change_dates && p.known_change_dates.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.known_change_dates.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {formatDate(d)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
