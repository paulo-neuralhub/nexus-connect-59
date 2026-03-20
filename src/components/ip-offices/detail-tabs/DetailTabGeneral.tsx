/**
 * Detail Tab: General Information
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Phone, Mail, Globe, Clock, Languages, BarChart3, Printer } from "lucide-react";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Español", en: "Inglés", fr: "Francés", de: "Alemán", it: "Italiano",
  pt: "Portugués", zh: "Chino", ja: "Japonés", ko: "Coreano", ar: "Árabe",
  ru: "Ruso", nl: "Neerlandés", pl: "Polaco", ro: "Rumano", sv: "Sueco",
};

function parseLanguages(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

interface Props {
  office: Record<string, unknown>;
}

export function DetailTabGeneral({ office }: Props) {
  const officialLangs = parseLanguages(office.languages);

  const rawHours = office.office_hours;
  const officeHoursObj = typeof rawHours === "object" && rawHours !== null ? rawHours as Record<string, string> : null;
  const officeHoursStr = typeof rawHours === "string" ? rawHours : null;

  const rawConfidence = office.data_completeness_score;
  const completeness = typeof rawConfidence === "number" ? rawConfidence : 0;
  const lastVerified = office.data_last_verified_at as string | null;

  const approvalRate = office.approval_rate_pct as number | null;
  const rejectionRate = office.rejection_rate_pct as number | null;
  const daysFirstAction = office.avg_days_to_first_action as number | null;
  const daysDecision = office.avg_days_to_decision as number | null;
  const tmApplications = office.stats_tm_applications as number | null;
  const tmRegistrations = office.stats_tm_registrations as number | null;
  const hasStats = approvalRate || daysFirstAction || daysDecision || tmApplications;

  return (
    <div className="space-y-4">
      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {office.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span>{office.address as string}</span>
            </div>
          )}
          {office.phone_general && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{office.phone_general as string}</span>
            </div>
          )}
          {office.fax && (
            <div className="flex items-center gap-2">
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Fax:</span>
              <span>{office.fax as string}</span>
            </div>
          )}
          {office.email_general && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${office.email_general}`} className="text-primary hover:underline">
                {office.email_general as string}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Web
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "Principal", url: office.website_main || office.website_official },
            { label: "E-filing", url: office.e_filing_url },
            { label: "Búsqueda", url: office.search_url || office.website_search },
            { label: "Tasas", url: office.fees_url },
          ].filter(l => l.url).map(link => (
            <div key={link.label} className="flex items-start gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-muted-foreground text-xs w-16 shrink-0">{link.label}:</span>
              <a href={link.url as string} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline truncate">
                {(() => { try { return new URL(link.url as string).hostname; } catch { return link.url as string; } })()}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hours & Languages */}
      <div className="grid md:grid-cols-2 gap-4">
        {(officeHoursObj || officeHoursStr) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {officeHoursStr ? (
                <p>{officeHoursStr}</p>
              ) : officeHoursObj ? (
                <>
                  {officeHoursObj.mon_fri && <p>L-V: {officeHoursObj.mon_fri}</p>}
                  {officeHoursObj.sat && <p>Sáb: {officeHoursObj.sat}</p>}
                </>
              ) : null}
              {office.timezone && (
                <p className="text-xs text-muted-foreground">Zona: {office.timezone as string}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" /> Idiomas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {officialLangs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {officialLangs.map(l => (
                  <Badge key={l} variant="secondary" className="text-xs">
                    {LANGUAGE_NAMES[l] || l.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Statistics */}
      {hasStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Estadísticas Operativas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {approvalRate != null && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasa de aprobación</span>
                  <span className="font-medium">{approvalRate}%</span>
                </div>
                <Progress value={approvalRate} className="h-2" />
              </div>
            )}
            {rejectionRate != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa de rechazo</span>
                <span className="font-medium">{rejectionRate}%</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {daysFirstAction != null && (
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs text-muted-foreground">Primera acción</p>
                  <p className="font-medium">~{daysFirstAction} días</p>
                </div>
              )}
              {daysDecision != null && (
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs text-muted-foreground">Hasta decisión</p>
                  <p className="font-medium">~{daysDecision} días</p>
                </div>
              )}
              {tmApplications != null && (
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs text-muted-foreground">Solicitudes/año</p>
                  <p className="font-medium">{tmApplications.toLocaleString("es-ES")}</p>
                </div>
              )}
              {tmRegistrations != null && (
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs text-muted-foreground">Registros/año</p>
                  <p className="font-medium">{tmRegistrations.toLocaleString("es-ES")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data completeness */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">📊 Completitud de datos</span>
            <span className="font-medium">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
          {lastVerified && (
            <p className="text-xs text-muted-foreground mt-2">
              Última verificación: {new Date(lastVerified).toLocaleDateString("es-ES")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
