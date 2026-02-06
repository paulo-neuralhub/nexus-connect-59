// ============================================================
// GLOBAL STYLE BAR — Horizontal bar to select/apply style
// ============================================================

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Paintbrush, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type GlobalStyleId = 'clasico' | 'elegante' | 'moderno' | 'sofisticado';

interface StyleOption {
  id: GlobalStyleId;
  name: string;
  color: string;
}

const STYLES: StyleOption[] = [
  { id: 'clasico', name: 'Clásico', color: '#1E3A5F' },
  { id: 'elegante', name: 'Elegante', color: '#0F766E' },
  { id: 'moderno', name: 'Moderno', color: '#2563EB' },
  { id: 'sofisticado', name: 'Sofisticado', color: '#7C3AED' },
];

interface GlobalStyleBarProps {
  activeStyle: GlobalStyleId;
  onStyleChange: (style: GlobalStyleId) => void;
  onApplyToAll: (style: GlobalStyleId) => void;
}

export function GlobalStyleBar({ activeStyle, onStyleChange, onApplyToAll }: GlobalStyleBarProps) {
  const currentStyleName = STYLES.find(s => s.id === activeStyle)?.name || '';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Estilo activo:</span>
        <div className="flex items-center gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStyleChange(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeStyle === s.id
                  ? "bg-white shadow-sm border border-slate-200 text-slate-800"
                  : "text-slate-500 hover:bg-white/60"
              )}
            >
              <span
                className="w-3 h-3 rounded-full border-2"
                style={{ 
                  backgroundColor: activeStyle === s.id ? s.color : 'transparent',
                  borderColor: s.color,
                }}
              />
              <span className="hidden sm:inline">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Paintbrush className="h-4 w-4" />
            Aplicar a todas
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aplicar estilo "{currentStyleName}" a todos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cambiará el estilo visual de todas las plantillas de documentos de tu organización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onApplyToAll(activeStyle)}>
              Aplicar a todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
