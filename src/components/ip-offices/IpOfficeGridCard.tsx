import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Globe, ExternalLink, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IpOfficeWithCommercial } from "@/hooks/useIpOfficesDirectory";

const OFFICE_TYPE_LABELS: Record<string, string> = {
  international: "Internacional",
  regional: "Regional",
  national: "Nacional",
};

interface Props {
  office: IpOfficeWithCommercial;
  onClick?: () => void;
}

export function IpOfficeGridCard({ office, onClick }: Props) {
  const navigate = useNavigate();
  const c = office.commercial;
  const officeType = office.office_type || "national";
  const digitalScore = office.digital_maturity_score ?? 0;
  const isMadrid = office.member_madrid_protocol ?? false;
  const estMonths = office.tm_estimated_registration_months;
  const requiresAgent = office.requires_local_agent;

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/backoffice/ipo/${office.code}`);
  };

  const getDigitalColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-blue-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getDigitalBarColor = (score: number) => {
    if (score >= 8) return "[&>div]:bg-emerald-500";
    if (score >= 5) return "[&>div]:bg-blue-500";
    if (score >= 3) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  const getCardBg = () => {
    const level = office.digitalization_level;
    if (level === "FULL_DIGITAL") return "bg-emerald-50/50 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40";
    if (level === "AVANZADA") return "bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/40";
    if (level === "PARCIAL") return "bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40";
    if (level === "BASICA") return "bg-slate-50/50 hover:bg-slate-100/70 dark:bg-slate-800/20 dark:hover:bg-slate-800/40";
    return "bg-orange-50/20 hover:bg-orange-50/50 dark:bg-orange-950/15 dark:hover:bg-orange-950/30";
  };

  // Extract country name and bold it in the office description
  const officeName = office.official_name_local || office.name || "";
  const countryName = office.country_name || "";
  
  const renderOfficeName = () => {
    if (!countryName || !officeName) return <>{officeName}</>;
    const countryUpper = countryName.toUpperCase();
    const nameUpper = officeName.toUpperCase();
    const idx = nameUpper.lastIndexOf(countryUpper);
    if (idx >= 0) {
      return (
        <>
          {officeName.slice(0, idx)}
          <span className="font-semibold text-foreground">{officeName.slice(idx, idx + countryName.length)}</span>
          {officeName.slice(idx + countryName.length)}
        </>
      );
    }
    return <>{officeName} — <span className="font-semibold text-foreground">{countryName}</span></>;
  };

  return (
    <Card className={cn("cursor-pointer hover:shadow-lg transition-all hover:border-primary/30 group h-full flex flex-col shadow-sm border-border/60", getCardBg())} onClick={handleClick}>
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{office.country_flag || "🏛️"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-foreground">{office.acronym || office.code}</h3>
              <Badge variant="outline" className="text-xs shadow-sm border-border/80">{OFFICE_TYPE_LABELS[officeType] || "Nacional"}</Badge>
              {(office as any).has_fee_intelligence && (
                <Badge variant="outline" className="text-[10px] h-4 gap-0.5 px-1 shadow-sm"><Sparkles className="h-2.5 w-2.5 text-amber-500" />Tasas</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{renderOfficeName()}</p>
          </div>
        </div>

        {/* Location */}
        {(office.city || office.country_name) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="h-3 w-3" />{[office.city, office.country_name].filter(Boolean).join(", ")}
          </p>
        )}

        {/* IP Types */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            <IpTypeBadge active={office.handles_trademarks} label="™" title="Marcas" />
            <IpTypeBadge active={office.handles_patents} label="P" title="Patentes" />
            <IpTypeBadge active={office.handles_designs} label="D" title="Diseños" />
            {office.handles_utility_models && <IpTypeBadge active={true} label="UM" title="Modelos Utilidad" />}
          </div>
        </div>

        {/* Key info */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            {isMadrid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}
            <span className={isMadrid ? "text-emerald-700 font-medium" : "text-muted-foreground"}>Madrid</span>
          </div>
          {estMonths && <div className="flex items-center gap-1.5 text-muted-foreground">⏱ ~{estMonths} meses</div>}
        </div>

        {/* Digital maturity bar */}
        {digitalScore > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">🤖 Digital</span>
              <span className={cn("font-medium", getDigitalColor(digitalScore))}>{digitalScore}/10</span>
            </div>
            <Progress value={digitalScore * 10} className={cn("h-1.5", getDigitalBarColor(digitalScore))} />
          </div>
        )}

        {/* Completeness & Agent */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {(office.data_completeness_score != null && (office.data_completeness_score as number) > 0) && (
            <span className={cn("font-medium",
              (office.data_completeness_score as number) >= 80 ? "text-emerald-600" :
              (office.data_completeness_score as number) >= 50 ? "text-amber-600" : "text-red-600"
            )}>
              {(office.data_completeness_score as number) >= 80 ? "🟢" : (office.data_completeness_score as number) >= 50 ? "🟡" : "🔴"} {office.data_completeness_score}%
            </span>
          )}
          {requiresAgent != null && (
            <span className={requiresAgent ? "text-amber-600" : "text-emerald-600"}>
              {requiresAgent ? "👤 Agente" : "✅ Sin agente"}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            {c?.price_tier === 'real' && c.price_total ? (
              <span className="text-sm font-bold text-emerald-700">💰 €{c.price_total.toLocaleString()}</span>
            ) : c?.price_tier === 'suggested' && c.suggested_total ? (
              <span className="text-sm font-medium text-amber-600">🟡 ~€{c.suggested_total.toLocaleString()}</span>
            ) : (
              <span className="text-xs text-muted-foreground">⚪ Sin datos</span>
            )}
            {c?.pj_is_active && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">🟢 En web</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">Ver ficha completa <ArrowRight className="h-3 w-3" /></span>
            {(office.website_main || office.website_url) && (
              <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1" onClick={(e) => { e.stopPropagation(); window.open((office.website_main || office.website_url) as string, "_blank"); }}>
                <Globe className="h-3 w-3" /><ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IpTypeBadge({ active, label, title }: { active?: boolean | null; label: string; title: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium shadow-sm",
      active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"
    )} title={title}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{label}
    </span>
  );
}
