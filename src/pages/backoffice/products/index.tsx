// ============================================================
// IP-NEXUS BACKOFFICE - Products Management Page
// ============================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlansTab, AddonsTab, ModulesTab, PricingTab } from '@/components/backoffice/products';

export default function BackofficeProductsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="text-muted-foreground">
          Gestiona planes, módulos, add-ons y precios
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <PlansTab />
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <ModulesTab />
        </TabsContent>

        <TabsContent value="addons" className="mt-6">
          <AddonsTab />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
