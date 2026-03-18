// ============================================================
// CRM001 — Introducción al CRM (PREMIUM)
// ============================================================

import { Users, LayoutGrid, Kanban, BarChart3 } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { FeatureGrid } from '../FeatureGrid';
import { PipelineVisual } from '../PipelineVisual';
import { IllustrationCRM } from '../illustrations';

const ACCENT = '#EC4899';

export function CRM001Content() {
  return (
    <ArticleLayout
      title="Introducción al CRM"
      subtitle="Gestión de relaciones comerciales diseñada específicamente para profesionales de PI."
      icon={Users}
      accentColor={ACCENT}
      category="CRM"
      categorySlug="crm"
      readTime="5 min"
      lastUpdated="Febrero 2026"
      tags={['CRM', 'contactos', 'pipeline', 'ventas']}
      tocSections={[
        { id: 'que-es', title: '¿Qué es el CRM?' },
        { id: 'pasos', title: 'Primeros pasos' },
        { id: 'pipelines', title: 'Pipelines de PI' },
        { id: 'vistas', title: 'Vistas disponibles' },
      ]}
      relatedArticles={[
        { title: 'NEXUS Genius: tus asistentes de IA', path: '/app/help/article/que-es-genius', readTime: '5 min' },
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationCRM size={150} />
      </div>

      <ArticleSection id="que-es" title="¿Qué es el CRM?" icon={Users} accentColor={ACCENT}>
        <p className="text-foreground/80">
          El CRM de IP-NEXUS es un sistema de gestión de relaciones <strong>diseñado
          específicamente para profesionales de PI</strong>. A diferencia de un CRM genérico, está
          integrado con tus expedientes, plazos y documentos.
        </p>
        <FeatureGrid features={[
          { emoji: '👤', title: 'Contactos', description: 'Gestiona clientes, empresas y representantes.', items: ['Personas y empresas', 'Importar desde CSV', 'Timeline completo'], accentColor: ACCENT },
          { emoji: '🎯', title: 'Pipelines', description: 'Flujos de ventas con etapas personalizables.', items: ['Drag & drop Kanban', 'Pipelines predefinidos para PI', 'Conversión a expediente'], accentColor: '#3B82F6' },
          { emoji: '📞', title: 'Actividades', description: 'Registra llamadas, emails y reuniones.', items: ['Timeline cronológico', 'Notas internas', 'Documentos adjuntos'], accentColor: '#10B981' },
          { emoji: '🔗', title: 'Integración PI', description: 'Vinculado con Docket y Spider.', items: ['Vincular contactos a expedientes', 'Portal de cliente', 'Alertas de vencimiento'], accentColor: '#F59E0B' },
        ]} />
        <InfoCallout type="info">
          El CRM es un módulo <strong>premium</strong> disponible en el plan Business y superior.
          En Professional puedes gestionar contactos básicos.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="pasos" title="Primeros pasos con el CRM" icon={LayoutGrid} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Accede al módulo CRM',
            description: 'Haz click en "CRM" en el sidebar. Verás el panel con resumen de contactos, deals activos y actividades.',
          },
          {
            title: 'Crea tu primer contacto',
            description: 'Click en "+ Nuevo contacto" y rellena los datos: nombre, email, teléfono, empresa.',
            tip: 'Si ya tienes contactos en otro sistema, puedes importarlos desde un archivo CSV.',
          },
          {
            title: 'Configura tu pipeline',
            description: 'Ve a CRM → Configuración → Pipelines. IP-NEXUS incluye pipelines predefinidos para PI.',
          },
          {
            title: 'Crea tu primer deal',
            description: 'Un deal es una oportunidad de negocio. Asócialo a un contacto y un pipeline. Muévelo entre etapas en la vista Kanban.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="pipelines" title="Pipelines predefinidos para PI" icon={Kanban} accentColor={ACCENT}>
        <PipelineVisual
          title="Captación de clientes"
          accentColor={ACCENT}
          stages={[
            { emoji: '📥', label: 'Lead' },
            { emoji: '📞', label: 'Contacto' },
            { emoji: '📋', label: 'Análisis' },
            { emoji: '💰', label: 'Propuesta' },
            { emoji: '🤝', label: 'Negociación' },
            { emoji: '✅', label: 'Ganado' },
          ]}
        />
        <PipelineVisual
          title="Registro de marca"
          accentColor="#8B5CF6"
          stages={[
            { emoji: '📝', label: 'Solicitud' },
            { emoji: '🔍', label: 'Anterioridades' },
            { emoji: '📄', label: 'Documentos' },
            { emoji: '📤', label: 'Presentación' },
            { emoji: '⏳', label: 'Examen' },
            { emoji: '✅', label: 'Concedida' },
          ]}
        />
        <PipelineVisual
          title="Renovaciones"
          accentColor="#10B981"
          stages={[
            { emoji: '📅', label: 'Por vencer' },
            { emoji: '📧', label: 'Notificado' },
            { emoji: '✅', label: 'Confirmado' },
            { emoji: '💳', label: 'Pagado' },
            { emoji: '📤', label: 'Presentado' },
          ]}
        />
      </ArticleSection>

      <ArticleSection id="vistas" title="Vistas disponibles" icon={BarChart3} accentColor={ACCENT} variant="highlighted">
        <FeatureGrid features={[
          { emoji: '📋', title: 'Lista', description: 'Tabla con filtros avanzados, ordenación y búsqueda. Ideal para gestión masiva.', accentColor: '#3B82F6' },
          { emoji: '📊', title: 'Kanban', description: 'Arrastra deals entre etapas del pipeline. La vista más visual para ventas.', accentColor: ACCENT },
          { emoji: '📅', title: 'Calendario', description: 'Visualiza actividades programadas por fecha. Útil para seguimiento.', accentColor: '#10B981' },
          { emoji: '📈', title: 'Reportes', description: 'Métricas de conversión, valor del pipeline y rendimiento del equipo.', accentColor: '#F59E0B' },
        ]} />
      </ArticleSection>
    </ArticleLayout>
  );
}
