// ============================================================
// GS003 — Crear tu primer expediente (PREMIUM)
// ============================================================

import { FolderPlus, FileText, ListChecks } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { DataTable } from '../DataTable';
import { MockupCreateMatter } from '../ScreenshotMockups';
import { IllustrationNewMatter } from '../illustrations';

const ACCENT = '#0EA5E9';

export function GS003Content() {
  return (
    <ArticleLayout
      title="Crear tu primer expediente"
      subtitle="Un expediente en IP-NEXUS representa un caso de PI: marca, patente, diseño o litigio."
      icon={FolderPlus}
      accentColor={ACCENT}
      category="Primeros Pasos"
      categorySlug="getting-started"
      readTime="5 min"
      lastUpdated="Febrero 2026"
      tags={['expediente', 'docket', 'marca', 'patente']}
      tocSections={[
        { id: 'intro', title: 'Qué es un expediente' },
        { id: 'pasos', title: 'Paso a paso' },
        { id: 'campos', title: 'Campos del expediente' },
      ]}
      relatedArticles={[
        { title: 'Importar expedientes', path: '/app/help/article/importar-expedientes', readTime: '4 min' },
        { title: 'Configurar plazos y alertas', path: '/app/help/article/configurar-alertas', readTime: '4 min' },
        { title: 'Crear expediente (avanzado)', path: '/app/help/article/crear-expediente', readTime: '6 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationNewMatter size={150} />
      </div>

      <ArticleSection id="intro" title="Qué es un expediente" icon={FileText} accentColor={ACCENT}>
        <p className="text-foreground/80">
          Un <strong>expediente</strong> almacena toda la información de un caso de PI: datos del titular,
          jurisdicción, documentos, plazos, costes e historial. Es la unidad central de trabajo en IP-NEXUS.
        </p>
        <InfoCallout type="info">
          Si ya tienes expedientes en otro sistema o en Excel, puedes importarlos automáticamente.
          Consulta la guía{' '}
          <a href="/app/help/article/importar-expedientes" className="underline font-semibold">
            Importar expedientes existentes
          </a>.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="pasos" title="Paso a paso" icon={ListChecks} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Accede a IP-Docket',
            description: 'En el sidebar izquierdo, haz click en "Expedientes" o usa el atajo ⌘+2.',
            tip: 'También puedes crear un expediente rápido desde cualquier página con ⌘+N.',
          },
          {
            title: 'Haz click en "Crear nuevo"',
            description: 'En la esquina superior derecha encontrarás el botón "Crear nuevo". Se abrirá el formulario de creación.',
          },
          {
            title: 'Selecciona el tipo de IP',
            description: 'Elige qué tipo de expediente vas a crear. Cada tipo tiene campos específicos adaptados.',
            illustration: <MockupCreateMatter />,
          },
          {
            title: 'Rellena los datos del expediente',
            description: 'Completa la información básica: nombre de la marca, cliente, jurisdicción y clases Niza. Puedes completar datos más tarde.',
            tip: 'Para marcas, las clases Niza más comunes son: 9 (tecnología), 25 (ropa), 35 (servicios empresariales) y 42 (servicios tecnológicos).',
          },
          {
            title: 'Guarda el expediente',
            description: 'Haz click en "Crear expediente". Tu expediente aparecerá en la lista de IP-Docket.',
          },
        ]} />
        <InfoCallout type="tip">
          Después de crear tu primer expediente, te recomendamos configurar las alertas de vencimiento.
          Consulta{' '}
          <a href="/app/help/article/configurar-alertas" className="underline font-semibold">
            Configurar plazos y alertas
          </a>.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="campos" title="Campos del expediente" icon={FileText} accentColor={ACCENT}>
        <DataTable
          headers={['Campo', 'Descripción', '¿Obligatorio?']}
          rows={[
            ['Tipo de IP', 'Marca, Patente, Diseño o Litigio', '✅ Sí'],
            ['Nombre / Denominación', 'Nombre de la marca, título de la patente, etc.', '✅ Sí'],
            ['Referencia interna', 'Tu código interno para identificar el caso', 'Opcional'],
            ['Cliente', 'Contacto asociado al expediente', 'Recomendado'],
            ['Jurisdicción', 'España (OEPM), UE (EUIPO), Internacional (WIPO), etc.', 'Recomendado'],
            ['Clases Niza', 'Clases de productos/servicios (solo para marcas)', 'Para marcas'],
            ['Estado', 'Fase actual del expediente', 'Automático'],
          ]}
        />
        <InfoCallout type="warning">
          Los campos obligatorios pueden variar según el tipo de IP seleccionado.
          Para patentes, se requiere el número de solicitud y la fecha de prioridad.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
