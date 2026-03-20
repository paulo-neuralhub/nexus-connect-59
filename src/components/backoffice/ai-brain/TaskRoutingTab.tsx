import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, ArrowRight } from 'lucide-react';
import { useAITasks } from '@/hooks/ai-brain/useAITasks';
import { useMemo } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  agent: '💬',
  analysis: '🔍',
  generation: '✍️',
  classification: '📋',
  search: '🌐',
  vision: '👁️',
  general: '⚙️',
};

const MODULE_LABELS: Record<string, string> = {
  legal: 'Legal',
  competitive_intelligence: 'Inteligencia Competitiva',
  document_processing: 'Procesamiento Documentos',
  document_generation: 'Generación Documentos',
  trademark_analysis: 'Análisis Marcas',
  pricing: 'Tasas / Pricing',
  assistant: 'Asistente',
  case_management: 'Gestión Expedientes',
  reporting: 'Informes',
  communications: 'Comunicaciones',
  translation: 'Traducción',
  general: 'General',
};

export function TaskRoutingTab() {
  const { data: tasks, isLoading } = useAITasks();

  const tasksByModule = useMemo(() => {
    if (!tasks) return {};
    const grouped: Record<string, typeof tasks> = {};
    tasks.forEach(task => {
      const mod = task.module || 'general';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(task);
    });
    return grouped;
  }, [tasks]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routing de Tareas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const modules = Object.keys(tasksByModule).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Routing de Tareas IA
        </CardTitle>
        <CardDescription>
          {tasks?.length || 0} tareas configuradas • Qué modelo usa cada función
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay tareas configuradas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map(mod => (
              <div key={mod}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {MODULE_LABELS[mod] || mod}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByModule[mod].length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByModule[mod].map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{CATEGORY_ICONS[task.category] || '⚙️'}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{task.task_name || task.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs font-mono">
                          {task.task_code}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-mono text-xs">
                          {task.primary_model || '—'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.primary_provider || '—'}
                        </Badge>
                        {task.temperature != null && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            T:{task.temperature}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
