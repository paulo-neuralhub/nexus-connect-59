/**
 * Coverage banners for jurisdiction checks via genius_check_coverage RPC
 */
import { AlertTriangle, Globe, Scale, Languages } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CoverageData {
  can_respond: boolean;
  coverage_level: string;
  effective_score: number;
  requires_translation: boolean;
  rep_requirement: string;
  rep_notes: string | null;
  warnings: string[];
  disclaimer: string;
}

interface Props {
  coverage: CoverageData | null;
  jurisdictionName?: string;
}

export function GeniusCoverageBanner({ coverage, jurisdictionName }: Props) {
  if (!coverage) return null;

  return (
    <div className="space-y-2">
      {/* No coverage */}
      {coverage.coverage_level === 'none' && (
        <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">
            Sin cobertura verificada
          </AlertTitle>
          <AlertDescription className="text-xs">
            No tenemos conocimiento legal verificado para{' '}
            {jurisdictionName || 'esta jurisdicción'}. Los resultados pueden no ser
            precisos legalmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Minimal coverage */}
      {coverage.coverage_level === 'minimal' && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Cobertura mínima
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
            Cobertura limitada para {jurisdictionName || 'esta jurisdicción'}. 
            Verificar con especialista local.
          </AlertDescription>
        </Alert>
      )}

      {/* Translation required */}
      {coverage.requires_translation && (
        <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
          <Languages className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Traducción requerida
          </AlertTitle>
          <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
            El Genius genera el documento en inglés. Se requiere traducción
            certificada antes de presentar.
          </AlertDescription>
        </Alert>
      )}

      {/* Representation requirement */}
      {coverage.rep_requirement !== 'none' && coverage.rep_notes && (
        <Alert className="border-purple-300 bg-purple-50 dark:bg-purple-950/20">
          <Scale className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">
            Representación legal obligatoria
          </AlertTitle>
          <AlertDescription className="text-xs text-purple-700 dark:text-purple-400">
            {coverage.rep_notes}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/** Inline coverage indicator for jurisdiction selectors */
export function CoverageIndicator({ level }: { level: string }) {
  const config: Record<string, { emoji: string; label: string; className: string }> = {
    complete: { emoji: '🟢', label: 'Template verificado', className: 'text-green-700 dark:text-green-400' },
    partial: { emoji: '🟡', label: 'Template parcial — revisar', className: 'text-amber-700 dark:text-amber-400' },
    minimal: { emoji: '🔴', label: 'Sin template — experto obligatorio', className: 'text-red-700 dark:text-red-400' },
    none: { emoji: '⚫', label: 'Sin cobertura — No recomendado', className: 'text-muted-foreground' },
  };

  const c = config[level] || config.none;

  return (
    <span className={`text-xs ${c.className}`}>
      {c.emoji} {c.label}
    </span>
  );
}
