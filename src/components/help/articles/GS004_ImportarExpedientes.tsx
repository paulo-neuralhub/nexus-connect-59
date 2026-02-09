// ============================================================
// GS004 — Importar expedientes existentes (PREMIUM)
// ============================================================

import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { DataTable } from '../DataTable';
import { FeatureGrid } from '../FeatureGrid';

const ACCENT = '#0EA5E9';

export function GS004Content() {
  return (
    <ArticleLayout
      title="Importar expedientes existentes"
      subtitle="Migra tus datos desde Excel, CSV u otro sistema de PI a IP-NEXUS de forma masiva."
      icon={Upload}
      accentColor={ACCENT}
      category="Primeros Pasos"
      categorySlug="getting-started"
      readTime="4 min"
      lastUpdated="Febrero 2026"
      tags={['importar', 'migración', 'Excel', 'CSV']}
      tocSections={[
        { id: 'formatos', title: 'Formatos soportados' },
        { id: 'columnas', title: 'Columnas requeridas' },
        { id: 'pasos', title: 'Paso a paso' },
      ]}
      relatedArticles={[
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
        { title: 'Configurar plazos y alertas', path: '/app/help/article/configurar-alertas', readTime: '4 min' },
      ]}
    >
      <p className="text-[15px] text-foreground/80 leading-relaxed">
        Si ya gestionas expedientes de PI en otro software o en hojas de cálculo, IP-NEXUS te
        permite <strong>importarlos de forma masiva</strong> para que no tengas que empezar de cero.
      </p>

      <ArticleSection id="formatos" title="Formatos soportados" icon={FileSpreadsheet} accentColor={ACCENT}>
        <FeatureGrid features={[
          { emoji: '📊', title: 'Excel', description: 'Archivos .xlsx y .xls con una fila por expediente.', accentColor: '#10B981' },
          { emoji: '📄', title: 'CSV', description: 'Separado por comas o punto y coma. Codificación UTF-8.', accentColor: '#3B82F6' },
          { emoji: '🔄', title: 'Migración asistida', description: 'Desde otros sistemas IP. Contacta con soporte para una importación guiada.', accentColor: '#8B5CF6' },
        ]} columns={3} />
      </ArticleSection>

      <ArticleSection id="columnas" title="Columnas requeridas" icon={FileSpreadsheet} accentColor={ACCENT} variant="highlighted">
        <DataTable
          headers={['Columna', 'Obligatoria', 'Ejemplo']}
          rows={[
            ['Referencia', 'Sí', 'MRC-2024-001'],
            ['Tipo', 'Sí', 'Marca'],
            ['Denominación', 'Sí', 'AURORA'],
            ['Titular', 'Sí', 'Tech Corp S.L.'],
            ['Jurisdicción', 'Sí', 'EUIPO'],
            ['Estado', 'No', 'En trámite'],
            ['Fecha solicitud', 'No', '2024-01-15'],
            ['Clases', 'No', '9, 35, 42'],
          ]}
          caption="Estructura del archivo de importación"
        />
      </ArticleSection>

      <ArticleSection id="pasos" title="Paso a paso" icon={CheckCircle} accentColor={ACCENT}>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Prepara tu archivo',
            description: 'Organiza tus datos con una fila por expediente. Asegúrate de incluir al menos las columnas obligatorias.',
          },
          {
            title: 'Sube el archivo',
            description: 'Ve a Configuración → Importar datos → Importar expedientes. Arrastra o selecciona tu archivo.',
          },
          {
            title: 'Mapea los campos',
            description: 'Revisa que cada columna se corresponde con el campo correcto. El sistema sugiere el mapeo automáticamente.',
          },
          {
            title: 'Revisa y confirma',
            description: 'Verás una preview con los expedientes a importar, advertencias sobre datos incompletos y opciones para duplicados.',
            warning: 'La importación masiva no se puede deshacer automáticamente. Revisa bien los datos antes de confirmar.',
          },
          {
            title: 'Importa',
            description: 'Haz click en "Importar" y espera. Recibirás un informe con expedientes importados, advertencias y errores.',
          },
        ]} />
        <InfoCallout type="tip">
          Si tienes más de 500 expedientes, contacta con nuestro equipo para una{' '}
          <strong>migración asistida gratuita</strong>. Nos encargamos de todo.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
