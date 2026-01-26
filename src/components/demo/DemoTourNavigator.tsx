// ============================================================
// IP-NEXUS - DEMO TOUR NAVIGATOR
// Navegador visual para el tour de demo comercial
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MessageCircle, 
  Target, 
  HelpCircle,
  Check,
  Minimize2,
  Maximize2,
  X,
  Lightbulb,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TOUR_STEPS, 
  CLOSING_STEP, 
  TOUR_PHASES,
  getAllSteps,
  getStepById,
  getPhaseForStep,
  type TourStep,
  type ClosingStep,
} from './tourSteps';
import { cn } from '@/lib/utils';

interface DemoTourNavigatorProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function DemoTourNavigator({ isVisible = true, onClose }: DemoTourNavigatorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedActions, setCompletedActions] = useState<Record<number, Record<number, boolean>>>({});
  const [minimized, setMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const allSteps = getAllSteps();
  const step = getStepById(currentStep);
  const currentPhase = getPhaseForStep(currentStep);
  
  // Timer for elapsed time
  useEffect(() => {
    if (!isPaused && isVisible) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, isVisible]);

  // Auto-detect step based on current route
  useEffect(() => {
    const matchingStep = allSteps.find(s => 
      location.pathname.startsWith(s.route) || 
      s.route.startsWith(location.pathname)
    );
    if (matchingStep && matchingStep.id !== currentStep) {
      // Optional: auto-sync step with route
      // setCurrentStep(matchingStep.id);
    }
  }, [location.pathname]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToStep = (stepId: number) => {
    const targetStep = getStepById(stepId);
    if (targetStep) {
      setCurrentStep(stepId);
      navigate(targetStep.route);
    }
  };

  const toggleAction = (actionIndex: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep],
        [actionIndex]: !prev[currentStep]?.[actionIndex],
      },
    }));
  };

  const getCompletedActionsCount = (stepId: number) => {
    const actions = completedActions[stepId] || {};
    return Object.values(actions).filter(Boolean).length;
  };

  const getTotalActionsForStep = (stepId: number) => {
    const s = getStepById(stepId);
    if (!s) return 0;
    return 'keyActions' in s ? s.keyActions?.length || 0 : 0;
  };

  if (!isVisible) return null;

  // Minimized view
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[200]">
        <Button 
          onClick={() => setMinimized(false)} 
          className="gap-2 bg-primary shadow-lg hover:bg-primary/90"
          size="lg"
        >
          <Play className="h-4 w-4" />
          Tour Demo ({currentStep}/13)
          <Badge variant="secondary" className="ml-1">
            {formatTime(elapsedTime)}
          </Badge>
        </Button>
      </div>
    );
  }

  const isClosingStep = step?.id === 13;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] border-t-2 border-primary/30 bg-background shadow-2xl">
      {/* Header con fases */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">DEMO TOUR</span>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn("gap-1", currentPhase?.textColor)}
          >
            {currentPhase?.name}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        {/* Progress por fases */}
        <div className="hidden items-center gap-4 md:flex">
          {TOUR_PHASES.map((phase) => (
            <div key={phase.id} className="flex flex-col items-center gap-1">
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                phase.id === currentPhase?.id ? phase.textColor : "text-muted-foreground"
              )}>
                {phase.name}
              </span>
              <div className="flex items-center gap-1">
                {phase.steps.map((stepId) => (
                  <button
                    key={stepId}
                    onClick={() => goToStep(stepId)}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all hover:scale-125',
                      stepId === currentStep ? `${phase.color} ring-2 ring-offset-1 ring-offset-background` :
                      stepId < currentStep ? phase.color :
                      'bg-muted-foreground/30'
                    )}
                    title={`Paso ${stepId}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="gap-1"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenido del paso actual */}
      {step && (
        <div className="p-4">
          <div className="mx-auto max-w-7xl">
            {/* Título y tiempo */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                  currentPhase?.color
                )}>
                  <span className="text-lg font-bold">{currentStep}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {step.duration} min
                </Badge>
                {!isClosingStep && (
                  <Badge variant="secondary">
                    {getCompletedActionsCount(currentStep)}/{getTotalActionsForStep(currentStep)} acciones
                  </Badge>
                )}
              </div>
            </div>

            {isClosingStep ? (
              // Vista de cierre
              <ClosingStepContent step={step as ClosingStep} />
            ) : (
              // Vista de paso normal
              <div className="grid gap-4 md:grid-cols-3">
                {/* Columna 1: Hook y Acciones */}
                <div className="space-y-3">
                  {/* Hook de apertura */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">
                          Frase de apertura
                        </p>
                        <p className="mt-1 text-sm italic text-foreground">
                          "{(step as TourStep).openingHook}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist de acciones */}
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Check className="h-3.5 w-3.5" />
                      Acciones a realizar
                    </p>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-2">
                        {(step as TourStep).keyActions?.map((action, idx) => (
                          <label
                            key={idx}
                            className="flex cursor-pointer items-start gap-2 text-sm"
                          >
                            <Checkbox
                              checked={completedActions[currentStep]?.[idx] || false}
                              onCheckedChange={() => toggleAction(idx)}
                              className="mt-0.5"
                            />
                            <span className={cn(
                              completedActions[currentStep]?.[idx] && "text-muted-foreground line-through"
                            )}>
                              {action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Columna 2: Puntos clave */}
                <div className="rounded-lg border p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Puntos a mencionar
                  </p>
                  <ScrollArea className="max-h-40">
                    <ul className="space-y-1.5">
                      {(step as TourStep).talkingPoints?.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>

                {/* Columna 3: Ventaja y Pregunta */}
                <div className="space-y-3">
                  {/* Ventaja competitiva */}
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                          Ventaja vs competencia
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {(step as TourStep).competitiveEdge}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pregunta de cierre */}
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                          Pregunta de cierre
                        </p>
                        <p className="mt-1 text-sm italic text-foreground">
                          "{step.closingQuestion}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <Button
                variant="outline"
                onClick={() => goToStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {/* Selector de paso */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ir a:</span>
                <Select
                  value={String(currentStep)}
                  onValueChange={(v) => goToStep(Number(v))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allSteps.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.id}. {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => goToStep(currentStep + 1)}
                disabled={currentStep === 13}
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para el paso de cierre
function ClosingStepContent({ step }: { step: ClosingStep }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Key Points (métricas) */}
      {step.keyPoints.map((point, idx) => (
        <div key={idx} className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-center">
          <div className="text-2xl font-bold text-primary">{point.metric}</div>
          <div className="mt-1 text-sm text-muted-foreground">{point.description}</div>
          {point.yearly && (
            <Badge variant="secondary" className="mt-2">{point.yearly}</Badge>
          )}
        </div>
      ))}

      {/* Ventajas únicas */}
      <div className="col-span-2 rounded-lg border p-4">
        <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
          <Zap className="h-4 w-4 text-emerald-500" />
          Ventajas únicas
        </h4>
        <ul className="space-y-1.5">
          {step.uniqueAdvantages.map((adv, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              {adv}
            </li>
          ))}
        </ul>
      </div>

      {/* Próximos pasos */}
      <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-medium text-foreground">Próximos pasos</h4>
        <ol className="space-y-1.5">
          {step.nextSteps.map((ns, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {idx + 1}
              </span>
              {ns}
            </li>
          ))}
        </ol>
        
        {/* Pregunta de cierre */}
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            💬 "{step.closingQuestion}"
          </p>
        </div>
      </div>
    </div>
  );
}
