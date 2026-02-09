// ============================================================
// GS005 — Configurar plazos y alertas (PREMIUM)
// ============================================================

import { Bell, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { DataTable } from '../DataTable';

const ACCENT = '#F59E0B';

export function GS005Content() {
  return (
    <ArticleLayout
      title="Configurar plazos y alertas"
      subtitle="Nunca pierdas un vencimiento. Configura alertas automáticas para plazos críticos de PI."
      icon={Bell}
      accentColor={ACCENT}
      category="Primeros Pasos"
      categorySlug="getting-started"
      readTime="4 min"
      lastUpdated="Febrero 2026"
      tags={['alertas', 'plazos', 'vencimientos', 'renovaciones']}
      tocSections={[
        { id: 'por-que', title: 'Por qué es importante' },
        { id: 'configurar', title: 'Cómo configurar' },
        { id: 'tipos', title: 'Tipos de plazos' },
      ]}
      relatedArticles={[
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
        { title: 'IP-Spider: Vigilancia de marcas', path: '/app/help/article/que-es-spider', readTime: '4 min' },
      ]}
    >
      <p className="text-[15px] text-foreground/80 leading-relaxed">
        Uno de los mayores riesgos en PI es <strong>perder un plazo</strong>. IP-NEXUS te permite
        configurar alertas automáticas para que nunca se te escape un vencimiento, renovación o plazo procesal.
      </p>

      <ArticleSection id="por-que" title="Por qué es importante" icon={AlertTriangle} accentColor={ACCENT}>
        <InfoCallout type="warning">
          Perder un plazo de renovación puede significar la <strong>pérdida permanente</strong> de un
          derecho de PI. Configura las alertas desde el primer día.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="configurar" title="Cómo configurar alertas" icon={Bell} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Accede a la configuración de alertas',
            description: 'Ve a Configuración → Notificaciones → Plazos y alertas. Aquí puedes definir las reglas generales.',
          },
          {
            title: 'Define cuándo avisar',
            description: 'Selecciona con cuántos días de antelación quieres recibir la alerta. Puedes configurar múltiples avisos.',
            tip: 'Recomendamos al menos 3 recordatorios: a 30, 7 y 1 día antes.',
          },
          {
            title: 'Elige los canales',
            description: 'Selecciona cómo recibir alertas: notificación in-app, email, o ambas. Para plazos críticos, activa el email.',
          },
          {
            title: 'Configura el escalado',
            description: 'Opcionalmente, configura que si un plazo no se atiende, se escale a un supervisor o manager.',
            tip: 'El escalado es especialmente útil con un gran volumen de expedientes.',
          },
          {
            title: 'Alertas por expediente',
            description: 'Además de reglas generales, puedes añadir alertas específicas en cada expediente: Plazos → Añadir alerta.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="tipos" title="Tipos de plazos automáticos" icon={Calendar} accentColor={ACCENT}>
        <DataTable
          headers={['Tipo', 'Frecuencia', 'Detalle']}
          rows={[
            ['Renovaciones de marca', 'Cada 10 años', 'Desde la fecha de solicitud'],
            ['Anualidades de patente', 'Anual', 'A partir del 3er año'],
            ['Plazos de oposición', '2-3 meses', 'Desde la publicación oficial'],
            ['Plazos procesales', 'Variable', 'Configurables según jurisdicción'],
          ]}
        />
        <InfoCallout type="info">
          IP-NEXUS calcula automáticamente las fechas de renovación y vencimiento basándose en la
          jurisdicción y el tipo de PI. Solo necesitas revisar y confirmar.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
