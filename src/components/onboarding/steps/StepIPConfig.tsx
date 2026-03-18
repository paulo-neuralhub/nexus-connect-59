/**
 * StepIPConfig - IP Configuration step for onboarding
 * Configures jurisdictions, reference format, and Nice classes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Hash, Tag, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIPConfigProps {
  data: Record<string, any>;
  updateData: (key: string, value: any) => void;
  organizationId: string;
}

const JURISDICTIONS = [
  { code: 'ES', name: 'España', flag: '🇪🇸', office: 'OEPM' },
  { code: 'EU', name: 'Unión Europea', flag: '🇪🇺', office: 'EUIPO' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', office: 'USPTO' },
  { code: 'WO', name: 'Internacional (WIPO)', flag: '🌐', office: 'WIPO' },
  { code: 'CN', name: 'China', flag: '🇨🇳', office: 'CNIPA' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', office: 'UKIPO' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', office: 'DPMA' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', office: 'INPI' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵', office: 'JPO' },
  { code: 'MX', name: 'México', flag: '🇲🇽', office: 'IMPI' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', office: 'INPI' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', office: 'INPI' },
];

const NICE_CLASSES_COMMON = [
  { number: 9, description: 'Electrónica, software' },
  { number: 35, description: 'Publicidad, negocios' },
  { number: 42, description: 'Servicios TI' },
  { number: 25, description: 'Ropa, calzado' },
  { number: 41, description: 'Educación, entretenimiento' },
  { number: 43, description: 'Restauración, alojamiento' },
  { number: 5, description: 'Farmacia, medicina' },
  { number: 3, description: 'Cosméticos' },
];

const REFERENCE_FORMATS = [
  { 
    value: 'auto', 
    label: 'Automático (recomendado)', 
    example: 'TM-ES-20260130-ABC-0001-X9',
    description: 'Formato con check digit para enrutado automático de emails'
  },
  { 
    value: 'simple', 
    label: 'Simple', 
    example: '2026/TM/0001',
    description: 'Año/Tipo/Secuencia'
  },
  { 
    value: 'custom', 
    label: 'Personalizado', 
    example: 'ABC-TM-0001',
    description: 'Define tu propio formato'
  },
];

export function StepIPConfig({ data, updateData, organizationId }: StepIPConfigProps) {
  const selectedJurisdictions = data.jurisdictions || ['ES', 'EU'];
  const selectedNiceClasses = data.frequentNiceClasses || [];
  const referenceFormat = data.referenceFormat || 'auto';

  const toggleJurisdiction = (code: string) => {
    const current = [...selectedJurisdictions];
    const index = current.indexOf(code);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(code);
    }
    updateData('jurisdictions', current);
  };

  const toggleNiceClass = (num: number) => {
    const current = [...selectedNiceClasses];
    const index = current.indexOf(num);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(num);
    }
    updateData('frequentNiceClasses', current);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Configuración de PI</h2>
        <p className="text-muted-foreground text-sm">
          Personaliza IP-NEXUS para tu práctica
        </p>
      </div>

      {/* Jurisdictions */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Jurisdicciones donde trabajas
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {JURISDICTIONS.map((jur) => {
            const isSelected = selectedJurisdictions.includes(jur.code);
            return (
              <div
                key={jur.code}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleJurisdiction(jur.code)}
              >
                <span className="text-lg">{jur.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{jur.name}</p>
                  <p className="text-xs text-muted-foreground">{jur.office}</p>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Selecciona las jurisdicciones principales. Podrás añadir más después.
        </p>
      </div>

      {/* Reference Format */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Formato de referencias internas
        </Label>
        <div className="space-y-2">
          {REFERENCE_FORMATS.map((format) => {
            const isSelected = referenceFormat === format.value;
            return (
              <div
                key={format.value}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => updateData('referenceFormat', format.value)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{format.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                  {format.example}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  {format.description}
                </p>
              </div>
            );
          })}
        </div>
        
        {referenceFormat === 'custom' && (
          <div className="mt-3">
            <Label>Prefijo personalizado</Label>
            <Input
              value={data.referencePrefix || ''}
              onChange={(e) => updateData('referencePrefix', e.target.value.toUpperCase())}
              placeholder="ABC"
              maxLength={5}
              className="uppercase"
            />
          </div>
        )}
      </div>

      {/* Nice Classes */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          Clases Nice frecuentes (opcional)
        </Label>
        <p className="text-xs text-muted-foreground">
          Selecciona las clases que usas más para acceso rápido
        </p>
        <div className="flex flex-wrap gap-2">
          {NICE_CLASSES_COMMON.map((cls) => {
            const isSelected = selectedNiceClasses.includes(cls.number);
            return (
              <Badge
                key={cls.number}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "bg-primary"
                )}
                onClick={() => toggleNiceClass(cls.number)}
              >
                {cls.number} - {cls.description}
                {isSelected && <X className="h-3 w-3 ml-1" />}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
