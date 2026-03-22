import { PlatformMrrTab } from '@/components/backoffice/finance/PlatformMrrTab';

export default function BackofficeFinanceMrrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📈 MRR / ARR</h1>
        <p className="text-muted-foreground">Evolución de ingresos recurrentes de la plataforma</p>
      </div>
      <PlatformMrrTab />
    </div>
  );
}
