import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Briefcase, 
  DollarSign,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground">Resumen general de IP-NEXUS</p>
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
              label="Organizaciones"
              value={stats?.total_organizations || 0}
              icon={Building2}
              color="hsl(var(--primary))"
            />
            <StatCard
              label="Usuarios"
              value={stats?.total_users || 0}
              icon={Users}
              color="hsl(var(--module-genius))"
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
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Feedback pendiente"
          count={15}
          href="/admin/feedback"
          color="hsl(var(--warning))"
        />
        <QuickActionCard
          title="Suscripciones vencidas"
          count={3}
          href="/admin/subscriptions?status=past_due"
          color="hsl(var(--destructive))"
        />
        <QuickActionCard
          title="Orgs en trial"
          count={28}
          href="/admin/organizations?status=trialing"
          color="hsl(var(--module-genius))"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
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
      className="bg-card rounded-xl border p-4 hover:border-primary/50 transition-colors flex items-center justify-between"
    >
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-bold" style={{ color }}>{count}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
}
