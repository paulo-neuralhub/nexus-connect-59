/**
 * Public Pricing Page
 * PROMPT 50: Platform Modularization
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, X, ArrowRight, Sparkles, Shield, Zap, Users, Briefcase, MessageSquare, Radar, Store, BarChart3 } from 'lucide-react';
import { useMainPacks, useStandalonePacks, SubscriptionPack } from '@/hooks/use-subscription-packs';
import { cn } from '@/lib/utils';

const FEATURE_COMPARISON = [
  {
    category: 'Gestión de Expedientes (Docket)',
    features: [
      { name: 'Expedientes activos', starter: '50', professional: '500', enterprise: 'Ilimitados' },
      { name: 'Tareas y plazos', starter: true, professional: true, enterprise: true },
      { name: 'Documentos con versiones', starter: true, professional: true, enterprise: true },
      { name: 'Auto-cálculo de plazos', starter: false, professional: true, enterprise: true },
      { name: 'Árbol de familias', starter: false, professional: true, enterprise: true },
      { name: 'Email parsing', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    category: 'CRM',
    features: [
      { name: 'Contactos', starter: '100', professional: '1,000', enterprise: 'Ilimitados' },
      { name: 'Deals/Oportunidades', starter: '50', professional: 'Ilimitados', enterprise: 'Ilimitados' },
      { name: 'Pipelines personalizados', starter: false, professional: true, enterprise: true },
      { name: 'Automatizaciones', starter: false, professional: true, enterprise: true },
      { name: 'Email tracking', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    category: 'Vigilancia (Spider)',
    features: [
      { name: 'Watchlists', starter: '-', professional: '5', enterprise: '25+' },
      { name: 'Alertas en tiempo real', starter: false, professional: true, enterprise: true },
      { name: 'Análisis de similitud', starter: false, professional: true, enterprise: true },
      { name: 'Vigilancia global', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    category: 'IA (Genius)',
    features: [
      { name: 'Consultas/mes', starter: '100', professional: '500', enterprise: 'Ilimitadas' },
      { name: 'Chat asistente', starter: true, professional: true, enterprise: true },
      { name: 'Análisis de documentos', starter: false, professional: true, enterprise: true },
      { name: 'Traductor legal', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    category: 'Soporte',
    features: [
      { name: 'Email', starter: true, professional: true, enterprise: true },
      { name: 'Chat en vivo', starter: false, professional: true, enterprise: true },
      { name: 'Prioridad', starter: false, professional: false, enterprise: true },
      { name: 'Account Manager', starter: false, professional: false, enterprise: true },
      { name: 'SLA garantizado', starter: false, professional: false, enterprise: true },
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: '¿Puedo probar IP-NEXUS gratis?',
    answer: 'Sí, el plan Starter es completamente gratuito. También ofrecemos 14 días de prueba en los planes Professional y Enterprise sin compromiso.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) y transferencia bancaria para planes Enterprise. Todos los pagos se procesan de forma segura a través de Stripe.',
  },
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se aplican inmediatamente y se prorratea la diferencia.',
  },
  {
    question: '¿Qué pasa con mis datos si cancelo?',
    answer: 'Si cancelas, mantenemos tus datos durante 90 días. Puedes exportarlos en cualquier momento o reactivar tu cuenta sin perder información.',
  },
  {
    question: '¿Ofrecen descuentos por pago anual?',
    answer: 'Sí, al pagar anualmente obtienes 2 meses gratis (equivalente a un 17% de descuento).',
  },
  {
    question: '¿Necesito instalar algo?',
    answer: 'No, IP-NEXUS es 100% cloud. Solo necesitas un navegador web moderno. También tenemos app móvil (PWA) disponible.',
  },
];

function PricingCard({ pack, isYearly }: { pack: SubscriptionPack; isYearly: boolean }) {
  const price = isYearly && pack.price_yearly ? pack.price_yearly / 12 : pack.price_monthly;
  const originalPrice = pack.price_monthly;
  const isFree = price === 0;

  return (
    <Card 
      className={cn(
        'relative flex flex-col transition-all duration-300 hover:shadow-lg',
        pack.is_featured && 'border-primary shadow-xl scale-105 z-10'
      )}
    >
      {pack.badge_text && (
        <Badge 
          className={cn(
            'absolute -top-3 left-1/2 -translate-x-1/2',
            pack.is_featured ? 'bg-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {pack.badge_text}
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{pack.name}</CardTitle>
        <CardDescription>{pack.tagline}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        {/* Price */}
        <div className="text-center">
          {isFree ? (
            <div className="text-4xl font-bold">Gratis</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">€{Math.round(price)}</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              {isYearly && pack.price_yearly && (
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">€{originalPrice}</span>
                  {' '}Facturado anualmente
                </div>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {pack.features_highlight?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={pack.is_featured ? 'default' : 'outline'}
          size="lg"
          asChild
        >
          <Link to={isFree ? '/register' : `/register?plan=${pack.code}`}>
            {isFree ? 'Empezar gratis' : 'Empezar prueba'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function StandalonePackCard({ pack }: { pack: SubscriptionPack }) {
  const Icon = pack.code === 'spider_standalone' ? Radar : Store;
  
  return (
    <Card className="flex items-center justify-between p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{pack.name}</h3>
          <p className="text-sm text-muted-foreground">{pack.tagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold">€{pack.price_monthly}/mes</div>
          <div className="text-sm text-muted-foreground">Independiente</div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/register?plan=${pack.code}`}>
            Ver más
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const { data: mainPacks, isLoading: loadingMain } = useMainPacks();
  const { data: standalonePacks, isLoading: loadingStandalone } = useStandalonePacks();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">IP-NEXUS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Prueba gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            14 días gratis en planes de pago
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Precios simples y transparentes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Elige el plan que mejor se adapte a tu práctica de Propiedad Intelectual.
            Sin costes ocultos, sin sorpresas.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={cn(!isYearly && 'font-semibold')}>Mensual</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={cn(isYearly && 'font-semibold')}>
              Anual
              <Badge variant="secondary" className="ml-2">-17%</Badge>
            </span>
          </div>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {loadingMain ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[500px] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
              {mainPacks?.map(pack => (
                <PricingCard key={pack.id} pack={pack} isYearly={isYearly} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5" />
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-5 h-5" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>+500 despachos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-5 h-5" />
              <span>Soporte en español</span>
            </div>
          </div>
        </div>
      </section>

      {/* Standalone packs */}
      {standalonePacks && standalonePacks.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Productos Independientes</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ¿Ya tienes un sistema de gestión? Usa nuestros módulos de forma independiente.
              </p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {standalonePacks.map(pack => (
                <StandalonePackCard key={pack.id} pack={pack} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compara todas las funcionalidades
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-2 font-medium">Funcionalidad</th>
                  <th className="text-center py-4 px-2 font-medium w-32">Starter</th>
                  <th className="text-center py-4 px-2 font-medium w-32 bg-primary/5">Professional</th>
                  <th className="text-center py-4 px-2 font-medium w-32">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((category, catIdx) => (
                  <>
                    <tr key={`cat-${catIdx}`} className="bg-muted/50">
                      <td colSpan={4} className="py-3 px-2 font-semibold">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr key={`feat-${catIdx}-${featIdx}`} className="border-b border-muted">
                        <td className="py-3 px-2 text-sm">{feature.name}</td>
                        <td className="text-center py-3 px-2">
                          <FeatureValue value={feature.starter} />
                        </td>
                        <td className="text-center py-3 px-2 bg-primary/5">
                          <FeatureValue value={feature.professional} />
                        </td>
                        <td className="text-center py-3 px-2">
                          <FeatureValue value={feature.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Preguntas frecuentes
          </h2>
          
          <Accordion type="single" collapsible className="max-w-2xl mx-auto">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para transformar tu práctica de PI?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a más de 500 despachos que ya gestionan su cartera de PI con IP-NEXUS.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Empezar gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground/90" asChild>
              <Link to="/contact">Contactar ventas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              <span className="font-semibold">IP-NEXUS</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Términos</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacidad</Link>
              <Link to="/contact" className="hover:text-foreground">Contacto</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IP-NEXUS. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-green-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
    );
  }
  
  if (value === '-') {
    return <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />;
  }
  
  return <span className="text-sm font-medium">{value}</span>;
}
