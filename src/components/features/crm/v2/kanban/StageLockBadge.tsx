/**
 * StageLockBadge — Visual badge for stage lock_type on column headers
 */
import { Lock, AlertTriangle, Shield, Clock, Paperclip, type LucideIcon } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KanbanStage } from "@/lib/kanban-utils";

interface LockConfig {
  icon: LucideIcon;
  label: string;
  className: string;
  iconClassName: string;
}

const LOCK_CONFIG: Record<string, LockConfig | null> = {
  free: null,
  confirm: {
    icon: AlertTriangle,
    label: "Confirmación",
    className: "text-amber-700 bg-amber-50 border-amber-200",
    iconClassName: "text-amber-600",
  },
  matter_driven: {
    icon: Lock,
    label: "Docket",
    className: "text-blue-700 bg-blue-50 border-blue-200",
    iconClassName: "text-blue-600",
  },
  admin_only: {
    icon: Shield,
    label: "Admin",
    className: "text-violet-700 bg-violet-50 border-violet-200",
    iconClassName: "text-violet-600",
  },
  deadline_blocked: {
    icon: Clock,
    label: "Plazos",
    className: "text-red-700 bg-red-50 border-red-200",
    iconClassName: "text-red-600",
  },
  document_required: {
    icon: Paperclip,
    label: "Documento",
    className: "text-slate-700 bg-slate-50 border-slate-200",
    iconClassName: "text-slate-500",
  },
};

interface StageLockBadgeProps {
  stage: KanbanStage;
  className?: string;
}

export function StageLockBadge({ stage, className = "" }: StageLockBadgeProps) {
  const config = LOCK_CONFIG[stage.lock_type];
  if (!config) return null;

  const Icon = config.icon;

  const badge = (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full border select-none transition-opacity hover:opacity-80 ${config.className} ${className}`}
    >
      <Icon className={`w-3 h-3 ${config.iconClassName}`} />
      {config.label}
    </span>
  );

  if (!stage.lock_message) return badge;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-xs leading-relaxed z-50" side="bottom" align="start">
          {stage.lock_message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

StageLockBadge.displayName = "StageLockBadge";
