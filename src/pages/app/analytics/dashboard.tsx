/**
 * Advanced Analytics Page - L106
 * Dashboard analítico avanzado para el despacho
 */

import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/page-context';
import { AdvancedAnalyticsDashboard } from '@/components/features/analytics/AdvancedAnalyticsDashboard';

export default function AdvancedAnalyticsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Dashboard Analítico');
  }, [setTitle]);

  return <AdvancedAnalyticsDashboard />;
}
