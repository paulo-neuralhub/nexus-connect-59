// ============================================================
// IP-NEXUS - OFFICE TEMPLATE SELECTOR
// Component to select office-specific document templates
// ============================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, CheckCircle2, AlertTriangle, Globe, Shield, 
  Stamp, PenTool, FileCheck, Info, ExternalLink, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useOfficeDocumentRequirements, 
  OFFICE_CATALOG,
  type OfficeDocumentRequirement 
} from '@/hooks/useOfficeDocumentRequirements';
import { getSignatureTypeLabel } from '@/lib/templates/office-template-validator';

interface OfficeTemplateSelectorProps {
  selectedOffice?: string;
  selectedDocumentType?: string;
  onOfficeSelect: (officeCode: string) => void;
  onDocumentTypeSelect: (documentType: string) => void;
  onTemplateSelect?: (requirement: OfficeDocumentRequirement) => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, { es: string; icon: React.ElementType }> = {
  power_of_attorney: { es: 'Poder de Representación', icon: FileCheck },
  trademark_application: { es: 'Solicitud de Marca', icon: FileText },
  assignment: { es: 'Cesión / Transferencia', icon: PenTool },
  renewal: { es: 'Renovación', icon: Clock },
  opposition: { es: 'Oposición', icon: Shield },
};

export function OfficeTemplateSelector({
  selectedOffice,
  selectedDocumentType,
  onOfficeSelect,
  onDocumentTypeSelect,
  onTemplateSelect,
}: OfficeTemplateSelectorProps) {
  const { requirements, isLoading, availableOffices, getDocumentTypes, getRequirement } = 
    useOfficeDocumentRequirements();

  const selectedRequirement = selectedOffice && selectedDocumentType
    ? getRequirement(selectedOffice, selectedDocumentType)
    : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando requisitos...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Office Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Seleccionar Oficina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Object.values(OFFICE_CATALOG)
              .filter(office => availableOffices.includes(office.code))
              .map((office) => (
                <Button
                  key={office.code}
                  variant={selectedOffice === office.code ? 'default' : 'outline'}
                  className={cn(
                    'h-auto py-3 flex flex-col items-center gap-1',
                    selectedOffice === office.code && 'ring-2 ring-primary'
                  )}
                  style={{
                    borderColor: selectedOffice === office.code ? office.color : undefined,
                    backgroundColor: selectedOffice === office.code ? office.color : undefined,
                  }}
                  onClick={() => onOfficeSelect(office.code)}
                >
                  <span className="text-xl">{office.flag}</span>
                  <span className="text-xs font-medium">{office.name}</span>
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Type Selection */}
      {selectedOffice && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getDocumentTypes(selectedOffice).map((docType) => {
                const label = DOCUMENT_TYPE_LABELS[docType];
                const Icon = label?.icon || FileText;
                return (
                  <Button
                    key={docType}
                    variant={selectedDocumentType === docType ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      onDocumentTypeSelect(docType);
                      const req = getRequirement(selectedOffice, docType);
                      if (req && onTemplateSelect) {
                        onTemplateSelect(req);
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label?.es || docType}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements Display */}
      {selectedRequirement && (
        <OfficeRequirementsCard requirement={selectedRequirement} />
      )}
    </div>
  );
}

// ============================================================
// REQUIREMENTS CARD
// ============================================================
interface OfficeRequirementsCardProps {
  requirement: OfficeDocumentRequirement;
}

function OfficeRequirementsCard({ requirement }: OfficeRequirementsCardProps) {
  const office = OFFICE_CATALOG[requirement.office_code];
  const req = requirement.requirements;
  const signatureLabel = getSignatureTypeLabel(req.signature_type);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: office?.color || '#666' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-lg">{office?.flag}</span>
            <span>{office?.name}</span>
            {requirement.official_form_number && (
              <Badge variant="secondary" className="text-xs">
                {requirement.official_form_number}
              </Badge>
            )}
          </CardTitle>
          {requirement.official_form_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={requirement.official_form_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Formulario oficial
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requirements Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <RequirementItem
            icon={req.notarization_required ? AlertTriangle : CheckCircle2}
            label="Notarización"
            value={req.notarization_required ? 'Requerida' : 'No requerida'}
            isWarning={req.notarization_required}
          />
          <RequirementItem
            icon={req.electronic_signature_accepted ? CheckCircle2 : AlertTriangle}
            label="Firma electrónica"
            value={req.electronic_signature_accepted ? 'Aceptada' : 'No aceptada'}
            isWarning={!req.electronic_signature_accepted}
          />
          <RequirementItem
            icon={Globe}
            label="Idioma"
            value={req.language.toUpperCase()}
          />
          <RequirementItem
            icon={req.signature_type === 'seal_preferred' ? Stamp : PenTool}
            label="Tipo de firma"
            value={signatureLabel.es}
            isWarning={req.signature_type === 'seal_preferred' || req.signature_type === 'wet_signature'}
          />
          {req.filing_deadline_days && (
            <RequirementItem
              icon={Clock}
              label="Plazo presentación"
              value={`${req.filing_deadline_days} días`}
              isWarning
            />
          )}
          {req.translation_required && (
            <RequirementItem
              icon={Globe}
              label="Traducción"
              value="Requerida"
              isWarning
            />
          )}
        </div>

        {/* Special Notes */}
        {req.special_notes && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {req.special_notes}
            </AlertDescription>
          </Alert>
        )}

        {/* Accepted Languages */}
        {req.accepted_languages && req.accepted_languages.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Idiomas aceptados:</span>
            {req.accepted_languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs">
                {lang.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// REQUIREMENT ITEM
// ============================================================
interface RequirementItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isWarning?: boolean;
}

function RequirementItem({ icon: Icon, label, value, isWarning }: RequirementItemProps) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
      <Icon className={cn(
        'h-4 w-4 mt-0.5 shrink-0',
        isWarning ? 'text-warning' : 'text-success'
      )} />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

export default OfficeTemplateSelector;
