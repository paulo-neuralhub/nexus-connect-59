// ============================================================
// IP-NEXUS BACKOFFICE - Modules Tab Component
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, ExternalLink, Users, TrendingUp, FileText, Radar, Globe, Brain } from 'lucide-react';
import { useProducts, useProductStats, type Product } from '@/hooks/backoffice';
import { formatCurrency } from '@/lib/utils';

const MODULE_ICONS: Record<string, React.ElementType> = {
  DOCKET: FileText,
  SPIDER: Radar,
  MARKET: Globe,
  GENIUS: Brain,
};

export function ModulesTab() {
  const { data: modules, isLoading } = useProducts({ type: 'module_standalone' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Módulos Standalone</h2>
          <p className="text-sm text-muted-foreground">
            Productos que se venden de forma independiente
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {modules?.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: Product }) {
  const { data: stats } = useProductStats(module.id);
  const Icon = MODULE_ICONS[module.module_code ?? ''] ?? FileText;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: module.color ? `${module.color}20` : '#f0f0f0' }}
            >
              <Icon 
                className="h-6 w-6" 
                style={{ color: module.color ?? '#666' }}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{module.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                {module.description}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats?.activeSubscribers ?? 0}</p>
              <p className="text-xs text-muted-foreground">Suscriptores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats?.mrr ?? 0)}</p>
              <p className="text-xs text-muted-foreground">MRR</p>
            </div>
          </div>
        </div>

        {/* Landing URL */}
        {module.landing_url && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Landing:</span>
            <a 
              href={module.landing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              {module.landing_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={module.is_active ? 'default' : 'secondary'}>
            {module.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
          {!module.is_visible && (
            <Badge variant="outline">Oculto</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
