// src/pages/backoffice/ai-brain.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Brain, 
  Shield, 
  FileText, 
  Database, 
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Key,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface AIProvider {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  models: string[];
  apiKeyMasked: string;
  latency: number | null;
  errorRate: number;
  circuitState: 'closed' | 'half-open' | 'open';
  baseUrl?: string;
}

interface TaskRoute {
  id: string;
  task: string;
  primary: string;
  fallback1: string;
  fallback2: string;
  timeout: number;
  maxRetries: number;
}

interface RAGBase {
  id: string;
  name: string;
  description?: string;
  docs: number;
  chunks: number;
  lastUpdate: string;
  tasks: number;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
}

// Mock data
const initialProviders: AIProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    status: 'active',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiKeyMasked: '••••••••xyz',
    latency: 1.2,
    errorRate: 0.1,
    circuitState: 'closed',
    baseUrl: 'https://api.anthropic.com'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    status: 'active',
    models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    apiKeyMasked: '••••••••abc',
    latency: 2.1,
    errorRate: 1.5,
    circuitState: 'half-open',
    baseUrl: 'https://api.openai.com'
  },
  {
    id: 'google',
    name: 'Google AI',
    status: 'error',
    models: ['gemini-pro', 'gemini-pro-vision'],
    apiKeyMasked: '••••••••def',
    latency: null,
    errorRate: 100,
    circuitState: 'open',
    baseUrl: 'https://generativelanguage.googleapis.com'
  }
];

const initialTaskRoutes: TaskRoute[] = [
  { id: '1', task: 'NEXUS GUIDE', primary: 'Claude Haiku', fallback1: 'GPT-4o-mini', fallback2: 'Mistral S', timeout: 30000, maxRetries: 3 },
  { id: '2', task: 'NEXUS OPS', primary: 'Claude Sonnet', fallback1: 'GPT-4o', fallback2: 'Claude H', timeout: 45000, maxRetries: 3 },
  { id: '3', task: 'NEXUS LEGAL', primary: 'Claude Opus', fallback1: 'GPT-4-turbo', fallback2: 'Claude S', timeout: 60000, maxRetries: 2 },
  { id: '4', task: 'NEXUS WATCH', primary: 'Claude Sonnet', fallback1: 'GPT-4o', fallback2: 'Gemini Pro', timeout: 30000, maxRetries: 3 },
  { id: '5', task: 'NEXUS STRATEGIST', primary: 'Claude Opus', fallback1: 'GPT-4-turbo', fallback2: 'Claude S', timeout: 90000, maxRetries: 2 },
  { id: '6', task: 'Email Generation', primary: 'Claude Haiku', fallback1: 'GPT-4o-mini', fallback2: 'Mistral S', timeout: 15000, maxRetries: 3 },
];

const initialRagBases: RAGBase[] = [
  { id: '1', name: 'Legal España', description: 'Legislación y jurisprudencia española de PI', docs: 450, chunks: 12340, lastUpdate: '2026-01-15', tasks: 2, embeddingModel: 'text-embedding-3-small', chunkSize: 1000, chunkOverlap: 200 },
  { id: '2', name: 'Legal Europa', description: 'Regulaciones europeas de PI (EUIPO, EPO)', docs: 1200, chunks: 45600, lastUpdate: '2026-01-14', tasks: 3, embeddingModel: 'text-embedding-3-small', chunkSize: 1000, chunkOverlap: 200 },
  { id: '3', name: 'IP-NEXUS Docs', description: 'Documentación interna de IP-NEXUS', docs: 85, chunks: 2100, lastUpdate: '2026-01-18', tasks: 2, embeddingModel: 'text-embedding-3-small', chunkSize: 800, chunkOverlap: 150 },
];

const allModels = [
  'Claude Opus', 'Claude Sonnet', 'Claude Haiku',
  'GPT-4-turbo', 'GPT-4o', 'GPT-4o-mini',
  'Gemini Pro', 'Gemini Pro Vision',
  'Mistral L', 'Mistral S'
];

