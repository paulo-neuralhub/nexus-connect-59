import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Plus, X, ExternalLink, Loader2, Check, AlertTriangle, Crown } from "lucide-react";
import { useTenantOffices, TenantOffice, OfficeAddon } from "@/hooks/useTenantOffices";
import { useOrganization } from "@/contexts/organization-context";
import { Link } from "react-router-dom";

export default function MyOfficesPage() {
  const { currentOrganization } = useOrganization();
  const { myOffices, availableAddons, isLoading, addOfficeAddon, cancelOfficeAddon, isAddingAddon, isCancellingAddon } = useTenantOffices();
  
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [selectedAddon, setSelectedAddon] = React.useState<OfficeAddon | null>(null);
  const [selectedOffice, setSelectedOffice] = React.useState<TenantOffice | null>(null);

  const plan = currentOrganization?.plan || 'starter';
  const planPrice = { starter: 49, professional: 99, business: 199, enterprise: 299 }[plan] || 99;
  
  const includedOffices = myOffices.filter(o => o.source_type === 'included');
  const addonOffices = myOffices.filter(o => o.source_type === 'addon');
  const totalAddonPrice = addonOffices.reduce((sum, o) => sum + (o.price_monthly || 0), 0);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'operational': return '🟢';
      case 'degraded': return '🟡';
      case 'maintenance': return '🔵';
      case 'down': return '🔴';
      default: return '⚪';
    }
  };

  const handleAddAddon = async () => {
    if (!selectedAddon) return;
    await addOfficeAddon(selectedAddon.id);
    setAddModalOpen(false);
    setSelectedAddon(null);
  };

  const handleCancelAddon = async () => {
    if (!selectedOffice) return;
    await cancelOfficeAddon(selectedOffice.id);
    setCancelModalOpen(false);
    setSelectedOffice(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Oficinas y Jurisdicciones</h1>
        <p className="text-muted-foreground mt-1">
          Tu plan: <span className="font-semibold uppercase">{plan}</span> ({planPrice}€/mes)
        </p>
      </div>

      {/* Included in Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Incluidas en tu plan</CardTitle>
          <CardDescription>
            Estas oficinas están incluidas en tu suscripción {plan}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {includedOffices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay oficinas incluidas en tu plan actual.</p>
          ) : (
            includedOffices.map((office) => (
              <div key={office.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{office.flag_emoji}</span>
                  <div>
                    <div className="font-medium">{office.office_name_short || office.office_code}</div>
                    <div className="text-sm text-muted-foreground">{office.office_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estado: {getStatusIcon(office.operational_status)} {office.operational_status || 'N/A'}
                      {office.last_sync_at && ` • Última sync: ${new Date(office.last_sync_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expedientes monitorizados: {office.matters_count}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/app/settings/integrations">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* My Add-ons */}
      {addonOffices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mis Add-ons</CardTitle>
            <CardDescription>
              Oficinas adicionales contratadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {addonOffices.map((office) => (
              <div key={office.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{office.flag_emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{office.office_name_short || office.office_code}</span>
                      <Badge variant="secondary">+{office.price_monthly}€/mes</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{office.office_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estado: {getStatusIcon(office.operational_status)} {office.operational_status || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expedientes monitorizados: {office.matters_count}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/app/settings/integrations">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedOffice(office);
                      setCancelModalOpen(true);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Add-ons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Añadir más oficinas</CardTitle>
          <CardDescription>
            Amplía tu cobertura con oficinas adicionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableAddons.length === 0 ? (
            <p className="text-muted-foreground text-sm">Ya tienes acceso a todas las oficinas disponibles.</p>
          ) : (
            availableAddons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{addon.flag_emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{addon.office_name_short || addon.office_code}</span>
                      <Badge variant="outline">+{addon.price_monthly}€/mes</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{addon.office_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estado: {getStatusIcon(addon.operational_status)} {addon.operational_status || 'N/A'}
                      {addon.data_source_type === 'file_import' && ' • Método: Importar archivos'}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedAddon(addon);
                    setAddModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Enterprise Upsell */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Con ENTERPRISE (299€/mes) todas las oficinas incluidas</p>
                <p className="text-sm text-muted-foreground">Acceso ilimitado a todas las jurisdicciones</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/app/settings/billing">Comparar planes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Resumen facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
              <span>{planPrice}€/mes</span>
            </div>
            {addonOffices.map((office) => (
              <div key={office.id} className="flex justify-between text-muted-foreground">
                <span>+ {office.office_name_short || office.office_code}</span>
                <span>{office.price_monthly}€/mes</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>TOTAL</span>
              <span>{planPrice + totalAddonPrice}€/mes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Addon Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Oficina</DialogTitle>
            <DialogDescription>
              {selectedAddon?.flag_emoji} {selectedAddon?.office_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Incluye</h4>
              <ul className="space-y-1">
                {selectedAddon?.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <p className="font-medium">Precio: +{selectedAddon?.price_monthly}€/mes</p>
              <p className="text-sm text-muted-foreground mt-1">
                Se añadirá a tu próxima factura de forma prorrateada. Puedes cancelar en cualquier momento.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Tu facturación actual:</span>
                <span>{planPrice + totalAddonPrice}€/mes</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Nueva facturación:</span>
                <span>{planPrice + totalAddonPrice + (selectedAddon?.price_monthly || 0)}€/mes</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAddon} disabled={isAddingAddon}>
              {isAddingAddon && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar y añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Addon Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Oficina</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres cancelar el add-on de {selectedOffice?.office_name_short || selectedOffice?.office_code}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Al cancelar:</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Perderás acceso a la sincronización automática</li>
                    <li>• Los expedientes de esta oficina dejarán de actualizarse</li>
                    <li>• Los documentos ya descargados se mantendrán</li>
                    <li>• Los plazos existentes no se eliminarán</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              La cancelación será efectiva al final del período de facturación actual.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelAddon} disabled={isCancellingAddon}>
              {isCancellingAddon && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
