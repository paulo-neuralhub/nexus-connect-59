/**
 * Agent Storefront — /portal/:slug/agent/storefront
 */
import { useState } from 'react';
import { useAgentPortalContext } from './AgentPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Clock, Check, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontItem {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  price_type: 'fixed' | 'from' | 'quote' | 'free';
  base_price_eur: number | null;
  includes_official_fees: boolean;
  official_fees_estimate_eur: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  features: string[];
  is_featured: boolean;
}

const MOCK_ITEMS: StorefrontItem[] = [
  {
    id: 'si-1', title: 'Registro de Marca EUIPO', description: 'Registro completo de marca comunitaria',
    short_description: 'Protección en todos los países de la UE', category: 'trademark',
    price_type: 'from', base_price_eur: 450, includes_official_fees: false,
    official_fees_estimate_eur: 850, estimated_days_min: 365, estimated_days_max: 540,
    features: ['Búsqueda previa incluida', '1 clase Niza', 'Gestión completa'], is_featured: true,
  },
  {
    id: 'si-2', title: 'Registro de Marca Nacional (OEPM)', description: 'Registro de marca en España',
    short_description: 'Protección nacional en España', category: 'trademark',
    price_type: 'fixed', base_price_eur: 350, includes_official_fees: true,
    official_fees_estimate_eur: 144, estimated_days_min: 180, estimated_days_max: 365,
    features: ['Tasas oficiales incluidas', '1 clase', 'Seguimiento completo'], is_featured: false,
  },
  {
    id: 'si-3', title: 'Búsqueda de Anterioridades', description: 'Búsqueda exhaustiva de marcas similares',
    short_description: 'Identifica conflictos potenciales', category: 'search',
    price_type: 'fixed', base_price_eur: 120, includes_official_fees: false,
    official_fees_estimate_eur: null, estimated_days_min: 3, estimated_days_max: 5,
    features: ['3 jurisdicciones', 'Informe detallado', 'Recomendaciones'], is_featured: true,
  },
  {
    id: 'si-4', title: 'Consultoría PI Estratégica', description: 'Sesión de consultoría sobre estrategia de PI',
    short_description: 'Asesoramiento personalizado', category: 'consultation',
    price_type: 'quote', base_price_eur: null, includes_official_fees: false,
    official_fees_estimate_eur: null, estimated_days_min: 1, estimated_days_max: 3,
    features: ['Sesión 1h', 'Informe escrito', 'Follow-up'], is_featured: false,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'trademark', label: '🔵 Marcas' },
  { value: 'patent', label: '🟢 Patentes' },
  { value: 'design', label: '🟡 Diseños' },
  { value: 'search', label: '🔍 Búsquedas' },
  { value: 'consultation', label: '⭐ Consultoría' },
];

