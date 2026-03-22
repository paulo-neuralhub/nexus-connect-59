import { MessageSquare } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3 max-w-xs">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Selecciona un canal
        </h3>
        <p className="text-xs text-muted-foreground">
          Elige un canal de la barra lateral para comenzar a chatear con tu equipo.
        </p>
      </div>
    </div>
  );
}
