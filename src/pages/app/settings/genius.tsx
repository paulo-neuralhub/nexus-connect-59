/**
 * Genius Settings Page — General, Disclaimer, Usage tabs
 */
import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/page-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Brain, Shield, BarChart3 } from 'lucide-react';
import { useGeniusTenantConfig, useGeniusUsageStats } from '@/hooks/genius/useGeniusTenantConfig';

export default function GeniusSettingsPage() {
  const { setTitle } = usePageTitle();
  const { data: config, isLoading } = useGeniusTenantConfig();
  const usage = useGeniusUsageStats();

  useEffect(() => {
    setTitle('Configuración IP-GENIUS');
  }, [setTitle]);

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">IP-GENIUS PRO</h1>
          <p className="text-sm text-muted-foreground">Configuración del módulo de IA</p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Brain className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="disclaimer" className="gap-1.5">
            <Shield className="h-4 w-4" /> Disclaimer
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado del módulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado</span>
                <Badge variant={config?.is_active ? 'default' : 'secondary'}>
                  {config?.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Plan</span>
                <Badge variant="outline">{config?.plan_code || 'Sin plan'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Idioma preferido</span>
                <span className="text-sm">{config?.preferred_language === 'es' ? 'Español' : config?.preferred_language || 'Español'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <FeatureRow label="Generación de documentos" enabled={config?.feature_document_generation} />
              <FeatureRow label="Acciones en la app" enabled={config?.feature_app_actions} />
              <FeatureRow label="Análisis proactivo" enabled={config?.feature_proactive_analysis} />
              <FeatureRow label="Búsqueda web" enabled={config?.feature_web_search} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclaimer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disclaimer legal</CardTitle>
              <CardDescription>
                El disclaimer legal debe ser aceptado antes de usar IP-GENIUS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado de aceptación</span>
                {config?.disclaimer_accepted ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Aceptado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Pendiente
                  </Badge>
                )}
              </div>
              {config?.disclaimer_accepted_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fecha de aceptación</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(config.disclaimer_accepted_at).toLocaleString('es-ES')}
                  </span>
                </div>
              )}

              <div className="mt-4 p-4 rounded-lg border bg-muted/50 text-sm space-y-2">
                <p className="font-medium">Contenido del disclaimer:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>IP-GENIUS es una herramienta de asistencia tecnológica</li>
                  <li>No constituye asesoramiento legal</li>
                  <li>No reemplaza la revisión de un abogado</li>
                  <li>No garantiza resultados ante oficinas IP</li>
                  <li>Los documentos generados son borradores</li>
                  <li>El profesional es responsable de todas las decisiones</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso del mes actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <UsageBar
                label="Consultas"
                used={usage.queries.used}
                max={usage.queries.max}
                pct={usage.queries.pct}
              />
              <UsageBar
                label="Documentos generados"
                used={usage.documents.used}
                max={usage.documents.max}
                pct={usage.documents.pct}
              />
              <UsageBar
                label="Acciones ejecutadas"
                used={usage.actions.used}
                max={usage.actions.max}
                pct={usage.actions.pct}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      {enabled ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

function UsageBar({
  label,
  used,
  max,
  pct,
}: {
  label: string;
  used: number;
  max: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {used} / {max === -1 ? '∞' : max}
        </span>
      </div>
      <Progress value={max === -1 ? 0 : pct} className="h-2" />
    </div>
  );
}