export default function AIBrainPage() {
  const [activeTab, setActiveTab] = useState('providers');
  const [providers, setProviders] = useState<AIProvider[]>(initialProviders);
  const [taskRoutes, setTaskRoutes] = useState<TaskRoute[]>(initialTaskRoutes);
  const [ragBases, setRagBases] = useState<RAGBase[]>(initialRagBases);

  // Dialog states
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [ragDialogOpen, setRagDialogOpen] = useState(false);
  
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingTask, setEditingTask] = useState<TaskRoute | null>(null);
  const [editingRag, setEditingRag] = useState<RAGBase | null>(null);

  // Form states
  const [providerForm, setProviderForm] = useState({
    name: '',
    apiKey: '',
    baseUrl: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [taskForm, setTaskForm] = useState({
    task: '',
    primary: '',
    fallback1: '',
    fallback2: '',
    timeout: 30000,
    maxRetries: 3
  });

  const [ragForm, setRagForm] = useState({
    name: '',
    description: '',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 1000,
    chunkOverlap: 200
  });

  // Handlers
  const openProviderDialog = (provider?: AIProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderForm({
        name: provider.name,
        apiKey: '',
        baseUrl: provider.baseUrl || '',
        status: provider.status === 'error' ? 'inactive' : provider.status
      });
    } else {
      setEditingProvider(null);
      setProviderForm({ name: '', apiKey: '', baseUrl: '', status: 'active' });
    }
    setProviderDialogOpen(true);
  };

  const saveProvider = () => {
    if (editingProvider) {
      setProviders(prev => prev.map(p => 
        p.id === editingProvider.id 
          ? { ...p, name: providerForm.name, baseUrl: providerForm.baseUrl, status: providerForm.status, apiKeyMasked: providerForm.apiKey ? '••••••••new' : p.apiKeyMasked }
          : p
      ));
      toast.success(`Provider ${providerForm.name} actualizado`);
    } else {
      const newProvider: AIProvider = {
        id: Date.now().toString(),
        name: providerForm.name,
        status: providerForm.status,
        models: [],
        apiKeyMasked: '••••••••new',
        latency: null,
        errorRate: 0,
        circuitState: 'closed',
        baseUrl: providerForm.baseUrl
      };
      setProviders(prev => [...prev, newProvider]);
      toast.success(`Provider ${providerForm.name} creado`);
    }
    setProviderDialogOpen(false);
  };

  const openTaskDialog = (task?: TaskRoute) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        task: task.task,
        primary: task.primary,
        fallback1: task.fallback1,
        fallback2: task.fallback2,
        timeout: task.timeout,
        maxRetries: task.maxRetries
      });
    } else {
      setEditingTask(null);
      setTaskForm({ task: '', primary: '', fallback1: '', fallback2: '', timeout: 30000, maxRetries: 3 });
    }
    setTaskDialogOpen(true);
  };

  const saveTask = () => {
    if (editingTask) {
      setTaskRoutes(prev => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...taskForm } : t
      ));
      toast.success(`Task ${taskForm.task} actualizado`);
    } else {
      const newTask: TaskRoute = {
        id: Date.now().toString(),
        ...taskForm
      };
      setTaskRoutes(prev => [...prev, newTask]);
      toast.success(`Task ${taskForm.task} creado`);
    }
    setTaskDialogOpen(false);
  };

  const openRagDialog = (rag?: RAGBase) => {
    if (rag) {
      setEditingRag(rag);
      setRagForm({
        name: rag.name,
        description: rag.description || '',
        embeddingModel: rag.embeddingModel,
        chunkSize: rag.chunkSize,
        chunkOverlap: rag.chunkOverlap
      });
    } else {
      setEditingRag(null);
      setRagForm({ name: '', description: '', embeddingModel: 'text-embedding-3-small', chunkSize: 1000, chunkOverlap: 200 });
    }
    setRagDialogOpen(true);
  };

  const saveRag = () => {
    if (editingRag) {
      setRagBases(prev => prev.map(r => 
        r.id === editingRag.id ? { ...r, ...ragForm } : r
      ));
      toast.success(`RAG ${ragForm.name} actualizado`);
    } else {
      const newRag: RAGBase = {
        id: Date.now().toString(),
        ...ragForm,
        docs: 0,
        chunks: 0,
        lastUpdate: new Date().toISOString().split('T')[0],
        tasks: 0
      };
      setRagBases(prev => [...prev, newRag]);
      toast.success(`RAG ${ragForm.name} creado`);
    }
    setRagDialogOpen(false);
  };

  const testProvider = (provider: AIProvider) => {
    toast.info(`Probando conexión con ${provider.name}...`);
    setTimeout(() => {
      if (provider.status === 'error') {
        toast.error(`Error de conexión con ${provider.name}`);
      } else {
        toast.success(`Conexión exitosa con ${provider.name}`);
      }
    }, 1500);
  };

  const deleteProvider = (id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
    toast.success('Provider eliminado');
  };

  const deleteTask = (id: string) => {
    setTaskRoutes(prev => prev.filter(t => t.id !== id));
    toast.success('Task eliminado');
  };

  const deleteRag = (id: string) => {
    setRagBases(prev => prev.filter(r => r.id !== id));
    toast.success('RAG eliminado');
  };

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
          <Button variant="outline" onClick={() => toast.info('Sincronizando estados...')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Status
          </Button>
          <Button onClick={() => openProviderDialog()}>
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
                {providers.map((provider) => (
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
                    <div className="flex items-center gap-2">
                      {getStatusBadge(provider.status)}
                      {getCircuitBadge(provider.circuitState)}
                      <Button variant="outline" size="sm" onClick={() => testProvider(provider)}>
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openProviderDialog(provider)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteProvider(provider.id)}>
                        <Trash2 className="h-4 w-4" />
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Router</CardTitle>
                <CardDescription>Configuración de modelos por funcionalidad con fallbacks</CardDescription>
              </div>
              <Button onClick={() => openTaskDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
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
                      <th className="text-left py-3 px-4 font-medium">Timeout</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskRoutes.map((route) => (
                      <tr key={route.id} className="border-b">
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
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {route.timeout / 1000}s
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openTaskDialog(route)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTask(route.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                {providers.map((provider) => (
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
              <Button onClick={() => toast.info('Prompts manager próximamente')}>
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
              <Button onClick={() => openRagDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New RAG
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ragBases.map((rag) => (
                  <div key={rag.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Updated: {rag.lastUpdate}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => openRagDialog(rag)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRag(rag.id)}>
                        <Trash2 className="h-4 w-4" />
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

      {/* Provider Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Editar Provider' : 'Nuevo Provider'}</DialogTitle>
            <DialogDescription>
              Configura los datos del proveedor de IA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Nombre</Label>
              <Input
                id="provider-name"
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                placeholder="ej: Anthropic, OpenAI..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key {editingProvider && '(dejar vacío para mantener)'}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="api-key"
                  type="password"
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL (opcional)</Label>
              <Input
                id="base-url"
                value={providerForm.baseUrl}
                onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select 
                value={providerForm.status} 
                onValueChange={(v) => setProviderForm({ ...providerForm, status: v as 'active' | 'inactive' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveProvider}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Task Route' : 'Nuevo Task Route'}</DialogTitle>
            <DialogDescription>
              Configura el enrutamiento de modelos para esta tarea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Nombre de la Tarea</Label>
              <Input
                id="task-name"
                value={taskForm.task}
                onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
                placeholder="ej: NEXUS LEGAL, Email Generation..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Model</Label>
                <Select 
                  value={taskForm.primary} 
                  onValueChange={(v) => setTaskForm({ ...taskForm, primary: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {allModels.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fallback 1</Label>
                <Select 
                  value={taskForm.fallback1} 
                  onValueChange={(v) => setTaskForm({ ...taskForm, fallback1: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {allModels.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fallback 2</Label>
                <Select 
                  value={taskForm.fallback2} 
                  onValueChange={(v) => setTaskForm({ ...taskForm, fallback2: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {allModels.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={taskForm.timeout}
                  onChange={(e) => setTaskForm({ ...taskForm, timeout: parseInt(e.target.value) || 30000 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retries">Max Retries</Label>
                <Input
                  id="retries"
                  type="number"
                  value={taskForm.maxRetries}
                  onChange={(e) => setTaskForm({ ...taskForm, maxRetries: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTask}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RAG Dialog */}
      <Dialog open={ragDialogOpen} onOpenChange={setRagDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{editingRag ? 'Editar RAG' : 'Nueva Base de Conocimiento'}</DialogTitle>
            <DialogDescription>
              Configura la base de conocimiento para RAG
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rag-name">Nombre</Label>
              <Input
                id="rag-name"
                value={ragForm.name}
                onChange={(e) => setRagForm({ ...ragForm, name: e.target.value })}
                placeholder="ej: Legal España, IP Documentation..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rag-desc">Descripción</Label>
              <Textarea
                id="rag-desc"
                value={ragForm.description}
                onChange={(e) => setRagForm({ ...ragForm, description: e.target.value })}
                placeholder="Describe el contenido de esta base de conocimiento..."
              />
            </div>
            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select 
                value={ragForm.embeddingModel} 
                onValueChange={(v) => setRagForm({ ...ragForm, embeddingModel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chunk-size">Chunk Size</Label>
                <Input
                  id="chunk-size"
                  type="number"
                  value={ragForm.chunkSize}
                  onChange={(e) => setRagForm({ ...ragForm, chunkSize: parseInt(e.target.value) || 1000 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chunk-overlap">Chunk Overlap</Label>
                <Input
                  id="chunk-overlap"
                  type="number"
                  value={ragForm.chunkOverlap}
                  onChange={(e) => setRagForm({ ...ragForm, chunkOverlap: parseInt(e.target.value) || 200 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRagDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveRag}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
