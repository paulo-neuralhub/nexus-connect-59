/**
 * Detail Tab: Requirements
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Props {
  office: Record<string, unknown>;
}

function ReqRow({ label, value, details }: { label: string; value: boolean | null | undefined; details?: string | null }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground ml-2">— Sin datos</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      )}
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-2 text-sm">
          {value ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Obligatorio</Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">No requerido</Badge>
          )}
        </span>
        {details && <p className="text-xs text-muted-foreground mt-1">{String(details)}</p>}
      </div>
    </div>
  );
}

function TextRow({ label, value }: { label: string; value: unknown }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-1">
        <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
        <p className="text-sm mt-0.5">{String(value)}</p>
      </div>
    </div>
  );
}

export function DetailTabRequirements({ office }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">👤 Representación y Agente Local</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <ReqRow label="Agente local obligatorio" value={office.requires_local_agent as boolean | null} />
          {office.agent_requirement_type && <TextRow label="Tipo de requisito" value={office.agent_requirement_type} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">✅ Requisitos de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <ReqRow label="Declaración de uso obligatoria" value={office.tm_use_requirement as boolean | null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">⏱️ Plazos Clave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {office.tm_opposition_period_days && <TextRow label="Período de oposición" value={`${office.tm_opposition_period_days} días`} />}
          {office.grace_period_days && <TextRow label="Período de gracia (renovación)" value={`${office.grace_period_days} días`} />}
          {office.priority_claim_months && <TextRow label="Plazo prioridad (Convenio de París)" value={`${office.priority_claim_months} meses`} />}
          {office.tm_registration_duration_years && <TextRow label="Duración del registro" value={`${office.tm_registration_duration_years} años`} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🏷️ Clasificación y Tipos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <ReqRow label="Multi-clase" value={office.tm_multi_class as boolean | null} />
          <ReqRow label="Clasificación Nice" value={office.uses_nice_classification as boolean | null} />
        </CardContent>
      </Card>
    </div>
  );
}
