import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Users, FileText, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { useUserMetrics, useMatterMetrics, useFeatureAdoption, useOfficeSyncMetrics } from '@/hooks/backoffice/useAnalyticsUsage';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsUsagePage() {
  const [period, setPeriod] = useState('30d');
  const { data: userMetrics, isLoading: loadingUsers } = useUserMetrics();
  const { data: matterMetrics, isLoading: loadingMatters } = useMatterMetrics();
  const { data: featureAdoption, isLoading: loadingFeatures } = useFeatureAdoption();
  const { data: officeSyncMetrics, isLoading: loadingOffice } = useOfficeSyncMetrics();
  
  const isLoading = loadingUsers || loadingMatters || loadingFeatures || loadingOffice;

  const userTrend = [
    { day: 'Lun', dau: 456, wau: 789, mau: 1234 },
    { day: 'Mar', dau: 423, wau: 812, mau: 1234 },
    { day: 'Mié', dau: 489, wau: 798, mau: 1234 },
    { day: 'Jue', dau: 512, wau: 834, mau: 1234 },
    { day: 'Vie', dau: 478, wau: 856, mau: 1234 },
    { day: 'Sáb', dau: 234, wau: 789, mau: 1234 },
    { day: 'Dom', dau: 189, wau: 756, mau: 1234 },
  ];

  const features = [
    { name: 'Gestión expedientes', users: 1180, adoption: 95.6 },
    { name: 'CRM clientes', users: 890, adoption: 72.1 },
    { name: 'Alertas/plazos', users: 756, adoption: 61.3 },
    { name: 'Sync oficinas', users: 645, adoption: 52.3 },
    { name: 'Facturación', users: 534, adoption: 43.3 },
    { name: 'Portal cliente', users: 312, adoption: 25.3 },
    { name: 'Marketplace', users: 89, adoption: 7.2 },
    { name: 'API', users: 45, adoption: 3.6 },
  ];

  const offices = [
    { office: 'EUIPO', syncsDay: 4567, docs: 1234, success: 98.5 },
    { office: 'OEPM', syncsDay: 2345, docs: 567, success: 95.2 },
    { office: 'USPTO', syncsDay: 1234, docs: 345, success: 97.8 },
    { office: 'WIPO', syncsDay: 890, docs: 234, success: 94.1 },
    { office: 'EPO', syncsDay: 567, docs: 123, success: 99.2 },
  ];

  const matterTypes = [
    { type: 'Marcas', percent: 65 },
    { type: 'Patentes', percent: 25 },
    { type: 'Diseños', percent: 8 },
    { type: 'Otros', percent: 2 },
  ];

  const matterStatus = [
    { status: 'Activos', percent: 78 },
    { status: 'Pendientes', percent: 12 },
    { status: 'Archivados', percent: 10 },
  ];

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
          <h1 className="text-2xl font-bold">Métricas de Uso</h1>
          <p className="text-muted-foreground">Actividad de usuarios, expedientes y funcionalidades</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* User KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DAU</p>
                <p className="text-2xl font-bold">456</p>
                <p className="text-xs text-muted-foreground">37% del total</p>
              </div>
              <div className="text-right">
                <span className="text-success text-sm">↑ 5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WAU</p>
                <p className="text-2xl font-bold">789</p>
                <p className="text-xs text-muted-foreground">64% del total</p>
              </div>
              <div className="text-right">
                <span className="text-success text-sm">↑ 3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MAU</p>
                <p className="text-2xl font-bold">312</p>
                <p className="text-xs text-muted-foreground">25% del total</p>
              </div>
              <div className="text-right">
                <span className="text-success text-sm">↑ 8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dau" name="DAU" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="wau" name="WAU" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="mau" name="MAU" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expedientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Expedientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">45,678</p>
                <p className="text-sm text-muted-foreground">Total expedientes</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Creados este mes</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">312</p>
                <p className="text-sm text-muted-foreground">Promedio por tenant</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Por tipo</h4>
              <div className="space-y-3">
                {matterTypes.map((t) => (
                  <div key={t.type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t.type}</span>
                      <span className="text-muted-foreground">{t.percent}%</span>
                    </div>
                    <Progress value={t.percent} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Por estado</h4>
              <div className="space-y-3">
                {matterStatus.map((s) => (
                  <div key={s.status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{s.status}</span>
                      <span className="text-muted-foreground">{s.percent}%</span>
                    </div>
                    <Progress value={s.percent} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Adoption */}
      <Card>
        <CardHeader>
          <CardTitle>Adopción de Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionalidad</TableHead>
                <TableHead className="text-right">Usuarios</TableHead>
                <TableHead className="text-right">% Adopción</TableHead>
                <TableHead className="w-48">Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-right">{f.users.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{f.adoption}%</TableCell>
                  <TableCell>
                    <Progress value={f.adoption} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Office Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronización con Oficinas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oficina</TableHead>
                <TableHead className="text-right">Syncs/día</TableHead>
                <TableHead className="text-right">Docs descargados</TableHead>
                <TableHead className="text-right">Éxito %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map((o) => (
                <TableRow key={o.office}>
                  <TableCell className="font-medium">{o.office}</TableCell>
                  <TableCell className="text-right">{o.syncsDay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{o.docs.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={o.success >= 98 ? 'text-success' : o.success >= 95 ? 'text-warning' : 'text-destructive'}>
                      {o.success}%
                    </span>
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
