import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TrademarkType =
  | 'nominative'
  | 'figurative'
  | 'mixed'
  | '3d'
  | 'sound'
  | 'color'
  | 'pattern'
  | 'multimedia'
  | 'motion';

interface TrademarkTypeOption {
  code: TrademarkType;
  label: string;
  helper?: string;
}

const TRADEMARK_TYPES: TrademarkTypeOption[] = [
  { code: 'nominative', label: 'Denominativa' },
  { code: 'figurative', label: 'Figurativa' },
  { code: 'mixed', label: 'Mixta' },
  { code: '3d', label: '3D' },
  { code: 'sound', label: 'Sonora' },
  { code: 'color', label: 'Color' },
  { code: 'pattern', label: 'Patrón' },
  { code: 'multimedia', label: 'Multimedia' },
  { code: 'motion', label: 'Movimiento' },
];

interface TrademarkTypeSelectorProps {
  value?: TrademarkType;
  onChange: (type: TrademarkType) => void;
}

export function TrademarkTypeSelector({ value, onChange }: TrademarkTypeSelectorProps) {
  const selectedLabel = TRADEMARK_TYPES.find(type => type.code === value)?.label;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Tipo de marca</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona la modalidad de marca que vas a registrar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRADEMARK_TYPES.map((type) => {
            const isSelected = value === type.code;
            return (
              <button
                key={type.code}
                type="button"
                onClick={() => onChange(type.code)}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-all',
                  'hover:border-primary/50 hover:bg-accent active:scale-[0.98]',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-foreground'
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Badge variant="secondary">Marca {selectedLabel}</Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { TRADEMARK_TYPES };
