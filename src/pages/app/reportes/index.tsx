/**
 * Reportes Page — Connected to report_definitions + report_executions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Briefcase, Clock, Building, Euro, TrendingUp,
  Bot, ChevronRight, FileText, Download, Play,
  Loader2, Trash2, Calendar,
} from 'lucide-react';
import { usePageTitle } from '@/contexts/page-context';
import { useOrganization } from '@/contexts/organization-context';
import { useReportDefinitions, useGeneratedReports } from '@/hooks/analytics/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const REPORT_ICONS: Record<string, typeof Briefcase> = {
  portfolio: Briefcase,
  deadlines: Clock,
  financial: Euro,
  productivity: TrendingUp,
  client_analysis: Building,
  ai_usage: Bot,
};

const REPORT_COLORS: Record<string, string> = {
  portfolio: 'bg-primary/10 text-primary',
  deadlines: 'bg-amber-500/10 text-amber-600',
  financial: 'bg-emerald-500/10 text-emerald-600',
  productivity: 'bg-purple-500/10 text-purple-600',
  client_analysis: 'bg-blue-500/10 text-blue-600',
  ai_usage: 'bg-pink-500/10 text-pink-600',
};

export default function ReportesPage() {
  const { setTitle } = usePageTitle();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  useEffect(() => { setTitle('Reportes'); }, [setTitle]);

  const { data: definitions, isLoading: loadingDefs } = useReportDefinitions();
  const { data: generatedReports, isLoading: loadingGenerated } = useGeneratedReports();

  const [selectedDef, setSelectedDef] = useState<any>(null);
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [genFormat, setGenFormat] = useState('csv');
  const [genPeriod, setGenPeriod] = useState('month');

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async ({ defId, format: fmt, period }: { defId: string; format: string; period: string }) => {
      if (!currentOrganization?.id) throw new Error('No org');

      // Step 1: Insert execution as pending
      const { data, error } = await supabase
        .from('report_executions')
        .insert({
          organization_id: currentOrganization.id,
          report_definition_id: defId,
          parameters: { period, format: fmt } as any,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Step 2: Call Edge Function to generate
      const { data: result, error: fnErr } = await supabase.functions.invoke('generate-report', {
        body: { execution_id: data.id },
      });

      if (fnErr) throw new Error(fnErr.message || 'Error generando reporte');
      if (result?.error) throw new Error(result.error);

      // Step 3: Auto-download if URL available
      if (result?.download_url) {
        window.open(result.download_url, '_blank');
      }

      return { ...data, download_url: result?.download_url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-executions'] });
      toast.success('Reporte generado correctamente');
      setShowGenDialog(false);
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const handleGenerate = (def: any) => {
    setSelectedDef(def);
    setGenFormat('csv');
    setGenPeriod('month');
    setShowGenDialog(true);
  };

  const handleConfirmGenerate = () => {
    if (!selectedDef) return;
    generateMutation.mutate({ defId: selectedDef.id, format: genFormat, period: genPeriod });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Genera y descarga informes de tu despacho
            </p>
          </div>
        </div>
      </div>

      {/* Report templates */}
      {loadingDefs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : definitions && definitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {definitions.map((def: any) => {
            const Icon = REPORT_ICONS[def.report_type] || FileText;
            const colorClass = REPORT_COLORS[def.report_type] || 'bg-muted text-muted-foreground';
            const formats = def.output_formats || ['csv'];

            return (
              <Card key={def.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{def.name}</CardTitle>
                      {def.is_system_template && (
                        <Badge variant="outline" className="text-xs mt-1">Sistema</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3 line-clamp-2">
                    {def.description || 'Sin descripción'}
                  </CardDescription>
                  <div className="flex gap-1 mb-4">
                    {formats.slice(0, 3).map((f: string) => (
                      <Badge key={f} variant="secondary" className="text-xs uppercase">
                        {f}
                      </Badge>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => handleGenerate(def)}>
                    <Play className="h-4 w-4 mr-2" />
                    Generar reporte
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Sin plantillas de reportes"
          description="No se encontraron plantillas de reportes disponibles"
        />
      )}

      {/* Generated reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Mis reportes generados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGenerated ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : generatedReports && generatedReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Nombre</th>
                    <th className="text-left py-2 font-medium">Tipo</th>
                    <th className="text-left py-2 font-medium">Formato</th>
                    <th className="text-left py-2 font-medium">Fecha</th>
                    <th className="text-left py-2 font-medium">Expira</th>
                    <th className="text-right py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map((report: any) => {
                    const daysLeft = differenceInDays(new Date(report.expires_at), new Date());
                    return (
                      <tr key={report.id} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{report.report_name}</td>
                        <td className="py-2.5">
                          <Badge variant="outline" className="text-xs">{report.report_type || '-'}</Badge>
                        </td>
                        <td className="py-2.5">
                          <Badge variant="secondary" className="text-xs uppercase">{report.format || 'csv'}</Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {format(new Date(report.created_at), 'dd MMM yyyy', { locale: es })}
                        </td>
                        <td className="py-2.5">
                          {daysLeft <= 7 ? (
                            <Badge variant="destructive" className="text-xs">Expira en {daysLeft}d</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">{daysLeft}d restantes</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button variant="ghost" size="sm" disabled>
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Sin reportes generados"
              description="Genera tu primer reporte usando las plantillas de arriba"
            />
          )}
        </CardContent>
      </Card>

      {/* Generate dialog */}
      <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar: {selectedDef?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={genPeriod} onValueChange={setGenPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                  <SelectItem value="all">Todo el histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <Select value={genFormat} onValueChange={setGenFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedDef?.output_formats || ['csv']).map((f: string) => (
                    <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
