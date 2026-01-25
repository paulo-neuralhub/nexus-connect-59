// ============================================================
// IP-NEXUS BACKOFFICE - Plans Tab Component
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Star, Users, TrendingUp } from 'lucide-react';
import { useProducts, useAllProductStats, type Product, type ProductWithDetails } from '@/hooks/backoffice';
import { PlanEditModal } from './PlanEditModal';
import { formatCurrency } from '@/lib/utils';

export function PlansTab() {
  const { data: plans, isLoading } = useProducts({ type: 'plan' });
  const { data: stats } = useAllProductStats();
  const [selectedPlan, setSelectedPlan] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getPlanStats = (planCode: string) => {
    const planStats = stats?.subscribersByPlan.find(p => p.planCode === planCode);
    const mrrStats = stats?.mrrByProduct.find(p => p.productCode === planCode);
    return {
      subscribers: planStats?.count ?? 0,
      mrr: mrrStats?.mrr ?? 0,
    };
  };

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
          <h2 className="text-xl font-semibold">Planes de Suscripción</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los planes disponibles para nuevos suscriptores
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => {
          const planStats = getPlanStats(plan.code);
          
          return (
            <Card key={plan.id} className="relative">
              {plan.is_popular && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-amber-500"
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Popular
                </Badge>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xl font-bold">{planStats.subscribers}</p>
                      <p className="text-xs text-muted-foreground">Suscriptores</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xl font-bold">{formatCurrency(planStats.mrr)}</p>
                      <p className="text-xs text-muted-foreground">MRR</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {!plan.is_visible && (
                    <Badge variant="outline">Oculto</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {stats && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalMrr)}</p>
                <p className="text-sm text-muted-foreground">Total MRR</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalArr)}</p>
                <p className="text-sm text-muted-foreground">Total ARR</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                <p className="text-sm text-muted-foreground">Suscriptores</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageChurn.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Churn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {selectedPlan && (
        <PlanEditModal
          plan={selectedPlan}
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PlanEditModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
