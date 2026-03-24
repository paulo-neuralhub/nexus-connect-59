/**
 * LostDealModal — Confirmation modal when moving a deal to "Lost" stage
 */

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface LostDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  onConfirm: (data: { reason: string; notes: string; competitor: string }) => void;
  isLoading?: boolean;
}

const LOSS_REASONS = [
  { value: 'price', label: 'Precio demasiado alto' },
  { value: 'competitor', label: 'Eligió competidor' },
  { value: 'no_budget', label: 'Sin presupuesto' },
  { value: 'no_need', label: 'No necesita el servicio' },
  { value: 'timing', label: 'Timing inadecuado' },
  { value: 'no_response', label: 'Sin respuesta' },
  { value: 'other', label: 'Otro motivo' },
];

export function LostDealModal({ open, onOpenChange, dealName, onConfirm, isLoading }: LostDealModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [competitor, setCompetitor] = useState('');

  const handleConfirm = () => {
    onConfirm({ reason, notes, competitor });
    setReason('');
    setNotes('');
    setCompetitor('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            😔 Marcar como perdido
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de marcar <strong>{dealName}</strong> como perdido?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo de pérdida *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {LOSS_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Competidor (opcional)</Label>
            <Input
              value={competitor}
              onChange={e => setCompetitor(e.target.value)}
              placeholder="Nombre del competidor..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading ? 'Guardando...' : 'Confirmar pérdida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
