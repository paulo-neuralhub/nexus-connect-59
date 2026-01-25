import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import { useRetentionCohorts, useMRRRetentionCohorts, useLTVByCohort } from '@/hooks/backoffice/useAnalyticsCohorts';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function AnalyticsCohortsPage() {
  const { data: retentionCohorts, isLoading: loadingRetention } = useRetentionCohorts();
  const { data: mrrCohorts, isLoading: loadingMRR } = useMRRRetentionCohorts();
  const { data: ltvCohorts, isLoading: loadingLTV } = useLTVByCohort();
  
  const isLoading = loadingRetention || loadingMRR || loadingLTV;

  // Sample cohort data
  const cohorts = [
    { month: 'Jun 2024', m0: 100, m1: 85, m2: 78, m3: 72, m4: 68, m5: 65, m6: 62, m7: 60, m8: 58 },
    { month: 'Jul 2024', m0: 100, m1: 88, m2: 80, m3: 74, m4: 70, m5: 67, m6: 64, m7: 61, m8: null },
    { month: 'Ago 2024', m0: 100, m1: 86, m2: 79, m3: 73, m4: 69, m5: 66, m6: 63, m7: null, m8: null },
    { month: 'Sep 2024', m0: 100, m1: 87, m2: 81, m3: 75, m4: 71, m5: 68, m6: null, m7: null, m8: null },
    { month: 'Oct 2024', m0: 100, m1: 89, m2: 82, m3: 76, m4: 72, m5: null, m6: null, m7: null, m8: null },
    { month: 'Nov 2024', m0: 100, m1: 90, m2: 83, m3: 77, m4: null, m5: null, m6: null, m7: null, m8: null },
    { month: 'Dic 2024', m0: 100, m1: 91, m2: 84, m3: null, m4: null, m5: null, m6: null, m7: null, m8: null },
    { month: 'Ene 2025', m0: 100, m1: 92, m2: null, m3: null, m4: null, m5: null, m6: null, m7: null, m8: null },
  ];

  const ltvData = [
    { cohort: 'Jun 2024', clients: 23, ltv: 4230, payback: 3.2 },
    { cohort: 'Jul 2024', clients: 28, ltv: 4450, payback: 3.0 },
    { cohort: 'Ago 2024', clients: 31, ltv: 4680, payback: 2.9 },
    { cohort: 'Sep 2024', clients: 35, ltv: 4890, payback: 2.8 },
    { cohort: 'Oct 2024', clients: 42, ltv: 5120, payback: 2.7 },
    { cohort: 'Nov 2024', clients: 38, ltv: 5340, payback: 2.6 },
    { cohort: 'Dic 2024', clients: 29, ltv: 5560, payback: 2.5 },
    { cohort: 'Ene 2025', clients: 18, ltv: null, payback: null },
  ];

  const getRetentionColor = (value: number | null) => {
    if (value === null) return 'bg-muted/30';
    if (value >= 80) return 'bg-success/80 text-success-foreground';
    if (value >= 60) return 'bg-success/40';
    if (value >= 40) return 'bg-warning/40';
    return 'bg-destructive/40';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Análisis de Cohortes</h1>
          <p className="text-muted-foreground">Retención de usuarios y MRR por cohorte mensual</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Retention Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Retención por Cohorte (% usuarios activos)
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Porcentaje de usuarios que permanecen activos cada mes</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Cohorte</TableHead>
                  <TableHead className="text-center w-12">M0</TableHead>
                  <TableHead className="text-center w-12">M1</TableHead>
                  <TableHead className="text-center w-12">M2</TableHead>
                  <TableHead className="text-center w-12">M3</TableHead>
                  <TableHead className="text-center w-12">M4</TableHead>
                  <TableHead className="text-center w-12">M5</TableHead>
                  <TableHead className="text-center w-12">M6</TableHead>
                  <TableHead className="text-center w-12">M7</TableHead>
                  <TableHead className="text-center w-12">M8</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.month}>
                    <TableCell className="font-medium text-sm">{cohort.month}</TableCell>
                    {[cohort.m0, cohort.m1, cohort.m2, cohort.m3, cohort.m4, cohort.m5, cohort.m6, cohort.m7, cohort.m8].map((val, idx) => (
                      <TableCell key={idx} className="p-1">
                        <div className={cn('text-center py-2 px-1 rounded text-sm font-medium', getRetentionColor(val))}>
                          {val !== null ? `${val}%` : '-'}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-muted-foreground">Leyenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/80" />
              <span>≥80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/40" />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/40" />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/40" />
              <span>&lt;40%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Retención de MRR por Cohorte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Net Revenue Retention (NRR)</p>
              <p className="text-4xl font-bold text-success">108%</p>
              <p className="text-sm text-muted-foreground mt-2">Incluye expansión de cuentas existentes</p>
            </div>
            <div className="p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Gross Revenue Retention (GRR)</p>
              <p className="text-4xl font-bold">95%</p>
              <p className="text-sm text-muted-foreground mt-2">Sin expansión, solo retención</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LTV by Cohort */}
      <Card>
        <CardHeader>
          <CardTitle>LTV por Cohorte</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohorte</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">LTV Estimado</TableHead>
                <TableHead className="text-right">Payback Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ltvData.map((row) => (
                <TableRow key={row.cohort}>
                  <TableCell className="font-medium">{row.cohort}</TableCell>
                  <TableCell className="text-right">{row.clients}</TableCell>
                  <TableCell className="text-right">
                    {row.ltv ? `€${row.ltv.toLocaleString()}` : '(proyectado)'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.payback ? `${row.payback} meses` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
