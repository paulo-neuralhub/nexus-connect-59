// src/pages/app/finance/valuation/index.tsx
// Shows upgrade prompt since Valuation requires Advanced tier
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';

export default function ValuationDashboardPage() {
  const { enabled, isLoading } = useFinanceFeature('feature_valuation');

  if (isLoading) return null;

  // Always show upgrade prompt for now (feature_valuation defaults to false)
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardContent className="flex flex-col items-center text-center py-12 px-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center -mt-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Valoración de activos PI</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            La valoración de portfolios de propiedad intelectual (ISO 10668) está disponible en el plan <strong>Advanced</strong> del módulo financiero.
          </p>
          <div className="space-y-2 text-left w-full max-w-xs text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Valoración multimétodo (coste, mercado, ingresos)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Portfolio tracking y análisis de tendencias
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Informes de valoración profesionales (PDF)
            </div>
          </div>
          <Button asChild className="mt-4">
            <Link to="/app/settings">
              Ver planes <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
