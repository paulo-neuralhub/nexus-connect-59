// ============================================================
// IP-NEXUS - DEMO BADGE
// Badge visual fijo que indica modo demo activo
// Diseño minimal: transparente por defecto, opaco al hover
// ============================================================

import { Target } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  prospectCompany?: string | null;
  onClose?: () => void;
  className?: string;
}

export function DemoBadge({ prospectCompany, className }: DemoBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed top-3 right-3 z-[100]",
        "flex items-center gap-1.5",
        "px-2.5 py-1.5 rounded-full",
        "text-xs font-medium",
        "transition-all duration-300 ease-out",
        "cursor-default select-none",
        // Transparente por defecto, opaco al hover
        isHovered
          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
          : "bg-amber-500/20 text-amber-600/70 dark:text-amber-400/70 backdrop-blur-sm",
        className
      )}
    >
      <Target className={cn(
        "h-3 w-3 transition-all duration-300",
        isHovered ? "animate-pulse" : "opacity-70"
      )} />
      <span>DEMO</span>
      {prospectCompany && isHovered && (
        <span className="text-amber-100 font-normal max-w-[120px] truncate ml-1">
          — {prospectCompany}
        </span>
      )}
    </div>
  );
}

// Badge más compacto para usar en el header
export function DemoBadgeCompact({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        "px-2 py-0.5 rounded-full",
        "bg-amber-500/15 text-amber-600/80 dark:text-amber-400/80",
        "text-xs font-medium",
        className
      )}
    >
      <Target className="h-2.5 w-2.5" />
      <span>DEMO</span>
    </div>
  );
}
