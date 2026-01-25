// ============================================================
// IP-NEXUS - Cancel Subscription Modal
// ============================================================

import { useState } from 'react';
import { XCircle, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodEndDate: string;
  planName: string;
  onConfirm: (reason: string, feedback?: string) => void;
  isLoading?: boolean;
}

const cancellationReasons = [
  { value: 'price', label: 'El precio es muy alto' },
  { value: 'unused', label: 'No uso suficiente la plataforma' },
  { value: 'missing_feature', label: 'Falta alguna funcionalidad' },
  { value: 'technical', label: 'Problemas técnicos' },
  { value: 'business_change', label: 'Cambio de negocio/cierre' },
  { value: 'other', label: 'Otro' },
];

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  periodEndDate,
  planName,
  onConfirm,
  isLoading,
}: Props) {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleConfirm = () => {
    onConfirm(reason, feedback);
  };

  const formattedEndDate = format(new Date(periodEndDate), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancelar Suscripción
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">
            😢 Sentimos que te vayas
          </p>

          <div>
            <Label className="text-base font-medium">
              Antes de irte, ¿hay algo que podamos mejorar?
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="mt-3 space-y-2"
            >
              {cancellationReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {reason === 'other' && (
            <div>
              <Label>Cuéntanos más (opcional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="¿Qué podríamos mejorar?"
                className="mt-1"
              />
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="font-medium">Alternativas</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                💡 ¿Quizás un plan más económico?
                <Button variant="link" size="sm" className="h-auto p-0">
                  Ver planes <ChevronRight className="h-3 w-3" />
                </Button>
              </p>
              <p className="flex items-center gap-2">
                💡 ¿Necesitas pausar temporalmente?
                <Button variant="link" size="sm" className="h-auto p-0">
                  Contactar <ChevronRight className="h-3 w-3" />
                </Button>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="font-medium text-sm mb-2">Si continúas con la cancelación:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tendrás acceso hasta el {formattedEndDate}</li>
              <li>• Tus datos se conservarán 30 días</li>
              <li>• Podrás reactivar en cualquier momento</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading ? 'Procesando...' : 'Cancelar mi suscripción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
