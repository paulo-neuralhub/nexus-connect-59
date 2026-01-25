// ============================================================
// IP-NEXUS - Trial Banner Component
// ============================================================

import { Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  planName: string;
  daysRemaining: number;
  trialEnd: string;
  progress: number;
  onActivate: () => void;
  onChangePlan: () => void;
  onCancelTrial: () => void;
}

export function TrialBanner({
  planName,
  daysRemaining,
  trialEnd,
  progress,
  onActivate,
  onChangePlan,
  onCancelTrial,
}: Props) {
  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary">Período de Prueba</h3>
            <p className="text-muted-foreground mt-1">
              Estás probando <strong>{planName}</strong>
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  Te quedan {daysRemaining} días de prueba
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Finaliza: {format(new Date(trialEnd), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% del período usado</p>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Al finalizar, se cobrará automáticamente según el plan seleccionado.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={onActivate}>
                <Zap className="h-4 w-4 mr-2" />
                Activar ahora
              </Button>
              <Button variant="outline" onClick={onChangePlan}>
                Cambiar plan
              </Button>
              <Button variant="ghost" onClick={onCancelTrial}>
                Cancelar prueba
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
