/**
 * Genius Disclaimer Modal — MANDATORY before activation
 * Cannot be closed without accepting
 */
import { useState } from 'react';
import { Scale, ShieldAlert, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAcceptGeniusDisclaimer } from '@/hooks/genius/useGeniusTenantConfig';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onAccepted: () => void;
  onDecline?: () => void;
}

const WARNINGS = [
  'No constituye asesoramiento legal',
  'No reemplaza la revisión de un abogado',
  'No garantiza resultados ante oficinas IP',
  'Los documentos generados son borradores',
];

const CONFIRMATION =
  'El profesional es responsable de todas las decisiones y documentos que utilice';

export function GeniusDisclaimerModal({ open, onAccepted, onDecline }: Props) {
  const [responsibleName, setResponsibleName] = useState('');
  const acceptMutation = useAcceptGeniusDisclaimer();

  const handleAccept = async () => {
    if (!responsibleName.trim()) {
      toast.error('Introduce el nombre del responsable');
      return;
    }
    try {
      await acceptMutation.mutateAsync({ responsibleName: responsibleName.trim() });
      toast.success('IP-GENIUS activado correctamente');
      onAccepted();
    } catch {
      toast.error('Error al aceptar el disclaimer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Aviso Legal Importante — IP-GENIUS
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lea atentamente antes de continuar
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-foreground">
            IP-GENIUS es una herramienta de asistencia tecnológica para
            profesionales de propiedad intelectual.
          </p>

          {/* Warnings */}
          <div className="space-y-2">
            {WARNINGS.map((w) => (
              <div key={w} className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-destructive flex-shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <Check className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span>{CONFIRMATION}</span>
          </div>

          {/* Responsible name */}
          <div className="space-y-2">
            <Label htmlFor="responsible-name">
              Nombre del responsable <span className="text-destructive">*</span>
            </Label>
            <Input
              id="responsible-name"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder="Nombre completo del profesional responsable"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Este consentimiento queda registrado con fecha y hora.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          {onDecline && (
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleAccept}
            disabled={!responsibleName.trim() || acceptMutation.isPending}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {acceptMutation.isPending ? (
              'Procesando...'
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Entiendo y acepto — Activar IP-GENIUS
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
