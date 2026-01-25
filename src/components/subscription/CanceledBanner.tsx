// ============================================================
// IP-NEXUS - Canceled Subscription Banner Component
// ============================================================

import { XCircle, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  cancelDate: string;
  onReactivate: () => void;
  isLoading?: boolean;
}

export function CanceledBanner({ cancelDate, onReactivate, isLoading }: Props) {
  const formattedDate = format(new Date(cancelDate), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-destructive">Cancelación Programada</h3>
            <p className="text-muted-foreground mt-1">
              Tu suscripción se cancelará el <strong>{formattedDate}</strong>.
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-sm">
                Hasta entonces, seguirás teniendo acceso completo.
              </p>
              <p className="text-sm text-muted-foreground">
                Después perderás acceso a:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Sincronización con oficinas</li>
                <li>• Alertas de plazos</li>
                <li>• Descarga de documentos</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Tus datos se conservarán 30 días por si cambias de opinión.
              </p>
            </div>

            <Button onClick={onReactivate} disabled={isLoading} className="mt-4">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reactivar suscripción
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
