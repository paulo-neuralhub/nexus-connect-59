// ============================================================
// CoPilotMemoryPanel — "¿Qué sé de ti?" GDPR transparency
// ============================================================

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Shield, Trash2, ChevronLeft, Loader2,
  Pen, Calendar, TrendingUp, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MemoryExplanation } from '@/hooks/use-copilot';

interface CoPilotMemoryPanelProps {
  isPro: boolean;
  isLoading: boolean;
  data: MemoryExplanation | null;
  onFetch: () => void;
  onBack: () => void;
  onDeleteAll?: () => void;
}

const PATTERN_ICONS: Record<string, typeof Brain> = {
  writing: Pen,
  schedule: Calendar,
  priority: TrendingUp,
  communication: MessageSquare,
};

function getPatternIcon(text: string) {
  if (text.includes('escrib') || text.includes('email') || text.includes('formal')) return Pen;
  if (text.includes('mañana') || text.includes('hora') || text.includes('activ')) return Calendar;
  if (text.includes('plazo') || text.includes('revis') || text.includes('prioriz')) return TrendingUp;
  return Brain;
}

export function CoPilotMemoryPanel({
  isPro,
  isLoading,
  data,
  onFetch,
  onBack,
  onDeleteAll,
}: CoPilotMemoryPanelProps) {
  // Fetch on mount
  useEffect(() => {
    if (!data) onFetch();
  }, [data, onFetch]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Brain className={cn('h-5 w-5', isPro ? 'text-amber-500' : 'text-primary')} />
        <h3 className="text-sm font-semibold">¿Qué sé de ti?</h3>
      </div>

      {/* GDPR notice */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
        <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Esta información se usa para personalizar tus sugerencias. 
          Puedes desactivar el aprendizaje o borrar todos los datos en cualquier momento.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando tu perfil...</span>
        </div>
      )}

      {data && !isLoading && (
        <ScrollArea className="max-h-[380px]">
          <div className="space-y-4 pr-2">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Aprendiendo desde"
                value={data.learning_since ? new Date(data.learning_since).toLocaleDateString('es') : '—'}
              />
              <StatCard
                label="Eventos capturados"
                value={data.total_events_captured.toLocaleString()}
              />
              <StatCard
                label="Sugerencias aceptadas"
                value={`${Math.round(data.suggestions_acted_pct)}%`}
              />
            </div>

            {/* Patterns in natural language */}
            {data.patterns_in_plain_language.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Lo que he aprendido:</p>
                <div className="space-y-2">
                  {data.patterns_in_plain_language.map((pattern, i) => {
                    const Icon = getPatternIcon(pattern);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-foreground/80 leading-relaxed">{pattern}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Writing styles */}
            {data.writing_styles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Estilos de escritura:</p>
                <div className="space-y-1.5">
                  {data.writing_styles.map((ws, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ws.context_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{ws.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent decisions */}
            {data.recent_decisions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Decisiones recientes:</p>
                <div className="space-y-1">
                  {data.recent_decisions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{new Date(d.date).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</span>
                      <span className="text-foreground/70">{d.type}</span>
                      {d.jurisdiction && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {d.jurisdiction}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete all data */}
            {data.can_delete && onDeleteAll && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  onClick={onDeleteAll}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Borrar todos mis datos de aprendizaje
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {!data && !isLoading && (
        <div className="text-center py-6">
          <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aún no hay datos de aprendizaje.</p>
          <p className="text-xs text-muted-foreground mt-1">
            El CoPilot aprenderá de tus patrones de uso con el tiempo.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
