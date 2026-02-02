// ============================================================
// JurisdictionRequirementsCard Component
// Display document requirements for a specific jurisdiction/office
// ============================================================

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileSignature,
  Globe,
  Shield,
  Stamp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  Info,
  FileText,
  Languages,
} from 'lucide-react';
import { useState } from 'react';
import type { JurisdictionDocumentRequirement } from '@/types/jurisdiction-requirements';
import { 
  OFFICE_INFO, 
  SIGNATURE_TYPE_LABELS 
} from '@/types/jurisdiction-requirements';
import { getRequirementWarnings, getRequirementTips } from '@/lib/document-validation-engine';

interface JurisdictionRequirementsCardProps {
  requirement: JurisdictionDocumentRequirement;
  language?: 'en' | 'es';
  showDetails?: boolean;
  onGenerateDocument?: () => void;
}

export function JurisdictionRequirementsCard({
  requirement,
  language = 'en',
  showDetails = true,
  onGenerateDocument,
}: JurisdictionRequirementsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const officeInfo = OFFICE_INFO[requirement.office_code];
  const signatureLabel = SIGNATURE_TYPE_LABELS[requirement.signature_type];
  const warnings = getRequirementWarnings(requirement, language);
  const tips = getRequirementTips(requirement);

  const RequirementRow = ({ 
    icon: Icon, 
    label, 
    value, 
    variant = 'default',
    tooltip,
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error';
    tooltip?: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-sm font-medium">
        {typeof value === 'string' ? (
          <Badge 
            variant={
              variant === 'success' ? 'default' : 
              variant === 'warning' ? 'secondary' : 
              variant === 'error' ? 'destructive' : 
              'outline'
            }
            className={
              variant === 'success' ? 'bg-green-100 text-green-800 border-green-200' : ''
            }
          >
            {value}
          </Badge>
        ) : value}
      </div>
    </div>
  );

  return (
    <Card className="border-l-4" style={{ borderLeftColor: officeInfo?.color || '#666' }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{officeInfo?.flag || '🏢'}</span>
            <div>
              <CardTitle className="text-lg">
                {officeInfo?.name || requirement.office_code}
              </CardTitle>
              <CardDescription className="capitalize">
                {requirement.document_type.replace(/_/g, ' ')}
              </CardDescription>
            </div>
          </div>
          {onGenerateDocument && (
            <Button size="sm" onClick={onGenerateDocument}>
              <FileText className="h-4 w-4 mr-1" />
              {language === 'es' ? 'Generar' : 'Generate'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Requirements */}
        <div className="space-y-1">
          <RequirementRow
            icon={Shield}
            label={language === 'es' ? 'Poder requerido' : 'POA Required'}
            value={
              requirement.poa_required
                ? (language === 'es' ? 'Sí' : 'Yes')
                : (language === 'es' ? 'No' : 'No')
            }
            variant={requirement.poa_required ? 'warning' : 'success'}
            tooltip={requirement.poa_required_condition?.replace(/_/g, ' ')}
          />
          
          <RequirementRow
            icon={FileSignature}
            label={language === 'es' ? 'Tipo de firma' : 'Signature Type'}
            value={language === 'es' ? signatureLabel.es : signatureLabel.en}
            variant={
              requirement.signature_type === 'wet_signature' ? 'warning' :
              requirement.signature_type === 'seal' ? 'warning' :
              'default'
            }
          />
          
          <RequirementRow
            icon={Languages}
            label={language === 'es' ? 'Idioma oficial' : 'Official Language'}
            value={requirement.official_language.toUpperCase()}
          />
          
          <RequirementRow
            icon={Stamp}
            label={language === 'es' ? 'Notarización' : 'Notarization'}
            value={
              requirement.notarization_required
                ? (language === 'es' ? 'Requerida' : 'Required')
                : (language === 'es' ? 'No requerida' : 'Not required')
            }
            variant={requirement.notarization_required ? 'warning' : 'success'}
          />
          
          <RequirementRow
            icon={Globe}
            label={language === 'es' ? 'Firma electrónica' : 'E-Signature'}
            value={
              <span className="flex items-center gap-1">
                {requirement.electronic_signature_accepted ? (
                  <><Check className="h-3 w-3 text-green-600" /> {language === 'es' ? 'Aceptada' : 'Accepted'}</>
                ) : (
                  <><X className="h-3 w-3 text-red-600" /> {language === 'es' ? 'No aceptada' : 'Not accepted'}</>
                )}
              </span>
            }
          />
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <ul className="list-disc list-inside text-sm space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {language === 'es' ? 'Ver detalles' : 'View details'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <Separator />
              
              {/* Required Fields */}
              {requirement.required_fields.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {language === 'es' ? 'Campos requeridos' : 'Required Fields'}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {requirement.required_fields.map((field, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {language === 'es' ? field.label_es || field.label_en : field.label_en}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Languages */}
              {requirement.accepted_languages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {language === 'es' ? 'Idiomas aceptados' : 'Accepted Languages'}
                  </h4>
                  <div className="flex gap-1">
                    {requirement.accepted_languages.map((lang, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs uppercase">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {tips.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-800">
                    <Lightbulb className="h-4 w-4" />
                    {language === 'es' ? 'Consejos' : 'Tips'}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {(requirement.notes_en || requirement.notes_es) && (
                <div className="text-sm text-muted-foreground">
                  {language === 'es' ? requirement.notes_es : requirement.notes_en}
                </div>
              )}

              {/* Official Guidelines Link */}
              {requirement.official_guidelines_url && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={requirement.official_guidelines_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Ver guías oficiales' : 'View official guidelines'}
                  </a>
                </Button>
              )}

              {/* Form URL */}
              {requirement.official_form_url && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={requirement.official_form_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Descargar formulario' : 'Download form'}
                    {requirement.official_form_number && ` (${requirement.official_form_number})`}
                  </a>
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
