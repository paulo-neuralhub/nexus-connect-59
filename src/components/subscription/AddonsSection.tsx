// ============================================================
// IP-NEXUS - Addons Section Component
// ============================================================

import { Package, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionItem } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/format';

interface Props {
  items: SubscriptionItem[];
  onCancelAddon: (addonId: string, addonName: string) => void;
  onAddOffices: () => void;
  onAddModules: () => void;
}

export function AddonsSection({ items, onCancelAddon, onAddOffices, onAddModules }: Props) {
  const jurisdictionAddons = items.filter(i => i.product?.product_type === 'jurisdiction');
  const moduleAddons = items.filter(i => i.product?.product_type === 'addon');

  const renderAddonItem = (item: SubscriptionItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 rounded-lg border bg-card"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {item.product?.product_type === 'jurisdiction' ? '🌐' : '📦'}
        </div>
        <div>
          <p className="font-medium">{item.product?.name || 'Add-on'}</p>
          <p className="text-sm text-muted-foreground">
            +{item.price ? formatCurrency(item.price.price, item.price.currency || 'EUR') : '---'}/mes
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => onCancelAddon(item.id, item.product?.name || 'Add-on')}
      >
        <X className="h-4 w-4 mr-1" />
        Cancelar
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add-ons Activos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No tienes add-ons activos
          </p>
        ) : (
          <div className="space-y-2">
            {jurisdictionAddons.length > 0 && (
              <div className="space-y-2">
                <Badge variant="outline" className="mb-2">Oficinas</Badge>
                {jurisdictionAddons.map(renderAddonItem)}
              </div>
            )}
            {moduleAddons.length > 0 && (
              <div className="space-y-2 mt-4">
                <Badge variant="outline" className="mb-2">Módulos</Badge>
                {moduleAddons.map(renderAddonItem)}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={onAddOffices}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir oficinas
          </Button>
          <Button variant="outline" onClick={onAddModules}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir módulos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
