import { useEnrichProgress } from "@/contexts/EnrichProgressContext";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function EnrichProgressWidget() {
  const { state } = useEnrichProgress();

  if (!state.isRunning && state.elapsed === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-xl shadow-lg p-3 min-w-[280px] max-w-[320px] animate-in slide-in-from-bottom-2">
      {state.isRunning ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Actualizando directorio</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.floor(state.elapsed / 60)}:{String(state.elapsed % 60).padStart(2, "0")}
            </span>
          </div>
          <Progress
            value={state.totalBatches > 0 ? Math.min(95, Math.round((state.batchesSent / state.totalBatches) * 100)) : 0}
            className="h-1.5"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ola {state.currentWave}/{state.totalWaves}</span>
            <span>{state.batchesSent}/{state.totalBatches} lotes</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{state.status}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Actualización completada</span>
        </div>
      )}
    </div>
  );
}
