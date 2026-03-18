// ============================================================
// GS002 — Invitar a tu equipo (PREMIUM)
// ============================================================

import { Users, UserPlus, Shield } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { DataTable } from '../DataTable';
import { IllustrationCRM } from '../illustrations';

const ACCENT = '#3B82F6';

export function GS002Content() {
  return (
    <ArticleLayout
      title="Invitar a tu equipo"
      subtitle="Añade miembros a tu organización y asígnales roles con permisos específicos."
      icon={Users}
      accentColor={ACCENT}
      category="Primeros Pasos"
      categorySlug="getting-started"
      readTime="3 min"
      lastUpdated="Febrero 2026"
      tags={['equipo', 'roles', 'permisos', 'invitaciones']}
      tocSections={[
        { id: 'invitar', title: 'Cómo invitar' },
        { id: 'roles', title: 'Roles disponibles' },
        { id: 'limites', title: 'Límites por plan' },
      ]}
      relatedArticles={[
        { title: 'Configurar tu organización', path: '/app/help/article/configurar-organizacion', readTime: '4 min' },
        { title: 'Crear tu primer expediente', path: '/app/help/article/primer-expediente', readTime: '5 min' },
      ]}
    >
      <div className="flex justify-center mb-8">
        <IllustrationCRM size={150} />
      </div>

      <p className="text-[15px] text-foreground/80 leading-relaxed">
        IP-NEXUS funciona mejor cuando trabajas en equipo. Invita a miembros de tu despacho y
        asígnales <strong>roles con permisos específicos</strong> para controlar qué puede ver y hacer cada persona.
      </p>

      <ArticleSection id="invitar" title="Cómo invitar miembros" icon={UserPlus} accentColor={ACCENT}>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Accede a la gestión de equipo',
            description: 'Ve a Configuración → Usuarios y equipo. Verás la lista de todos los miembros actuales de tu organización.',
          },
          {
            title: 'Haz click en "Invitar miembro"',
            description: 'Introduce la dirección de email de la persona que quieres invitar. Puedes invitar a varias personas a la vez separando los emails con comas.',
            tip: 'Puedes pegar una lista de emails directamente desde Excel o un archivo de texto.',
          },
          {
            title: 'Selecciona el rol',
            description: 'Elige el rol que tendrá el nuevo miembro. Cada rol tiene permisos predefinidos que puedes personalizar después.',
          },
          {
            title: 'Envía la invitación',
            description: 'Haz click en "Enviar invitación". El usuario recibirá un email con un enlace para unirse.',
            warning: 'Las invitaciones expiran en 7 días. Si no se aceptan, deberás reenviarlas.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="roles" title="Roles disponibles" icon={Shield} accentColor={ACCENT} variant="highlighted">
        <DataTable
          headers={['Rol', 'Expedientes', 'CRM', 'Configuración', 'Facturación']}
          rows={[
            ['Owner', '✅ Todo', '✅ Todo', '✅ Todo', '✅'],
            ['Admin', '✅ Todo', '✅ Todo', '✅ Todo', '❌'],
            ['Manager', '✅ CRUD', '✅ CRUD', 'Parcial', '❌'],
            ['Member', 'Asignados', 'Asignados', '❌', '❌'],
            ['Viewer', 'Solo lectura', 'Solo lectura', '❌', '❌'],
          ]}
          caption="Permisos por rol"
        />
      </ArticleSection>

      <ArticleSection id="limites" title="Límites por plan" icon={Users} accentColor={ACCENT}>
        <InfoCallout type="info">
          El número de usuarios disponibles depende de tu plan. Consulta{' '}
          <a href="/app/help/article/planes-precios" className="underline font-semibold">Planes y precios</a>{' '}
          para ver los límites de cada plan.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
