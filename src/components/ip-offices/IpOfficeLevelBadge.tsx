import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type AutomationLevel = 'FULL_DIGITAL' | 'AVANZADA' | 'PARCIAL' | 'BASICA' | 'MANUAL';

interface LevelConfig {
  label: string;
  labelShort: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  percentRange: string;
}

export const AUTOMATION_LEVELS: Record<string, LevelConfig> = {
  FULL_DIGITAL: { label: "Full Digital", labelShort: "Full", icon: "⚡", colorClass: "text-emerald-700", bgClass: "bg-emerald-100", borderClass: "border-l-emerald-500", percentRange: "≥75%" },
  AVANZADA: { label: "Avanzada", labelShort: "Avz", icon: "🔌", colorClass: "text-blue-700", bgClass: "bg-blue-100", borderClass: "border-l-blue-500", percentRange: "45-74%" },
  PARCIAL: { label: "Parcial", labelShort: "Par", icon: "🤖", colorClass: "text-yellow-700", bgClass: "bg-yellow-100", borderClass: "border-l-yellow-500", percentRange: "20-44%" },
  BASICA: { label: "Básica", labelShort: "Bás", icon: "🔍", colorClass: "text-orange-700", bgClass: "bg-orange-100", borderClass: "border-l-orange-500", percentRange: "<20%" },
  MANUAL: { label: "Manual", labelShort: "Man", icon: "❌", colorClass: "text-red-700", bgClass: "bg-red-100", borderClass: "border-l-red-500", percentRange: "0%" },
};

interface Props {
  level: string | null | undefined;
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
}

export function IpOfficeLevelBadge({ level, variant = 'full', className }: Props) {
  const config = AUTOMATION_LEVELS[level || 'MANUAL'] || AUTOMATION_LEVELS.MANUAL;
  if (variant === 'icon-only') return <span className={className}>{config.icon}</span>;
  if (variant === 'compact') {
    return (
      <Badge className={cn("text-xs font-medium border-0", config.bgClass, config.colorClass, className)}>
        {config.icon} {config.labelShort}
      </Badge>
    );
  }
  return (
    <Badge className={cn("text-xs font-medium gap-1 border-0", config.bgClass, config.colorClass, className)}>
      {config.icon} {config.label}
    </Badge>
  );
}
