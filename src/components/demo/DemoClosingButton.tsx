// ============================================================
// IP-NEXUS - DEMO CLOSING BUTTON
// Botón flotante para abrir el panel de cierre de demo
// ============================================================

import { useState } from "react";
import { BarChart3, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoClosingPanel } from "./DemoClosingPanel";
import { useIsDemoMode } from "@/hooks/backoffice/useDemoMode";
import { useOrganization } from "@/contexts/organization-context";

interface DemoClosingButtonProps {
  className?: string;
}

export function DemoClosingButton({ className }: DemoClosingButtonProps) {
  const { currentOrganization } = useOrganization();
  const { isDemoMode, showComparisons, config } = useIsDemoMode(currentOrganization?.id);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // No mostrar si no está en modo demo o comparaciones desactivadas
  if (!isDemoMode || !showComparisons) return null;

  return (
    <>
      {/* Botón flotante */}
      <Button
        onClick={() => setIsPanelOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-[9997]",
          "h-12 gap-2 px-4",
          "bg-gradient-to-r from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70",
          "text-primary-foreground font-medium",
          "shadow-lg shadow-primary/25",
          "border border-primary/20",
          "animate-fade-in",
          className
        )}
      >
        <Trophy className="h-5 w-5" />
        <span>Ver Resumen de Valor</span>
        <BarChart3 className="h-4 w-4 opacity-70" />
      </Button>

      {/* Panel de cierre */}
      <DemoClosingPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        prospectCompany={config?.prospect_company ?? undefined}
      />
    </>
  );
}
