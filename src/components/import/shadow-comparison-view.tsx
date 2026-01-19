import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Eye,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  RefreshCw,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShadowComparison, useApplyShadowImport } from '@/hooks/use-shadow-import';
import type { ShadowComparison, ShadowDetail, FieldDiff } from '@/types/universal-import';

interface ShadowComparisonViewProps {
  jobId: string;
  onApply: () => void;
  onCancel: () => void;
}

export function ShadowComparisonView({ jobId, onApply, onCancel }: ShadowComparisonViewProps) {
  const { data: comparison, isLoading, error } = useShadowComparison(jobId);
  const applyImport = useApplyShadowImport();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Generando comparativa...</h3>
          <p className="text-sm text-muted-foreground">
            Analizando diferencias con los datos actuales
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error || !comparison) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium">Error al cargar comparativa</h3>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-500" />;
      case 'update': return <Pencil className="h-4 w-4 text-blue-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Nuevo';
      case 'update': return 'Modificar';
      case 'delete': return 'Eliminar';
      case 'conflict': return 'Conflicto';
      default: return action;
    }
  };

  const handleApply = async () => {
    await applyImport.mutateAsync(jobId);
    onApply();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Modo Shadow - Vista Previa</CardTitle>
              <CardDescription>
                Revisa los cambios antes de aplicarlos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <Plus className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {comparison.summary.new_records}
              </p>
              <p className="text-xs text-green-600">Nuevos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Pencil className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {comparison.summary.modified_records}
              </p>
              <p className="text-xs text-blue-600">Modificados</p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {comparison.summary.conflicts}
              </p>
              <p className="text-xs text-amber-600">Conflictos</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {comparison.summary.unchanged_records}
              </p>
              <p className="text-xs text-muted-foreground">Sin cambios</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {comparison.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {comparison.recommendations.map((rec, i) => (
              <div 
                key={i}
                className={cn(
                  "p-3 rounded-lg flex items-start gap-3",
                  rec.type === 'warning' && "bg-amber-50 dark:bg-amber-950",
                  rec.type === 'info' && "bg-blue-50 dark:bg-blue-950",
                  rec.type === 'action_required' && "bg-red-50 dark:bg-red-950"
                )}
              >
                {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />}
                {rec.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                {rec.type === 'action_required' && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                <div>
                  <p className="font-medium text-sm">{rec.message}</p>
                  {rec.suggested_action && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {rec.suggested_action}
                    </p>
                  )}
                  {rec.affected_records > 0 && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {rec.affected_records} registros afectados
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalle de Cambios</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({comparison.details.length})
              </TabsTrigger>
              <TabsTrigger value="create">
                Nuevos ({comparison.details.filter(d => d.action === 'create').length})
              </TabsTrigger>
              <TabsTrigger value="update">
                Modificados ({comparison.details.filter(d => d.action === 'update').length})
              </TabsTrigger>
              <TabsTrigger value="conflict">
                Conflictos ({comparison.details.filter(d => d.action === 'conflict').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {comparison.details
                    .filter(d => activeTab === 'all' || d.action === activeTab)
                    .map((detail, i) => (
                      <Collapsible 
                        key={i}
                        open={expandedItems.has(`${detail.entity}-${detail.source_id}`)}
                        onOpenChange={() => toggleExpand(`${detail.entity}-${detail.source_id}`)}
                      >
                        <Card>
                          <CollapsibleTrigger asChild>
                            <CardContent className="p-3 cursor-pointer hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                {getActionIcon(detail.action)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {detail.entity}
                                    </Badge>
                                    <span className="font-mono text-sm truncate">
                                      {detail.source_id}
                                    </span>
                                  </div>
                                  {detail.diff && detail.diff.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {detail.diff.length} campo(s) modificado(s)
                                    </p>
                                  )}
                                </div>
                                <Badge variant={
                                  detail.action === 'create' ? 'default' :
                                  detail.action === 'update' ? 'secondary' :
                                  detail.action === 'conflict' ? 'destructive' : 'outline'
                                }>
                                  {getActionLabel(detail.action)}
                                </Badge>
                                {expandedItems.has(`${detail.entity}-${detail.source_id}`) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="px-3 pb-3 border-t">
                              {detail.action === 'create' && detail.new_data && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium mb-2">Datos a crear:</p>
                                  <div className="bg-muted p-2 rounded text-xs font-mono overflow-auto">
                                    <pre>{JSON.stringify(detail.new_data, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                              
                              {detail.action === 'update' && detail.diff && (
                                <Table className="mt-3">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-1/4">Campo</TableHead>
                                      <TableHead className="w-1/3">Valor actual</TableHead>
                                      <TableHead className="w-1/12"></TableHead>
                                      <TableHead className="w-1/3">Nuevo valor</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {detail.diff.map((diff, j) => (
                                      <TableRow key={j}>
                                        <TableCell className="font-medium">{diff.field}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {String(diff.current_value || '—')}
                                        </TableCell>
                                        <TableCell>
                                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className={cn(
                                          diff.significance === 'high' && "text-amber-600 font-medium"
                                        )}>
                                          {String(diff.new_value || '—')}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                              
                              {detail.action === 'conflict' && (
                                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded">
                                  <p className="text-sm text-amber-800 dark:text-amber-200">
                                    Este registro ha sido modificado tanto en el origen como en IP-NEXUS.
                                    Requiere revisión manual.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Volver a analizar
          </Button>
          <Button 
            onClick={handleApply}
            disabled={applyImport.isPending || comparison.summary.conflicts > 0}
          >
            {applyImport.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Aplicar importación
            {comparison.summary.new_records + comparison.summary.modified_records > 0 && (
              <Badge variant="secondary" className="ml-2">
                {comparison.summary.new_records + comparison.summary.modified_records}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
