// ============================================================
// IP-NEXUS BACKOFFICE — Telephony Management (6-Tab Page)
// ============================================================

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone } from 'lucide-react';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ProvidersTab } from './tabs/ProvidersTab';
import { TenantsTab } from './tabs/TenantsTab';
import { NumbersTab } from './tabs/NumbersTab';
import { CdrsTab } from './tabs/CdrsTab';
import { RatesTab } from './tabs/RatesTab';
import { FinanceTab } from './tabs/FinanceTab';

export default function BackofficeTelephonyPage() {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <GradientBackground variant="subtle" className="min-h-full -m-6">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Gestión de Telefonía
          </h1>
          <p className="text-muted-foreground mt-1">
            Proveedores, números, tarifas, CDRs y finanzas del módulo de telefonía.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="providers">Proveedores</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="numbers">Números</TabsTrigger>
            <TabsTrigger value="cdrs">CDRs</TabsTrigger>
            <TabsTrigger value="rates">Tarifas</TabsTrigger>
            <TabsTrigger value="finance">Finanzas</TabsTrigger>
          </TabsList>

          <TabsContent value="providers"><ProvidersTab /></TabsContent>
          <TabsContent value="tenants"><TenantsTab /></TabsContent>
          <TabsContent value="numbers"><NumbersTab /></TabsContent>
          <TabsContent value="cdrs"><CdrsTab /></TabsContent>
          <TabsContent value="rates"><RatesTab /></TabsContent>
          <TabsContent value="finance"><FinanceTab /></TabsContent>
        </Tabs>
      </div>
    </GradientBackground>
  );
}
