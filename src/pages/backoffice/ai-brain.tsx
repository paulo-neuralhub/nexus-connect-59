// src/pages/backoffice/ai-brain.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Zap, 
  Shield, 
  FileText, 
  Database, 
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  Settings,
  Plus,
  Eye
} from 'lucide-react';

// Mock data for AI providers
const aiProviders = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    status: 'active',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiKeyMasked: '••••••••xyz',
    latency: 1.2,
    errorRate: 0.1,
    circuitState: 'closed'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    status: 'active',
    models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    apiKeyMasked: '••••••••abc',
    latency: 2.1,
    errorRate: 1.5,
    circuitState: 'half-open'
  },
  {
    id: 'google',
    name: 'Google AI',
    status: 'error',
    models: ['gemini-pro', 'gemini-pro-vision'],
    apiKeyMasked: '••••••••def',
    latency: null,
    errorRate: 100,
    circuitState: 'open'
  }
];

const taskRoutes = [
  { task: 'NEXUS GUIDE', primary: 'Claude Haiku', fallback1: 'GPT-4o-mini', fallback2: 'Mistral S' },
  { task: 'NEXUS OPS', primary: 'Claude Sonnet', fallback1: 'GPT-4o', fallback2: 'Claude H' },
  { task: 'NEXUS LEGAL', primary: 'Claude Opus', fallback1: 'GPT-4-turbo', fallback2: 'Claude S' },
  { task: 'NEXUS WATCH', primary: 'Claude Sonnet', fallback1: 'GPT-4o', fallback2: 'Gemini Pro' },
  { task: 'NEXUS STRATEGIST', primary: 'Claude Opus', fallback1: 'GPT-4-turbo', fallback2: 'Claude S' },
  { task: 'Email Generation', primary: 'Claude Haiku', fallback1: 'GPT-4o-mini', fallback2: 'Mistral S' },
];

const ragKnowledgeBases = [
  { name: 'Legal España', docs: 450, chunks: 12340, lastUpdate: '2026-01-15', tasks: 2 },
  { name: 'Legal Europa', docs: 1200, chunks: 45600, lastUpdate: '2026-01-14', tasks: 3 },
  { name: 'IP-NEXUS Docs', docs: 85, chunks: 2100, lastUpdate: '2026-01-18', tasks: 2 },
];

export default function AIBrainPage() {
  const [activeTab, setActiveTab] = useState('providers');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Activo</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCircuitBadge = (state: string) => {
    switch (state) {
      case 'closed':
        return <Badge className="bg-green-500/10 text-green-600">🟢 CLOSED</Badge>;
      case 'half-open':
        return <Badge className="bg-yellow-500/10 text-yellow-600">🟡 HALF-OPEN</Badge>;
      case 'open':
        return <Badge className="bg-red-500/10 text-red-600">🔴 OPEN</Badge>;
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Brain
          </h1>
          <p className="text-muted-foreground">
            Sistema centralizado de IA con redundancia y optimización
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Status
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens (Enero)</p>
                <p className="text-2xl font-bold">58M</p>
                <p className="text-xs text-muted-foreground">45.2M in / 12.8M out</p>
              </div>
              <Cpu className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coste Total</p>
                <p className="text-2xl font-bold">€2,340</p>
                <p className="text-xs text-green-600">-12% vs mes anterior</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latencia Promedio</p>
                <p className="text-2xl font-bold">1.4s</p>
                <p className="text-xs text-muted-foreground">P95: 3.2s</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.7%</p>
                <p className="text-xs text-muted-foreground">Últimos 30 días</p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="router">Task Router</TabsTrigger>
          <TabsTrigger value="circuit">Circuit Breaker</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="rag">RAG</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>Gestión de proveedores de IA y sus API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.models.length} modelos • API Key: {provider.apiKeyMasked}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(provider.status)}
                      {getCircuitBadge(provider.circuitState)}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Router Tab */}
        <TabsContent value="router" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Router</CardTitle>
              <CardDescription>Configuración de modelos por funcionalidad con fallbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Task</th>
                      <th className="text-left py-3 px-4 font-medium">Primary</th>
                      <th className="text-left py-3 px-4 font-medium">Fallback 1</th>
                      <th className="text-left py-3 px-4 font-medium">Fallback 2</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskRoutes.map((route) => (
                      <tr key={route.task} className="border-b">
                        <td className="py-3 px-4 font-medium">{route.task}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{route.primary}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{route.fallback1}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{route.fallback2}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Circuit Breaker Tab */}
        <TabsContent value="circuit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breaker Status</CardTitle>
              <CardDescription>Monitoreo en tiempo real del estado de los circuitos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiProviders.map((provider) => (
                  <div key={provider.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{provider.name}</span>
                        {getCircuitBadge(provider.circuitState)}
                      </div>
                      <Switch checked={provider.status === 'active'} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Latency</p>
                        <p className="font-medium">
                          {provider.latency ? `${provider.latency}s` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Error Rate</p>
                        <p className={`font-medium ${provider.errorRate > 5 ? 'text-destructive' : ''}`}>
                          {provider.errorRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{provider.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prompts Manager</CardTitle>
                <CardDescription>Gestión y versionado de prompts del sistema</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Prompts manager coming soon</p>
                <p className="text-sm">Gestión de prompts con A/B testing y versionado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAG Tab */}
        <TabsContent value="rag" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>RAG Knowledge Bases</CardTitle>
                <CardDescription>Bases de conocimiento para retrieval augmented generation</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New RAG
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ragKnowledgeBases.map((rag) => (
                  <div key={rag.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{rag.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rag.docs} docs • {rag.chunks.toLocaleString()} chunks • {rag.tasks} tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Updated: {rag.lastUpdate}
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Analytics</CardTitle>
              <CardDescription>Métricas de consumo y costes por provider y task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Anthropic</span>
                    <span className="text-sm font-medium">€1,850 (79%)</span>
                  </div>
                  <Progress value={79} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">OpenAI</span>
                    <span className="text-sm font-medium">€380 (16%)</span>
                  </div>
                  <Progress value={16} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Others</span>
                    <span className="text-sm font-medium">€110 (5%)</span>
                  </div>
                  <Progress value={5} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
