// ============================================================
// IP-NEXUS — Empty state for thread detail
// ============================================================

import { MessageSquare } from 'lucide-react';

export function CommEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-xs">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Bandeja Unificada
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona una conversación para ver los mensajes
        </p>
      </div>
    </div>
  );
}
