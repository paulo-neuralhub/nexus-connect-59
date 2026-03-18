// ============================================================
// Docket001 — Crear expediente (avanzado) (PREMIUM)
// ============================================================

import { FolderOpen, FileText, Paperclip, Settings } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { MockupCreateMatter } from '../ScreenshotMockups';
import { IllustrationNewMatter } from '../illustrations';
import { Kbd } from '../Kbd';

const ACCENT = '#0EA5E9';

export function Docket001Content() {
  return (
    <ArticleLayout
      title="Crear un expediente — Guía completa"
      subtitle="El proceso detallado de creación de expedientes con todas las opciones del wizard."
      icon={FolderOpen}
      accentColor={ACCENT}
      category="IP-Docket"
      categorySlug="ip-docket"
      readTime="6 min"
      lastUpdated="Febrero 2026"
      tags={['docket', 'expediente', 'wizard', 'marca', 'patente']}
      tocSections={[
        { id: 'contexto', title: 'Contexto' },
        { id: 'proceso', title: 'Proceso completo' },
        { id: 'siguiente', title: 'Después de crear' },
      ]}
      relatedArticles={[
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
        { title: 'Proceso de registro de marca', path: '/app/help/article/proceso-registro', readTime: '5 min' },
        { title: 'Configurar plazos y alertas', path: '/app/help/article/configurar-alertas', readTime: '4 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationNewMatter size={150} />
      </div>

      <ArticleSection id="contexto" title="Antes de empezar" icon={FileText} accentColor={ACCENT}>
        <p className="text-foreground/80">
          El módulo IP-Docket es el <strong>corazón de IP-NEXUS</strong>. Cada expediente almacena
          toda la información de un caso de PI: datos del titular, jurisdicción, documentos,
          plazos, costes e historial de actividad.
        </p>
        <InfoCallout type="info">
          Si es tu primera vez, consulta primero{' '}
          <a href="/app/help/article/primer-expediente" className="underline font-semibold">
            Crear tu primer expediente
          </a>{' '}
          para una versión más resumida.
        </InfoCallout>
      </ArticleSection>

      <ArticleSection id="proceso" title="Proceso completo" icon={Settings} accentColor={ACCENT} variant="highlighted">
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Abre el formulario de creación',
            description: (
              <span>
                Navega a Expedientes en el sidebar y haz click en "+ Nuevo expediente".
                Atajo rápido: <Kbd>⌘</Kbd>+<Kbd>N</Kbd> desde cualquier página.
              </span>
            ),
          },
          {
            title: 'Paso 1: Tipo de PI',
            description: 'Selecciona el tipo de derecho: Marca, Patente, Diseño industrial o Litigio. Cada tipo muestra campos adaptados.',
            illustration: <MockupCreateMatter />,
          },
          {
            title: 'Paso 2: Datos del titular',
            description: 'Selecciona un contacto existente del CRM o crea uno nuevo. El titular es la persona que será propietaria del derecho.',
            tip: 'Si el titular es una empresa, asegúrate de que la razón social coincida exactamente con la registrada en la oficina de PI.',
          },
          {
            title: 'Paso 3: Jurisdicción y clasificación',
            description: 'Elige la oficina de PI (OEPM, EUIPO, WIPO, etc.) y, para marcas, selecciona las clases de Niza aplicables.',
          },
          {
            title: 'Paso 4: Datos adicionales',
            description: 'Completa información opcional: referencia interna, representante, notas, prioridades y fechas clave.',
          },
          {
            title: 'Paso 5: Documentos',
            description: 'Adjunta documentos relevantes: logo (marcas figurativas), memoria descriptiva (patentes), fotografías (diseños), poderes, etc.',
            warning: 'Los archivos no pueden superar los 50 MB. Formatos: PDF, DOCX, XLSX, PNG, JPG, TIFF.',
          },
          {
            title: 'Crear y configurar',
            description: 'Haz click en "Crear expediente". Se creará en estado Borrador. Desde la ficha puedes añadir plazos, costes y activar vigilancia.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="siguiente" title="Después de crear" icon={Paperclip} accentColor={ACCENT}>
        <InfoCallout type="tip">
          Activa la <strong>vigilancia en IP-Spider</strong> para recibir alertas si se solicitan
          marcas similares en la misma jurisdicción.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
