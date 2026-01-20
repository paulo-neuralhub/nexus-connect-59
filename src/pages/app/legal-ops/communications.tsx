import { CommunicationsInbox, AIDisclaimer } from '@/components/legal-ops';

export default function CommunicationsPage() {
  return (
    <div className="p-6">
      <AIDisclaimer 
        message="Las comunicaciones pueden ser clasificadas automáticamente por IA. Todas las clasificaciones son sugerencias y deben verificarse."
        variant="info"
        dismissible
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Comunicaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas las comunicaciones con tus clientes
          </p>
        </div>
      </div>

      <CommunicationsInbox />
    </div>
  );
}
