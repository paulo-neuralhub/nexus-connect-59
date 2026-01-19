// src/components/features/ip-finance/PortfolioPerformanceChart.tsx
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp } from 'lucide-react';

interface PortfolioPerformanceChartProps {
  portfolioId: string;
}

export function PortfolioPerformanceChart({ portfolioId }: PortfolioPerformanceChartProps) {
  // Fetch historical valuations for assets in this portfolio
  const { data: valuationHistory, isLoading } = useQuery({
    queryKey: ['portfolio-valuation-history', portfolioId],
    queryFn: async () => {
      // First get all assets in portfolio
      const { data: assets } = await supabase
        .from('finance_portfolio_assets')
        .select('id')
        .eq('portfolio_id', portfolioId);

      if (!assets?.length) return [];

      // Get all valuations for these assets
      const { data: valuations } = await supabase
        .from('finance_valuations')
        .select('*')
        .in('asset_id', assets.map(a => a.id))
        .order('valuation_date', { ascending: true });

      return valuations || [];
    }
  });

  const chartData = useMemo(() => {
    if (!valuationHistory?.length) return [];

    // Group valuations by date and sum values
    const groupedByDate = valuationHistory.reduce((acc, v: any) => {
      const date = v.valuation_date;
      if (!acc[date]) {
        acc[date] = { date, value: 0, count: 0 };
      }
      acc[date].value += v.estimated_value || 0;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; value: number; count: number }>);

    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('es-ES', { 
          month: 'short', 
          year: '2-digit' 
        }),
        formattedValue: new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: 'EUR',
          notation: 'compact'
        }).format(item.value)
      }));
  }, [valuationHistory]);

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <EmptyState
          icon={<TrendingUp className="h-10 w-10" />}
          title="Sin datos históricos"
          description="Valora los activos del portfolio para ver la evolución"
        />
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="formattedDate" 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('es-ES', { 
                notation: 'compact', 
                currency: 'EUR' 
              }).format(value)
            }
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium">{data.date}</p>
                    <p className="text-lg font-bold text-primary">{data.formattedValue}</p>
                    <p className="text-xs text-muted-foreground">{data.count} activo(s) valorado(s)</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Valor Portfolio"
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
