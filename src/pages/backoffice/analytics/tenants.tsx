import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, AlertTriangle, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useTopTenants, useHealthScores, useAtRiskTenants, useTenantSegmentation } from '@/hooks/backoffice/useAnalyticsTenants';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AnalyticsTenantsPage() {
  const [search, setSearch] = useState('');
  const { data: topTenants, isLoading: loadingTop } = useTopTenants();
  const { data: healthScores, isLoading: loadingHealth } = useHealthScores();
  const { data: atRiskTenants, isLoading: loadingRisk } = useAtRiskTenants();
  const { data: segmentation, isLoading: loadingSeg } = useTenantSegmentation();
  
  const isLoading = loadingTop || loadingHealth || loadingRisk || loadingSeg;

  const topTenantsData = [
    { rank: 1, name: 'Global IP SL', plan: 'Enterprise', mrr: 348, matters: 2345 },
    { rank: 2, name: 'Marca Legal', plan: 'Professional', mrr: 138, matters: 890 },
    { rank: 3, name: 'Patent Pro', plan: 'Enterprise', mrr: 328, matters: 1567 },
    { rank: 4, name: 'IP Solutions', plan: 'Enterprise', mrr: 299, matters: 1234 },
    { rank: 5, name: 'Trade Mark Co', plan: 'Professional', mrr: 118, matters: 567 },
    { rank: 6, name: 'Innova IP', plan: 'Professional', mrr: 99, matters: 456 },
    { rank: 7, name: 'Brand Guard', plan: 'Professional', mrr: 99, matters: 423 },
    { rank: 8, name: 'IP Experts', plan: 'Professional', mrr: 99, matters: 398 },
    { rank: 9, name: 'Legal Patents', plan: 'Starter', mrr: 68, matters: 234 },
    { rank: 10, name: 'Quick Marks', plan: 'Starter', mrr: 29, matters: 189 },
  ];

  const atRiskData = [
    { name: 'Test Corp', score: 35, reason: 'Sin login 15 días' },
    { name: 'Old Brand SL', score: 42, reason: 'Bajo uso features' },
    { name: 'IP Simple', score: 48, reason: 'Solo 1 usuario activo' },
  ];

  const healthSummary = {
    healthy: { count: 89, percent: 61 },
    atRisk: { count: 42, percent: 29 },
    critical: { count: 15, percent: 10 },
  };

  const sizeSeg = [
    { segment: 'Small (<100)', count: 45, arpu: 45 },
    { segment: 'Medium (100-500)', count: 67, arpu: 89 },
    { segment: 'Large (500+)', count: 34, arpu: 189 },
  ];

  const ageSeg = [
    { segment: '<3 meses', count: 28, risk: 'Alto' },
    { segment: '3-12 meses', count: 56, risk: 'Medio' },
    { segment: '>12 meses', count: 62, risk: 'Bajo' },
  ];

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      Enterprise: 'default',
      Professional: 'secondary',
      Starter: 'outline',
    };
    return <Badge variant={variants[plan] || 'outline'}>{plan}</Badge>;
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'Alto') return 'text-destructive';
    if (risk === 'Medio') return 'text-warning';
    return 'text-success';
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
          <h1 className="text-2xl font-bold">Análisis por Tenant</h1>
          <p className="text-muted-foreground">Rankings, health scores y segmentación de clientes</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Top Tenants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top 10 Tenants por MRR
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tenant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Expedientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topTenantsData
                .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
                .map((tenant) => (
                  <TableRow key={tenant.rank}>
                    <TableCell className="font-medium">{tenant.rank}</TableCell>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                    <TableCell className="text-right">€{tenant.mrr}</TableCell>
                    <TableCell className="text-right">{tenant.matters.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Score basado en: actividad, adopción de features, growth
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-success/10 rounded-lg flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{healthSummary.healthy.count}</p>
                <p className="text-sm text-muted-foreground">Saludable (&gt;70) - {healthSummary.healthy.percent}%</p>
              </div>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{healthSummary.atRisk.count}</p>
                <p className="text-sm text-muted-foreground">En riesgo (40-70) - {healthSummary.atRisk.percent}%</p>
              </div>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{healthSummary.critical.count}</p>
                <p className="text-sm text-muted-foreground">Crítico (&lt;40) - {healthSummary.critical.percent}%</p>
              </div>
            </div>
          </div>

          <h4 className="font-medium mb-3">Tenants en riesgo (acción recomendada)</h4>
          <div className="space-y-2">
            {atRiskData.map((tenant) => (
              <div key={tenant.name} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('text-lg font-bold', tenant.score < 40 ? 'text-destructive' : 'text-warning')}>
                    {tenant.score}
                  </div>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{tenant.reason}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Contactar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Por tamaño (expedientes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sizeSeg.map((seg) => (
                <div key={seg.segment} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{seg.segment}</span>
                    <span className="text-muted-foreground">{seg.count} tenants</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ARPU:</span>
                    <span className="font-medium">€{seg.arpu}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por antigüedad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ageSeg.map((seg) => (
                <div key={seg.segment} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{seg.segment}</span>
                    <span className="text-muted-foreground">{seg.count} tenants</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Churn risk:</span>
                    <span className={cn('font-medium', getRiskColor(seg.risk))}>{seg.risk}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
