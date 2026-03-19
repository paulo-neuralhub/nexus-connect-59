import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Info, Zap, Plug, Bot, Search, XCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LevelDescription {
  key: string; icon: string; lucideIcon: React.ElementType; label: string; scoreRange: string;
  dotColor: string; borderColor: string; bgColor: string; textColor: string;
  bullets: { text: string; positive: boolean }[]; examples: string;
}

const LEVEL_DESCRIPTIONS: LevelDescription[] = [
  { key: "FULL_DIGITAL", icon: "⚡", lucideIcon: Zap, label: "Full Digital", scoreRange: "80-100%",
    dotColor: "bg-emerald-500", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-700 dark:text-emerald-400",
    bullets: [
      { text: "API Machine-to-Machine completa", positive: true },
      { text: "Filing automático desde la plataforma", positive: true },
      { text: "Seguimiento en tiempo real vía API", positive: true },
      { text: "Sin intervención humana necesaria", positive: true },
    ], examples: "WIPO, EPO, EUIPO, IP Australia" },
  { key: "AVANZADA", icon: "🔌", lucideIcon: Plug, label: "Avanzada", scoreRange: "50-79%",
    dotColor: "bg-blue-500", borderColor: "border-l-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-700 dark:text-blue-400",
    bullets: [
      { text: "API parcial disponible", positive: true },
      { text: "Filing semi-automático", positive: true },
      { text: "Datos abiertos disponibles", positive: true },
      { text: "Supervisión mínima recomendada", positive: false },
    ], examples: "JPO, KIPO, CIPO, DPMA, USPTO" },
  { key: "PARCIAL", icon: "🤖", lucideIcon: Bot, label: "Parcial", scoreRange: "20-49%",
    dotColor: "bg-yellow-500", borderColor: "border-l-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", textColor: "text-yellow-700 dark:text-yellow-400",
    bullets: [
      { text: "Portal web funcional sin API", positive: true },
      { text: "Browser Agents para automatización", positive: true },
      { text: "Agente local recomendable", positive: false },
    ], examples: "IMPI México, INPI Brasil, OEPM España" },
  { key: "BASICA", icon: "🔍", lucideIcon: Search, label: "Básica", scoreRange: "1-19%",
    dotColor: "bg-orange-500", borderColor: "border-l-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30", textColor: "text-orange-700 dark:text-orange-400",
    bullets: [
      { text: "Presencia web mínima", positive: true },
      { text: "Filing 100% manual", positive: false },
      { text: "Agente local necesario", positive: false },
    ], examples: "Oficinas de Latinoamérica menor, Sudeste Asiático" },
  { key: "MANUAL", icon: "❌", lucideIcon: XCircle, label: "Manual", scoreRange: "0%",
    dotColor: "bg-red-500", borderColor: "border-l-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-700 dark:text-red-400",
    bullets: [
      { text: "Sin infraestructura digital", positive: false },
      { text: "Solicitudes en papel", positive: false },
      { text: "Agente local obligatorio", positive: false },
    ], examples: "Muchas oficinas africanas, países insulares" },
];

interface Stats { total: number; full_digital: number; mostly_digital: number; partially_digital: number; basic_digital: number; manual: number; }
interface Props { stats: Stats; selectedLevel: string; onSelectLevel: (level: string) => void; }

export function IpOfficeLevelDescriptions({ stats, selectedLevel, onSelectLevel }: Props) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const statMap: Record<string, number> = { FULL_DIGITAL: stats.full_digital, AVANZADA: stats.mostly_digital, PARCIAL: stats.partially_digital, BASICA: stats.basic_digital, MANUAL: stats.manual };
  const handleBadgeClick = (key: string) => { setExpandedLevel(expandedLevel === key ? null : key); onSelectLevel(key === selectedLevel ? "ALL" : key); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cada oficina está clasificada según su nivel de integración digital, que determina qué operaciones puedes automatizar.
      </p>
      <div className="flex flex-wrap gap-2">
        {LEVEL_DESCRIPTIONS.map((level) => {
          const count = statMap[level.key] || 0;
          const isSelected = selectedLevel === level.key;
          const isExpanded = expandedLevel === level.key;
          return (
            <button key={level.key} onClick={() => handleBadgeClick(level.key)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border hover:shadow-sm",
                isSelected ? cn(level.bgColor, level.textColor, "border-current ring-1 ring-current/30") : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
              )}>
              <span className={cn("h-2 w-2 rounded-full shrink-0", level.dotColor)} />
              <span>{level.icon} {level.label}: {count}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
            </button>
          );
        })}
        <button onClick={() => setShowAll(!showAll)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
          <Info className="h-3 w-3" />{showAll ? "Ocultar detalles" : "Ver todos los niveles"}
        </button>
      </div>
      {expandedLevel && !showAll && <LevelDetailCard level={LEVEL_DESCRIPTIONS.find(l => l.key === expandedLevel)!} />}
      {showAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {LEVEL_DESCRIPTIONS.map((level) => <LevelDetailCard key={level.key} level={level} />)}
        </div>
      )}
    </div>
  );
}

function LevelDetailCard({ level }: { level: LevelDescription }) {
  return (
    <div className={cn("rounded-lg border-l-4 p-4 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150", level.borderColor, level.bgColor)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-semibold text-sm", level.textColor)}>{level.icon} {level.label} <span className="font-normal text-muted-foreground">(Score: {level.scoreRange})</span></span>
        <span className={cn("h-3 w-3 rounded-full", level.dotColor)} />
      </div>
      <ul className="space-y-1">
        {level.bullets.map((b, i) => (
          <li key={i} className="text-xs flex items-start gap-1.5"><span className="mt-0.5 shrink-0">{b.positive ? "✅" : "⚠️"}</span><span className="text-foreground/80">{b.text}</span></li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/30"><span className="font-medium">Ejemplos:</span> {level.examples}</p>
    </div>
  );
}
