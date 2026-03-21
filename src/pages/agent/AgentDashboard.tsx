/**
 * Agent Dashboard with onboarding checklist
 */
import { CheckCircle, Circle, BarChart3, DollarSign, Star, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMyAgentProfile, useAgentServices, useAgentServiceRequests } from '@/hooks/market/useMarketAgentsV3';

export default function AgentDashboard() {
  const { data: agent } = useMyAgentProfile();
  const { data: services = [] } = useAgentServices(agent?.id);
  const { data: requests = [] } = useAgentServiceRequests(agent?.id);

  if (!agent) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <h2 className="text-xl font-bold mb-2">Crear perfil de agente</h2>
        <p className="text-gray-500 text-sm mb-4">Necesitas un perfil de agente para acceder a esta sección</p>
        <Link to="/agent/profile"><Button style={{ background: '#10B981' }} className="text-white">Crear perfil</Button></Link>
      </div>
    );
  }

  // Onboarding checks
  const checks = [
    { label: 'Foto de perfil', done: !!agent.avatar_url, link: '/agent/profile' },
    { label: 'Bio (min 100 chars)', done: (agent.bio?.length || 0) >= 100, link: '/agent/profile' },
    { label: 'Al menos 1 servicio publicado', done: services.length > 0, link: '/agent/services' },
    { label: 'Al menos 1 jurisdicción definida', done: (agent.jurisdictions?.length || 0) > 0, link: '/agent/profile' },
    { label: 'Cuenta de cobro Stripe Connect', done: agent.stripe_onboarding_complete, link: '/agent/settings' },
    { label: 'Aceptar T&C + GDPR', done: agent.is_active, link: '/agent/settings' },
  ];
  const completedCount = checks.filter(c => c.done).length;
  const progress = Math.round((completedCount / checks.length) * 100);
  const allDone = completedCount === checks.length;

  const newRequests = requests.filter((r: any) => r.status === 'published' || r.status === 'quoted');
  const activeRequests = requests.filter((r: any) => ['accepted', 'in_progress', 'delivered'].includes(r.status));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Agente</h1>

      {/* Onboarding */}
      {!allDone && (
        <Card className="border-emerald-200" style={{ background: '#F0FDF4' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-emerald-800">Checklist de onboarding</h3>
              <span className="text-sm font-bold text-emerald-700">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="space-y-2">
              {checks.map(c => (
                <Link key={c.label} to={c.link} className="flex items-center gap-2 text-sm no-underline hover:bg-emerald-50 rounded p-1 -mx-1">
                  {c.done ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={c.done ? 'text-emerald-700 line-through' : 'text-gray-700'}>{c.label}</span>
                </Link>
              ))}
            </div>
            {allDone && (
              <Button className="mt-4 text-white" style={{ background: '#10B981' }}>Publicar mi perfil</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Inbox className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{newRequests.length}</p>
            <p className="text-xs text-gray-500">Solicitudes nuevas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{activeRequests.length}</p>
            <p className="text-xs text-gray-500">En curso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{agent.rating_avg?.toFixed(1) || '—'}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{agent.completed_services}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
