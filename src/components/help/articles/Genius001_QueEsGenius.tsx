// ============================================================
// Genius001 — NEXUS Genius: tus asistentes de IA (PREMIUM)
// ============================================================

import { Brain, Cpu, MessageSquare, Lightbulb } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { FeatureGrid } from '../FeatureGrid';
import { IllustrationAI } from '../illustrations';

const ACCENT = '#F59E0B';

export function Genius001Content() {
  return (
    <ArticleLayout
      title="NEXUS Genius: tus asistentes de IA"
      subtitle="Descubre cómo la inteligencia artificial puede acelerar tu trabajo en Propiedad Intelectual."
      icon={Brain}
      accentColor={ACCENT}
      category="Genius AI"
      categorySlug="genius-ai"
      readTime="5 min"
      lastUpdated="Febrero 2026"
      tags={['IA', 'genius', 'asistentes', 'automatización']}
      tocSections={[
        { id: 'que-es', title: '¿Qué es Genius?' },
        { id: 'agentes', title: 'Agentes disponibles' },
        { id: 'como-usar', title: 'Cómo usar Genius' },
        { id: 'consejos', title: 'Consejos avanzados' },
      ]}
      relatedArticles={[
        { title: 'Proceso de registro de marca', path: '/app/help/article/proceso-registro', readTime: '5 min' },
        { title: 'Introducción al CRM', path: '/app/help/article/introduccion-crm', readTime: '5 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationAI size={160} />
      </div>

      <ArticleSection id="que-es" title="¿Qué es Genius?" icon={Brain} accentColor={ACCENT}>
        <p className="text-foreground/80">
          NEXUS Genius es el sistema de inteligencia artificial de IP-NEXUS. Incluye varios agentes
          especializados que te ayudan en diferentes tareas de gestión de PI — desde consultas legales
          hasta análisis financieros automatizados.
        </p>
        <InfoCallout type="info">
          NEXUS Genius está incluido en los planes Professional y Enterprise.
          En el plan Starter, tienes acceso limitado a 10 consultas/mes.{' '}
          <a href="/app/help/article/planes-precios" className="underline font-semibold">Ver planes →</a>
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="agentes" title="Agentes disponibles" icon={Cpu} accentColor={ACCENT} variant="highlighted">
        <p className="text-foreground/80 mb-2">
          Cada agente está especializado en un área. IP-NEXUS selecciona automáticamente el mejor según
          tu consulta, o puedes elegir uno manualmente.
        </p>
        <FeatureGrid features={[
          {
            emoji: '⚖️', title: 'NEXUS Legal',
            description: 'El abogado de PI que nunca duerme.',
            items: ['Consultas sobre legislación', 'Análisis de registrabilidad', 'Comparación de marcas', 'Informes de anterioridades'],
            accentColor: '#EF4444',
          },
          {
            emoji: '📊', title: 'NEXUS Analyst',
            description: 'Análisis inteligente de tu portfolio.',
            items: ['Análisis de portfolio', 'Tendencias del mercado', 'Benchmarking competitivo', 'Informes automatizados'],
            accentColor: '#3B82F6',
          },
          {
            emoji: '🔍', title: 'NEXUS Watch',
            description: 'Vigilancia inteligente de marcas.',
            items: ['Análisis de alertas Spider', 'Evaluación de riesgo', 'Recomendaciones de acción', 'Priorización de amenazas'],
            accentColor: '#8B5CF6',
          },
          {
            emoji: '⚙️', title: 'NEXUS Ops',
            description: 'Automatización de tareas repetitivas.',
            items: ['Generación de documentos', 'Actualización masiva', 'Clasificación automática', 'Workflows inteligentes'],
            accentColor: '#10B981',
          },
          {
            emoji: '💰', title: 'NEXUS Finance',
            description: 'Análisis financiero de PI.',
            items: ['Estimación de costes', 'Optimización de presupuestos', 'ROI de la cartera', 'Proyecciones'],
            accentColor: '#F59E0B',
          },
          {
            emoji: '📝', title: 'NEXUS Drafter',
            description: 'Redacción inteligente de documentos.',
            items: ['Descripciones de productos', 'Escritos de oposición', 'Cartas a clientes', 'Informes profesionales'],
            accentColor: '#6366F1',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="como-usar" title="Cómo usar Genius" icon={MessageSquare} accentColor={ACCENT}>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Abre el panel de Genius',
            description: 'En el sidebar, haz click en "IA y Análisis", o usa el atajo ⌘+J desde cualquier pantalla.',
            tip: 'Si estás dentro de un expediente, Genius ya tiene el contexto — no necesitas repetir datos.',
          },
          {
            title: 'Escribe tu consulta',
            description: 'Escribe en lenguaje natural. Ejemplo: "¿Puedo registrar AURORA en clase 9 en la UE?" o "Genera un informe de anterioridades".',
          },
          {
            title: 'Revisa la respuesta',
            description: 'Genius responde con análisis detallado, fuentes y recomendaciones. Incluye enlaces directos a datos de tu portfolio.',
            warning: 'Las respuestas de IA son orientativas. Siempre verifica antes de tomar decisiones legales.',
          },
          {
            title: 'Genera un informe (opcional)',
            description: 'Click en "Generar informe PDF" para crear un documento profesional con tu marca, datos de contacto y el análisis.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="consejos" title="Consejos para mejores resultados" icon={Lightbulb} accentColor={ACCENT} variant="highlighted">
        <InfoCallout type="tip" title="Sé específico">
          En lugar de "analiza esta marca", prueba: "Analiza la registrabilidad de AURORA
          en clase 9 para la UE, comparando con anterioridades existentes."
        </InfoCallout>
        <InfoCallout type="tip" title="Usa el contexto">
          Si abres Genius desde dentro de un expediente, el agente ya conoce todos los datos del caso.
          Solo necesitas hacer tu pregunta directa.
        </InfoCallout>
        <InfoCallout type="note" title="Historial de chats">
          Todas tus conversaciones con Genius se guardan automáticamente.
          Puedes revisarlas en cualquier momento desde el panel de IA.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
