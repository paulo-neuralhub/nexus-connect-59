import { createContext, useContext, useState, useRef, useCallback } from "react";

interface EnrichProgressState {
  isRunning: boolean;
  elapsed: number;
  batchesSent: number;
  totalBatches: number;
  currentWave: number;
  totalWaves: number;
  status: string;
}

interface EnrichProgressContextType {
  state: EnrichProgressState;
  start: (totalBatches: number, totalWaves: number) => void;
  updateProgress: (batchesSent: number, currentWave: number, status: string) => void;
  finish: () => void;
}

const defaults: EnrichProgressState = {
  isRunning: false,
  elapsed: 0,
  batchesSent: 0,
  totalBatches: 0,
  currentWave: 0,
  totalWaves: 0,
  status: "",
};

const EnrichProgressContext = createContext<EnrichProgressContextType | null>(null);

export function EnrichProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EnrichProgressState>(defaults);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback((totalBatches: number, totalWaves: number) => {
    if (resetTimerRef.current) { clearTimeout(resetTimerRef.current); resetTimerRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const startTime = Date.now();
    setState({
      isRunning: true, elapsed: 0, batchesSent: 0, totalBatches,
      currentWave: 0, totalWaves, status: "Iniciando...",
    });

    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, elapsed: Math.floor((Date.now() - startTime) / 1000) }));
    }, 1000);
  }, []);

  const updateProgress = useCallback((batchesSent: number, currentWave: number, status: string) => {
    setState(prev => ({ ...prev, batchesSent, currentWave, status }));
  }, []);

  const finish = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setState(prev => ({ ...prev, isRunning: false, status: "Completado" }));

    resetTimerRef.current = setTimeout(() => {
      setState(defaults);
      resetTimerRef.current = null;
    }, 30000);
  }, []);

  return (
    <EnrichProgressContext.Provider value={{ state, start, updateProgress, finish }}>
      {children}
    </EnrichProgressContext.Provider>
  );
}

export const useEnrichProgress = () => {
  const ctx = useContext(EnrichProgressContext);
  if (!ctx) throw new Error("useEnrichProgress must be used within EnrichProgressProvider");
  return ctx;
};
