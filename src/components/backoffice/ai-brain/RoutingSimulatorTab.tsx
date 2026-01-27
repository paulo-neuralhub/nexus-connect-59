// ============================================================
// IP-NEXUS AI BRAIN - ROUTING SIMULATOR TAB
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, Route, CheckCircle, XCircle, AlertTriangle, 
  ArrowRight, Zap, Clock 
} from 'lucide-react';
import { useAITaskAssignments } from '@/hooks/ai-brain';
import { 
  useSimulateModelSelection, 
  useAllTasksRouting,
  ModelSelectionResult 
} from '@/hooks/ai-brain/useAIRoutingSimulator';

export function RoutingSimulatorTab() {
  const { tasks, isLoading: tasksLoading } = useAITaskAssignments();
  const { data: tasksWithRouting, isLoading: routingLoading } = useAllTasksRouting();
  const simulateMutation = useSimulateModelSelection();
  
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [requiresVision, setRequiresVision] = useState(false);
  const [requiresTools, setRequiresTools] = useState(false);
  const [result, setResult] = useState<ModelSelectionResult | null>(null);

  const handleSimulate = async () => {
    if (!selectedTask) return;
    
    const simResult = await simulateMutation.mutateAsync({
      taskCode: selectedTask,
      requiresVision,
      requiresTools,
    });
    
    setResult(simResult);
  };

  const isLoading = tasksLoading || routingLoading;

  // Count issues
  const issueCount = tasksWithRouting?.filter(t => t.hasIssue).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Routing Simulator
          </CardTitle>
          <CardDescription>
            Test how the router selects models based on health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Task to simulate</Label>
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks?.map(task => (
                      <SelectItem key={task.id} value={task.task_code}>
                        {task.task_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vision">Requires Vision</Label>
                <Switch 
                  id="vision"
                  checked={requiresVision} 
                  onCheckedChange={setRequiresVision} 
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tools">Requires Tools</Label>
                <Switch 
                  id="tools"
                  checked={requiresTools} 
                  onCheckedChange={setRequiresTools} 
                />
              </div>

              <Button 
                onClick={handleSimulate} 
                disabled={!selectedTask || simulateMutation.isPending}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                {simulateMutation.isPending ? 'Simulating...' : 'Simulate Routing'}
              </Button>
            </div>

            {/* Result section */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium mb-4">Simulation Result</h4>
              
              {result ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Selected Model</span>
                    <Badge variant="secondary" className="font-mono">
                      {result.selected_model_code || 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Provider</span>
                    <span className="font-medium">{result.selected_provider_code || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Is Fallback?</span>
                    <Badge variant={result.is_fallback ? 'destructive' : 'outline'}>
                      {result.is_fallback ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  {result.fallback_reason && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reason</span>
                      <span className="text-sm text-orange-600">{result.fallback_reason}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Temperature</span>
                      <span>{result.temperature}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Tokens</span>
                      <span>{result.max_tokens?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Timeout</span>
                      <span>{result.timeout_ms ? `${result.timeout_ms / 1000}s` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a task and click "Simulate" to see routing result
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routing Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Routing Status Overview
              </CardTitle>
              <CardDescription>
                Current routing decisions for all active tasks
              </CardDescription>
            </div>
            {issueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {issueCount} tasks using fallback
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasksWithRouting?.map(task => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  task.hasIssue ? 'bg-orange-50 border-orange-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${task.hasIssue ? 'bg-orange-100' : 'bg-muted'}`}>
                    {task.hasIssue ? (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{task.task_name}</p>
                    <p className="text-xs text-muted-foreground">{task.module}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Primary model */}
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className={task.primaryHealthy ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50 line-through'}
                    >
                      {task.primary_model?.model_id || 'None'}
                    </Badge>
                    {task.primary_model && (
                      task.primaryHealthy ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )
                    )}
                  </div>

                  {/* Arrow to selected */}
                  {task.isFallback && (
                    <>
                      <ArrowRight className="h-4 w-4 text-orange-500" />
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {task.selectedModel?.model_id || 'None'}
                      </Badge>
                    </>
                  )}

                  {/* Timeout */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
                    <Clock className="h-3 w-3" />
                    30s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
