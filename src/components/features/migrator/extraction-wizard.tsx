import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Users,
  Calendar,
  FolderOpen,
  RefreshCw,
  Globe,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  Settings2,
  ArrowRightLeft,
  PlugZap,
  Database,
  Brain,
  Import,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import type { MigrationConnection } from '@/types/migration-advanced';

// =====================================================
// TYPES
// =====================================================

interface ExtractionEntity {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedItems?: number;
}

type WizardStep =
  | 'entities'
  | 'configure'
  | 'connecting'
  | 'extracting'
  | 'complete'
  | 'mapping'
  | 'importing';

interface BatchEntry {
  letter: string;
  count: number;
  status: 'completed' | 'in-progress';
}

interface ExtractionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: MigrationConnection | null;
}

// =====================================================
// CONSTANTS
// =====================================================

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ESTIMATED_TOTAL = 14_496;
const POLL_INTERVAL_MS = 3_000;

const EXTRACTION_ENTITIES: ExtractionEntity[] = [
  {
    id: 'matters',
    name: 'Expedientes / Marcas',
    description: 'Registros de marcas, patentes, diseños y sus estados',
    icon: FileText,
    priority: 'P0',
  },
  {
    id: 'deadlines',
    name: 'Plazos / Vencimientos',
    description: 'Fechas límite, renovaciones y recordatorios',
    icon: Calendar,
    priority: 'P0',
  },
  {
    id: 'contacts',
    name: 'Titulares / Clientes',
    description: 'Personas y empresas titulares de derechos',
    icon: Users,
    priority: 'P1',
  },
  {
    id: 'classes',
    name: 'Clases NIZA',
    description: 'Clasificación de productos y servicios',
    icon: FolderOpen,
    priority: 'P1',
  },
  {
    id: 'documents',
    name: 'Documentos Adjuntos',
    description: 'Archivos asociados a expedientes (si descargables)',
    icon: FolderOpen,
    priority: 'P2',
  },
  {
    id: 'history',
    name: 'Historial de Acciones',
    description: 'Línea de tiempo y notas de cada expediente',
    icon: Clock,
    priority: 'P3',
  },
];

const SPEED_OPTIONS = [
  { value: 'conservative', label: 'Conservador', desc: '10 req/min — Ideal para servidores legacy', delay: 6000 },
  { value: 'moderate', label: 'Moderado', desc: '20 req/min — Balance velocidad/seguridad', delay: 3000 },
  { value: 'fast', label: 'Rápido', desc: '40 req/min — Solo si el servidor lo permite', delay: 1500 },
];

const WIZARD_STEPS: { key: WizardStep; label: string; icon: typeof Globe }[] = [
  { key: 'entities', label: 'Entidades', icon: Database },
  { key: 'configure', label: 'Configurar', icon: Settings2 },
  { key: 'connecting', label: 'Conectando', icon: PlugZap },
  { key: 'extracting', label: 'Extrayendo', icon: RefreshCw },
  { key: 'complete', label: 'Mapeo IA', icon: Brain },
  { key: 'mapping', label: 'Importar', icon: Import },
];

// Step ordering for comparisons
const STEP_ORDER: Record<WizardStep, number> = {
  entities: 0,
  configure: 1,
  connecting: 2,
  extracting: 3,
  complete: 4,
  mapping: 5,
  importing: 6,
};

// =====================================================
// HELPERS
// =====================================================

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseLetterFromPage(currentPage: string | null): string | null {
  if (!currentPage) return null;
  const match = currentPage.match(/letra\s+(\w)/i);
  return match ? match[1].toUpperCase() : null;
}

function getLetterIndex(letter: string): number {
  return ALPHABET.indexOf(letter.toUpperCase());
}

// =====================================================
// COMPONENT
// =====================================================

