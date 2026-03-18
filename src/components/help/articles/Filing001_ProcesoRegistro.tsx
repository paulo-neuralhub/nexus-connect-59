// ============================================================
// Filing001 — Proceso de registro de marca (PREMIUM)
// ============================================================

import { Stamp, Search, FileCheck, Clock } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { DataTable } from '../DataTable';
import { PipelineVisual } from '../PipelineVisual';
import { IllustrationSearch } from '../illustrations';

const ACCENT = '#8B5CF6';

export function Filing001Content() {
  return (
    <ArticleLayout
      title="Proceso de registro de marca"
      subtitle="Las fases completas desde la solicitud hasta la concesión de tu marca."
      icon={Stamp}
      accentColor={ACCENT}
      category="Registro y Filing"
      categorySlug="filing"
      readTime="5 min"
      lastUpdated="Febrero 2026"
      tags={['registro', 'marca', 'filing', 'OEPM', 'EUIPO']}
      tocSections={[
        { id: 'vision', title: 'Visión general' },
        { id: 'fases', title: 'Fases del registro' },
        { id: 'plazos', title: 'Plazos típicos' },
      ]}
      relatedArticles={[
        { title: 'Crear expediente (avanzado)', path: '/app/help/article/crear-expediente', readTime: '6 min' },
        { title: 'Qué es NEXUS Genius', path: '/app/help/article/que-es-genius', readTime: '5 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationSearch size={150} />
      </div>

      <ArticleSection id="vision" title="Visión general del proceso" icon={FileCheck} accentColor={ACCENT}>
        <p className="text-foreground/80">
          El registro de una marca pasa por varias fases, desde la preparación de la solicitud hasta
          la obtención del certificado. IP-NEXUS te guía en cada paso y <strong>automatiza el
          seguimiento</strong> de todo el proceso.
        </p>
        <PipelineVisual
          title="Flujo de registro de marca"
          accentColor={ACCENT}
          stages={[
            { emoji: '🔍', label: 'Anterioridades' },
            { emoji: '📝', label: 'Preparación' },
            { emoji: '📤', label: 'Presentación' },
            { emoji: '🔎', label: 'Examen' },
            { emoji: '📢', label: 'Publicación' },
            { emoji: '✅', label: 'Concesión' },
          ]}
        />
      </ArticleSection>

      <ArticleSection id="fases" title="Fases del registro" icon={Search} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Búsqueda de anterioridades',
            description: 'Comprueba que no existen marcas idénticas o similares ya registradas. Usa IP-Genius para un análisis automático de riesgos.',
            tip: 'Una búsqueda de anterioridades puede ahorrarte meses y miles de euros en oposiciones.',
          },
          {
            title: 'Preparación de la solicitud',
            description: 'Reúne toda la documentación: denominación, logotipo (si aplica), lista de productos/servicios, datos del titular y representante.',
          },
          {
            title: 'Presentación ante la oficina',
            description: 'La solicitud se presenta ante la oficina correspondiente (OEPM, EUIPO, WIPO). IP-NEXUS genera la documentación y conecta con Data Hub.',
            warning: 'Una vez presentada, no se pueden modificar los productos/servicios ni añadir clases. Revisa todo antes de enviar.',
          },
          {
            title: 'Examen de forma y fondo',
            description: 'La oficina revisa que la solicitud cumple los requisitos y examina si la marca es registrable.',
          },
          {
            title: 'Publicación',
            description: 'Si supera el examen, la marca se publica en el Boletín Oficial. Se abre un período de oposición de 2-3 meses.',
            tip: 'Activa la vigilancia en IP-Spider para detectar si alguien se opone a tu marca.',
          },
          {
            title: 'Concesión',
            description: 'Si no hay oposiciones (o se resuelven favorablemente), la oficina emite el certificado de registro. ¡Tu marca está registrada!',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="plazos" title="Plazos típicos por jurisdicción" icon={Clock} accentColor={ACCENT}>
        <DataTable
          headers={['Jurisdicción', 'Oficina', 'Plazo estimado']}
          rows={[
            ['🇪🇸 España', 'OEPM', '6-8 meses'],
            ['🇪🇺 Unión Europea', 'EUIPO', '4-6 meses'],
            ['🌍 Internacional', 'WIPO', '12-18 meses'],
            ['🇺🇸 Estados Unidos', 'USPTO', '8-12 meses'],
          ]}
        />
        <InfoCallout type="info">
          IP-NEXUS actualiza automáticamente el estado del expediente en cada fase si tienes conectada
          la oficina en Data Hub.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
