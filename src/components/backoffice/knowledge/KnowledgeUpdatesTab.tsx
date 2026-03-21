// ============================================================
// IP-NEXUS BACKOFFICE — Updates Tab (Queue + Outdated + Monthly)
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useUpdateQueue,
  useOutdatedContent,
  useApproveResearch,
  useMonthlyUpdate,
  type QueueItem,
} from '@/hooks/backoffice/useKnowledgeMap';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Check, X, RefreshCw, Clock, Eye } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function KnowledgeUpdatesTab() {
  const { data: queue, isLoading: qLoading } = useUpdateQueue('in_review');
  const { data: outdated, isLoading: oLoading } = useOutdatedContent();
  const monthlyMut = useMonthlyUpdate();

  const [reviewItem, setReviewItem] = useState<QueueItem | null>(null);
  const [monthlyConfirm, setMonthlyConfirm] = useState(false);

  return (
    <div className="space-y-8">
      {/* Queue Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Cola de Revisión</h3>
        {qLoading ? (
          <Spinner />
        ) : !queue?.length ? (
          <p className="text-sm text-muted-foreground">No hay investigaciones pendientes de revisión</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jurisdicción</TableHead>
                  <TableHead>Profundidad</TableHead>
                  <TableHead>Confianza</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.jurisdiction_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.research_depth}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.confidence_level}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.created_at && formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setReviewItem(item)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Outdated Content */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Contenido Desactualizado ({outdated?.length || 0})
        </h3>
        {oLoading ? (
          <Spinner />
        ) : !outdated?.length ? (
          <p className="text-sm text-muted-foreground">Todo el contenido está actualizado</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jurisdicción</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Última verificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outdated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.jurisdiction_code}</TableCell>
                    <TableCell className="text-xs">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{c.knowledge_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_verified_at ? format(new Date(c.last_verified_at), 'dd MMM yyyy', { locale: es }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Monthly Update */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Actualización Mensual Automática</h3>
        <p className="text-xs text-muted-foreground">
          Escanea hasta 10 jurisdicciones prioritarias (cobertura obsoleta, miembros Madrid sin cubrir, top LATAM).
          Usa Perplexity sonar (económico). Los resultados se insertan en la cola para revisión humana.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setMonthlyConfirm(true)}
            disabled={monthlyMut.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${monthlyMut.isPending ? 'animate-spin' : ''}`} />
            Ejecutar Actualización Mensual
          </Button>
          {monthlyMut.isPending && <Progress value={50} className="flex-1" stateColor="#F59E0B" />}
        </div>
      </section>

      {/* Review Modal */}
      {reviewItem && (
        <ApprovalModal item={reviewItem} onClose={() => setReviewItem(null)} />
      )}

      {/* Monthly Confirm */}
      <Dialog open={monthlyConfirm} onOpenChange={setMonthlyConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Actualización Mensual</DialogTitle>
            <DialogDescription>
              Se investigarán hasta 10 jurisdicciones con Perplexity sonar.
              Coste estimado: ~€5-10. Los resultados se añadirán a la cola de revisión.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMonthlyConfirm(false)}>Cancelar</Button>
            <Button onClick={() => { monthlyMut.mutate(); setMonthlyConfirm(false); }}>
              Confirmar y Ejecutar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Approval Modal with 5s Timer ----------
function ApprovalModal({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  const approveMut = useApproveResearch();
  const chunks: any[] = Array.isArray(item.proposed_chunks) ? item.proposed_chunks : [];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewedSeconds, setViewedSeconds] = useState<Record<number, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Track time each chunk has been visible
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setViewedSeconds((prev) => {
        const next = { ...prev };
        chunks.forEach((_, i) => {
          next[i] = (next[i] || 0) + 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [chunks.length]);

  const allRead = chunks.every((_, i) => (viewedSeconds[i] || 0) >= 5);
  const canApprove = selected.size > 0 && allRead;

  const handleApprove = () => {
    const approvedIds = Array.from(selected).map((i) => chunks[i]?.id || `chunk_${i}`);
    approveMut.mutate(
      { queue_id: item.id, approved_chunk_ids: approvedIds },
      { onSuccess: onClose },
    );
  };

  const handleReject = () => {
    approveMut.mutate(
      { queue_id: item.id, approved_chunk_ids: [] },
      { onSuccess: onClose },
    );
  };

  const toggleChunk = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Revisar Investigación — {item.jurisdiction_code}
          </DialogTitle>
          <DialogDescription>
            {chunks.length} chunks propuestos · Confianza: {item.confidence_level}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {chunks.map((chunk: any, i: number) => {
              const seconds = viewedSeconds[i] || 0;
              const isRead = seconds >= 5;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(i)}
                      onCheckedChange={() => toggleChunk(i)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{chunk.title || `Chunk ${i + 1}`}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                        {chunk.content || chunk.text || JSON.stringify(chunk).substring(0, 300)}
                      </p>
                      {chunk.source_url && (
                        <a
                          href={chunk.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary underline mt-1 inline-block"
                        >
                          {chunk.source_url}
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {isRead ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{5 - seconds}s</span>
                      )}
                    </div>
                  </div>
                  {!isRead && (
                    <Progress value={(seconds / 5) * 100} className="h-0.5" stateColor="#22C55E" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {!allRead && (
          <p className="text-[11px] text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Cada chunk debe ser visible al menos 5 segundos antes de aprobar
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="destructive" size="sm" onClick={handleReject} disabled={approveMut.isPending}>
            <X className="h-3.5 w-3.5 mr-1" /> Rechazar todo
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={!canApprove || approveMut.isPending}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Aprobar seleccionados ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
