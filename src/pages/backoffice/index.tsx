// src/pages/backoffice/index.tsx
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Briefcase, 
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Brain,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin';
import { usePendingEventsCount } from '@/hooks/useSystemEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BackofficeDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingEventsCount = 0 } = usePendingEventsCount();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Backoffice Dashboard</h1>
        <p className="text-muted-foreground">Control total del ecosistema IP-NEXUS</p>
      </div>
      
      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Tenants"
              value={stats?.total_organizations || 0}
              icon={Building2}
              color="hsl(var(--primary))"
              href="/backoffice/tenants"
            />
            <StatCard
              label="Usuarios"
              value={stats?.total_users || 0}
              icon={Users}
              color="hsl(var(--module-genius))"
              href="/backoffice/users"
            />
            <StatCard
              label="Expedientes"
              value={stats?.total_matters || 0}
              icon={Briefcase}
              color="hsl(var(--success))"
            />
            <StatCard
              label="Suscripciones activas"
              value={stats?.active_subscriptions || 0}
              icon={DollarSign}
              color="hsl(var(--warning))"
              href="/backoffice/billing"
            />
          </>
        )}
      </div>
      
      {/* Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">MRR (Monthly Recurring Revenue)</p>
              {isLoading ? (
                <Skeleton className="h-9 w-32 mt-1" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats?.mrr || 0)}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex items-center text-green-600">
              <ArrowUpRight className="w-4 h-4" /> +12%
            </span>
            <span className="text-muted-foreground">vs mes anterior</span>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ARR (Annual Recurring Revenue)</p>
              {isLoading ? (
                <Skeleton className="h-9 w-32 mt-1" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats?.arr || 0)}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  AI Brain
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  IPO Connections
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  3 degradadas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Billing
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Operativo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
              <QuickActionCard
                title="Event Log pendientes"
                count={pendingEventsCount}
                href="/backoffice/events"
                color="hsl(var(--warning))"
              />
            <QuickActionCard
              title="Feedback pendiente"
              count={15}
              href="/backoffice/feedback"
              color="hsl(var(--warning))"
            />
            <QuickActionCard
              title="Suscripciones vencidas"
              count={3}
              href="/backoffice/billing?status=past_due"
              color="hsl(var(--destructive))"
            />
            <QuickActionCard
              title="Tenants en trial"
              count={28}
              href="/backoffice/tenants?status=trialing"
              color="hsl(var(--module-genius))"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string;
  value: number;
  icon: any;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-card rounded-xl border p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

function QuickActionCard({ title, count, href, color }: {
  title: string;
  count: number;
  href: string;
  color: string;
}) {
  return (
    <Link 
      to={href}
      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
    >
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-bold" style={{ color }}>{count}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
