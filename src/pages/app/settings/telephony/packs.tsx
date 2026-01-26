// ============================================================
// IP-NEXUS APP - Tenant Telephony Packs Purchase Page
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageSquare, Star, Zap, Check, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTelephonyPacks, type TelephonyPack } from '@/hooks/useTelephonyPacks';
import { useTenantTelephonyBalance } from '@/hooks/useTenantTelephony';
import { useTelephonyPurchase } from '@/hooks/useTelephonyPurchase';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

export default function TelephonyPacksPage() {
  const navigate = useNavigate();
  const { data: packs = [], isLoading } = useTelephonyPacks();
  const { data: balance } = useTenantTelephonyBalance();
  const { purchasePack, isPurchasing } = useTelephonyPurchase();
  
  const [selectedPack, setSelectedPack] = useState<TelephonyPack | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('saved');

  const activePacks = packs.filter(p => p.is_active);

  const handleSelectPack = (pack: TelephonyPack) => {
    setSelectedPack(pack);
    setShowCheckout(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPack) return;
    
    const result = await purchasePack(selectedPack.id);
    if (result.success) {
      setShowCheckout(false);
      navigate('/app/settings/telephony');
    }
  };

  const calculateTotal = (pack: TelephonyPack) => {
    const subtotal = pack.price;
    const vat = subtotal * 0.21;
    return { subtotal, vat, total: subtotal + vat };
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/settings/telephony">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comprar minutos</h1>
          <p className="text-muted-foreground">
            Tu saldo actual: <span className="font-medium text-foreground">{balance?.minutes_balance ?? 0} minutos</span>
          </p>
        </div>
      </div>

      <Separator />

      {/* Packs Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Elige tu pack</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-64" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePacks.map(pack => (
              <Card 
                key={pack.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:shadow-md",
                  pack.is_featured && "ring-2 ring-primary"
                )}
                onClick={() => handleSelectPack(pack)}
              >
                {/* Badge */}
                {pack.badge_text && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {pack.is_featured && <Star className="h-3 w-3 mr-1 fill-current" />}
                    {pack.badge_text}
                  </Badge>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  {pack.description && (
                    <CardDescription>{pack.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Minutes & SMS */}
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-lg font-medium">
                      <Phone className="h-5 w-5 text-primary" />
                      <span>{pack.minutes_included.toLocaleString()} minutos</span>
                    </div>
                    {pack.sms_included > 0 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>+ {pack.sms_included} SMS</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center py-2">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(pack.price, pack.currency)}
                    </span>
                    {pack.savings_percentage && pack.savings_percentage > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-success/10 text-success">
                        Ahorra {pack.savings_percentage}%
                      </Badge>
                    )}
                  </div>

                  {/* Validity */}
                  <p className="text-xs text-center text-muted-foreground">
                    Válido por {pack.validity_days} días
                  </p>

                  {/* CTA */}
                  <Button 
                    className="w-full" 
                    variant={pack.is_featured ? 'default' : 'outline'}
                  >
                    Seleccionar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tarifas por destino
          </CardTitle>
          <CardDescription>
            Los minutos de tu pack se consumen según el destino de la llamada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇪🇸</span>
                <span className="text-sm font-medium">España (fijos y móviles)</span>
              </div>
              <span className="text-sm text-muted-foreground">1 minuto = 1 minuto</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇪🇺</span>
                <span className="text-sm font-medium">Unión Europea</span>
              </div>
              <span className="text-sm text-muted-foreground">1 minuto = 1.3 minutos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm font-medium">Estados Unidos</span>
              </div>
              <span className="text-sm text-muted-foreground">1 minuto = 1.1 minutos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌎</span>
                <span className="text-sm font-medium">Otros países</span>
              </div>
              <span className="text-sm text-muted-foreground">Según tarifa</span>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="full-rates">
              <AccordionTrigger>Ver tarifas completas</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Las tarifas varían según el país de destino. Contacta con soporte para obtener información detallada sobre tarifas internacionales.</p>
                  <p className="text-xs">* Sujeto a política de uso razonable para packs ilimitados.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar compra</DialogTitle>
            <DialogDescription>
              Revisa los detalles de tu pedido
            </DialogDescription>
          </DialogHeader>

          {selectedPack && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{selectedPack.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPack.minutes_included.toLocaleString()} minutos
                    {selectedPack.sms_included > 0 && ` + ${selectedPack.sms_included} SMS`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Válido por {selectedPack.validity_days} días
                  </p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculateTotal(selectedPack).subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (21%)</span>
                    <span>{formatCurrency(calculateTotal(selectedPack).vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>TOTAL</span>
                    <span>{formatCurrency(calculateTotal(selectedPack).total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Método de pago</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="saved" id="payment-saved" />
                    <Label htmlFor="payment-saved" className="flex-1 cursor-pointer">
                      Usar tarjeta guardada (•••• 4242)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="new" id="payment-new" />
                    <Label htmlFor="payment-new" className="flex-1 cursor-pointer">
                      Usar otra tarjeta
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Los minutos se añadirán inmediatamente a tu saldo.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={isPurchasing}>
              {isPurchasing ? (
                <>Procesando...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar y pagar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
