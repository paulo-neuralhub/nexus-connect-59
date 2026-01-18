import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, RefreshCw, CheckCircle, XCircle, 
  Clock, Database, FileText, AlertTriangle
} from 'lucide-react';

export default function ImportJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock job data
  const job = {
    id,
    name: 'Sincronización EUIPO',
    source: 'EUIPO Sync',
    status: 'completed',
    startedAt: '2026-01-18T10:30:00Z',
    completedAt: '2026-01-18T10:32:35Z',
    duration: '2m 35s',
    stats: {
      total: 150,
      created: 45,
      updated: 100,
      skipped: 3,
      failed: 2
    },
    errors: [
      { row: 45, field: 'application_date', error: 'Formato de fecha inválido' },
      { row: 89, field: 'registration_number', error: 'Registro duplicado' }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />En proceso</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const successRate = ((job.stats.created + job.stats.updated) / job.stats.total * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/import?tab=jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{job.name}</h1>
              {getStatusBadge(job.status)}
            </div>
            <p className="text-muted-foreground">{job.source} • Duración: {job.duration}</p>
          </div>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Creados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{job.stats.created}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{job.stats.updated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Omitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{job.stats.skipped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{job.stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado de la Importación</CardTitle>
          <CardDescription>{successRate}% de tasa de éxito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={parseFloat(successRate)} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{job.stats.created + job.stats.updated} exitosos</span>
              <span className="text-muted-foreground">{job.stats.skipped} omitidos</span>
              <span className="text-destructive">{job.stats.failed} fallidos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {job.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Errores ({job.errors.length})
            </CardTitle>
            <CardDescription>Registros que no pudieron importarse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.errors.map((error, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <Badge variant="outline" className="shrink-0">Fila {error.row}</Badge>
                  <span className="text-sm font-medium">{error.field}</span>
                  <span className="text-sm text-muted-foreground">{error.error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Importación completada</p>
                <p className="text-sm text-muted-foreground">18 Ene 2026, 10:32:35</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Procesando registros</p>
                <p className="text-sm text-muted-foreground">150 registros procesados</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Importación iniciada</p>
                <p className="text-sm text-muted-foreground">18 Ene 2026, 10:30:00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
