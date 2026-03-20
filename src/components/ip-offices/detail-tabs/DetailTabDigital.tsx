/**
 * Detail Tab: Digital Capabilities & Automation
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  office: Record<string, unknown>;
}

const AUTOMATION_LABELS: Record<string, string> = {
  FULL_DIGITAL: "Full Digital", AVANZADA: "Avanzada", PARCIAL: "Parcial",
  BASICA: "Básica", MANUAL: "Manual",
};

export function DetailTabDigital({ office }: Props) {
  const eFilingAvailable = office.e_filing_available ?? false;
  const eFilingUrl = (office.e_filing_url ?? null) as string | null;
  const onlinePayment = office.online_payment ?? false;
  const electronicSignature = office.electronic_signature ?? false;
  const hasApi = office.has_api ?? false;
  const apiType = (office.api_type ?? null) as string | null;
  const apiUrl = (office.api_url ?? null) as string | null;
  const apiDocUrl = (office.api_documentation_url ?? null) as string | null;
  const apiSandbox = office.api_sandbox_available ?? false;
  const automationLevel = (office.automation_level ?? null) as string | null;
  const automationPct = (office.automation_percentage ?? 0) as number;

  const features = [
    { label: "E-filing disponible", value: !!eFilingAvailable, url: eFilingUrl },
    { label: "Pago online", value: !!onlinePayment },
    { label: "Firma electrónica", value: !!electronicSignature },
    { label: "API disponible", value: !!hasApi },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🤖 Infraestructura Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Automatización</span>
              <span className="font-bold">
                {automationLevel ? (AUTOMATION_LABELS[automationLevel] || automationLevel) : "—"}
                {automationPct > 0 && ` · ${automationPct}%`}
              </span>
            </div>
            <Progress value={automationPct} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-2">
            {features.map(({ label, value }) => (
              <div key={label} className={cn("flex items-center gap-2 p-2 rounded text-sm",
                value ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30")}>
                {value ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={value ? "" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {eFilingAvailable && eFilingUrl && (
        <div className="text-sm">
          <a href={eFilingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-xs">
            📝 Portal E-filing: {(() => { try { return new URL(eFilingUrl).hostname; } catch { return eFilingUrl; } })()}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {hasApi && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🔌 API</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {apiType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="text-xs uppercase">{apiType}</Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sandbox</span>
              <span>{apiSandbox ? "✅ Disponible" : "⚪ No disponible"}</span>
            </div>
            {apiUrl && (
              <a href={apiUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-xs">
                {apiUrl} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {apiDocUrl && (
              <a href={apiDocUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-xs">
                Documentación API <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
