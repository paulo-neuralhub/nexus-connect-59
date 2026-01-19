import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Play, 
  Pause, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { 
  useWorkflowTemplate, 
  useWorkflowExecutions,
  useToggleWorkflowActive,
  useTriggerWorkflowManually
} from '@/hooks/workflow/useWorkflows';
import { WORKFLOW_TRIGGER_TYPES, WORKFLOW_ACTION_TYPES } from '@/types/workflow.types';

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: workflow, isLoading } = useWorkflowTemplate(id);
  const { data: executions = [] } = useWorkflowExecutions({ workflowId: id, limit: 10 });
  const toggleActive = useToggleWorkflowActive();
  const triggerManually = useTriggerWorkflowManually();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Workflow no encontrado</h2>
        <Button onClick={() => navigate('/app/workflow')}>Volver</Button>
      </div>
    );
  }

  const triggerInfo = WORKFLOW_TRIGGER_TYPES.find(t => t.type === workflow.trigger_type);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/workflow')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                {workflow.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {workflow.is_active ? 'Activo' : 'Inactivo'}
            </span>
            <Switch
              checked={workflow.is_active}
              onCheckedChange={(checked) => toggleActive.mutate({ id: workflow.id, isActive: checked })}
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => triggerManually.mutate({ workflowId: workflow.id })}
            disabled={!workflow.is_active || triggerManually.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            Ejecutar
          </Button>
          <Button onClick={() => navigate(`/app/workflow/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.execution_count}</p>
                <p className="text-sm text-muted-foreground">Ejecuciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{triggerInfo?.label}</p>
                <p className="text-sm text-muted-foreground">Disparador</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.actions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Acciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {workflow.last_executed_at 
                    ? new Date(workflow.last_executed_at).toLocaleDateString('es-ES')
                    : 'Nunca'}
                </p>
                <p className="text-sm text-muted-foreground">Última ejecución</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones del Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(workflow.actions || []).map((action: any, index: number) => {
              const actionType = WORKFLOW_ACTION_TYPES.find(t => t.type === action.type);
              return (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div className="flex-1">
                    <p className="font-medium">{action.name}</p>
                    <p className="text-sm text-muted-foreground">{actionType?.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecuciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay ejecuciones registradas
            </p>
          ) : (
            <div className="space-y-2">
              {executions.map(exec => (
                <div 
                  key={exec.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
                  onClick={() => navigate(`/app/workflow/execution/${exec.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {exec.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : exec.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">{exec.trigger_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {exec.actions_completed} acciones completadas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(exec.status)}>
                      {exec.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(exec.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
