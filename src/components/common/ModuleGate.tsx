/**
 * ModuleGate Component
 * PROMPT 50: Universal module access control
 * 
 * Wraps content that requires module access.
 * Shows upgrade prompts when access is denied.
 */

import { ReactNode } from 'react';
import { useModuleAccess, ModuleCode, TierCode } from '@/hooks/use-module-access';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MODULE_REGISTRY } from '@/lib/modules/module-registry';

interface ModuleGateProps {
  module: ModuleCode;
  requiredTier?: TierCode;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  loadingFallback?: ReactNode;
}

const TIER_NAMES: Record<TierCode, string> = {
  basic: 'Basic',
  pro: 'Professional',
  enterprise: 'Enterprise',
};

/**
 * Gate component that controls access to module content
 */
export function ModuleGate({
  module,
  requiredTier,
  children,
  fallback,
  showUpgrade = true,
  loadingFallback,
}: ModuleGateProps) {
  const { hasAccess, isLoading, tier } = useModuleAccess(module);

  // Loading state
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No access to module
  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    if (!showUpgrade) return null;
    return <ModuleUpgradePrompt module={module} />;
  }

  // Check tier requirement
  if (requiredTier && tier) {
    const tierOrder: TierCode[] = ['basic', 'pro', 'enterprise'];
    const currentIndex = tierOrder.indexOf(tier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    if (currentIndex < requiredIndex) {
      if (fallback) return <>{fallback}</>;
      if (!showUpgrade) return null;
      return <TierUpgradePrompt module={module} requiredTier={requiredTier} currentTier={tier} />;
    }
  }

  return <>{children}</>;
}

/**
 * Prompt shown when module is not licensed
 */
function ModuleUpgradePrompt({ module }: { module: ModuleCode }) {
  const moduleInfo = MODULE_REGISTRY[module];
  const moduleName = moduleInfo?.name || module;
  const moduleColor = moduleInfo?.color || '#3B82F6';

  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardHeader className="text-center pb-2">
        <div 
          className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${moduleColor}15` }}
        >
          <Lock className="w-7 h-7" style={{ color: moduleColor }} />
        </div>
        <CardTitle className="text-xl">Desbloquea {moduleName}</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {moduleInfo?.description || `El módulo ${moduleName} no está incluido en tu plan actual.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4 pt-2">
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/pricing">
              Ver planes
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/app/settings/billing?upgrade=${module}`}>
              <Sparkles className="w-4 h-4 mr-2" />
              Actualizar plan
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Prompt shown when tier is insufficient
 */
function TierUpgradePrompt({
  module,
  requiredTier,
  currentTier,
}: {
  module: ModuleCode;
  requiredTier: TierCode;
  currentTier: TierCode;
}) {
  const moduleInfo = MODULE_REGISTRY[module];
  const moduleColor = moduleInfo?.color || '#F59E0B';

  return (
    <Card 
      className="border-2"
      style={{ borderColor: `${moduleColor}50`, backgroundColor: `${moduleColor}05` }}
    >
      <CardHeader className="text-center pb-2">
        <div 
          className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${moduleColor}15` }}
        >
          <Sparkles className="w-7 h-7" style={{ color: moduleColor }} />
        </div>
        <CardTitle className="text-xl">Actualiza a {TIER_NAMES[requiredTier]}</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Tu plan actual ({TIER_NAMES[currentTier]}) no incluye esta funcionalidad.
          Actualiza a {TIER_NAMES[requiredTier]} para desbloquearla.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-2">
        <Button asChild>
          <Link to={`/app/settings/billing?upgrade=${module}&tier=${requiredTier}`}>
            Actualizar ahora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Feature Gate - checks specific feature within a module
 */
interface FeatureGateProps {
  module: ModuleCode;
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ module, feature, children, fallback }: FeatureGateProps) {
  const { hasAccess, features } = useModuleAccess(module);

  if (!hasAccess) return fallback ? <>{fallback}</> : null;
  
  const hasFeature = features.some(f => f.includes(feature));
  if (!hasFeature) return fallback ? <>{fallback}</> : null;

  return <>{children}</>;
}

/**
 * Hook-based access check for conditional rendering
 */
export function useModuleGate(module: ModuleCode, requiredTier?: TierCode) {
  const { hasAccess, tier, isLoading } = useModuleAccess(module);

  if (isLoading) return { allowed: false, isLoading: true };
  if (!hasAccess) return { allowed: false, isLoading: false, reason: 'no_license' };

  if (requiredTier && tier) {
    const tierOrder: TierCode[] = ['basic', 'pro', 'enterprise'];
    const currentIndex = tierOrder.indexOf(tier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    if (currentIndex < requiredIndex) {
      return { allowed: false, isLoading: false, reason: 'tier_insufficient' };
    }
  }

  return { allowed: true, isLoading: false };
}

// Re-export types for convenience
export type { ModuleCode, TierCode };
