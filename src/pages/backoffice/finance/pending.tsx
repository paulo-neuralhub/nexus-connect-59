import { PlatformPendingTab } from '@/components/backoffice/finance/PlatformPendingTab';

export default function BackofficeFinancePendingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">✅ Pendientes de Revisión</h1>
        <p className="text-muted-foreground">Costes e ingresos auto-capturados pendientes de confirmación humana</p>
      </div>
      <PlatformPendingTab />
    </div>
  );
}
