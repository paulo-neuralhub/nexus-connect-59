import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PlansBaseTab } from '@/components/backoffice/billing/PlansBaseTab';
import { ModulesStandaloneTab } from '@/components/backoffice/billing/ModulesStandaloneTab';
import { JurisdictionPacksTab } from '@/components/backoffice/billing/JurisdictionPacksTab';
import { UsersStorageTab } from '@/components/backoffice/billing/UsersStorageTab';
import { TenantsTab } from '@/components/backoffice/billing/TenantsTab';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes y Precios</h1>
          <p className="text-slate-500">Configura los planes, precios y add-ons de IP-NEXUS</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">Planes Base</TabsTrigger>
          <TabsTrigger value="modules">Módulos Standalone</TabsTrigger>
          <TabsTrigger value="jurisdictions">Packs Jurisdicciones</TabsTrigger>
          <TabsTrigger value="resources">Usuarios / Storage</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <PlansBaseTab />
        </TabsContent>
        <TabsContent value="modules" className="mt-6">
          <ModulesStandaloneTab />
        </TabsContent>
        <TabsContent value="jurisdictions" className="mt-6">
          <JurisdictionPacksTab />
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <UsersStorageTab />
        </TabsContent>
        <TabsContent value="tenants" className="mt-6">
          <TenantsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
