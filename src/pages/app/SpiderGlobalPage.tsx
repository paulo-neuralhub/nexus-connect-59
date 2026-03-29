import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Shield, Eye, AlertTriangle } from 'lucide-react';

export default function SpiderGlobalPage() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-slate-200">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Globe className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Jurisdicciones monitoreadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Vigilancias activas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Marcas protegidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Alertas pendientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Vigilancia Global</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            El módulo de Vigilancia Global permite monitorear marcas y activos de propiedad intelectual
            a nivel mundial. Configura tus vigilancias desde IP-Spider para comenzar a recibir alertas.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