export default function AgentStorefrontPage() {
  const { clients, activeClient } = useAgentPortalContext();
  const [category, setCategory] = useState('all');
  const [orderModal, setOrderModal] = useState<StorefrontItem | null>(null);
  const [orderStep, setOrderStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [intakeData, setIntakeData] = useState({ mark_name: '', jurisdictions: '', nice_classes: '' });

  // Feature flag mock
  const featureEnabled = true;

  if (!featureEnabled) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Storefront no disponible</p>
          <p className="text-sm">El despacho activará esta función próximamente</p>
        </div>
      </div>
    );
  }

  const filtered = category === 'all' ? MOCK_ITEMS : MOCK_ITEMS.filter(i => i.category === category);

  const startOrder = (item: StorefrontItem) => {
    setOrderModal(item);
    setOrderStep(1);
    setSelectedClient(activeClient?.client_account_id || '');
    setIntakeData({ mark_name: '', jurisdictions: '', nice_classes: '' });
  };

  const submitOrder = () => {
    toast.success('Solicitud enviada. El despacho la confirmará en 24h.');
    setOrderModal(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold">¿Qué necesitas para tus clientes?</h1>
        <p className="text-sm text-muted-foreground">Catálogo de servicios del despacho</p>
      </div>

      {/* Categories */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          {CATEGORIES.map(c => (
            <TabsTrigger key={c.value} value={c.value} className="text-xs">{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <Card key={item.id} className="flex flex-col">
            <CardContent className="pt-5 flex-1 flex flex-col">
              {item.is_featured && (
                <Badge className="self-start mb-2 bg-primary/10 text-primary hover:bg-primary/10 text-[10px]">⭐ Destacado</Badge>
              )}
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{item.short_description}</p>

              {/* Price */}
              <div className="mb-3">
                {item.price_type === 'fixed' && (
                  <span className="text-lg font-bold text-foreground">€{item.base_price_eur}</span>
                )}
                {item.price_type === 'from' && (
                  <span className="text-lg font-bold text-foreground">Desde €{item.base_price_eur}</span>
                )}
                {item.price_type === 'quote' && (
                  <span className="text-sm font-medium text-muted-foreground">Presupuesto personalizado</span>
                )}
                {item.price_type === 'free' && (
                  <span className="text-lg font-bold text-emerald-600">Gratis</span>
                )}
                {item.includes_official_fees && (
                  <span className="text-[10px] text-muted-foreground block">Incluye tasas oficiales</span>
                )}
                {!item.includes_official_fees && item.official_fees_estimate_eur && (
                  <span className="text-[10px] text-muted-foreground block">+ tasas (≈€{item.official_fees_estimate_eur})</span>
                )}
              </div>

              {/* Timeline */}
              {item.estimated_days_min && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  {item.estimated_days_min}-{item.estimated_days_max} días estimado
                </div>
              )}

              {/* Features */}
              <div className="space-y-1 mb-4 flex-1">
                {item.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500" /> {f}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <Button size="sm" className="w-full gap-1.5" onClick={() => startOrder(item)}>
                Solicitar para cliente <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Modal */}
      <Dialog open={!!orderModal} onOpenChange={() => setOrderModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {orderStep === 1 && '¿Para qué cliente?'}
              {orderStep === 2 && 'Datos del expediente'}
              {orderStep === 3 && 'Resumen y envío'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {orderModal?.title} — Paso {orderStep} de 3
            </DialogDescription>
          </DialogHeader>

          {orderStep === 1 && (
            <div className="space-y-2">
              {clients.map(c => (
                <Button
                  key={c.client_account_id}
                  variant={selectedClient === c.client_account_id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedClient(c.client_account_id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}

          {orderStep === 2 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre de la marca</Label>
                <Input value={intakeData.mark_name} onChange={e => setIntakeData(p => ({ ...p, mark_name: e.target.value }))} placeholder="Ej: NEXUS" />
              </div>
              <div>
                <Label className="text-xs">Jurisdicciones</Label>
                <Input value={intakeData.jurisdictions} onChange={e => setIntakeData(p => ({ ...p, jurisdictions: e.target.value }))} placeholder="Ej: EUIPO, USPTO" />
              </div>
              <div>
                <Label className="text-xs">Clases Niza</Label>
                <Input value={intakeData.nice_classes} onChange={e => setIntakeData(p => ({ ...p, nice_classes: e.target.value }))} placeholder="Ej: 9, 42" />
              </div>
            </div>
          )}

          {orderStep === 3 && (
            <div className="space-y-3">
              <Card>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Servicio</span><span className="font-medium">{orderModal?.title}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{clients.find(c => c.client_account_id === selectedClient)?.name}</span></div>
                  {intakeData.mark_name && <div className="flex justify-between"><span className="text-muted-foreground">Marca</span><span>{intakeData.mark_name}</span></div>}
                  {orderModal?.base_price_eur && <div className="flex justify-between"><span className="text-muted-foreground">Precio estimado</span><span className="font-bold">€{orderModal.base_price_eur}</span></div>}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            {orderStep > 1 && (
              <Button variant="outline" onClick={() => setOrderStep(s => s - 1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Atrás
              </Button>
            )}
            {orderStep < 3 ? (
              <Button onClick={() => setOrderStep(s => s + 1)} disabled={orderStep === 1 && !selectedClient}>
                Siguiente <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button onClick={submitOrder}>
                <Package className="w-3.5 h-3.5 mr-1" /> Enviar solicitud
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
