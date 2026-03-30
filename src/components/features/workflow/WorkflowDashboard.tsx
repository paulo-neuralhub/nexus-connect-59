import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Plus, 
  Settings, 
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeoBadge } from '@/components/ui/neo-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { 
  useWorkflowTemplates, 
  useWorkflowExecutions, 
  useWorkflowStats,
  useToggleWorkflowActive,
  useDeleteWorkflowTemplate,
  useTriggerWorkflowManually
} from '@/hooks/workflow/useWorkflows';
import { usePendingApprovalsCount } from '@/hooks/workflow/useWorkflowApprovals';
import { WORKFLOW_TRIGGER_TYPES } from '@/types/workflow.types';
import type { WorkflowTemplate, WorkflowExecution } from '@/types/workflow.types';
import { InlineHelp } from '@/components/help';

// Color mapping for Workflow KPIs
const WORKFLOW_COLORS: Record<string, string> = {
  active: '#00b4d8',     // accent cyan
  executions: '#2563eb', // blue
  successful: '#10b981', // green
  failed: '#ef4444',     // red
};

export function WorkflowDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('workflows');

  const { data: workflows = [], isLoading: loadingWorkflows } = useWorkflowTemplates();
  const { data: executions = [], isLoading: loadingExecutions } = useWorkflowExecutions({ limit: 50 });
  const { data: stats } = useWorkflowStats(30);
  const { data: pendingCount = 0 } = usePendingApprovalsCount();
  
  const toggleActive = useToggleWorkflowActive();
  const deleteWorkflow = useDeleteWorkflowTemplate();
  const triggerManually = useTriggerWorkflowManually();

  // Filter workflows
  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = !search || 
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (w.trigger_type || '') === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTriggerInfo = (type: string) => {
    return WORKFLOW_TRIGGER_TYPES.find(t => t.type === type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      onboarding: 'bg-blue-100 text-blue-700',
      deadlines: 'bg-orange-100 text-orange-700',
      notifications: 'bg-blue-100 text-blue-700',
      crm: 'bg-pink-100 text-pink-700',
      billing: 'bg-amber-100 text-amber-700',
      spider: 'bg-red-100 text-red-700',
      custom: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.custom;
  };

  const activeWorkflowsCount = workflows.filter(w => w.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Workflows
            <InlineHelp text="Motor de automatización para crear flujos de trabajo. Configura triggers (plazos, eventos, fechas) y acciones automáticas (emails, tareas, cambios de estado)." />
          </h1>
          <p className="text-muted-foreground">Automatiza procesos con flujos de trabajo inteligentes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/app/workflow/templates')}>
            <Copy className="h-4 w-4 mr-2" />
            Plantillas
          </Button>
          <Button onClick={() => navigate('/app/workflow/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards with NeoBadge */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Workflows Activos"
          value={activeWorkflowsCount}
          color={WORKFLOW_COLORS.active}
        />
        <StatCard
          label="Ejecuciones (30d)"
          value={stats?.total_executions || 0}
          color={WORKFLOW_COLORS.executions}
        />
        <StatCard
          label="Exitosas"
          value={stats?.successful || 0}
          color={WORKFLOW_COLORS.successful}
        />
        <StatCard
          label="Fallidas"
          value={stats?.failed || 0}
          color={WORKFLOW_COLORS.failed}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar workflows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="deadlines">Plazos</SelectItem>
                <SelectItem value="notifications">Notificaciones</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="billing">Facturación</SelectItem>
                <SelectItem value="spider">Spider</SelectItem>
                <SelectItem value="custom">Personalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workflows List */}
          {loadingWorkflows ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No hay workflows</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Crea tu primer workflow o usa una plantilla
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/app/workflow/templates')}>
                    Ver Plantillas
                  </Button>
                  <Button onClick={() => navigate('/app/workflow/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredWorkflows.map(workflow => {
                const triggerInfo = getTriggerInfo(workflow.trigger_type);
                
                return (
                  <div 
                    key={workflow.id}
                    className="group cursor-pointer transition-all duration-200"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      background: '#f1f4f9',
                      marginBottom: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(0, 180, 216, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Workflow icon - SILK style */}
                      <div 
                        style={{ 
                          width: '32px', 
                          height: '32px',
                          borderRadius: '8px',
                          background: workflow.is_active 
                            ? 'rgba(0, 180, 216, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Zap 
                          size={14} 
                          style={{ 
                            color: workflow.is_active ? '#00b4d8' : '#94a3b8' 
                          }} 
                        />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span 
                            style={{ 
                              fontSize: '14px', 
                              fontWeight: 700, 
                              color: '#0a2540' 
                            }}
                            className="truncate"
                          >
                            {workflow.name}
                          </span>
                          
                          {workflow.is_system && (
                            <span 
                              style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '5px',
                                background: '#10b9810a',
                                color: '#10b981'
                              }}
                            >
                              Sistema
                            </span>
                          )}
                        </div>
                        
                        <div 
                          style={{ 
                            fontSize: '12px', 
                            color: '#64748b',
                            marginBottom: '6px'
                          }}
                          className="truncate"
                        >
                          {workflow.description || `Trigger: ${triggerInfo?.label || workflow.trigger_type}`}
                        </div>
                        
                        {/* Tags and info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(0, 0, 0, 0.04)',
                              color: '#94a3b8'
                            }}
                          >
                            {workflow.category}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {workflow.actions?.length || 0} acciones
                          </span>
                          {workflow.execution_count > 0 && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              • {workflow.execution_count} ejecuciones
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Toggle and menu */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {workflow.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <Switch
                            checked={workflow.is_active}
                            onCheckedChange={(checked) => 
                              toggleActive.mutate({ id: workflow.id, isActive: checked })
                            }
                            disabled={toggleActive.isPending}
                          />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/workflow/${workflow.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/app/workflow/${workflow.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => triggerManually.mutate({ workflowId: workflow.id })}
                              disabled={!workflow.is_active}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Ejecutar Manualmente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('¿Eliminar este workflow?')) {
                                  deleteWorkflow.mutate(workflow.id);
                                }
                              }}
                              disabled={workflow.is_system}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="executions" className="mt-4">
          {loadingExecutions ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : executions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Sin ejecuciones</h3>
                <p className="text-muted-foreground text-sm">
                  Las ejecuciones de workflows aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {executions.map(execution => (
                    <div 
                      key={execution.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/app/workflow/execution/${execution.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          execution.status === 'completed' && "bg-emerald-100",
                          execution.status === 'running' && "bg-blue-100",
                          execution.status === 'failed' && "bg-red-100",
                          execution.status === 'pending' && "bg-yellow-100"
                        )}>
                          {execution.status === 'running' ? (
                            <Spinner className="h-4 w-4" />
                          ) : execution.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : execution.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium">
                            {(execution.workflow as any)?.name || 'Workflow'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {execution.trigger_type} • {execution.actions_completed}/{(execution.workflow as any)?.actions?.length || 0} acciones
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(execution.started_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <Card 
      className="border border-black/[0.06] rounded-[14px] hover:border-[rgba(0,180,216,0.15)] transition-colors"
      style={{ background: '#f1f4f9' }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <NeoBadge
            value={value}
            color={value > 0 ? color : '#94a3b8'}
            size="md"
          />
          <div>
            <p 
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: '#0a2540' }}
            >
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
