/**
 * Spider Onboarding / Upgrade Gate
 * Shown when has_spider = false
 */
import { Link } from 'react-router-dom';
import { Radar, Shield, Eye, Zap, Globe, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    icon: Shield,
    title: 'Protección proactiva',
    description: 'Detecta marcas conflictivas antes de que se registren. Monitoriza oficinas de PI en más de 180 jurisdicciones.',
  },
  {
    icon: Eye,
    title: 'Análisis inteligente',
    description: 'Análisis fonético, semántico y visual con IA. Puntuación de similitud combinada para priorizar amenazas.',
  },
  {
    icon: Zap,
    title: 'Alertas en tiempo real',
    description: 'Notificaciones instantáneas cuando se detectan conflictos. Plazos de oposición calculados automáticamente.',
  },
];

const PLANS = [
  {
    name: 'Lite',
    code: 'lite',
    price: '29',
    description: 'Para profesionales independientes',
    features: [
      '5 vigilancias activas',
      '3 jurisdicciones por vigilancia',
      '30 escaneos/mes',
      '50 alertas/mes',
      'Análisis fonético y semántico',
    ],
    notIncluded: ['Análisis visual de logos', 'Vigilancia de dominios', 'Escaneo en tiempo real'],
    highlighted: false,
  },
  {
    name: 'Pro',
    code: 'pro',
    price: '79',
    description: 'Para despachos y agencias',
    features: [
      '25 vigilancias activas',
      '10 jurisdicciones por vigilancia',
      '100 escaneos/mes',
      '500 alertas/mes',
      'Análisis fonético, semántico y visual',
      'Comparación de logos con IA',
    ],
    notIncluded: ['Vigilancia de dominios', 'Escaneo en tiempo real'],
    highlighted: true,
  },
  {
    name: 'Full',
    code: 'full',
    price: '199',
    description: 'Para corporaciones y grandes carteras',
    features: [
      'Vigilancias ilimitadas',
      'Jurisdicciones ilimitadas',
      'Escaneos ilimitados',
      'Alertas ilimitadas',
      'Análisis completo (fonético + visual + semántico)',
      'Vigilancia de dominios',
      'Escaneo en tiempo real',
    ],
    notIncluded: [],
    highlighted: false,
  },
];

export default function SpiderOnboarding() {
  return (
    <div className="min-h-[80vh] py-10 px-4 md:px-8 max-w-6xl mx-auto space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.35)',
          }}
        >
          <Radar className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          IP-SPIDER
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Sistema inteligente de vigilancia y monitorización de propiedad intelectual.
          Detecta amenazas, protege tus marcas y actúa antes que la competencia.
        </p>
      </section>

      {/* Benefits */}
      <section className="grid md:grid-cols-3 gap-6">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:shadow-lg transition-shadow"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
            >
              <b.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">{b.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
          </div>
        ))}
      </section>

      {/* Plans */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Elige tu plan Spider</h2>
          <p className="text-muted-foreground mt-2">Todos los planes incluyen soporte y actualizaciones</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`rounded-2xl border-2 p-6 space-y-5 transition-shadow ${
                plan.highlighted
                  ? 'border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/10 relative'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full bg-[#8B5CF6]">
                  Más popular
                </span>
              )}
              <div>
                <h3 className="font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mes</span>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                    <span className="w-4 h-4 mt-0.5 shrink-0 text-center">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link to="/app/settings/subscription/plans">
                  Contratar {plan.name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Global reach */}
      <section className="text-center py-8 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Globe className="w-5 h-5" />
          <span className="text-sm">Cobertura en más de 180 oficinas de PI a nivel mundial</span>
        </div>
      </section>
    </div>
  );
}
