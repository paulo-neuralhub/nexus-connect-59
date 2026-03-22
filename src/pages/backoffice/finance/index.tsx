import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, DollarSign, AlertTriangle, PieChart } from 'lucide-react';
import { usePendingReviewCount } from '@/hooks/backoffice/usePlatformFinance';
import { PlatformDashboardTab } from '@/components/backoffice/finance/PlatformDashboardTab';
import { PlatformRevenueTab } from '@/components/backoffice/finance/PlatformRevenueTab';
import { PlatformCostsTab } from '@/components/backoffice/finance/PlatformCostsTab';
import { PlatformMrrTab } from '@/components/backoffice/finance/PlatformMrrTab';
import { PlatformPendingTab } from '@/components/backoffice/finance/PlatformPendingTab';

export default function BackofficeFinancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: pendingCount = 0 } = usePendingReviewCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">💰 IP-NEXUS Finance</h1>
        <p className="text-muted-foreground">Finanzas de la plataforma — P&L, MRR, costes e ingresos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard P&L
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" /> Ingresos
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <PieChart className="h-4 w-4" /> Costes
          </TabsTrigger>
          <TabsTrigger value="mrr" className="gap-2">
            <TrendingUp className="h-4 w-4" /> MRR/ARR
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 relative">
            <AlertTriangle className="h-4 w-4" /> Pendientes
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-medium text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><PlatformDashboardTab /></TabsContent>
        <TabsContent value="revenue"><PlatformRevenueTab /></TabsContent>
        <TabsContent value="costs"><PlatformCostsTab /></TabsContent>
        <TabsContent value="mrr"><PlatformMrrTab /></TabsContent>
        <TabsContent value="pending"><PlatformPendingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
