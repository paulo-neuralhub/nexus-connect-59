// ============================================================
// GS001 — Configurar tu organización (PREMIUM)
// ============================================================

import { Settings, Building, Palette, FileText, Globe, Save } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { IllustrationDashboard } from '../illustrations';

const ACCENT = '#3B82F6';

export function GS001Content() {
  return (
    <ArticleLayout
      title="Configurar tu organización"
      subtitle="Define los datos de tu despacho o empresa para personalizar IP-NEXUS a tu imagen."
      icon={Building}
      accentColor={ACCENT}
      category="Primeros Pasos"
      categorySlug="getting-started"
      readTime="4 min"
      lastUpdated="Febrero 2026"
      tags={['configuración', 'organización', 'onboarding']}
      tocSections={[
        { id: 'antes', title: 'Antes de empezar' },
        { id: 'pasos', title: 'Paso a paso' },
        { id: 'siguiente', title: 'Siguiente paso' },
      ]}
      relatedArticles={[
        { title: 'Invitar a tu equipo', path: '/app/help/article/invitar-equipo', readTime: '3 min' },
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationDashboard size={150} />
      </div>

      <p className="text-[15px] text-foreground/80 leading-relaxed">
        Antes de empezar a trabajar con expedientes y clientes, configura los datos de tu
        <strong> organización</strong>. Se utilizarán en comunicaciones, documentos generados y facturación.
      </p>

      <ArticleSection id="antes" title="Antes de empezar" icon={Settings} accentColor={ACCENT}>
        <InfoCallout type="info">
          Solo los usuarios con rol <strong>Admin</strong> u <strong>Owner</strong> pueden
          modificar los ajustes de la organización.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="pasos" title="Paso a paso" icon={Settings} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Accede a Configuración',
            description: 'En el sidebar izquierdo, haz click en el icono de engranaje (⚙️) o navega a Configuración → Organización.',
            tip: 'También puedes acceder desde tu perfil (avatar) → Configuración de organización.',
          },
          {
            title: 'Datos básicos',
            description: 'Rellena el nombre de tu despacho o empresa, el slug (URL corta) y una descripción breve. Esta información será visible para los miembros de tu equipo.',
          },
          {
            title: 'Logo y branding',
            description: 'Sube el logotipo de tu organización. Se recomienda un archivo PNG o SVG con fondo transparente y dimensiones mínimas de 200×200px.',
            tip: 'Usa un logo cuadrado para que se vea bien en todos los tamaños.',
          },
          {
            title: 'Datos fiscales',
            description: 'Introduce el NIF/CIF, dirección fiscal y datos de contacto. Son necesarios para la generación de facturas y presupuestos desde el módulo Finance.',
            warning: 'Si no introduces los datos fiscales, no podrás generar facturas desde IP-NEXUS.',
          },
          {
            title: 'Zona horaria e idioma',
            description: 'Selecciona la zona horaria de tu oficina principal y el idioma por defecto. Los plazos y alertas se calcularán según esta configuración.',
          },
          {
            title: 'Guarda los cambios',
            description: 'Haz click en "Guardar" para aplicar la configuración. Los cambios se reflejarán inmediatamente en toda la plataforma.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="siguiente" title="Siguiente paso" icon={Save} accentColor={ACCENT}>
        <InfoCallout type="tip">
          Tras configurar tu organización, el siguiente paso es{' '}
          <a href="/app/help/article/invitar-equipo" className="underline font-semibold">invitar a tu equipo</a>.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
