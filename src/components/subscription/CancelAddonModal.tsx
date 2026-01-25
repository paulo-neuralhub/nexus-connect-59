// ============================================================
// IP-NEXUS - Cancel Addon Modal
// ============================================================

import { Package, XCircle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addonName: string;
  addonPrice: number;
  currentTotal: number;
  newTotal: number;
  periodEndDate: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelAddonModal({
  open,
  onOpenChange,
  addonName,
  addonPrice,
  currentTotal,
  newTotal,
  periodEndDate,
  onConfirm,
  isLoading,
}: Props) {
  const formattedEndDate = format(new Date(periodEndDate), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cancelar Add-on
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            ¿Seguro que quieres cancelar el add-on de <strong>{addonName}</strong>?
          </p>

          <div className="rounded-lg border bg-destructive/5 p-4">
            <p className="font-medium flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Al cancelar perderás:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Sincronización automática con {addonName}</li>
              <li>• Alertas de cambios de estado</li>
              <li>• Descarga automática de documentos</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-primary/5 p-4">
            <p className="font-medium flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-primary" />
              Tus datos se conservan:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Expedientes existentes</li>
              <li>• Documentos ya descargados</li>
              <li>• Plazos ya creados</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-1">
            <p className="text-sm">
              La cancelación será efectiva el <strong>{formattedEndDate}</strong>.
            </p>
            <p className="text-sm font-medium mt-2">
              Nueva facturación: {formatCurrency(newTotal, 'EUR')}/mes 
              <span className="text-muted-foreground font-normal">
                {' '}(antes {formatCurrency(currentTotal, 'EUR')}/mes)
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
