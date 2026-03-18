// ============================================================
// IP-NEXUS BACKOFFICE - Add-ons Tab Component
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Plus, Check, X, Globe, Flag, Brain, Radar } from 'lucide-react';
import { useProductAddonsConfig, type AddonWithDetails } from '@/hooks/backoffice/useProductAddons';
import { AddonEditModal } from './AddonEditModal';
import { formatCurrency } from '@/lib/utils';

const ICON_MAP: Record<string, React.ReactNode> = {
  Flag: <Flag className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Globe2: <Globe className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Radar: <Radar className="h-5 w-5" />,
};

export function AddonsTab() {
  const { data: addons, isLoading } = useProductAddonsConfig();
  const [selectedAddon, setSelectedAddon] = useState<AddonWithDetails | null>(null);

  // Separate office addons from module addons
  const officeAddons = addons?.filter(a => a.product.code.startsWith('addon_office_')) ?? [];
  const moduleAddons = addons?.filter(a => !a.product.code.startsWith('addon_office_')) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const renderAddonRow = (addon: AddonWithDetails) => {
    const monthlyPrice = addon.prices?.find(p => p.billing_period === 'monthly')?.price ?? 0;
    const includedInPlans = addon.included_in_plans ?? [];
    const isActive = addon.product.is_active;

    return (
      <tr key={addon.product.id} className="border-b hover:bg-muted/50">
        <td className="p-3">
          <div className="flex items-center gap-2">
            {ICON_MAP[addon.product.icon ?? ''] ?? <Flag className="h-5 w-5" />}
            <span className="font-medium">{addon.product.name}</span>
          </div>
        </td>
        <td className="p-3">
          {monthlyPrice > 0 ? `${formatCurrency(monthlyPrice)}/mes` : '-'}
        </td>
        <td className="p-3">
          <div className="flex flex-wrap gap-1">
            {includedInPlans.length > 0 ? (
              includedInPlans.map((plan: string) => (
                <Badge key={plan} variant="secondary" className="text-xs">
                  {plan.replace('plan_', '')}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        </td>
        <td className="p-3">
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </td>
        <td className="p-3 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAddon(addon)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Add-ons</h2>
          <p className="text-sm text-muted-foreground">
            Productos que se pueden añadir a cualquier plan
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo add-on
        </Button>
      </div>

      {/* Office Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Oficinas</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="p-3">Add-on</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Gratis en</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {officeAddons.map(renderAddonRow)}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Module Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Módulos Extra</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="p-3">Add-on</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Gratis en</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {moduleAddons.map(renderAddonRow)}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {selectedAddon && (
        <AddonEditModal
          addon={selectedAddon}
          open={!!selectedAddon}
          onClose={() => setSelectedAddon(null)}
        />
      )}
    </div>
  );
}
