/**
 * Detail Tab: IP Types & Trademark Process
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, UserCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  office: Record<string, unknown>;
}

export function DetailTabProcess({ office }: Props) {
  const ipTypes = [
    { key: "handles_trademarks", label: "Marcas", icon: "™" },
    { key: "handles_patents", label: "Patentes", icon: "P" },
    { key: "handles_designs", label: "Diseños", icon: "D" },
    { key: "handles_utility_models", label: "Modelos Utilidad", icon: "UM" },
  ];

  const estMonths = office.tm_estimated_registration_months as number | null;
  const oppositionDays = office.tm_opposition_period_days as number | null;

  return (
    <div className="space-y-4">
      {/* IP Types grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tipos de PI gestionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ipTypes.map(({ key, label, icon }) => {
              const active = office[key] as boolean | null;
              return (
                <div key={key} className={cn("flex items-center gap-2 p-2 rounded text-sm",
                  active ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/50")}>
                  {active ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>{icon} {label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trademark process timeline */}
      {(estMonths || oppositionDays) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">⏱ Plazos estimados de marcas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {oppositionDays && (
              <TimelineBar label="Oposición" value={oppositionDays} max={180} unit="días" />
            )}
            {estMonths && (
              <TimelineBar label="TOTAL registro" value={estMonths} max={24} unit="meses" highlight />
            )}
          </CardContent>
        </Card>
      )}

      {/* Filing & requirements */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📋 Proceso de filing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Multi-clase" value={office.tm_multi_class ? "Sí" : "No"} />
            <InfoRow label="Clasificación Nice" value={office.uses_nice_classification ? "Sí" : "No"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📝 Requisitos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Prueba de uso" value={office.tm_use_requirement ? "Requerida" : "No requerida"} />
            <InfoRow label="Prioridad (París)" value={office.priority_claim_months ? `${office.priority_claim_months} meses` : "6 meses"} />
            <InfoRow label="Duración registro" value={office.tm_registration_duration_years ? `${office.tm_registration_duration_years} años` : "—"} />
          </CardContent>
        </Card>
      </div>

      {/* Agent requirements */}
      <Card className={cn(
        office.requires_local_agent
          ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10"
          : "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {office.requires_local_agent ? (
              <><UserCheck className="h-4 w-4 text-amber-600" /> Representación</>
            ) : (
              <><Shield className="h-4 w-4 text-emerald-600" /> Representación</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="font-medium">
            Agente local: {
              office.agent_requirement_type === "always" ? "Siempre requerido" :
              office.agent_requirement_type === "non_resident" ? "Solo no residentes" :
              office.agent_requirement_type === "never" ? "No requerido" :
              office.requires_local_agent ? "Requerido" : "No requerido"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineBar({ label, value, max, unit, highlight }: {
  label: string; value: number; max: number; unit: string; highlight?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={highlight ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
        <span className={highlight ? "font-semibold" : "text-muted-foreground"}>~{value} {unit}</span>
      </div>
      <Progress value={pct} className={cn("h-2", highlight && "[&>div]:bg-primary")} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
