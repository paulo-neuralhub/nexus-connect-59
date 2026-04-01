import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Handshake, TrendingUp, ArrowRight, Scale } from 'lucide-react';
import { useOppositionStats } from '@/hooks/useOppositions';
import { usePageTitle } from '@/contexts/page-context';

export default function OposicionesOverview() {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOppositionStats();

  useEffect(() => { setTitle('Oposiciones'); }, [setTitle]);

  const cards = [
    {
      title: 'Ofensivas Activas',
      count: stats?.offensiveActive ?? 0,
      icon: Swords,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      path: '/app/expedientes/oposiciones/ofensivas',
    },
    {
      title: 'Defensivas Activas',
      count: stats?.defensiveActive ?? 0,
      icon: Shield,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      path: '/app/expedientes/oposiciones/defensivas',
    },
    {
      title: 'Coexistencias',
      count: stats?.coexistenceActive ?? 0,
      icon: Handshake,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      path: '/app/expedientes/oposiciones/coexistencias',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Oposiciones</h1>
          <p className="text-sm text-muted-foreground">Gestión de oposiciones ofensivas, defensivas y coexistencias</p>
        </div>
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className={`${c.border} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => navigate(c.path)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? '—' : c.count}</div>
              <Button variant="link" className={`p-0 h-auto mt-1 ${c.color}`}>
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats row */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Éxito ofensivas" value={`${stats?.offensiveSuccessRate ?? 0}%`} icon={TrendingUp} />
            <Stat label="Éxito defensivas" value={`${stats?.defensiveSuccessRate ?? 0}%`} icon={TrendingUp} />
            <Stat label="Total registradas" value={`${stats?.total ?? 0}`} icon={Scale} />
            <Stat label="Activas total" value={`${(stats?.offensiveActive ?? 0) + (stats?.defensiveActive ?? 0)}`} icon={Swords} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="text-center">
      <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
