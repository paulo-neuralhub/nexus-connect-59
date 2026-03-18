// src/components/market/rfq/RfqCompleteWorkModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useMarkRfqWorkComplete, useRfqWorkFiles } from '@/hooks/market/useRfqWorkflow';

interface RfqCompleteWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
}

export function RfqCompleteWorkModal({
  open,
  onOpenChange,
  requestId,
}: RfqCompleteWorkModalProps) {
  const [summary, setSummary] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const { data: files = [] } = useRfqWorkFiles(requestId);
  const markComplete = useMarkRfqWorkComplete();

  const deliverables = files.filter(f => f.is_deliverable);
  const hasDeliverables = deliverables.length > 0 || files.length > 0;

  const canSubmit = summary.length >= 20 && confirmed;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await markComplete.mutateAsync({
      requestId,
      summary,
    });

    onOpenChange(false);
    setSummary('');
    setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Marcar trabajo como completado
          </DialogTitle>
          <DialogDescription>
            Una vez marcado como completado, el cliente revisará los entregables y podrá aprobar el trabajo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deliverables check */}
          {!hasDeliverables && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No hay archivos subidos. Se recomienda subir al menos un entregable antes de marcar como completado.
              </AlertDescription>
            </Alert>
          )}

          {files.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">Archivos entregados:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {files.slice(0, 5).map(file => (
                  <li key={file.id} className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    {file.file_name}
                  </li>
                ))}
                {files.length > 5 && (
                  <li className="text-muted-foreground">
                    ... y {files.length - 5} más
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="work-summary">Resumen del trabajo realizado *</Label>
            <Textarea
              id="work-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe brevemente el trabajo realizado, los entregables incluidos y cualquier observación relevante..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {summary.length}/20 caracteres mínimos
            </p>
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-complete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label htmlFor="confirm-complete" className="text-sm font-normal leading-tight">
              Confirmo que el trabajo ha sido completado según lo acordado y todos los entregables han sido subidos.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || markComplete.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {markComplete.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Marcar como Completado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
