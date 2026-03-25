import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Timer } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deadlineTitle: string;
  currentDate: string;
  extensionCount: number;
  onConfirm: (newDate: string, reason: string) => Promise<void>;
  isPending: boolean;
}

export function ExtendDeadlineModal({ open, onOpenChange, deadlineTitle, currentDate, extensionCount, onConfirm, isPending }: Props) {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [newDate, setNewDate] = useState(tomorrow);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!newDate || !reason.trim()) return;
    await onConfirm(newDate, reason);
    setNewDate(tomorrow);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-amber-600" />
            Prorrogar plazo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Prorrogar: <strong>{deadlineTitle}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Fecha actual: {format(new Date(currentDate), 'dd MMM yyyy', { locale: es })}
            {extensionCount > 0 && ` · Prórroga ${extensionCount + 1}/3`}
          </p>
          <div>
            <label className="text-sm font-medium">Nueva fecha límite *</label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={tomorrow}
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Motivo de la prórroga *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Pendiente de recibir documentación del cliente..."
              rows={3}
              className="mt-1.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending || !reason.trim() || !newDate}>
              <Timer className="h-4 w-4 mr-1" />
              Prorrogar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
