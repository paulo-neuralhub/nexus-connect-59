/**
 * Placeholder agent pages — each gets its own file
 */
import { Card, CardContent } from '@/components/ui/card';
import { User, Wrench, Award, CreditCard, Star, Settings } from 'lucide-react';

function Placeholder({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <Card>
        <CardContent className="p-12 text-center">
          <Icon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AgentProfile() {
  return <Placeholder icon={User} title="Mi Perfil Público" description="Gestión de perfil público, bio, foto, jurisdicciones e idiomas. Próximamente con editor completo." />;
}

export function AgentServicesPage() {
  return <Placeholder icon={Wrench} title="Mis Servicios" description="Gestiona los servicios que ofreces, precios y planes de pago disponibles." />;
}

export function AgentCredentialsPage() {
  return <Placeholder icon={Award} title="Mis Credenciales" description="Sube y gestiona tus acreditaciones profesionales para verificación." />;
}

export function AgentPaymentsPage() {
  return <Placeholder icon={CreditCard} title="Historial de Pagos" description="Consulta el historial de pagos recibidos y pendientes de liberación." />;
}

export function AgentReviewsPage() {
  return <Placeholder icon={Star} title="Reviews" description="Consulta y responde las valoraciones de tus clientes." />;
}

export function AgentSettingsPage() {
  return <Placeholder icon={Settings} title="Configuración" description="Cuenta Stripe Connect, T&C, configuración GDPR y cuenta." />;
}
