import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  full_digital: number;
  mostly_digital: number;
  partially_digital: number;
  basic_digital: number;
  manual: number;
  withPrice?: number;
  withSuggested?: number;
  withNoData?: number;
  activeInWeb?: number;
}

interface Props {
  stats: Stats;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
}

export function IpOfficeStats({ stats, selectedLevel, onSelectLevel }: Props) {
  const levels = [
    { key: "ALL", label: "Oficinas", count: stats.total, icon: "🌐", colorClass: "text-primary" },
    { key: "FULL_DIGITAL", label: "Full Digital", count: stats.full_digital, icon: "⚡", colorClass: "text-emerald-600" },
    { key: "AVANZADA", label: "Avanzada", count: stats.mostly_digital, icon: "🔌", colorClass: "text-blue-600" },
    { key: "PARCIAL", label: "Parcial", count: stats.partially_digital, icon: "🤖", colorClass: "text-yellow-600" },
    { key: "BASICA", label: "Básica", count: stats.basic_digital, icon: "🔍", colorClass: "text-orange-600" },
    { key: "MANUAL", label: "Manual", count: stats.manual, icon: "❌", colorClass: "text-red-600" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {levels.map((level) => (
          <Card
            key={level.key}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedLevel === level.key ? "ring-2 ring-primary bg-primary/5" : "bg-card/50 backdrop-blur hover:bg-card/80",
              level.key === "ALL" && "border-2"
            )}
            onClick={() => onSelectLevel(level.key)}
          >
            <CardContent className="p-3 text-center">
              <div className={cn("text-2xl font-bold", level.colorClass)}>{level.count}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <span>{level.icon}</span><span>{level.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.withPrice != null && (
          <Card className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.withPrice}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500">💰 Precio real</div>
            </CardContent>
          </Card>
        )}
        {stats.withSuggested != null && (
          <Card className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.withSuggested}</div>
              <div className="text-xs text-amber-600 dark:text-amber-500">🟡 Sugerido</div>
            </CardContent>
          </Card>
        )}
        {stats.withNoData != null && (
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.withNoData}</div>
              <div className="text-xs text-muted-foreground">⚪ Sin datos</div>
            </CardContent>
          </Card>
        )}
        {stats.activeInWeb != null && (
          <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.activeInWeb}</div>
              <div className="text-xs text-blue-600 dark:text-blue-500">🟢 En web</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
