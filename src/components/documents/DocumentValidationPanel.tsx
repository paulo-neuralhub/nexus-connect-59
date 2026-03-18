// ============================================================
// DocumentValidationPanel Component
// Validates document against jurisdiction requirements
// ============================================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  FileCheck,
} from 'lucide-react';
import type { JurisdictionDocumentRequirement } from '@/types/jurisdiction-requirements';
import { validateDocument, canGenerateDocument } from '@/lib/document-validation-engine';
import type { ValidationResult, ValidationError } from '@/types/jurisdiction-requirements';

interface DocumentValidationPanelProps {
  documentData: Record<string, unknown>;
  requirement: JurisdictionDocumentRequirement;
  language?: 'en' | 'es';
  showPreValidation?: boolean;
}

export function DocumentValidationPanel({
  documentData,
  requirement,
  language = 'en',
  showPreValidation = true,
}: DocumentValidationPanelProps) {
  // Run validation
  const validationResult = useMemo(
    () => validateDocument(documentData, requirement, language),
    [documentData, requirement, language]
  );

  // Pre-generation check
  const preGenCheck = useMemo(
    () => canGenerateDocument(documentData, requirement),
    [documentData, requirement]
  );

  // Calculate completion percentage
  const totalFields = requirement.required_fields.length;
  const filledFields = requirement.required_fields.filter(
    field => {
      const value = documentData[field.key];
      return value !== undefined && value !== null && value !== '';
    }
  ).length;
  const completionPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 100;

  const ValidationItem = ({ 
    error, 
    type 
  }: { 
    error: ValidationError; 
    type: 'error' | 'warning' | 'info' 
  }) => {
    const Icon = type === 'error' ? XCircle : type === 'warning' ? AlertTriangle : Info;
    const colorClass = 
      type === 'error' ? 'text-red-600' : 
      type === 'warning' ? 'text-amber-600' : 
      'text-blue-600';

    return (
      <div className={`flex items-start gap-2 py-2 ${colorClass}`}>
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm">{error.message}</span>
          {error.field && error.field !== 'document' && (
            <Badge variant="outline" className="ml-2 text-xs">
              {error.field}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {language === 'es' ? 'Validación del Documento' : 'Document Validation'}
          </CardTitle>
          <Badge 
            variant={validationResult.isValid ? 'default' : 'destructive'}
            className={validationResult.isValid ? 'bg-green-100 text-green-800' : ''}
          >
            {validationResult.isValid 
              ? (language === 'es' ? 'Válido' : 'Valid')
              : (language === 'es' ? 'Errores encontrados' : 'Errors found')
            }
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'es' ? 'Campos completados' : 'Fields completed'}
            </span>
            <span className="font-medium">{filledFields}/{totalFields} ({completionPercent}%)</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Pre-generation Check */}
        {showPreValidation && !preGenCheck.canGenerate && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4" />
            <AlertTitle>
              {language === 'es' ? 'No se puede generar' : 'Cannot Generate'}
            </AlertTitle>
            <AlertDescription>
              {preGenCheck.missingFields.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">
                    {language === 'es' ? 'Campos faltantes:' : 'Missing fields:'}
                  </span>
                  <ul className="list-disc list-inside ml-2">
                    {preGenCheck.missingFields.map((field, idx) => (
                      <li key={idx} className="text-sm">{field}</li>
                    ))}
                  </ul>
                </div>
              )}
              {preGenCheck.blockingErrors.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">
                    {language === 'es' ? 'Errores:' : 'Errors:'}
                  </span>
                  <ul className="list-disc list-inside ml-2">
                    {preGenCheck.blockingErrors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Valid State */}
        {validationResult.isValid && preGenCheck.canGenerate && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              {language === 'es' ? 'Documento válido' : 'Document Valid'}
            </AlertTitle>
            <AlertDescription className="text-green-700">
              {language === 'es' 
                ? 'El documento cumple con todos los requisitos de la oficina.'
                : 'The document meets all office requirements.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {validationResult.errors.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {language === 'es' ? 'Errores' : 'Errors'} ({validationResult.errors.length})
            </h4>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              {validationResult.errors.map((error, idx) => (
                <ValidationItem key={idx} error={error} type="error" />
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {validationResult.warnings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {language === 'es' ? 'Advertencias' : 'Warnings'} ({validationResult.warnings.length})
              </h4>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                {validationResult.warnings.map((warning, idx) => (
                  <ValidationItem key={idx} error={warning} type="warning" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info */}
        {validationResult.infos.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                {language === 'es' ? 'Información' : 'Information'} ({validationResult.infos.length})
              </h4>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                {validationResult.infos.map((info, idx) => (
                  <ValidationItem key={idx} error={info} type="info" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Requirement Summary */}
        <Separator />
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileCheck className="h-3 w-3" />
            {language === 'es' ? 'Validando contra:' : 'Validating against:'}{' '}
            <span className="font-medium">
              {requirement.office_code} - {requirement.document_type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
