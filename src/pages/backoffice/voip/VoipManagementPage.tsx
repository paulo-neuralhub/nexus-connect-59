import { useState } from 'react';
import { TrendingUp, Users, Settings, FileText } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useBackofficeVoipStats } from '@/hooks/useBackofficeVoipStats';
import { useBackofficeVoipOrgs } from '@/hooks/useBackofficeVoipOrgs';
import { VoipOverviewTab } from '@/components/voip/backoffice/VoipOverviewTab';
import { VoipOrganizationsTab } from '@/components/voip/backoffice/VoipOrganizationsTab';
import { VoipPlansTab } from '@/components/voip/backoffice/VoipPlansTab';
import { VoipInvoicesTab } from '@/components/voip/backoffice/VoipInvoicesTab';

type Tab = 'overview' | 'organizations' | 'plans' | 'invoices';

export default function VoipManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { data: stats, isLoading: statsLoading } = useBackofficeVoipStats();
  const { data: organizations, isLoading: orgsLoading } = useBackofficeVoipOrgs();

  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Gestión de Telefonía VoIP</h1>
        <p className="mt-1 text-sm text-muted-foreground">Costes, márgenes y facturación (Backoffice).</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Resumen', icon: TrendingUp },
            { id: 'organizations', label: 'Por organización', icon: Users },
            { id: 'plans', label: 'Planes', icon: Settings },
            { id: 'invoices', label: 'Facturación', icon: FileText },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={activeTab === t.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <VoipOverviewTab stats={stats} isLoading={statsLoading} />
      )}

      {activeTab === 'organizations' && (
        <VoipOrganizationsTab organizations={organizations ?? []} isLoading={orgsLoading} />
      )}

      {activeTab === 'plans' && (
        <VoipPlansTab />
      )}

      {activeTab === 'invoices' && (
        <VoipInvoicesTab />
      )}
    </PageContainer>
  );
}
