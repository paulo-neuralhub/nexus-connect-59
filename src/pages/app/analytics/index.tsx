import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/page-context';
import { AnalyticsTenantDashboard } from '@/components/features/analytics/AnalyticsTenantDashboard';

export default function AnalyticsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Analytics');
  }, [setTitle]);

  return <AnalyticsTenantDashboard />;
}
