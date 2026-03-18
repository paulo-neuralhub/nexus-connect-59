// ============================================================
// Fix001 — No puedo acceder a mi cuenta (PREMIUM)
// ============================================================

import { ShieldAlert, KeyRound, Lock, Monitor } from 'lucide-react';
import { ArticleLayout } from '../ArticleLayout';
import { ArticleSection } from '../ArticleSection';
import { StepByStep } from '../StepByStep';
import { InfoCallout } from '../InfoCallout';
import { FeatureGrid } from '../FeatureGrid';

const ACCENT = '#EF4444';

export function Fix001Content() {
  return (
    <ArticleLayout
      title="No puedo acceder a mi cuenta"
      subtitle="Soluciones rápidas para problemas de acceso. La mayoría se resuelven en menos de 2 minutos."
      icon={ShieldAlert}
      accentColor={ACCENT}
      category="Solución de problemas"
      categorySlug="troubleshooting"
      readTime="3 min"
      lastUpdated="Febrero 2026"
      tags={['acceso', 'contraseña', 'login', 'bloqueo']}
      tocSections={[
        { id: 'contrasena', title: 'Contraseña olvidada' },
        { id: 'bloqueada', title: 'Cuenta bloqueada' },
        { id: 'invitacion', title: 'Invitación no recibida' },
        { id: 'error', title: 'Error al cargar' },
      ]}
      relatedArticles={[
        { title: 'Configurar tu organización', path: '/app/help/article/configurar-organizacion', readTime: '4 min' },
        { title: 'Invitar a tu equipo', path: '/app/help/article/invitar-equipo', readTime: '3 min' },
      ]}
    >
      <p className="text-[15px] text-foreground/80 leading-relaxed">
        Si no puedes acceder a tu cuenta de IP-NEXUS, sigue los pasos según tu situación.
        La mayoría de los casos se resuelven en menos de <strong>2 minutos</strong>.
      </p>

      <ArticleSection id="contrasena" title="He olvidado mi contraseña" icon={KeyRound} accentColor={ACCENT}>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Ve a la pantalla de login',
            description: 'Abre app.ip-nexus.com y haz click en "¿Olvidaste tu contraseña?".',
          },
          {
            title: 'Introduce tu email',
            description: 'Escribe el email con el que te registraste. Recibirás un enlace para restablecer la contraseña.',
            tip: 'Revisa la carpeta de spam si no encuentras el email en tu bandeja de entrada.',
          },
          {
            title: 'Crea una nueva contraseña',
            description: 'Haz click en el enlace del email y crea una contraseña nueva. Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="bloqueada" title="Mi cuenta está bloqueada" icon={Lock} accentColor={ACCENT} variant="highlighted">
        <InfoCallout type="warning">
          Después de 5 intentos fallidos de login, tu cuenta se bloquea temporalmente durante
          <strong> 15 minutos</strong> como medida de seguridad.
        </InfoCallout>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Espera 15 minutos',
            description: 'El bloqueo se levanta automáticamente. No intentes acceder durante este tiempo.',
          },
          {
            title: 'Restablece tu contraseña',
            description: 'Si no recuerdas la contraseña, usa la opción de restablecimiento para evitar volver a bloquearte.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="invitacion" title="No recibí la invitación" icon={ShieldAlert} accentColor={ACCENT}>
        <StepByStep accentColor={ACCENT} steps={[
          {
            title: 'Verifica el email',
            description: 'Asegúrate de que tu administrador envió la invitación al email correcto.',
          },
          {
            title: 'Revisa spam y promociones',
            description: 'Los emails de IP-NEXUS pueden terminar en carpetas de spam, especialmente la primera vez.',
            tip: 'Añade noreply@ip-nexus.com a tus contactos para evitar que futuros emails vayan a spam.',
          },
          {
            title: 'Solicita reenvío',
            description: 'Pide a tu administrador que reenvíe desde Configuración → Usuarios. Las invitaciones expiran a los 7 días.',
          },
        ]} />
      </ArticleSection>

      <ArticleSection id="error" title="Veo un error al cargar" icon={Monitor} accentColor={ACCENT} variant="highlighted">
        <FeatureGrid features={[
          { emoji: '🗑️', title: 'Limpia la caché', description: 'Usa Ctrl+Shift+Delete para limpiar la caché del navegador.' },
          { emoji: '🕶️', title: 'Modo incógnito', description: 'Prueba en una ventana de incógnito para descartar extensiones.' },
          { emoji: '🔌', title: 'Desactiva extensiones', description: 'Algunas extensiones pueden interferir con la carga de IP-NEXUS.' },
          { emoji: '🌐', title: 'Otro navegador', description: 'Prueba con Chrome, Firefox o Safari para descartar problemas.' },
        ]} />
        <InfoCallout type="danger">
          Si ninguna solución funciona,{' '}
          <a href="/app/help/article/contactar-soporte" className="underline font-semibold">contacta con soporte</a>.
          Incluye capturas de pantalla del error y el navegador que estás usando.
        </InfoCallout>
      </ArticleSection>
    </ArticleLayout>
  );
}
