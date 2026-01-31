// ============================================================
// IP-NEXUS - TYPE + JURISDICTION COMBINED STEP
// L129: Compact step combining type and jurisdiction selection
// ============================================================

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MatterType } from '@/hooks/use-matters-v2';

// Type configuration with icons and descriptions
const TYPE_CONFIG: Record<string, { icon: string; description: string; popular: boolean }> = {
  TM: { icon: '®️', description: 'Registro de signos distintivos', popular: true },
  TM_NAT: { icon: '®️', description: 'Marca nacional', popular: false },
  TM_EU: { icon: '®️', description: 'Marca de la Unión Europea', popular: false },
  TM_INT: { icon: '®️', description: 'Marca internacional (Madrid)', popular: false },
  PT: { icon: '⚙️', description: 'Invenciones técnicas', popular: true },
  PT_NAT: { icon: '⚙️', description: 'Patente nacional', popular: false },
  PT_EU: { icon: '⚙️', description: 'Patente europea (EPO)', popular: false },
  PT_PCT: { icon: '⚙️', description: 'Solicitud PCT internacional', popular: false },
  UM: { icon: '🔧', description: 'Mejoras técnicas menores', popular: true },
  DS: { icon: '✏️', description: 'Diseños industriales', popular: true },
  DS_NAT: { icon: '✏️', description: 'Diseño nacional', popular: false },
  DS_EU: { icon: '®️', description: 'Diseño comunitario', popular: false },
  NC: { icon: '📜', description: 'Nombre comercial', popular: false },
  DOM: { icon: '🌐', description: 'Nombres de dominio', popular: false },
  OPO: { icon: '⚖️', description: 'Oposiciones y defensas', popular: false },
  VIG: { icon: '👁️', description: 'Vigilancia de marcas', popular: false },
  LIT: { icon: '🏛️', description: 'Litigios y procedimientos', popular: false },
};

// Jurisdictions configuration
const JURISDICTIONS = [
  // Popular
  { code: 'ES', name: 'España', flag: '🇪🇸', office: 'OEPM', region: 'Europa', popular: true },
  { code: 'EU', name: 'Unión Europea', flag: '🇪🇺', office: 'EUIPO', region: 'Europa', popular: true },
  { code: 'WO', name: 'Internacional', flag: '🌍', office: 'OMPI/WIPO', region: 'Internacional', popular: true },
  { code: 'EP', name: 'Patente Europea', flag: '🇪🇺', office: 'EPO', region: 'Regional', popular: true },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', office: 'USPTO', region: 'América', popular: true },
  // Europa
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', office: 'UKIPO', region: 'Europa', popular: false },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', office: 'DPMA', region: 'Europa', popular: false },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', office: 'INPI-FR', region: 'Europa', popular: false },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', office: 'UIBM', region: 'Europa', popular: false },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', office: 'INPI-PT', region: 'Europa', popular: false },
  { code: 'NL', name: 'Países Bajos', flag: '🇳🇱', office: 'BOIP', region: 'Europa', popular: false },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪', office: 'BOIP', region: 'Europa', popular: false },
  { code: 'CH', name: 'Suiza', flag: '🇨🇭', office: 'IGE', region: 'Europa', popular: false },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', office: 'ÖPA', region: 'Europa', popular: false },
  { code: 'SE', name: 'Suecia', flag: '🇸🇪', office: 'PRV', region: 'Europa', popular: false },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰', office: 'DKPTO', region: 'Europa', popular: false },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴', office: 'NIPO', region: 'Europa', popular: false },
  { code: 'FI', name: 'Finlandia', flag: '🇫🇮', office: 'PRH', region: 'Europa', popular: false },
  { code: 'PL', name: 'Polonia', flag: '🇵🇱', office: 'UPRP', region: 'Europa', popular: false },
  { code: 'CZ', name: 'Rep. Checa', flag: '🇨🇿', office: 'ÚPVČR', region: 'Europa', popular: false },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪', office: 'IPOI', region: 'Europa', popular: false },
  { code: 'GR', name: 'Grecia', flag: '🇬🇷', office: 'OBI', region: 'Europa', popular: false },
  { code: 'TR', name: 'Turquía', flag: '🇹🇷', office: 'TÜRKPATENT', region: 'Europa', popular: false },
  { code: 'RU', name: 'Rusia', flag: '🇷🇺', office: 'ROSPATENT', region: 'Europa', popular: false },
  // América
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', office: 'CIPO', region: 'América', popular: false },
  { code: 'MX', name: 'México', flag: '🇲🇽', office: 'IMPI', region: 'América', popular: false },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', office: 'INPI-BR', region: 'América', popular: false },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', office: 'INPI-AR', region: 'América', popular: false },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', office: 'INAPI', region: 'América', popular: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', office: 'SIC', region: 'América', popular: false },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', office: 'INDECOPI', region: 'América', popular: false },
  // Asia-Pacífico
  { code: 'CN', name: 'China', flag: '🇨🇳', office: 'CNIPA', region: 'Asia', popular: false },
  { code: 'JP', name: 'Japón', flag: '🇯🇵', office: 'JPO', region: 'Asia', popular: false },
  { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷', office: 'KIPO', region: 'Asia', popular: false },
  { code: 'IN', name: 'India', flag: '🇮🇳', office: 'CGPDTM', region: 'Asia', popular: false },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', office: 'IP Australia', region: 'Oceanía', popular: false },
  { code: 'NZ', name: 'Nueva Zelanda', flag: '🇳🇿', office: 'IPONZ', region: 'Oceanía', popular: false },
  { code: 'SG', name: 'Singapur', flag: '🇸🇬', office: 'IPOS', region: 'Asia', popular: false },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', office: 'HKIPD', region: 'Asia', popular: false },
];

