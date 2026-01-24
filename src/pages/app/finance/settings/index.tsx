// ============================================
// src/pages/app/finance/settings/index.tsx
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, FileText, CreditCard, Bell, Save } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { toast } from 'sonner';

export default function FinanceSettingsPage() {
  usePageTitle('Configuración Finance');

  const handleSave = () => {
    toast.success('Configuración guardada');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Facturación</h1>
        <p className="text-muted-foreground">
          Personaliza los ajustes de facturación y cobros
        </p>
      </div>

      {/* Datos empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos de la empresa
          </CardTitle>
          <CardDescription>
            Información que aparecerá en facturas y presupuestos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre fiscal</Label>
              <Input defaultValue="IP-NEXUS Legal Services S.L." />
            </div>
            <div className="space-y-2">
              <Label>CIF/NIF</Label>
              <Input defaultValue="B12345678" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dirección fiscal</Label>
            <Textarea 
              defaultValue="Calle Gran Vía 123, Planta 5&#10;28013 Madrid&#10;España" 
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email de facturación</Label>
              <Input type="email" defaultValue="facturacion@ip-nexus.com" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input defaultValue="+34 91 123 45 67" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturas
          </CardTitle>
          <CardDescription>
            Numeración y formato de facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefijo numeración</Label>
              <Input defaultValue="FAC-" />
            </div>
            <div className="space-y-2">
              <Label>Siguiente número</Label>
              <Input type="number" defaultValue="2026001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moneda por defecto</Label>
              <Select defaultValue="EUR">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="GBP">Libra (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IVA por defecto (%)</Label>
              <Input type="number" defaultValue="21" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas pie de factura</Label>
            <Textarea 
              placeholder="Texto que aparecerá al pie de todas las facturas..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Métodos de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Métodos de pago
          </CardTitle>
          <CardDescription>
            Datos bancarios para cobros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input defaultValue="ES12 1234 5678 9012 3456 7890" />
            </div>
            <div className="space-y-2">
              <Label>BIC/SWIFT</Label>
              <Input defaultValue="ABCDESMM" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Banco</Label>
            <Input defaultValue="Banco Ejemplo S.A." />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Permitir pago con tarjeta</div>
              <div className="text-sm text-muted-foreground">
                Los clientes podrán pagar online con tarjeta
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Alertas y recordatorios de cobro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Recordatorio de pago</div>
              <div className="text-sm text-muted-foreground">
                Enviar recordatorio automático al vencer el plazo
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Alerta facturas impagadas</div>
              <div className="text-sm text-muted-foreground">
                Notificar cuando una factura lleve más de 30 días impagada
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Resumen semanal</div>
              <div className="text-sm text-muted-foreground">
                Recibir resumen de facturación cada lunes
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
