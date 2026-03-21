import { useModuleAccess } from '@/hooks/use-module-access';
import { Loader2 } from 'lucide-react';
import SpiderOnboarding from './SpiderOnboarding';
import { SpiderDashboardView } from '@/components/features/spider/SpiderDashboardView';

export default function SpiderDashboard() {
  const { hasAccess, isLoading } = useModuleAccess('spider');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return <SpiderOnboarding />;
  }

  return <SpiderDashboardView />;
}
