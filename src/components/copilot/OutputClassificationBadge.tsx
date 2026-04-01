// ============================================================
// Trust Architecture — Output Classification Badge
// ============================================================

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ClassificationType = "info" | "analysis" | "advice";

interface Props {
  type: ClassificationType;
  className?: string;
}

const CONFIGS: Record<ClassificationType, {
  icon: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  tooltip: string;
}> = {
  info: {
    icon: "ℹ️",
    label: "INFORMACIÓN",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    tooltip: "Datos factuales verificables",
  },
  analysis: {
    icon: "⚖️",
    label: "ANÁLISIS",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    tooltip: "Análisis IA — requiere revisión profesional",
  },
  advice: {
    icon: "⚠️",
    label: "CONSEJO",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    tooltip: "Territorio de asesoría legal — supervisión obligatoria",
  },
};

/** Auto-classify content based on keywords */
export function classifyContent(content: string): ClassificationType {
  const lower = content.toLowerCase();
  if (
    lower.includes("recomiendo") || lower.includes("sugiero") ||
    lower.includes("aconsejo") || lower.includes("debería considerar") ||
    lower.includes("estrategia") || lower.includes("le sugiero")
  ) {
    return "advice";
  }
  if (
    lower.includes("análisis") || lower.includes("riesgo") ||
    lower.includes("evaluación") || lower.includes("comparación") ||
    lower.includes("similitud") || lower.includes("probabilidad")
  ) {
    return "analysis";
  }
  return "info";
}

export function OutputClassificationBadge({ type, className = "" }: Props) {
  const config = CONFIGS[type];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[11px] font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${config.border} ${className}`}
          style={{ height: 22, letterSpacing: "0.04em" }}
        >
          <span className="text-[10px]">{config.icon}</span>
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
