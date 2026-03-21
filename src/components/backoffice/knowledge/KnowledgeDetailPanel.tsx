// ============================================================
// IP-NEXUS BACKOFFICE — Jurisdiction Detail Panel
// ============================================================

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { X, AlertTriangle, BookOpen, Clock, Search as SearchIcon } from 'lucide-react';
import {
  useJurisdictionChunks,
  useJurisdictionLogs,
  useResearchJurisdiction,
  type CoverageRow,
} from '@/hooks/backoffice/useKnowledgeMap';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const LEVEL_COLORS: Record<string, string> = {
  complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  minimal: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function KnowledgeDetailPanel({
  row,
  onClose,
}: {
  row: CoverageRow;
  onClose: () => void;
}) {
  const { data: chunks, isLoading: chunksLoading } = useJurisdictionChunks(row.jurisdiction_code);
  const { data: logs } = useJurisdictionLogs(row.jurisdiction_code);
  const researchMut = useResearchJurisdiction();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-lg">{row.flag_emoji || '🏳️'}</span>
            {row.jurisdiction_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={LEVEL_COLORS[row.coverage_level] || LEVEL_COLORS.none}>
              {row.coverage_level}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Score: {row.effective_score}
              {row.quality_penalty_applied && ' ⚠️'}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-4 space-y-5">
          {/* Office Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Información</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Representante:</span>
                <p className="font-medium">{row.rep_requirement_type || 'No requerido'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Traducción:</span>
                <p className="font-medium">{row.requires_translation ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Idiomas filing:</span>
                <p className="font-medium">{row.accepted_filing_languages?.join(', ') || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Chunks:</span>
                <p className="font-medium">{row.total_kb_chunks}</p>
              </div>
            </div>
          </div>

          {/* Coverage Matrix */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Cobertura por Área</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Plazos', row.cov_deadlines],
                ['OA Response', row.cov_oa_response],
                ['Legislación', row.cov_legislation],
                ['Tasas', row.cov_fees],
                ['Oposición', row.cov_opposition],
                ['Licencias', row.cov_license],
              ].map(([label, level]) => (
                <div key={label as string} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                  <span>{label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {(level as string) || 'none'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => researchMut.mutate({ jurisdiction_code: row.jurisdiction_code, depth: 'basic' })}
              disabled={researchMut.isPending}
            >
              <SearchIcon className="h-3.5 w-3.5 mr-1" /> Investigar (básico)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => researchMut.mutate({ jurisdiction_code: row.jurisdiction_code, depth: 'full' })}
              disabled={researchMut.isPending}
            >
              <SearchIcon className="h-3.5 w-3.5 mr-1" /> Investigar (full)
            </Button>
          </div>

          {/* Chunks */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Chunks de Conocimiento
            </h4>
            {chunksLoading ? (
              <Spinner />
            ) : !chunks?.length ? (
              <p className="text-xs text-muted-foreground">Sin chunks</p>
            ) : (
              <div className="space-y-1">
                {(chunks as any[]).map((c: any) => (
                  <Collapsible key={c.id}>
                    <CollapsibleTrigger className="w-full text-left text-xs bg-muted/30 rounded px-2 py-1.5 hover:bg-muted/60 transition-colors">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-muted-foreground ml-2">[{c.knowledge_type}]</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 py-1.5 text-xs text-muted-foreground border-l-2 border-muted ml-2">
                      <p className="whitespace-pre-wrap">{c.content?.substring(0, 500)}</p>
                      {c.article_reference && (
                        <p className="mt-1 font-medium">📚 {c.article_reference}</p>
                      )}
                      <p className="mt-1 text-[10px]">
                        Confianza: {c.data_confidence} · Verificado: {c.last_verified_at ? format(new Date(c.last_verified_at), 'dd MMM yyyy', { locale: es }) : '—'}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>

          {/* Logs */}
          {logs && (logs as any[]).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Historial
              </h4>
              <div className="space-y-1">
                {(logs as any[]).slice(0, 10).map((l: any) => (
                  <div key={l.id} className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                    <span className="font-medium">{l.action}</span>
                    <span className="ml-2">
                      {l.created_at && formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {row.has_outdated_content && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Contiene contenido desactualizado
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
