/**
 * OfficeIntelligencePanel — Deep rejection & filing intelligence
 * Reusable across backoffice and tenant app directories
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert, CheckCircle, XCircle, ChevronDown, ChevronUp,
  BarChart3, Printer, Download, AlertTriangle, Brain, FileText,
  Clock, TrendingUp, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────
interface RichRejection {
  reason: string;
  percentage: number;
  notes?: string;
}
interface LegacyRejection {
  reason: string;
  pct: number;
}
interface SectorEntry { sector: string; pct: number }
interface CountryEntry { country: string; pct: number }

export interface OfficeIntelligenceData {
  // Stats
  annual_filing_volume?: number | null;
  filing_volume_year?: number | null;
  filing_volume_growth_pct?: number | null;
  stats_tm_applications?: number | null;
  stats_tm_registrations?: number | null;
  // Rates
  rejection_rate_pct?: number | null;
  approval_rate_pct?: number | null;
  opposition_success_rate?: number | null;
  success_rate_approvals?: number | null;
  // Processing times
  avg_days_to_first_action?: number | null;
  avg_days_to_decision?: number | null;
  avg_days_to_publication?: number | null;
  // Rejection reasons
  common_rejection_reasons?: RichRejection[] | null;
  main_rejection_reasons?: LegacyRejection[] | null;
  // Practices
  best_practices?: string[] | null;
  common_mistakes?: string[] | null;
  // Market
  top_filing_sectors?: SectorEntry[] | null;
  top_filing_countries?: CountryEntry[] | null;
  examiner_patterns?: Record<string, unknown> | null;
  // GENIUS
  genius_coverage_score?: number | null;
  genius_coverage_level?: string | null;
  genius_kb_chunks?: number | null;
  genius_last_kb_update?: string | null;
}

interface Props {
  office: OfficeIntelligenceData;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

// ── Helpers ────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("es-ES");
}
function daysToLabel(d: number | null | undefined): string {
  if (d == null) return "—";
  if (d > 90) return `~${Math.round(d / 30)} meses`;
  return `${d} días`;
}
function barColor(pct: number): string {
  if (pct >= 25) return "#DC2626";
  if (pct >= 15) return "#EA580C";
  if (pct >= 5) return "#D97706";
  return "#CA8A04";
}

function DataQualityBadge({ office }: { office: OfficeIntelligenceData }) {
  const rich = Array.isArray(office.common_rejection_reasons) && office.common_rejection_reasons.length >= 5
    && office.common_rejection_reasons.some(r => r.notes);
  const hasLegacy = Array.isArray(office.main_rejection_reasons) && office.main_rejection_reasons.length > 0;
  const hasRich = Array.isArray(office.common_rejection_reasons) && office.common_rejection_reasons.length > 0;

  if (rich) return <Badge className="bg-emerald-600 text-white text-[10px] ml-2">Curated Intelligence</Badge>;
  if (hasRich || hasLegacy) return <Badge variant="outline" className="text-amber-500 border-amber-500 text-[10px] ml-2">Automated Data</Badge>;
  return <Badge variant="outline" className="text-neutral-400 text-[10px] ml-2">No Data</Badge>;
}

// ── Main Component ─────────────────────────────────────
export function OfficeIntelligencePanel({ office, isLoading, error, onRetry }: Props) {
  if (isLoading) return <IntelligenceSkeleton />;

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-10 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">No se pudieron cargar los datos de inteligencia. Inténtalo de nuevo.</p>
          {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>}
        </CardContent>
      </Card>
    );
  }

  const richReasons = Array.isArray(office.common_rejection_reasons) && office.common_rejection_reasons.length > 0
    ? office.common_rejection_reasons : null;
  const legacyReasons = Array.isArray(office.main_rejection_reasons) && office.main_rejection_reasons.length > 0
    ? office.main_rejection_reasons : null;
  const hasAnyRejection = richReasons || legacyReasons;
  const hasBestPractices = Array.isArray(office.best_practices) && office.best_practices.length > 0;
  const hasMistakes = Array.isArray(office.common_mistakes) && office.common_mistakes.length > 0;
  const hasTimeline = office.avg_days_to_first_action != null && office.avg_days_to_publication != null && office.avg_days_to_decision != null;
  const hasSectors = Array.isArray(office.top_filing_sectors) && office.top_filing_sectors.length > 0;
  const hasCountries = Array.isArray(office.top_filing_countries) && office.top_filing_countries.length > 0;
  const hasMarket = hasSectors || hasCountries;
  const hasAnyData = hasAnyRejection || hasBestPractices || hasMistakes || hasTimeline || hasMarket
    || office.annual_filing_volume || office.rejection_rate_pct != null;

  if (!hasAnyData) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center space-y-3">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="text-base font-semibold">Datos de inteligencia no disponibles</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Nuestro equipo está recopilando datos de inteligencia específicos de esta jurisdicción.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Inteligencia de Jurisdicción
          </h2>
          <DataQualityBadge office={office} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <KpiRow office={office} />

      {/* 2. Rejection Reasons */}
      {hasAnyRejection && (
        <RejectionReasonsSection richReasons={richReasons} legacyReasons={legacyReasons} />
      )}

      {/* 3. Best Practices & Common Mistakes */}
      {(hasBestPractices || hasMistakes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PracticesCard
            title="Buenas Prácticas de Registro"
            items={office.best_practices}
            icon={<CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
            emptyText="Sin datos disponibles"
          />
          <PracticesCard
            title="Errores Comunes"
            items={office.common_mistakes}
            icon={<XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
            emptyText="Sin datos disponibles"
          />
        </div>
      )}

      {/* 4. Processing Timeline */}
      {hasTimeline && <ProcessingTimeline office={office} />}

      {/* 5. Market Intelligence */}
      {hasMarket && <MarketIntelligence office={office} />}

      {/* 6. GENIUS Coverage */}
      {office.genius_coverage_score != null && <GeniusCoverage office={office} />}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────

function KpiRow({ office }: { office: OfficeIntelligenceData }) {
  const cards: { label: string; value: string; sub?: string; color?: string; icon: React.ReactNode }[] = [];

  if (office.annual_filing_volume) {
    cards.push({
      label: "Volumen de Solicitudes",
      value: fmt(office.annual_filing_volume),
      sub: office.filing_volume_year ? `${office.filing_volume_year}` : undefined,
      icon: <FileText className="h-4 w-4" />,
    });
  }
  if (office.rejection_rate_pct != null) {
    cards.push({
      label: "Tasa de Rechazo",
      value: `${office.rejection_rate_pct}%`,
      sub: "Media global: ~22%",
      color: office.rejection_rate_pct > 25 ? "text-red-500" : office.rejection_rate_pct > 15 ? "text-orange-500" : "text-amber-500",
      icon: <ShieldAlert className="h-4 w-4" />,
    });
  }
  if (office.approval_rate_pct != null) {
    cards.push({
      label: "Tasa de Aprobación",
      value: `${office.approval_rate_pct}%`,
      color: "text-emerald-500",
      icon: <CheckCircle className="h-4 w-4" />,
    });
  }
  if (office.avg_days_to_decision != null) {
    cards.push({
      label: "Tiempo a Resolución",
      value: daysToLabel(office.avg_days_to_decision),
      sub: "Media global: ~12 meses",
      icon: <Clock className="h-4 w-4" />,
    });
  }
  if (office.opposition_success_rate != null) {
    cards.push({
      label: "Éxito en Oposición",
      value: `${office.opposition_success_rate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {c.icon}
              <span className="text-xs font-medium">{c.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", c.color)}>{c.value}</p>
            {c.sub && <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RejectionReasonsSection({
  richReasons,
  legacyReasons,
}: {
  richReasons: RichRejection[] | null;
  legacyReasons: LegacyRejection[] | null;
}) {
  const isRich = !!richReasons;
  const reasons: { reason: string; pct: number; notes?: string }[] = isRich
    ? richReasons!.map(r => ({ reason: r.reason, pct: r.percentage, notes: r.notes }))
    : (legacyReasons || []).map(r => ({ reason: r.reason, pct: r.pct }));

  const sorted = [...reasons].sort((a, b) => b.pct - a.pct);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Principales Motivos de Rechazo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {sorted.map((r, i) => (
          <RejectionRow key={i} rank={i + 1} reason={r.reason} pct={r.pct} notes={r.notes} />
        ))}
      </CardContent>
    </Card>
  );
}

function RejectionRow({ rank, reason, pct, notes }: { rank: number; reason: string; pct: number; notes?: string }) {
  const [open, setOpen] = useState(false);
  const color = barColor(pct);

  // Extract legal article from reason if present (text in parentheses or after §)
  const articleMatch = reason.match(/(§[^)]+|Art\.\s*\d+[^,)]*|\d+\([a-z]\))/i);
  const article = articleMatch ? articleMatch[0] : null;

  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-muted-foreground w-6 text-right shrink-0">#{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-medium leading-snug">{reason}</span>
            {article && (
              <Badge variant="outline" className="text-[10px] shrink-0">{article}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-semibold w-10 text-right" style={{ color }}>{pct}%</span>
          </div>
        </div>
        {notes && (
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-muted transition-colors shrink-0"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {open && notes && (
        <div className="ml-9 mt-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground leading-relaxed">
          {notes}
        </div>
      )}
    </div>
  );
}

function PracticesCard({
  title,
  items,
  icon,
  emptyText,
}: {
  title: string;
  items?: string[] | null;
  icon: React.ReactNode;
  emptyText: string;
}) {
  const hasItems = Array.isArray(items) && items.length > 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasItems ? (
          items!.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {icon}
              <span className="text-sm">{item}</span>
            </div>
          ))
        ) : (
          <p className="text-sm italic text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProcessingTimeline({ office }: { office: OfficeIntelligenceData }) {
  const d1 = office.avg_days_to_first_action!;
  const d2 = office.avg_days_to_publication!;
  const d3 = office.avg_days_to_decision!;
  const seg1 = d1;
  const seg2 = Math.max(d2 - d1, 0);
  const seg3 = Math.max(d3 - d2, 0);

  const stages = [
    { label: "Solicitud", days: null },
    { label: "Primera Acción", days: seg1 },
    { label: "Publicación", days: seg2 },
    { label: "Resolución", days: seg3 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Línea de Tiempo del Proceso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop */}
        <div className="hidden sm:flex items-center justify-between">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
                  i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-primary/40 text-foreground"
                )}>
                  {i + 1}
                </div>
                <span className="text-[11px] mt-1.5 font-medium text-center whitespace-nowrap">{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="flex-1 flex flex-col items-center mx-2">
                  <span className="text-[11px] text-muted-foreground font-medium mb-1">
                    {daysToLabel(stages[i + 1].days)}
                  </span>
                  <div className="w-full h-0.5 bg-primary/20 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-primary/40 border-y-[3px] border-y-transparent" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Mobile */}
        <div className="sm:hidden space-y-3">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-primary/40 text-foreground"
              )}>
                {i + 1}
              </div>
              <div>
                <span className="text-sm font-medium">{s.label}</span>
                {s.days != null && (
                  <span className="text-xs text-muted-foreground ml-2">({daysToLabel(s.days)})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketIntelligence({ office }: { office: OfficeIntelligenceData }) {
  const sectors = Array.isArray(office.top_filing_sectors) ? office.top_filing_sectors : [];
  const countries = Array.isArray(office.top_filing_countries) ? office.top_filing_countries : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Inteligencia de Mercado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sectors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Sectores Principales</h4>
              <div className="space-y-2">
                {sectors.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-32 truncate">{s.sector}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${s.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {countries.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Países Solicitantes</h4>
              <div className="space-y-2">
                {countries.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-32 truncate">{c.country}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GeniusCoverage({ office }: { office: OfficeIntelligenceData }) {
  const score = office.genius_coverage_score ?? 0;
  const level = score >= 90 ? { label: "Full Coverage", cls: "bg-emerald-600 text-white" }
    : score >= 75 ? { label: "High Coverage", cls: "bg-blue-600 text-white" }
    : score >= 50 ? { label: "Partial Coverage", cls: "bg-amber-500 text-white" }
    : { label: "Low Coverage", cls: "bg-red-500 text-white" };

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <Brain className="h-5 w-5 text-primary" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">GENIUS AI Coverage</span>
          <Badge className={cn("text-xs", level.cls)}>{level.label}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          {office.genius_kb_chunks != null && (
            <span>{office.genius_kb_chunks} chunks</span>
          )}
          {office.genius_last_kb_update && (
            <span>Actualizado {formatDistanceToNow(new Date(office.genius_last_kb_update), { addSuffix: true, locale: es })}</span>
          )}
          <Progress value={score} className="w-20 h-1.5" />
          <span className="font-semibold">{score}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ───────────────────────────────────────────
function IntelligenceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Card>
        <CardContent className="py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-20 rounded-lg" />
    </div>
  );
}
