// src/components/features/ip-finance/AssetAllocationChart.tsx
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { PortfolioAsset, AssetType } from '@/types/ip-finance.types';

interface ValuationWithFinalValue {
  asset_id?: string;
  final_value: number;
}

interface AssetAllocationChartProps {
  assets: PortfolioAsset[];
  valuations: ValuationWithFinalValue[];
}

const assetTypeLabels: Record<AssetType, string> = {
  trademark: 'Marcas',
  patent: 'Patentes',
  design: 'Diseños',
  copyright: 'Copyright',
  trade_secret: 'Secretos',
  domain: 'Dominios',
  software: 'Software',
  other: 'Otros'
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d'
];

export function AssetAllocationChart({ assets, valuations }: AssetAllocationChartProps) {
  const chartData = useMemo(() => {
    if (!assets.length) return [];

    // Create a map of asset values
    const assetValueMap = new Map<string, number>();
    valuations.forEach(v => {
      assetValueMap.set(v.asset_id, v.final_value || 0);
    });

    // Group by asset type and sum values
    const typeGroups = assets.reduce((acc, asset) => {
      const type = asset.asset_type as AssetType;
      const value = assetValueMap.get(asset.id) || asset.acquisition_cost || 0;
      
      if (!acc[type]) {
        acc[type] = { type, value: 0, count: 0 };
      }
      acc[type].value += value;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { type: AssetType; value: number; count: number }>);

    return Object.values(typeGroups)
      .filter(g => g.value > 0)
      .map(g => ({
        name: assetTypeLabels[g.type] || g.type,
        value: g.value,
        count: g.count,
        formattedValue: new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0
        }).format(g.value)
      }));
  }, [assets, valuations]);

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <EmptyState
          icon={<PieChartIcon className="h-10 w-10" />}
          title="Sin datos"
          description="Añade y valora activos para ver la distribución"
        />
      </div>
    );
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-lg font-bold text-primary">{data.formattedValue}</p>
                    <p className="text-xs text-muted-foreground">
                      {percentage}% del total • {data.count} activo(s)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            formatter={(value, entry: any) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
