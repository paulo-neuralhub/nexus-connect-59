import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Play, Settings2, Trash2, RefreshCw, 
  CheckCircle, Database, Globe, History, Code
} from 'lucide-react';

export default function ImportSourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // Mock source data
  const source = isNew ? null : {
    id,
    name: 'EUIPO Sync',
    type: 'api',
    status: 'connected',
    endpoint: 'https://euipo.europa.eu/api/v1',
    lastSync: '2026-01-18T10:30:00Z',
    totalRecords: 1250,
    mapping: {
      'trademark_name': 'title',
      'application_date': 'filing_date',
      'registration_number': 'registration_number'
    }
  };

  if (isNew) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nueva Fuente de Datos</h1>
            <p className="text-muted-foreground">Configura una nueva fuente de importación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="p-3 rounded-lg bg-blue-500/10 w-fit">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">API REST</CardTitle>
              <CardDescription>
                Conecta a cualquier API REST con autenticación OAuth, API Key o Basic Auth
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="p-3 rounded-lg bg-green-500/10 w-fit">
                <Database className="h-8 w-8 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Base de Datos</CardTitle>
              <CardDescription>
                PostgreSQL, MySQL, SQL Server, MongoDB y más
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="p-3 rounded-lg bg-orange-500/10 w-fit">
                <Code className="h-8 w-8 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Web Scraping</CardTitle>
              <CardDescription>
                Extrae datos de sitios web con nuestro motor de scraping IA
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="p-3 rounded-lg bg-purple-500/10 w-fit">
                <RefreshCw className="h-8 w-8 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Webhook</CardTitle>
              <CardDescription>
                Recibe datos en tiempo real desde otros sistemas
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{source?.name}</h1>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">{source?.type} • {source?.totalRecords.toLocaleString()} registros</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Ejecutar Sync
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="mapping">Mapeo de Campos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Última Sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Hace 2 horas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{source?.totalRecords.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Frecuencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Cada 6h</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block p-3 bg-muted rounded-lg text-sm">{source?.endpoint}</code>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Mapeo de Campos</CardTitle>
              <CardDescription>Relación entre campos de origen y destino</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(source?.mapping || {}).map(([source, target]) => (
                  <div key={source} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <code className="flex-1 text-sm">{source}</code>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                    <code className="flex-1 text-sm text-primary">{target as string}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Sincronizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No hay historial disponible.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Fuente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Fuente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
