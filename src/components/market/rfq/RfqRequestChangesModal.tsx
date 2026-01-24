// src/components/market/rfq/RfqRequestChangesModal.tsx
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
import { RefreshCw, Loader2 } from 'lucide-react';
import { useRequestRfqChanges } from '@/hooks/market/useRfqWorkflow';

interface RfqRequestChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
}

export function RfqRequestChangesModal({
  open,
  onOpenChange,
  requestId,
}: RfqRequestChangesModalProps) {
  const [reason, setReason] = useState('');

  const requestChanges = useRequestRfqChanges();

  const canSubmit = reason.length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await requestChanges.mutateAsync({
      requestId,
      reason,
    });

    onOpenChange(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" />
            Solicitar cambios
          </DialogTitle>
          <DialogDescription>
            El trabajo volverá a estado "en progreso" y el agente será notificado de tus observaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="changes-reason">¿Qué cambios necesitas? *</Label>
            <Textarea
              id="changes-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe detalladamente los cambios o correcciones que necesitas..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/20 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || requestChanges.isPending}
            variant="secondary"
          >
            {requestChanges.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Solicitar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
