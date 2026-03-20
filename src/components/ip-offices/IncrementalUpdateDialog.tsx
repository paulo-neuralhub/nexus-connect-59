import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useEnrichProgress } from "@/contexts/EnrichProgressContext";

interface IncrementalUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REGIONS = [
  { value: "europe", label: "🇪🇺 Europa (~52 oficinas)" },
  { value: "latin_america", label: "🌎 Latinoamérica (~19 oficinas)" },
  { value: "north_america", label: "🇺🇸 Norteamérica (~3 oficinas)" },
  { value: "asia_pacific", label: "🌏 Asia-Pacífico (~33 oficinas)" },
  { value: "middle_east", label: "🕌 Oriente Medio (~15 oficinas)" },
  { value: "africa", label: "🌍 África (~55 oficinas)" },
  { value: "caribbean", label: "🏝️ Caribe (~14 oficinas)" },
  { value: "oceania", label: "🌊 Oceanía (~7 oficinas)" },
  { value: "international", label: "🌐 Internacional (~2 oficinas)" },
];

export function IncrementalUpdateDialog({ open, onOpenChange }: IncrementalUpdateDialogProps) {
  const queryClient = useQueryClient();
  const enrichProgress = useEnrichProgress();
  const [phase, setPhase] = useState<"config" | "running" | "done">("config");
  const [scopeMode, setScopeMode] = useState<"all" | "region" | "specific">("all");
  const [selectedRegion, setSelectedRegion] = useState("europe");
  const [specificCodes, setSpecificCodes] = useState("");
  const [updateFees, setUpdateFees] = useState(true);
  const [updateIntel, setUpdateIntel] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [currentWave, setCurrentWave] = useState(0);
  const [totalWaves, setTotalWaves] = useState(0);
  const [batchesSent, setBatchesSent] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [currentBatchCodes, setCurrentBatchCodes] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runUpdate = async () => {
    setPhase("running");
    setLog([]);
    setBatchesSent(0);
    setTotalBatches(0);
    setElapsed(0);
    setCurrentWave(0);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    if (!supabaseUrl) { toast.error("VITE_SUPABASE_URL no configurada"); setPhase("config"); return; }

    let query = (supabase as any).from("ipo_offices").select("code").eq("is_active", true);
    if (scopeMode === "region") query = query.eq("region", selectedRegion);
    const { data: officesData } = await query.order("code");
    let codes = (officesData || []).map((o: any) => o.code as string);

    if (scopeMode === "specific" && specificCodes.trim()) {
      const requested = specificCodes.toUpperCase().split(",").map((c: string) => c.trim()).filter(Boolean);
      codes = codes.filter((c: string) => requested.includes(c));
    }

    if (codes.length === 0) { toast.error("No se encontraron oficinas con esos criterios"); setPhase("config"); return; }

    const functions: { name: string; label: string }[] = [];
    if (updateFees) functions.push({ name: "research-ip-office", label: "Investigación IP" });
    if (updateIntel) functions.push({ name: "jurisdiction-data-extractor", label: "Extracción de datos" });

    if (functions.length === 0) { toast.error("Selecciona al menos un tipo de datos"); setPhase("config"); return; }

    setTotalWaves(functions.length);

    const batches: string[][] = [];
    for (let i = 0; i < codes.length; i += 3) batches.push(codes.slice(i, i + 3));

    const totalBatchCount = batches.length * functions.length;
    setTotalBatches(totalBatchCount);
    enrichProgress.start(totalBatchCount, functions.length);

    addLog(`🚀 Iniciando: ${codes.length} oficinas · ${batches.length} lotes · ${functions.length} ola(s)`);

    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);

    let globalBatchCount = 0;

    for (let w = 0; w < functions.length; w++) {
      const fn = functions[w];
      setCurrentWave(w + 1);
      addLog(`\n📡 Ola ${w + 1}/${functions.length}: ${fn.label}`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setCurrentBatchCodes(batch);

        fetch(`${supabaseUrl}/functions/v1/${fn.name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          keepalive: true,
          body: JSON.stringify({ codes: batch, dry_run: false }),
        }).catch(() => {});

        globalBatchCount++;
        setBatchesSent(globalBatchCount);
        enrichProgress.updateProgress(globalBatchCount, w + 1, `Ola ${w + 1}: ${batch.join(", ")}`);

        const timestamp = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        addLog(`${timestamp} · Lote ${i + 1}/${batches.length} → ${batch.join(", ")}`);

        if (i < batches.length - 1) await new Promise(r => setTimeout(r, 2000));
      }

      if (w < functions.length - 1) {
        addLog(`⏳ Pausa 30s antes de la siguiente ola...`);
        await new Promise(r => setTimeout(r, 30000));
      }
    }

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    addLog(`\n✅ Todos los lotes enviados. Los datos se actualizarán progresivamente.`);
    setPhase("done");
    enrichProgress.finish();

    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["ip-offices-directory-unified"] });
      window.dispatchEvent(new Event("enrich-completed"));
    }, 10000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setPhase("config"); setLog([]); setBatchesSent(0); setTotalBatches(0);
      setElapsed(0); setCurrentWave(0); setTotalWaves(0);
      setScopeMode("all"); setUpdateFees(true); setUpdateIntel(true); setSpecificCodes("");
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">

        {phase === "config" && (
          <>
            <DialogHeader>
              <DialogTitle>🔄 Actualizar Directorio</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-3">
                <p className="text-sm font-medium">¿Qué jurisdicciones actualizar?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="scope" checked={scopeMode === "all"} onChange={() => setScopeMode("all")} className="accent-primary" />
                    Todas las jurisdicciones
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="scope" checked={scopeMode === "region"} onChange={() => setScopeMode("region")} className="accent-primary" />
                    Solo una región:
                  </label>
                  {scopeMode === "region" && (
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="w-full h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(r => (<SelectItem key={r.value} value={r.value} className="text-sm">{r.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="scope" checked={scopeMode === "specific"} onChange={() => setScopeMode("specific")} className="accent-primary" />
                    Códigos específicos:
                  </label>
                  {scopeMode === "specific" && (
                    <Input value={specificCodes} onChange={e => setSpecificCodes(e.target.value)} placeholder="ES, CO, US, MX..." className="h-9 text-sm font-mono" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">¿Qué datos actualizar?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={updateFees} onChange={e => setUpdateFees(e.target.checked)} className="accent-primary rounded" />
                    💰 Tasas oficiales
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={updateIntel} onChange={e => setUpdateIntel(e.target.checked)} className="accent-primary rounded" />
                    📊 Inteligencia
                  </label>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jurisdicciones:</span>
                  <span className="font-medium">
                    {scopeMode === "all" ? "Todas (~200)" :
                     scopeMode === "region" ? REGIONS.find(r => r.value === selectedRegion)?.label :
                     `${specificCodes.split(",").filter(c => c.trim()).length} códigos`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Olas:</span>
                  <span className="font-medium">
                    {[updateFees && "Tasas", updateIntel && "Inteligencia"].filter(Boolean).join(" + ") || "Ninguna"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiempo estimado:</span>
                  <span className="font-medium">
                    {scopeMode === "specific" ? "1-3 min" : scopeMode === "region" ? "3-5 min" : "8-12 min"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={runUpdate} disabled={!updateFees && !updateIntel}>🚀 Iniciar actualización</Button>
            </DialogFooter>
          </>
        )}

        {phase === "running" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Actualizando directorio...
              </DialogTitle>
              <DialogDescription>Puedes cerrar — el proceso continúa en background</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tiempo</span>
                <span className="font-mono font-medium">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
              </div>
              <Progress value={totalBatches > 0 ? Math.min(95, Math.round((batchesSent / totalBatches) * 100)) : 0} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ola {currentWave}/{totalWaves} · Lote {batchesSent}/{totalBatches}</span>
                <span>{currentBatchCodes.join(", ")}</span>
              </div>
              <ScrollArea className="h-40 bg-muted/30 rounded-lg p-2 font-mono text-xs">
                {log.map((entry, i) => (<div key={i} className="py-0.5 text-muted-foreground">{entry}</div>))}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">💡 Las peticiones usan <code className="bg-muted px-1 rounded">keepalive</code> — siguen procesando aunque cierres este diálogo.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cerrar (sigue en background)</Button>
            </DialogFooter>
          </>
        )}

        {phase === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Actualización lanzada
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <p className="text-lg font-bold text-emerald-700">{batchesSent}</p>
                  <p className="text-xs text-muted-foreground">lotes enviados</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-lg font-bold text-blue-700">{totalWaves}</p>
                  <p className="text-xs text-muted-foreground">olas completadas</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-lg font-bold text-purple-700">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</p>
                  <p className="text-xs text-muted-foreground">tiempo total</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                📊 Los datos se actualizarán progresivamente en el directorio durante los próximos minutos.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cerrar</Button>
              <Button onClick={handleClose}><Globe className="h-4 w-4 mr-2" />Ver directorio</Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
