// ============================================================
// IP-NEXUS - TYPE + JURISDICTION COMBINED STEP
// Fixed 6 category cards + trademark sub-selector + jurisdiction
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
import { TrademarkTypeSelector, type TrademarkType } from './TrademarkTypeSelector';

// ── Fixed 6 IP categories ──────────────────────────────────
const IP_CATEGORIES = [
  { code: 'trademark', icon: '🏷️', label: 'Marca', description: 'Nombres, logos y signos distintivos' },
  { code: 'patent', icon: '⚗️', label: 'Patente', description: 'Invenciones técnicas e innovaciones' },
  { code: 'design', icon: '🎨', label: 'Diseño Industrial', description: 'Apariencia estética de productos' },
  { code: 'domain', icon: '🌐', label: 'Dominio', description: 'Nombres de dominio en Internet' },
  { code: 'copyright', icon: '©️', label: 'Derecho de Autor', description: 'Obras literarias, artísticas y software' },
  { code: 'trade_secret', icon: '🔒', label: 'Secreto Empresarial', description: 'Información confidencial de negocio' },
] as const;

// ── Jurisdictions ──────────────────────────────────────────
const JURISDICTIONS = [
  { code: 'ES', name: 'España', flag: '🇪🇸', office: 'OEPM', region: 'Europa', popular: true },
  { code: 'EU', name: 'Unión Europea', flag: '🇪🇺', office: 'EUIPO', region: 'Europa', popular: true },
  { code: 'WO', name: 'Internacional', flag: '🌍', office: 'OMPI/WIPO', region: 'Internacional', popular: true },
  { code: 'EP', name: 'Patente Europea', flag: '🇪🇺', office: 'EPO', region: 'Regional', popular: true },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', office: 'USPTO', region: 'América', popular: true },
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
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', office: 'CIPO', region: 'América', popular: false },
  { code: 'MX', name: 'México', flag: '🇲🇽', office: 'IMPI', region: 'América', popular: false },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', office: 'INPI-BR', region: 'América', popular: false },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', office: 'INPI-AR', region: 'América', popular: false },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', office: 'INAPI', region: 'América', popular: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', office: 'SIC', region: 'América', popular: false },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', office: 'INDECOPI', region: 'América', popular: false },
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
  trademarkType?: TrademarkType;
  onSelectTrademarkType?: (type: TrademarkType) => void;
}

export function TypeJurisdictionStep({
  selectedType,
  onSelectType,
  selectedJurisdictions,
  onSelectJurisdictions,
  isLoading,
  singleJurisdiction = true,
  trademarkType,
  onSelectTrademarkType,
}: TypeJurisdictionStepProps) {
  const [showJurisModal, setShowJurisModal] = useState(false);

  const popularJurisdictions = JURISDICTIONS.filter(j => j.popular);
  const otherJurisdictions = JURISDICTIONS.filter(j => !j.popular);

  const isTrademarkType = selectedType === 'trademark';

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
        <h2 className="text-xl font-semibold">¿Qué tipo de derecho quieres gestionar?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
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
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ═══════ SECTION 1: TYPE SELECTION — 6 fixed cards ═══════ */}
      <div>
        <h2 className="text-lg font-semibold mb-1">¿Qué tipo de derecho quieres gestionar?</h2>
        <p className="text-sm text-muted-foreground mb-5">Selecciona la categoría de propiedad intelectual</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {IP_CATEGORIES.map((cat, index) => {
            const isSelected = selectedType === cat.code;
            return (
              <motion.button
                key={cat.code}
                type="button"
                onClick={() => onSelectType(cat.code)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                  "hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
                <span className="text-2xl block mb-2">{cat.icon}</span>
                <h3 className={cn(
                  "font-semibold text-sm",
                  isSelected && "text-primary"
                )}>{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ═══════ SECTION 1b: TRADEMARK SUB-SELECTOR (conditional) ═══════ */}
      <AnimatePresence>
        {isTrademarkType && onSelectTrademarkType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TrademarkTypeSelector
              value={trademarkType}
              onChange={onSelectTrademarkType}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ SECTION 2: JURISDICTION ═══════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Jurisdicción</h2>
          <p className="text-sm text-muted-foreground">¿Dónde quieres proteger este derecho?</p>
        </div>

        {/* Popular Jurisdictions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularJurisdictions.map((j, index) => {
            const isSelected = selectedJurisdictions.includes(j.code);
            return (
              <motion.div
                key={j.code}
                onClick={() => toggleJurisdiction(j.code)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  "hover:shadow-sm",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {singleJurisdiction ? (
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                ) : (
                  <Checkbox checked={isSelected} />
                )}
                <span className="text-2xl">{j.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", isSelected && "text-primary")}>{j.name}</p>
                  <p className="text-xs text-muted-foreground">{j.office}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </motion.div>
            );
          })}
        </div>

        {/* More Jurisdictions */}
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

        {/* Selected pills */}
        {selectedJurisdictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-muted/50 rounded-xl space-y-1.5"
          >
            <p className="text-xs font-medium text-muted-foreground">Seleccionadas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedJurisdictions.map(code => {
                const j = JURISDICTIONS.find(x => x.code === code);
                return (
                  <Badge key={code} className="gap-1.5 pr-1.5">
                    {j?.flag} {j?.name}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeJurisdiction(code); }}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* EUIPO hint */}
        {selectedJurisdictions.includes('EU') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
          >
            🇪🇺 Protección en los 27 países de la UE con una sola solicitud ante EUIPO.
          </motion.p>
        )}
      </div>

      {/* Jurisdiction modal */}
      <Dialog open={showJurisModal} onOpenChange={setShowJurisModal}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Jurisdicción</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {['Europa', 'América', 'Asia', 'Oceanía'].map(region => {
                const regionJuris = otherJurisdictions.filter(j => j.region === region);
                if (regionJuris.length === 0) return null;
                return (
                  <div key={region}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{region}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {regionJuris.map(j => {
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
                              isSelected ? "border-primary bg-primary/5" : "border-border"
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