interface TypeJurisdictionStepProps {
  types: MatterType[];
  selectedType: string;
  onSelectType: (typeCode: string) => void;
  selectedJurisdictions: string[];
  onSelectJurisdictions: (jurisdictions: string[]) => void;
  isLoading?: boolean;
  singleJurisdiction?: boolean;
}

export function TypeJurisdictionStep({
  types,
  selectedType,
  onSelectType,
  selectedJurisdictions,
  onSelectJurisdictions,
  isLoading,
  singleJurisdiction = true,
}: TypeJurisdictionStepProps) {
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showJurisModal, setShowJurisModal] = useState(false);

  // Separate popular and other types
  const popularTypes = types.filter(t => TYPE_CONFIG[t.code]?.popular);
  const otherTypes = types.filter(t => !TYPE_CONFIG[t.code]?.popular);
  
  // Separate popular jurisdictions
  const popularJurisdictions = JURISDICTIONS.filter(j => j.popular);
  const otherJurisdictions = JURISDICTIONS.filter(j => !j.popular);

  const toggleJurisdiction = (code: string) => {
    if (singleJurisdiction) {
      onSelectJurisdictions([code]);
    } else {
      const newSelection = selectedJurisdictions.includes(code)
        ? selectedJurisdictions.filter(j => j !== code)
        : [...selectedJurisdictions, code];
      onSelectJurisdictions(newSelection);
    }
  };

  const removeJurisdiction = (code: string) => {
    onSelectJurisdictions(selectedJurisdictions.filter(j => j !== code));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">¿Qué tipo de expediente vas a crear?</h2>
          <p className="text-muted-foreground">Cargando tipos disponibles...</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Tipo y Jurisdicción</h2>
        <p className="text-muted-foreground">Selecciona el tipo de expediente y dónde quieres protegerlo</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: TYPE SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">1</span>
            Tipo de expediente
          </div>

          {/* Popular Types Grid */}
          <div className="grid grid-cols-2 gap-2">
            {popularTypes.map((type) => {
              const config = TYPE_CONFIG[type.code] || { icon: '📁', description: '', popular: false };
              const isSelected = selectedType === type.code;

              return (
                <motion.button
                  key={type.code}
                  type="button"
                  onClick={() => onSelectType(type.code)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left relative",
                    "hover:shadow-sm hover:border-primary/50",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{type.name_es}</h3>
                      <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Other Types - Collapsible */}
          <AnimatePresence>
            {showAllTypes && otherTypes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2"
              >
                {otherTypes.map((type) => {
                  const config = TYPE_CONFIG[type.code] || { icon: '📁', description: '', popular: false };
                  const isSelected = selectedType === type.code;

                  return (
                    <button
                      key={type.code}
                      type="button"
                      onClick={() => onSelectType(type.code)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-all text-left text-sm",
                        "hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <span className="font-medium truncate">{type.name_es}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          {otherTypes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAllTypes(!showAllTypes)}
            >
              {showAllTypes ? (
                <>Ver menos <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Ver más tipos ({otherTypes.length}) <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* RIGHT COLUMN: JURISDICTION SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">2</span>
            Jurisdicción
          </div>

          {/* Popular Jurisdictions */}
          <div className="space-y-2">
            {popularJurisdictions.map((j) => {
              const isSelected = selectedJurisdictions.includes(j.code);
              return (
                <div
                  key={j.code}
                  onClick={() => toggleJurisdiction(j.code)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:border-primary/50",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  {singleJurisdiction ? (
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  ) : (
                    <Checkbox checked={isSelected} />
                  )}
                  <span className="text-xl">{j.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{j.name}</p>
                    <p className="text-xs text-muted-foreground">{j.office}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* More Jurisdictions Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowJurisModal(true)}
          >
            <Globe className="h-4 w-4 mr-2" />
            Más jurisdicciones ({otherJurisdictions.length})
          </Button>

          {/* Selected Jurisdictions Pills */}
          {selectedJurisdictions.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Seleccionadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedJurisdictions.map((code) => {
                  const j = JURISDICTIONS.find(x => x.code === code);
                  return (
                    <Badge key={code} variant="secondary" className="gap-1.5 pr-1">
                      {j?.flag} {j?.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeJurisdiction(code);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jurisdictions Modal */}
      <Dialog open={showJurisModal} onOpenChange={setShowJurisModal}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Jurisdicción</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {/* Group by region */}
              {['Europa', 'América', 'Asia', 'Oceanía'].map(region => {
                const regionJuris = otherJurisdictions.filter(j => j.region === region);
                if (regionJuris.length === 0) return null;
                
                return (
                  <div key={region}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{region}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {regionJuris.map((j) => {
                        const isSelected = selectedJurisdictions.includes(j.code);
                        return (
                          <button
                            key={j.code}
                            type="button"
                            onClick={() => {
                              toggleJurisdiction(j.code);
                              if (singleJurisdiction) setShowJurisModal(false);
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-all",
                              "hover:border-primary/50",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <span className="text-lg">{j.flag}</span>
                            <span className="truncate">{j.name}</span>
                            {isSelected && <Check className="h-3 w-3 text-primary shrink-0 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Helper to get jurisdiction info (exported for use in other components)
export function getJurisdictionInfo(code: string) {
  return JURISDICTIONS.find(j => j.code === code);
}
