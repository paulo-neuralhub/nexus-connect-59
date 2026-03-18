// ============================================================
// IP-NEXUS APP - KEYBOARD SHORTCUTS PAGE
// ============================================================

import { Link } from 'react-router-dom';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KEYBOARD_SHORTCUTS } from '@/lib/helpStaticContent';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  expedientes: 'Expedientes',
  navegación: 'Navegación',
  edición: 'Edición',
};

export default function ShortcutsPage() {
  const categories = ['general', 'navegación', 'expedientes', 'edición'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/help">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Atajos de teclado</h2>
            <p className="text-sm text-muted-foreground">Trabaja más rápido con estos atajos</p>
          </div>
        </div>
      </div>

      {/* Shortcuts by category */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((cat) => {
          const shortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === cat);
          if (shortcuts.length === 0) return null;
          return (
            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 bg-muted/50 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">
                  {CATEGORY_LABELS[cat]}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-foreground/80">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          {j > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-muted border border-border text-xs font-mono font-medium text-foreground shadow-sm">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
        <p className="text-sm text-muted-foreground">
          Pulsa <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-muted border border-border text-xs font-mono font-medium text-foreground shadow-sm mx-1">Ctrl</kbd>
          <span className="text-muted-foreground mx-0.5">+</span>
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-muted border border-border text-xs font-mono font-medium text-foreground shadow-sm mx-1">/</kbd>
          en cualquier parte de la app para ver esta lista
        </p>
      </div>
    </div>
  );
}
