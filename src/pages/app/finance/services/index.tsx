// =============================================
// ServicesCatalogPage — Catálogo de servicios PI
// /app/finance/services
// =============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Package, Lock, Edit, Power, Loader2 } from 'lucide-react';
import { useServicesCatalog, useCreateService, useUpdateService, type ServiceCatalogEntry } from '@/hooks/finance/useServicesCatalog';
import { formatCurrency } from '@/lib/constants/finance';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  trademark_registration: 'Registro de marca',
  trademark_renewal: 'Renovación de marca',
  trademark_opposition: 'Oposición',
  patent_filing: 'Solicitud de patente',
  patent_prosecution: 'Tramitación de patente',
  design_registration: 'Registro de diseño',
  ip_search: 'Búsquedas PI',
  ip_advice: 'Consultoría PI',
  official_fees: 'Tasas oficiales',
  translation: 'Traducciones',
  other: 'Otros',
};

const ITEM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  professional_fee: { label: 'Honorario', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  official_fee: { label: 'Tasa oficial', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  disbursement: { label: 'Suplido', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expense_recharge: { label: 'Gasto repercutido', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export default function ServicesCatalogPage() {
  const { data: services = [], isLoading } = useServicesCatalog();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ip_advice',
    invoice_item_type: 'professional_fee',
    default_price: '',
    default_currency: 'EUR',
    default_unit: 'service',
  });

  const filtered = services.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const systemServices = filtered.filter(s => s.is_system_template);
  const myServices = filtered.filter(s => !s.is_system_template);

  const resetForm = () => {
    setFormData({ code: '', name: '', category: 'ip_advice', invoice_item_type: 'professional_fee', default_price: '', default_currency: 'EUR', default_unit: 'service' });
  };

  const handleCreate = async () => {
    await createService.mutateAsync({
      code: formData.code,
      name: formData.name,
      category: formData.category,
      invoice_item_type: formData.invoice_item_type,
      default_price: formData.default_price ? Number(formData.default_price) : null,
      default_currency: formData.default_currency,
      default_unit: formData.default_unit,
    });
    setShowCreate(false);
    resetForm();
  };

  const handleToggleActive = async (service: ServiceCatalogEntry) => {
    await updateService.mutateAsync({
      id: service.id,
      data: { is_active: !service.is_active },
    });
  };

  const ServiceCard = ({ service }: { service: ServiceCatalogEntry }) => {
    const typeConfig = ITEM_TYPE_LABELS[service.invoice_item_type] || ITEM_TYPE_LABELS.professional_fee;
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {service.is_system_template ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Package className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{service.code}</code>
              <span className="font-medium text-sm truncate">{service.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={cn('text-[10px] py-0', typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[service.category] || service.category}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {service.default_price != null && (
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(service.default_price, service.default_currency)}
            </span>
          )}
          {!service.is_system_template && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                setEditingService(service);
                setFormData({
                  code: service.code,
                  name: service.name,
                  category: service.category,
                  invoice_item_type: service.invoice_item_type,
                  default_price: service.default_price?.toString() || '',
                  default_currency: service.default_currency,
                  default_unit: service.default_unit,
                });
              }}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggleActive(service)}
              >
                <Power className={cn("w-4 h-4", service.is_active ? "text-green-500" : "text-muted-foreground")} />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ServiceFormDialog = ({ open, onOpenChange, isEdit }: { open: boolean; onOpenChange: (o: boolean) => void; isEdit: boolean }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Nuevo servicio personalizado'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={formData.code} onChange={e => setFormData(f => ({ ...f, code: e.target.value }))} placeholder="CONS-CUSTOM" />
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Consultoría personalizada" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de línea</Label>
              <Select value={formData.invoice_item_type} onValueChange={v => setFormData(f => ({ ...f, invoice_item_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" step="0.01" value={formData.default_price} onChange={e => setFormData(f => ({ ...f, default_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={formData.default_currency} onValueChange={v => setFormData(f => ({ ...f, default_currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={formData.default_unit} onValueChange={v => setFormData(f => ({ ...f, default_unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Servicio</SelectItem>
                  <SelectItem value="hour">Hora</SelectItem>
                  <SelectItem value="page">Página</SelectItem>
                  <SelectItem value="class">Clase</SelectItem>
                  <SelectItem value="jurisdiction">Jurisdicción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!formData.code || !formData.name || createService.isPending || updateService.isPending}
            onClick={async () => {
              if (isEdit && editingService) {
                await updateService.mutateAsync({
                  id: editingService.id,
                  data: {
                    code: formData.code,
                    name: formData.name,
                    category: formData.category,
                    invoice_item_type: formData.invoice_item_type,
                    default_price: formData.default_price ? Number(formData.default_price) : null,
                    default_currency: formData.default_currency,
                    default_unit: formData.default_unit,
                  },
                });
                setEditingService(null);
              } else {
                await handleCreate();
              }
              onOpenChange(false);
              resetForm();
            }}
          >
            {(createService.isPending || updateService.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Actualizar' : 'Crear servicio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de servicios</h1>
          <p className="text-muted-foreground">Servicios predefinidos y personalizados para facturación</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo servicio
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código o nombre..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Mis servicios ({myServices.length})</h3>
            {myServices.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
                <p className="text-sm">No tienes servicios personalizados aún</p>
                <Button variant="link" onClick={() => { resetForm(); setShowCreate(true); }} className="mt-1">
                  Crear tu primer servicio →
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myServices.map(s => <ServiceCard key={s.id} service={s} />)}
              </div>
            )}
          </div>

          {/* System Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Servicios del sistema ({systemServices.length})
            </h3>
            <div className="space-y-2">
              {systemServices.map(s => <ServiceCard key={s.id} service={s} />)}
            </div>
          </div>
        </div>
      )}

      <ServiceFormDialog open={showCreate} onOpenChange={setShowCreate} isEdit={false} />
      <ServiceFormDialog open={!!editingService} onOpenChange={o => { if (!o) setEditingService(null); }} isEdit={true} />
    </div>
  );
}