export function ExtractionWizard({ open, onOpenChange, connection }: ExtractionWizardProps) {
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  // Wizard navigation
  const [step, setStep] = useState<WizardStep>('entities');
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['matters', 'deadlines']);
  const [speed, setSpeed] = useState('conservative');
  const [includeScreenshots, setIncludeScreenshots] = useState(true);

  // Extraction progress state
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [itemsScraped, setItemsScraped] = useState(0);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [pagesProcessed, setPagesProcessed] = useState(0);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchEntry[]>([]);

  // Timer
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Mapping review state
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [aiMapping, setAiMapping] = useState<Record<string, string | null> | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [confirmedMapping, setConfirmedMapping] = useState<Record<string, string>>({});
  const [mappingLoading, setMappingLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, failed: 0, total: 0 });
  const [importResult, setImportResult] = useState<any>(null);

  // Refs for cleanup
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevItemsRef = useRef(0);

  const systemName = connection?.name || 'Sistema';
  const portalUrl =
    connection?.connection_config?._temp_credentials?.url ||
    connection?.connection_config?.base_url ||
    '';

  // ── Resume: check for existing sessions when dialog opens ──
  const [resumeChecked, setResumeChecked] = useState(false);
  const [existingSession, setExistingSession] = useState<{
    id: string;
    status: string;
    items_scraped: number;
    current_page: string | null;
    created_at: string;
    import_job_id: string | null;
    has_matters: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open || !connection?.id) return;

    // Only check once per dialog open
    if (resumeChecked) return;

    async function checkExistingSession() {
      try {
        const { data: sessions } = await supabase
          .from('scraping_sessions')
          .select('id, status, items_scraped, current_page, created_at, import_job_id, extracted_data')
          .eq('source_id', connection!.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessions?.[0] && sessions[0].items_scraped > 0) {
          const s = sessions[0];
          const extractedData = s.extracted_data as any;
          const hasMatterData = extractedData?.matters && Array.isArray(extractedData.matters) && extractedData.matters.length > 0;

          setExistingSession({
            id: s.id,
            status: s.status,
            items_scraped: s.items_scraped,
            current_page: s.current_page,
            created_at: s.created_at,
            import_job_id: s.import_job_id,
            has_matters: hasMatterData,
          });
        }
      } catch {
        // Silently ignore
      } finally {
        setResumeChecked(true);
      }
    }

    checkExistingSession();
  }, [open, connection?.id, resumeChecked]);

  // Reset resumeChecked when dialog closes
  useEffect(() => {
    if (!open) {
      setResumeChecked(false);
      setExistingSession(null);
    }
  }, [open]);

  // ── Resume from existing session ──
  function handleResume() {
    if (!existingSession) return;

    setSessionId(existingSession.id);
    setItemsScraped(existingSession.items_scraped);
    setTotalItems(ESTIMATED_TOTAL);

    // Parse letter from current_page
    const letter = parseLetterFromPage(existingSession.current_page);
    if (letter) setCurrentLetter(letter);

    if (existingSession.status === 'completed' && existingSession.items_scraped > 0) {
      // Session completed with data → go directly to mapping step
      setExtractionStatus('completed');
      setStep('complete');
    } else if (existingSession.status === 'scraping' || existingSession.status === 'authenticating' || existingSession.status === 'authenticated') {
      // Session still running → resume polling
      setExtractionStatus('running');
      setStep('extracting');
      setStartTime(Date.now());
      startPolling(connection!.id);
    } else if (existingSession.status === 'error' && existingSession.items_scraped > 0) {
      // Session errored but has data → go to mapping
      setExtractionStatus('completed');
      setStep('complete');
    }

    setExistingSession(null); // Hide resume banner
  }

  // ── Elapsed timer ──
  useEffect(() => {
    if (startTime && (step === 'connecting' || step === 'extracting') && extractionStatus === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, step, extractionStatus]);

  // ── Batch tracking ──
  // When currentLetter or itemsScraped change, update batch entries
  useEffect(() => {
    if (!currentLetter) return;

    setBatches((prev) => {
      const existing = prev.find((b) => b.letter === currentLetter);
      if (existing) {
        // Update in-progress batch with latest count delta
        return prev.map((b) =>
          b.letter === currentLetter ? { ...b, count: itemsScraped - prev.filter((x) => x.letter !== currentLetter && x.status === 'completed').reduce((sum, x) => sum + x.count, 0), status: 'in-progress' as const } : b
        );
      }

      // Mark previous in-progress as completed, add new one
      const updated = prev.map((b) =>
        b.status === 'in-progress'
          ? { ...b, count: prevItemsRef.current - prev.filter((x) => x.status === 'completed' && x.letter !== b.letter).reduce((sum, x) => sum + x.count, 0), status: 'completed' as const }
          : b
      );
      updated.push({ letter: currentLetter, count: 0, status: 'in-progress' });
      return updated;
    });

    prevItemsRef.current = itemsScraped;
  }, [currentLetter, itemsScraped]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Computed values ──
  const effectiveTotal = totalItems || ESTIMATED_TOTAL;
  const progressPercent = Math.min(Math.round((itemsScraped / effectiveTotal) * 100), 99);
  const letterIndex = currentLetter ? getLetterIndex(currentLetter) : -1;
  const letterProgress = letterIndex >= 0 ? letterIndex + 1 : 0;

  // Time estimation
  const estimatedRemainingSeconds = (() => {
    if (elapsedSeconds < 10 || itemsScraped < 10) return null; // Not enough data
    const rate = itemsScraped / elapsedSeconds; // items per second
    const remaining = effectiveTotal - itemsScraped;
    if (rate <= 0) return null;
    return Math.round(remaining / rate);
  })();

  // ── Entity toggling ──
  function toggleEntity(id: string) {
    setSelectedEntities((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  // ── Polling function ──
  const startPolling = useCallback((sourceId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const { data: sessions } = await supabase
          .from('scraping_sessions')
          .select('id, status, current_page, items_scraped, items_total, pages_processed, error_log')
          .eq('source_id', sourceId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!sessions?.[0]) return;

        const s = sessions[0];
        setSessionId(s.id);
        setItemsScraped(s.items_scraped || 0);
        setTotalItems(s.items_total);
        setCurrentPage(s.current_page);
        setPagesProcessed(s.pages_processed || 0);
        setErrorLog(s.error_log);

        // Parse letter from current_page
        const letter = parseLetterFromPage(s.current_page);
        if (letter) setCurrentLetter(letter);

        // Auto-transition based on status
        if (s.status === 'scraping') {
          setStep((prev) => (prev === 'connecting' ? 'extracting' : prev));
        }
        if (s.status === 'completed') {
          setExtractionStatus('completed');
          setStep('complete');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);

          // Finalize batches: mark last in-progress as completed
          setBatches((prev) =>
            prev.map((b) => (b.status === 'in-progress' ? { ...b, status: 'completed' as const } : b))
          );
        }
        if (s.status === 'error') {
          setExtractionStatus('error');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        // Silently ignore poll errors
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // ── Start extraction ──
  async function startExtraction() {
    const sourceId = connection?.id;
    if (!sourceId) {
      toast.error('No hay conexión configurada');
      return;
    }

    // Reset state
    setStep('connecting');
    setExtractionStatus('running');
    setItemsScraped(0);
    setTotalItems(null);
    setPagesProcessed(0);
    setCurrentPage(null);
    setCurrentLetter(null);
    setSessionId(null);
    setErrorLog(null);
    setBatches([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    prevItemsRef.current = 0;

    const orgId = currentOrganization?.id || connection?.organization_id;

    // Fire the edge function (don't fully await -- we poll for progress)
    const edgeFnPromise = supabase.functions.invoke('web-scraper-engine', {
      body: {
        action: 'scrape',
        source_id: sourceId,
        entity_types: selectedEntities,
        options: {
          speed,
          include_screenshots: includeScreenshots,
        },
      },
      headers: {
        'x-organization-id': orgId!,
      },
    });

    // Start polling immediately
    startPolling(sourceId);

    // Also await the promise to handle fatal errors
    try {
      const { data, error } = await edgeFnPromise;

      if (error) {
        let detail = error.message;
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) detail = body.error;
        } catch {
          // ignore parse errors
        }
        console.error('[ExtractionWizard] Edge function error:', { error, detail });

        // Only set error if we haven't already transitioned to completed via polling
        setExtractionStatus((prev) => {
          if (prev === 'completed') return prev;
          toast.error(`Error de conexión: ${detail}`);
          return 'error';
        });
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      // Synchronous response with immediate data (unlikely for long scrapes, but handle it)
      if (data?.success !== false && (data?.extracted_data || data?.stats)) {
        const total = data?.stats?.total_items || data?.items_scraped || 0;
        setItemsScraped(total);
        setTotalItems(total);
        setPagesProcessed(data?.stats?.pages_processed || 1);
        if (data?.session_id) setSessionId(data.session_id);
        setExtractionStatus('completed');
        setStep('complete');
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }

      if (data?.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // If the edge function returned error in body
      if (data?.success === false) {
        setExtractionStatus((prev) => {
          if (prev === 'completed') return prev;
          toast.error(data.message || 'Error desconocido');
          return 'error';
        });
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (err: any) {
      setExtractionStatus((prev) => {
        if (prev === 'completed') return prev;
        toast.error(`Error inesperado: ${err.message}`);
        return 'error';
      });
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  // ── Close handler ──
  function handleClose() {
    if (extractionStatus === 'running' && (step === 'connecting' || step === 'extracting')) {
      if (!confirm('¿Seguro que quieres cerrar? La extracción continuará en segundo plano — podrás retomar desde el botón "Continuar".')) return;
    }
    // Cleanup intervals
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    // Reset wizard UI state (NOT session data in DB)
    setStep('entities');
    setExtractionStatus('idle');
    setItemsScraped(0);
    setTotalItems(null);
    setPagesProcessed(0);
    setCurrentPage(null);
    setCurrentLetter(null);
    setSessionId(null);
    setErrorLog(null);
    setBatches([]);
    setStartTime(null);
    setElapsedSeconds(0);
    setImportJobId(null);
    setAiMapping(null);
    setAiConfidence(0);
    setUnmappedColumns([]);
    setDetectedColumns([]);
    setConfirmedMapping({});
    setImportResult(null);
    // Reset resume check so next open re-checks for sessions
    setResumeChecked(false);
    setExistingSession(null);
    onOpenChange(false);
  }

  // ── AI Mapping handler ──
  async function handleStartMapping() {
    if (!sessionId) {
      toast.error('No hay sesión de extracción');
      return;
    }
    setMappingLoading(true);
    try {
      toast.info('Analizando datos con IA para mapeo de campos...');
      const orgId = currentOrganization?.id || connection?.organization_id;
      const { data: result, error: err } = await supabase.functions.invoke('process-import', {
        body: {
          action: 'create-from-scraping',
          session_id: sessionId,
          connection_id: connection?.id,
          organization_id: orgId,
        },
      });
      if (err) {
        console.error('Mapping error:', err);
        toast.error(`Error al analizar datos: ${err.message || JSON.stringify(err)}`);
        setMappingLoading(false);
        return;
      }
      // Store AI mapping results
      const entityJob = result?.entity_jobs?.[0];
      setImportJobId(result?.job_id || entityJob?.job_id);
      if (entityJob?.mapping) {
        setAiMapping(entityJob.mapping.mapping || {});
        setAiConfidence(entityJob.mapping.confidence || 0);
        setUnmappedColumns(entityJob.mapping.unmapped || []);
        // Initialize confirmed mapping from AI suggestion
        const initial: Record<string, string> = {};
        for (const [col, field] of Object.entries(entityJob.mapping.mapping || {})) {
          if (field && field !== 'null') initial[col] = field as string;
        }
        setConfirmedMapping(initial);
        setDetectedColumns(Object.keys(entityJob.mapping.mapping || {}));
      }
      toast.success('Análisis de IA completado. Revisa el mapeo de campos.');
      setStep('mapping');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setMappingLoading(false);
    }
  }

  // ── Import handler ──
  async function handleImport() {
    if (!importJobId) {
      toast.error('No hay job de importación');
      return;
    }
    setStep('importing');
    setImportProgress({ processed: 0, failed: 0, total: itemsScraped });
    try {
      const orgId = currentOrganization?.id || connection?.organization_id;
      const { data: result, error: err } = await supabase.functions.invoke('process-import', {
        body: {
          action: 'import',
          job_id: importJobId,
          confirmed_mapping: confirmedMapping,
          entity_type: 'matters',
          organization_id: orgId,
        },
      });
      if (err) {
        toast.error(`Error al importar: ${err.message}`);
        setStep('mapping');
        return;
      }
      setImportResult(result);
      setImportProgress({
        processed: result?.processed || 0,
        failed: result?.failed || 0,
        total: result?.total || itemsScraped,
      });
      toast.success(`Importación completada: ${result?.processed || 0} registros importados`);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      setStep('mapping');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Extracción de Datos — {systemName}
          </DialogTitle>
          <DialogDescription>
            {portalUrl && <span className="text-xs font-mono">{portalUrl}</span>}
          </DialogDescription>
        </DialogHeader>

        {/* ━━━ SIX-STEP WIZARD INDICATOR ━━━ */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {WIZARD_STEPS.map((ws, i) => {
              const isCurrent = step === ws.key || (step === 'importing' && ws.key === 'mapping');
              const isPast = STEP_ORDER[step] > STEP_ORDER[ws.key] || (step === 'importing' && STEP_ORDER[ws.key] < STEP_ORDER['mapping']);
              const Icon = ws.icon;

              return (
                <div key={ws.key} className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                          isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1 ring-offset-background',
                          isPast && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
                          !isCurrent && !isPast && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isCurrent && (step === 'connecting' || step === 'extracting') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {ws.label}
                    </TooltipContent>
                  </Tooltip>
                  <span
                    className={cn(
                      'text-xs hidden sm:inline font-medium transition-colors',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {ws.label}
                  </span>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-6 h-px mx-0.5',
                        isPast ? 'bg-green-400 dark:bg-green-600' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        <Separator />

        {/* ━━━ STEP 1: SELECT ENTITIES ━━━ */}
        {step === 'entities' && (
          <div className="space-y-4 py-4">
            {/* ── Resume banner: show when there's an existing session with data ── */}
            {existingSession && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Extracción anterior encontrada
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        {existingSession.items_scraped.toLocaleString()} registros extraídos
                        {existingSession.status === 'completed' && ' — Listo para mapeo IA'}
                        {existingSession.status === 'scraping' && ' — Extracción en curso'}
                        {existingSession.status === 'error' && ' — Extracción parcial (con errores)'}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                        Sesión: {new Date(existingSession.created_at).toLocaleString('es')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={handleResume}
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h3 className="font-medium mb-1">¿Qué datos quieres extraer?</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona las entidades a importar desde el portal. Los expedientes y plazos son prioritarios.
              </p>
            </div>

            <div className="grid gap-3">
              {EXTRACTION_ENTITIES.map((entity) => {
                const isSelected = selectedEntities.includes(entity.id);
                const Icon = entity.icon;
                return (
                  <Card
                    key={entity.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                    onClick={() => toggleEntity(entity.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Checkbox checked={isSelected} />
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-primary/10' : 'bg-muted'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entity.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {entity.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{entity.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('configure')} disabled={selectedEntities.length === 0}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ━━━ STEP 2: CONFIGURE ━━━ */}
        {step === 'configure' && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-medium mb-1">Configuración de extracción</h3>
              <p className="text-sm text-muted-foreground">
                Ajusta la velocidad y opciones antes de iniciar.
              </p>
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-3">Resumen</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntities.map((id) => {
                    const entity = EXTRACTION_ENTITIES.find((e) => e.id === id);
                    if (!entity) return null;
                    const Icon = entity.icon;
                    return (
                      <Badge key={id} variant="secondary" className="gap-1.5 py-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {entity.name}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Speed */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Velocidad de extracción
              </Label>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Opciones
              </Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="screenshots"
                  checked={includeScreenshots}
                  onCheckedChange={(checked) => setIncludeScreenshots(checked as boolean)}
                />
                <div>
                  <Label htmlFor="screenshots" className="cursor-pointer">
                    Capturar screenshots
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Guarda capturas de pantalla para auditoría y debugging
                  </p>
                </div>
              </div>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Seguridad</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Las credenciales se usan exclusivamente para extraer tus datos. Nunca se almacenan en texto plano ni se
                  comparten con terceros.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('entities')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={startExtraction}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Extracción
              </Button>
            </div>
          </div>
        )}

        {/* ━━━ STEP 3: CONNECTING ━━━ */}
        {step === 'connecting' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                {/* Pulsing outer ring */}
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-primary/5 border-2 border-primary/20 flex items-center justify-center">
                  <PlugZap className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">Conectando al portal...</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Autenticándose en <strong>{systemName}</strong> e inicializando la sesión de extracción.
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(elapsedSeconds)} transcurrido</span>
            </div>

            {/* Status details */}
            {currentPage && (
              <div className="text-center text-sm text-muted-foreground">
                {currentPage}
              </div>
            )}

            {extractionStatus === 'error' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Error de conexión</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {errorLog || 'No se pudo conectar con el portal. Verifica las credenciales.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleClose}>
                    Cerrar
                  </Button>
                  <Button onClick={startExtraction}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━ STEP 4: EXTRACTING WITH REAL PROGRESS ━━━ */}
        {step === 'extracting' && (
          <div className="space-y-5 py-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Extrayendo datos de {systemName}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1',
                  extractionStatus === 'running' && 'text-blue-500 border-blue-200',
                  extractionStatus === 'error' && 'text-red-500 border-red-200',
                  extractionStatus === 'completed' && 'text-green-500 border-green-200'
                )}
              >
                {extractionStatus === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                {extractionStatus === 'error' && <XCircle className="h-3 w-3" />}
                {extractionStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                {extractionStatus === 'running'
                  ? 'Extrayendo...'
                  : extractionStatus === 'error'
                    ? 'Error'
                    : 'Completado'}
              </Badge>
            </div>

            {/* Current batch indicator */}
            {currentLetter && extractionStatus === 'running' && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{currentLetter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Buscando letra {currentLetter}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Letra {letterProgress} de 26
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {Math.round((letterProgress / 26) * 100)}%
                  </p>
                </div>
              </div>
            )}

            {/* Overall progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso general</span>
                <span className="font-medium tabular-nums">
                  {extractionStatus === 'completed' ? '100' : progressPercent}%
                </span>
              </div>
              <Progress
                value={extractionStatus === 'completed' ? 100 : progressPercent}
                className="h-2.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {itemsScraped.toLocaleString()} registros
                  {totalItems ? ` / ${totalItems.toLocaleString()}` : ` (est. ~${effectiveTotal.toLocaleString()})`}
                </span>
                <span>{pagesProcessed} páginas procesadas</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{itemsScraped.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Registros</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{formatDuration(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Transcurrido</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold tabular-nums">
                  {estimatedRemainingSeconds !== null
                    ? `~${formatDuration(estimatedRemainingSeconds)}`
                    : '--:--'}
                </p>
                <p className="text-xs text-muted-foreground">Restante</p>
              </div>
            </div>

            {/* Alphabet letter grid */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Progreso por letra
              </h4>
              <div className="flex flex-wrap gap-1">
                {ALPHABET.map((letter) => {
                  const batch = batches.find((b) => b.letter === letter);
                  const isActive = currentLetter === letter && extractionStatus === 'running';
                  const isDone = batch?.status === 'completed';
                  const isPending = !batch;

                  return (
                    <TooltipProvider key={letter} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all',
                              isDone && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
                              isActive && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse',
                              isPending && 'bg-muted text-muted-foreground/50'
                            )}
                          >
                            {letter}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {isDone
                            ? `${letter} — ${batch.count} registros`
                            : isActive
                              ? `${letter} — en curso...`
                              : `${letter} — pendiente`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            {/* Batch log */}
            {batches.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Últimas tandas
                </h4>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {[...batches].reverse().map((batch) => (
                      <div
                        key={batch.letter}
                        className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50"
                      >
                        {batch.status === 'completed' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
                        )}
                        <span className="font-medium w-4">{batch.letter}</span>
                        <span className="text-muted-foreground">
                          {batch.status === 'completed'
                            ? `— ${batch.count} registros`
                            : '— en curso...'}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Error display */}
            {extractionStatus === 'error' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Error durante la extracción</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {errorLog || 'Ocurrió un error inesperado. Puedes reintentar.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cerrar
                  </Button>
                  <Button onClick={startExtraction} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel button during running */}
            {extractionStatus === 'running' && (
              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-600"
                  onClick={() => {
                    if (!confirm('¿Cancelar la extracción en curso?')) return;
                    if (pollRef.current) clearInterval(pollRef.current);
                    if (timerRef.current) clearInterval(timerRef.current);
                    setExtractionStatus('error');
                  }}
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ━━━ STEP 5: COMPLETE + AI MAPPING TRIGGER ━━━ */}
        {step === 'complete' && (
          <div className="space-y-6 py-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Extracción Completada</h3>
              <p className="text-muted-foreground mt-1">
                Se extrajeron <strong>{itemsScraped.toLocaleString()}</strong> registros de{' '}
                <strong>{selectedEntities.length}</strong> entidades
              </p>
            </div>

            {/* Results summary */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-medium">Resumen de extracción</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Portal</span>
                    <span className="font-medium">{systemName}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Registros</span>
                    <span className="font-medium">{itemsScraped.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Páginas</span>
                    <span className="font-medium">{pagesProcessed}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Tiempo</span>
                    <span className="font-medium">{formatDuration(elapsedSeconds)}</span>
                  </div>
                </div>

                {/* Completed batches summary */}
                {batches.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Letras procesadas: {batches.filter((b) => b.status === 'completed').length}/26
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {batches
                        .filter((b) => b.status === 'completed')
                        .map((b) => (
                          <Badge key={b.letter} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            {b.letter}: {b.count}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next steps */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Próximos pasos</h4>
              <div className="grid gap-2">
                <Button
                  className="w-full justify-start h-auto py-3"
                  disabled={mappingLoading}
                  onClick={handleStartMapping}
                >
                  {mappingLoading ? (
                    <Loader2 className="h-5 w-5 mr-3 shrink-0 animate-spin" />
                  ) : (
                    <Brain className="h-5 w-5 mr-3 shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">
                      {mappingLoading ? 'Analizando con IA...' : 'Mapear e Importar a IP-NEXUS'}
                    </p>
                    <p className="text-xs opacity-80">
                      IA analiza los campos, tú confirmas, se importan los datos
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => {
                    toast.success('Datos guardados. Puedes importarlos después desde Data Hub.');
                    handleClose();
                  }}
                >
                  <Clock className="h-5 w-5 mr-3 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Guardar para Después</p>
                    <p className="text-xs text-muted-foreground">
                      Los datos quedan en la sesión para procesar cuando quieras
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ STEP 6: MAPPING REVIEW (preserved from original) ━━━ */}
        {step === 'mapping' && aiMapping && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Mapeo de Campos — Revisión</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              La IA ha analizado las {detectedColumns.length} columnas extraídas y sugiere el siguiente mapeo. Revisa y
              ajusta antes de importar.
            </p>

            {/* Confidence indicator */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Confianza de IA</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      aiConfidence >= 0.8
                        ? 'text-green-600'
                        : aiConfidence >= 0.5
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    )}
                  >
                    {Math.round(aiConfidence * 100)}%
                  </span>
                </div>
                <Progress value={aiConfidence * 100} className="h-2" />
              </div>
              <Badge variant={aiConfidence >= 0.8 ? 'default' : 'outline'}>
                {Object.keys(confirmedMapping).length} / {detectedColumns.length} mapeados
              </Badge>
            </div>

            {/* Mapping table */}
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                  <span>Campo Origen (Galena)</span>
                  <span></span>
                  <span>Campo IP-NEXUS</span>
                </div>
                <Separator />
                {detectedColumns.map((col) => {
                  const mappedTo = confirmedMapping[col] || null;
                  const isUnmapped = !mappedTo;
                  return (
                    <div
                      key={col}
                      className={cn(
                        'grid grid-cols-[1fr,auto,1fr] gap-2 items-center px-2 py-2 rounded text-sm',
                        isUnmapped
                          ? 'bg-yellow-50 dark:bg-yellow-900/10'
                          : 'bg-green-50 dark:bg-green-900/10'
                      )}
                    >
                      <span className="font-mono text-xs truncate" title={col}>
                        {col}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Select
                        value={mappedTo || '_skip'}
                        onValueChange={(val) => {
                          setConfirmedMapping((prev) => {
                            const next = { ...prev };
                            if (val === '_skip') {
                              delete next[col];
                            } else {
                              next[col] = val;
                            }
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="No mapear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_skip">
                            <span className="text-muted-foreground">— No mapear —</span>
                          </SelectItem>
                          <SelectItem value="mark_name">Nombre de marca</SelectItem>
                          <SelectItem value="reference">Referencia / Expediente</SelectItem>
                          <SelectItem value="status">Estado</SelectItem>
                          <SelectItem value="filing_date">Fecha de presentación</SelectItem>
                          <SelectItem value="registration_date">Fecha de registro</SelectItem>
                          <SelectItem value="expiry_date">Fecha de vencimiento</SelectItem>
                          <SelectItem value="jurisdiction">Jurisdicción / País</SelectItem>
                          <SelectItem value="nice_classes">Clases de Niza</SelectItem>
                          <SelectItem value="applicant_name">Titular / Solicitante</SelectItem>
                          <SelectItem value="agent_reference">Agente / Oficina</SelectItem>
                          <SelectItem value="matter_type">Tipo (marca/patente)</SelectItem>
                          <SelectItem value="description">Descripción</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Unmapped columns warning */}
            {unmappedColumns.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-400">
                    {unmappedColumns.length} columnas sin mapeo claro
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    {unmappedColumns.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('complete')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                className="flex-1"
                disabled={Object.keys(confirmedMapping).length === 0}
                onClick={handleImport}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar e Importar ({Object.keys(confirmedMapping).length} campos mapeados)
              </Button>
            </div>
          </div>
        )}

        {/* ━━━ STEP 7: IMPORTING (preserved from original) ━━━ */}
        {step === 'importing' && (
          <div className="space-y-4 py-8 text-center">
            {!importResult ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                <h3 className="text-lg font-semibold">Importando datos a IP-NEXUS...</h3>
                <p className="text-sm text-muted-foreground">
                  Procesando {importProgress.total.toLocaleString()} registros con el mapeo confirmado. Esto puede tomar
                  unos minutos.
                </p>
                <Progress
                  value={
                    importProgress.total > 0
                      ? ((importProgress.processed + importProgress.failed) / importProgress.total) * 100
                      : 0
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {importProgress.processed} importados, {importProgress.failed} fallidos
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <h3 className="text-lg font-semibold">Importación Completada</h3>
                <div className="grid grid-cols-3 gap-3 text-sm max-w-sm mx-auto">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.processed}</p>
                      <p className="text-xs text-muted-foreground">Importados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates || 0}</p>
                      <p className="text-xs text-muted-foreground">Actualizados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                      <p className="text-xs text-muted-foreground">Fallidos</p>
                    </CardContent>
                  </Card>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="text-left max-w-sm mx-auto">
                    <p className="text-xs font-medium text-red-600 mb-1">Primeros errores:</p>
                    <ScrollArea className="max-h-24">
                      {importResult.errors.slice(0, 5).map((e: any, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground truncate">
                          Fila {e.row}: {e.error}
                        </p>
                      ))}
                    </ScrollArea>
                  </div>
                )}
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    onClick={() => {
                      handleClose();
                      navigate('/app/docket');
                    }}
                  >
                    Ver en DOCKET
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
