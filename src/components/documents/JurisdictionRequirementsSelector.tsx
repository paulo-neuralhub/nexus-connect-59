// ============================================================
// JurisdictionRequirementsSelector Component
// Select office and document type, view requirements
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Globe } from 'lucide-react';
import { 
  useJurisdictionRequirements, 
  useDocumentTypesForOffice 
} from '@/hooks/useJurisdictionRequirements';
import { JurisdictionRequirementsCard } from './JurisdictionRequirementsCard';
import { OFFICE_INFO } from '@/types/jurisdiction-requirements';

interface JurisdictionRequirementsSelectorProps {
  onSelectRequirement?: (requirement: any) => void;
  initialOffice?: string;
  initialDocumentType?: string;
  language?: 'en' | 'es';
}

export function JurisdictionRequirementsSelector({
  onSelectRequirement,
  initialOffice,
  initialDocumentType,
  language = 'en',
}: JurisdictionRequirementsSelectorProps) {
  const [selectedOffice, setSelectedOffice] = useState<string>(initialOffice || '');
  const [selectedDocType, setSelectedDocType] = useState<string>(initialDocumentType || '');

  // Fetch all requirements to get available offices
  const { data: allRequirements, isLoading: loadingRequirements } = useJurisdictionRequirements();
  
  // Get unique offices
  const offices = allRequirements 
    ? [...new Set(allRequirements.map(r => r.office_code))]
    : [];

  // Get document types for selected office
  const { data: documentTypes, isLoading: loadingDocTypes } = useDocumentTypesForOffice(selectedOffice);

  // Get selected requirement
  const selectedRequirement = allRequirements?.find(
    r => r.office_code === selectedOffice && r.document_type === selectedDocType
  );

  const handleOfficeChange = (office: string) => {
    setSelectedOffice(office);
    setSelectedDocType(''); // Reset document type when office changes
  };

  const handleDocTypeChange = (docType: string) => {
    setSelectedDocType(docType);
    const requirement = allRequirements?.find(
      r => r.office_code === selectedOffice && r.document_type === docType
    );
    if (requirement) {
      onSelectRequirement?.(requirement);
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {language === 'es' ? 'Requisitos por Jurisdicción' : 'Jurisdiction Requirements'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Office Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {language === 'es' ? 'Oficina' : 'Office'}
            </Label>
            {loadingRequirements ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedOffice} onValueChange={handleOfficeChange}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar oficina...' : 'Select office...'} />
                </SelectTrigger>
                <SelectContent>
                  {offices.map(office => {
                    const info = OFFICE_INFO[office];
                    return (
                      <SelectItem key={office} value={office}>
                        <div className="flex items-center gap-2">
                          <span>{info?.flag || '🏢'}</span>
                          <span>{info?.name || office}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {info?.country || office}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'es' ? 'Tipo de documento' : 'Document Type'}
            </Label>
            {loadingDocTypes && selectedOffice ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select 
                value={selectedDocType} 
                onValueChange={handleDocTypeChange}
                disabled={!selectedOffice}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      selectedOffice 
                        ? (language === 'es' ? 'Seleccionar tipo...' : 'Select type...') 
                        : (language === 'es' ? 'Primero seleccione oficina' : 'First select an office')
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes?.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatDocumentType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requirements Display */}
      {selectedRequirement && (
        <JurisdictionRequirementsCard
          requirement={selectedRequirement}
          language={language}
          showDetails={true}
        />
      )}

      {/* Quick Office Grid (when nothing selected) */}
      {!selectedOffice && !loadingRequirements && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {offices.map(office => {
            const info = OFFICE_INFO[office];
            const reqCount = allRequirements?.filter(r => r.office_code === office).length || 0;
            
            return (
              <button
                key={office}
                onClick={() => handleOfficeChange(office)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <span className="text-3xl">{info?.flag || '🏢'}</span>
                <span className="font-medium text-sm">{info?.name || office}</span>
                <Badge variant="secondary" className="text-xs">
                  {reqCount} {language === 'es' ? 'docs' : 'docs'}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
