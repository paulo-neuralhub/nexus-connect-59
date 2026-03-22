/**
 * Agent Messages — placeholder
 */
import { MessageSquare } from 'lucide-react';

export default function AgentMessagesPage() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center text-muted-foreground">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Mensajes</p>
        <p className="text-sm">Próximamente: comunicación directa con el despacho</p>
      </div>
    </div>
  );
}
