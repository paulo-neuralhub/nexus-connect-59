/**
 * API & Webhooks Settings Section
 * Unified view for managing API keys, webhooks, documentation, and logs
 */

import { useState } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Webhook,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  Code,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useApiKeys, 
  useCreateApiKey, 
  useRevokeApiKey, 
  useDeleteApiKey,
  useApiLogs
} from '@/hooks/use-api-keys';
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookDeliveries,
  useRetryWebhookDelivery,
  useRegenerateWebhookSecret
} from '@/hooks/use-webhooks';
import { API_SCOPES, WEBHOOK_EVENTS, WEBHOOK_DELIVERY_STATUS_CONFIG } from '@/lib/constants/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { ApiScope, WebhookEvent } from '@/types/api';

const SUPABASE_PROJECT_ID = 'dcdbpmbzizzzzdfkvohl';
const API_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/api-v1`;

export default function ApiWebhooksSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Code className="w-5 h-5" />
          API & Webhooks
        </h2>
        <p className="text-muted-foreground">
          Gestiona las claves de API y webhooks para integraciones externas
        </p>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentación
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhooksTab />
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <DocsTab />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============= API KEYS TAB =============
function ApiKeysTab() {
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const deleteMutation = useDeleteApiKey();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopes, setScopes] = useState<ApiScope[]>(['read']);
  const [expiresIn, setExpiresIn] = useState('never');
  
  const handleCreate = async () => {
    let expires_at: string | undefined;
    if (expiresIn !== 'never') {
      const days = parseInt(expiresIn);
      expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    try {
      const result = await createMutation.mutateAsync({ 
        name, 
        description, 
        scopes, 
        expires_at 
      });
      setNewKey(result.key);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setScopes(['read']);
    setExpiresIn('never');
  };
  
  const handleRevoke = async (id: string) => {
    if (!confirm('¿Revocar esta API Key? No podrá usarse más.')) return;
    await revokeMutation.mutateAsync(id);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta API Key permanentemente?')) return;
    await deleteMutation.mutateAsync(id);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };
  
  const toggleScope = (scope: ApiScope) => {
    setScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* New Key Alert */}
      {newKey && (
        <Alert className="border-success bg-success/10">
          <Check className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">API Key creada</AlertTitle>
          <AlertDescription>
            <p className="mb-3 text-foreground">Copia esta clave ahora. No podrás verla de nuevo.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-sm break-all">
                {showNewKey ? newKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowNewKey(!showNewKey)}
              >
                {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                onClick={() => copyToClipboard(newKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="link"
              className="mt-2 p-0 h-auto text-success"
              onClick={() => setNewKey(null)}
            >
              He copiado la clave, cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Claves de API
            </CardTitle>
            <CardDescription>
              Crea claves para integrar aplicaciones externas con IP-NEXUS
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva API Key</DialogTitle>
                <DialogDescription>
                  La clave solo se mostrará una vez. Guárdala en un lugar seguro.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Integración Zapier"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Para qué se usará esta API Key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Permisos</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(API_SCOPES).map(([scope, config]) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => toggleScope(scope as ApiScope)}
                        className={cn(
                          "flex items-center gap-2 p-2 border rounded-lg text-left transition-colors",
                          scopes.includes(scope as ApiScope) 
                            ? "bg-primary/10 border-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          scopes.includes(scope as ApiScope) 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground"
                        )}>
                          {scopes.includes(scope as ApiScope) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{config.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expires">Expiración</Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="180">6 meses</SelectItem>
                      <SelectItem value="365">1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!name || scopes.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear API Key'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay API Keys</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Crea una API Key para integrar con sistemas externos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map(apiKey => (
                  <TableRow key={apiKey.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{apiKey.name}</div>
                        {apiKey.description && (
                          <div className="text-xs text-muted-foreground">{apiKey.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm text-muted-foreground font-mono">
                        {apiKey.key_prefix}••••••••
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.scopes.slice(0, 2).map(scope => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                        {apiKey.scopes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{apiKey.scopes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {apiKey.last_used_at 
                        ? format(new Date(apiKey.last_used_at), 'dd/MM HH:mm', { locale: es })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      {apiKey.is_active ? (
                        <Badge className="bg-success/20 text-success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Revocada</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {apiKey.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(apiKey.id)}
                            title="Revocar"
                          >
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(apiKey.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============= WEBHOOKS TAB =============
function WebhooksTab() {
  const { data: webhooks = [], isLoading } = useWebhooks();
  const createMutation = useCreateWebhook();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  
  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ name, url, events });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const resetForm = () => {
    setName('');
    setUrl('');
    setEvents([]);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este webhook?')) return;
    await deleteMutation.mutateAsync(id);
  };
  
  const handleTest = async (id: string) => {
    await testMutation.mutateAsync(id);
  };
  
  const toggleEvent = (event: WebhookEvent) => {
    setEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  // Group events by category
  const groupedEvents = Object.entries(WEBHOOK_EVENTS).reduce((acc, [event, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ id: event as WebhookEvent, label: config.label });
    return acc;
  }, {} as Record<string, { id: WebhookEvent; label: string }[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Recibe notificaciones en tiempo real cuando ocurran eventos
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Webhook</DialogTitle>
                <DialogDescription>
                  Configura una URL para recibir notificaciones de eventos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Nombre *</Label>
                  <Input
                    id="webhook-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Notificaciones Slack"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL de destino *</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tu-servidor.com/webhook"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Eventos</Label>
                  <ScrollArea className="h-48 rounded border p-3">
                    {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                      <div key={category} className="mb-4">
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                          {category}
                        </p>
                        <div className="space-y-2">
                          {categoryEvents.map((event) => (
                            <div key={event.id} className="flex items-center gap-2">
                              <Checkbox
                                id={event.id}
                                checked={events.includes(event.id)}
                                onCheckedChange={() => toggleEvent(event.id)}
                              />
                              <Label htmlFor={event.id} className="text-sm font-normal cursor-pointer">
                                {event.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!name || !url || events.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear Webhook'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay webhooks configurados</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Crea un webhook para recibir notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(webhook => (
                <Collapsible
                  key={webhook.id}
                  open={expandedWebhook === webhook.id}
                  onOpenChange={(open) => setExpandedWebhook(open ? webhook.id : null)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            webhook.is_active ? "bg-success" : "bg-muted"
                          )} />
                          <div className="text-left">
                            <p className="font-medium">{webhook.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {webhook.url}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{webhook.events?.length || 0} eventos</Badge>
                          {webhook.is_active ? (
                            webhook.failed_deliveries > 0 ? (
                              <Badge variant="destructive">
                                {webhook.failed_deliveries} fallos
                              </Badge>
                            ) : (
                              <Badge className="bg-success/20 text-success">Activo</Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTest(webhook.id)}
                            disabled={testMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Probar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(webhook.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Eventos suscritos:</p>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events?.map((event: string) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {WEBHOOK_EVENTS[event as keyof typeof WEBHOOK_EVENTS]?.label || event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <WebhookDeliveriesSection webhookId={webhook.id} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Webhook Deliveries Section
function WebhookDeliveriesSection({ webhookId }: { webhookId: string }) {
  const { data: deliveries = [] } = useWebhookDeliveries(webhookId, 10);
  const retryMutation = useRetryWebhookDelivery();

  if (deliveries.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium mb-2">Últimas entregas:</p>
      <div className="space-y-2">
        {deliveries.map(delivery => (
          <div 
            key={delivery.id} 
            className="flex items-center justify-between p-2 bg-muted rounded text-sm"
          >
            <div className="flex items-center gap-2">
              {delivery.status === 'delivered' ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : delivery.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <RefreshCw className="w-4 h-4 text-warning animate-spin" />
              )}
              <span>{delivery.event_type}</span>
              <span className="text-muted-foreground">
                {format(new Date(delivery.created_at), 'dd/MM HH:mm', { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {delivery.response_status && (
                <Badge variant={delivery.response_status < 400 ? 'default' : 'destructive'}>
                  {delivery.response_status}
                </Badge>
              )}
              {delivery.status === 'failed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => retryMutation.mutate(delivery.id)}
                  disabled={retryMutation.isPending}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= DOCS TAB =============
function DocsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentación de la API</CardTitle>
          <CardDescription>
            Explora todos los endpoints disponibles para integrar con IP-NEXUS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="text-sm">{API_BASE_URL}</code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Autenticación</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Incluye tu API key en el header de cada petición:
            </p>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`curl -X GET "${API_BASE_URL}/matters" \\
  -H "X-API-Key: ipn_tu_api_key_aqui" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-3">Endpoints disponibles</h4>
            <div className="space-y-3">
              <EndpointDoc method="GET" path="/matters" description="Listar expedientes" />
              <EndpointDoc method="GET" path="/matters/:id" description="Obtener expediente" />
              <EndpointDoc method="POST" path="/matters" description="Crear expediente" />
              <EndpointDoc method="PUT" path="/matters/:id" description="Actualizar expediente" />
              <EndpointDoc method="GET" path="/contacts" description="Listar contactos" />
              <EndpointDoc method="GET" path="/contacts/:id" description="Obtener contacto" />
              <EndpointDoc method="POST" path="/contacts" description="Crear contacto" />
              <EndpointDoc method="GET" path="/deadlines" description="Listar plazos" />
              <EndpointDoc method="GET" path="/documents" description="Listar documentos" />
              <EndpointDoc method="GET" path="/invoices" description="Listar facturas" />
              <EndpointDoc method="GET" path="/health" description="Estado de la API" />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Códigos de respuesta</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-success/20 text-success">200</Badge>
                <span>OK - Petición exitosa</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-success/20 text-success">201</Badge>
                <span>Created - Recurso creado</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">400</Badge>
                <span>Bad Request - Error en la petición</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">401</Badge>
                <span>Unauthorized - API key inválida</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">403</Badge>
                <span>Forbidden - Sin permisos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">429</Badge>
                <span>Rate limit excedido</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Webhooks</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Los webhooks incluyen una firma HMAC-SHA256 para verificar la autenticidad:
            </p>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`// Headers incluidos en cada webhook
X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: matter.created
X-Webhook-Id: webhook-uuid

// Verificar la firma
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature === receivedSignature) {
  // Webhook válido
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EndpointDoc({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="flex items-center gap-3 p-2 border rounded">
      <Badge className={cn("font-mono text-xs", methodColors[method])}>
        {method}
      </Badge>
      <code className="text-sm flex-1">{path}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}

// ============= LOGS TAB =============
function LogsTab() {
  const { data: logs = [], isLoading } = useApiLogs(100);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'success') return log.status_code >= 200 && log.status_code < 400;
    if (filter === 'error') return log.status_code >= 400;
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Logs de actividad
          </CardTitle>
          <CardDescription>
            Últimas peticiones a la API
          </CardDescription>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="success">Exitosas</SelectItem>
            <SelectItem value="error">Errores</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay logs de actividad</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{log.endpoint}</code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          log.status_code >= 200 && log.status_code < 400
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        )}
                      >
                        {log.status_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
