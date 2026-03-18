import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileSearch,
  Link2,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationCheck {
  name: string;
  description: string;
  category: 'integrity' | 'completeness' | 'consistency' | 'references';
  status: 'passed' | 'warning' | 'failed';
  details: string;
  affectedCount: number;
  examples?: string[];
}

interface ValidationResult {
  overall: {
    status: 'passed' | 'warning' | 'failed';
    score: number;
    totalRecords: number;
    validRecords: number;
    warningRecords: number;
    errorRecords: number;
  };
  checks: ValidationCheck[];
  recommendations: string[];
}

interface PostImportValidationProps {
  jobId: string;
  validationResult: ValidationResult;
  onRevalidate: () => void;
  onExportReport: () => void;
}

export function PostImportValidation({ 
  jobId, 
  validationResult, 
  onRevalidate, 
  onExportReport 
}: PostImportValidationProps) {
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const { overall, checks, recommendations } = validationResult;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'integrity': return <FileSearch className="h-4 w-4" />;
      case 'completeness': return <BarChart3 className="h-4 w-4" />;
      case 'consistency': return <RefreshCw className="h-4 w-4" />;
      case 'references': return <Link2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const passedChecks = checks.filter(c => c.status === 'passed').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={cn(
        "border-2",
        overall.status === 'passed' && "border-green-500",
        overall.status === 'warning' && "border-amber-500",
        overall.status === 'failed' && "border-red-500"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              overall.status === 'passed' && "bg-green-100 dark:bg-green-900",
              overall.status === 'warning' && "bg-amber-100 dark:bg-amber-900",
              overall.status === 'failed' && "bg-red-100 dark:bg-red-900"
            )}>
              {overall.status === 'passed' && <CheckCircle2 className="h-10 w-10 text-green-600" />}
              {overall.status === 'warning' && <AlertTriangle className="h-10 w-10 text-amber-600" />}
              {overall.status === 'failed' && <XCircle className="h-10 w-10 text-red-600" />}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {overall.status === 'passed' && 'Validación Exitosa'}
                {overall.status === 'warning' && 'Validación con Advertencias'}
                {overall.status === 'failed' && 'Validación Fallida'}
              </h2>
              <p className="text-muted-foreground">
                {overall.validRecords.toLocaleString()} de {overall.totalRecords.toLocaleString()} registros válidos
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-green-600">
                  ✓ {passedChecks} checks pasados
                </span>
                {warningChecks > 0 && (
                  <span className="text-sm text-amber-600">
                    ⚠ {warningChecks} advertencias
                  </span>
                )}
                {failedChecks > 0 && (
                  <span className="text-sm text-red-600">
                    ✗ {failedChecks} errores
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold">{overall.score}%</div>
              <p className="text-sm text-muted-foreground">Puntuación</p>
              <Progress 
                value={overall.score} 
                className={cn(
                  "h-2 mt-2 w-32",
                  overall.score >= 90 && "[&>div]:bg-green-500",
                  overall.score >= 70 && overall.score < 90 && "[&>div]:bg-amber-500",
                  overall.score < 70 && "[&>div]:bg-red-500"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{overall.validRecords.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Registros Válidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-600">{overall.warningRecords.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Con Advertencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-600">{overall.errorRecords.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Con Errores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{checks.length}</p>
            <p className="text-sm text-muted-foreground">Validaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {checks.map((check, i) => (
                <Card 
                  key={i}
                  className={cn(
                    "cursor-pointer transition-all",
                    check.status === 'failed' && "border-red-200"
                  )}
                  onClick={() => {
                    setExpandedChecks(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(check.name)) {
                        newSet.delete(check.name);
                      } else {
                        newSet.add(check.name);
                      }
                      return newSet;
                    });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{check.name}</h4>
                          <Badge variant="outline" className="text-xs gap-1">
                            {getCategoryIcon(check.category)}
                            {check.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {check.description}
                        </p>
                        {check.affectedCount > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={cn("mt-2", getStatusColor(check.status))}
                          >
                            {check.affectedCount} registros afectados
                          </Badge>
                        )}
                        
                        {expandedChecks.has(check.name) && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm">{check.details}</p>
                            {check.examples && check.examples.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">Ejemplos:</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {check.examples.slice(0, 3).map((ex, j) => (
                                    <li key={j}>{ex}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">💡</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onRevalidate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Volver a validar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar informe
          </Button>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver registros importados
          </Button>
        </div>
      </div>
    </div>
  );
}
