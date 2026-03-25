import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deadlineTitle: string;
  onConfirm: (notes: string) => Promise<void>;
  isPending: boolean;
}

export function CompleteDeadlineModal({ open, onOpenChange, deadlineTitle, onConfirm, isPending }: Props) {
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await onConfirm(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Completar plazo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Marcar como completado: <strong>{deadlineTitle}</strong>
          </p>
          <div>
            <label className="text-sm font-medium">Notas de completado (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Documentación presentada en plazo..."
              rows={3}
              className="mt-1.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              <Check className="h-4 w-4 mr-1" />
              Marcar como completado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
