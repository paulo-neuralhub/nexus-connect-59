// ============================================================
// IP-NEXUS - TRADEMARK TYPE SELECTOR (SILK Design)
// L135: Selector de tipo de marca con diseño premium SILK
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Image, Layers, Box, Palette, Volume2, 
  Wind, Play, MapPin, Check, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Trademark type definitions
export type TrademarkType = 
  | 'nominative' 
  | 'figurative' 
  | 'mixed' 
  | '3d' 
  | 'color' 
  | 'sound' 
  | 'olfactory' 
  | 'motion' 
  | 'position';

interface TrademarkTypeOption {
  code: TrademarkType;
  label: string;
  description: string;
  icon: React.ElementType;
  isTraditional: boolean;
}

const TRADEMARK_TYPES: TrademarkTypeOption[] = [
  // Traditional types
  { code: 'nominative', label: 'Nominativa', description: 'Solo texto (palabras, letras, números)', icon: Type, isTraditional: true },
  { code: 'figurative', label: 'Figurativa', description: 'Solo imagen o diseño gráfico', icon: Image, isTraditional: true },
  { code: 'mixed', label: 'Mixta', description: 'Combinación de texto e imagen', icon: Layers, isTraditional: true },
  // Non-traditional types
  { code: '3d', label: 'Tridimensional', description: 'Forma tridimensional del producto o envase', icon: Box, isTraditional: false },
  { code: 'color', label: 'De color', description: 'Color específico como identificador', icon: Palette, isTraditional: false },
  { code: 'sound', label: 'Sonora', description: 'Sonido o melodía distintiva', icon: Volume2, isTraditional: false },
  { code: 'olfactory', label: 'Olfativa', description: 'Olor específico como identificador', icon: Wind, isTraditional: false },
  { code: 'motion', label: 'De movimiento', description: 'Secuencia animada o en movimiento', icon: Play, isTraditional: false },
  { code: 'position', label: 'De posición', description: 'Ubicación específica en el producto', icon: MapPin, isTraditional: false },
];

interface TrademarkTypeSelectorProps {
  value?: TrademarkType;
  onChange: (type: TrademarkType) => void;
}

export function TrademarkTypeSelector({ value, onChange }: TrademarkTypeSelectorProps) {
  const traditionalTypes = TRADEMARK_TYPES.filter(t => t.isTraditional);
  const nonTraditionalTypes = TRADEMARK_TYPES.filter(t => !t.isTraditional);
  const isNonTraditional = value && !TRADEMARK_TYPES.find(t => t.code === value)?.isTraditional;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div 
        className="rounded-xl p-6 mt-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.05) 0%, rgba(255, 255, 255, 1) 100%)',
          border: '1px solid rgba(0, 180, 216, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #00d4aa 100%)',
              boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
            }}
          >
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-800">Tipo de marca</h3>
            <p className="text-sm text-slate-500">Selecciona el tipo de marca que deseas registrar</p>
          </div>
        </div>

        {/* Traditional Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {traditionalTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.code;

            return (
              <motion.button
                key={type.code}
                type="button"
                onClick={() => onChange(type.code)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left overflow-hidden",
                  isSelected
                    ? "border-cyan-400 bg-cyan-50/50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {/* Selection badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #00b4d8 0%, #00d4aa 100%)',
                      boxShadow: '0 2px 8px rgba(0, 180, 216, 0.4)',
                    }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon */}
                <div 
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "bg-gradient-to-br from-cyan-100 to-cyan-50"
                      : "bg-gradient-to-br from-slate-100 to-slate-50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isSelected ? "text-cyan-600" : "text-slate-500"
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    isSelected ? "text-cyan-700" : "text-slate-800"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {type.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Marcas no tradicionales
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Non-traditional Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nonTraditionalTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.code;

            return (
              <motion.button
                key={type.code}
                type="button"
                onClick={() => onChange(type.code)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left overflow-hidden",
                  isSelected
                    ? "border-cyan-400 bg-cyan-50/50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {/* Selection badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #00b4d8 0%, #00d4aa 100%)',
                      boxShadow: '0 2px 8px rgba(0, 180, 216, 0.4)',
                    }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon */}
                <div 
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "bg-gradient-to-br from-cyan-100 to-cyan-50"
                      : "bg-gradient-to-br from-slate-100 to-slate-50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isSelected ? "text-cyan-600" : "text-slate-500"
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    isSelected ? "text-cyan-700" : "text-slate-800"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {type.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Non-traditional warning */}
        <AnimatePresence>
          {isNonTraditional && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div 
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
                >
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-semibold">Documentación adicional requerida.</span>{' '}
                  Las marcas no tradicionales requieren documentación específica (descripción técnica, muestras, archivos multimedia). 
                  Se solicitará en el siguiente paso.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { TRADEMARK_TYPES };
