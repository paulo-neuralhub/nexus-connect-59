import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { TopFeature } from '@/types/analytics';

interface FeatureUsageChartProps {
  data?: TopFeature[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(221, 83%, 53%)', // blue
  'hsl(160, 84%, 39%)', // green
  'hsl(38, 92%, 50%)',  // amber
  'hsl(262, 83%, 58%)', // purple
  'hsl(0, 84%, 60%)',   // red
  'hsl(330, 81%, 60%)', // pink
];

// Friendly names for features
const featureLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  matters_list: 'Expedientes',
  matter_detail: 'Detalle Exp.',
  search_basic: 'Búsqueda',
  search_advanced: 'Búsqueda Av.',
  search_ai: 'Búsqueda IA',
  document_viewer: 'Ver Docs',
  document_generator: 'Generar Docs',
  document_upload: 'Subir Docs',
  ai_genius_chat: 'Genius Chat',
  ai_genius_analyze: 'Genius Análisis',
  ai_genius_draft: 'Genius Redacción',
  ai_spider_search: 'Spider Búsqueda',
  ai_spider_monitor: 'Spider Monitor',
  market_browse: 'Market',
  market_request_quote: 'Solicitar Cotiz.',
  market_send_quote: 'Enviar Cotiz.',
  settings: 'Configuración',
  team_management: 'Equipo',
  billing: 'Facturación',
  calendar: 'Calendario',
  reports: 'Reportes',
  export: 'Exportar',
};

export function FeatureUsageChart({ data, isLoading }: FeatureUsageChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso de Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).slice(0, 8).map((item) => ({
    ...item,
    name: featureLabels[item.feature] || item.feature,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso de Features</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" className="text-xs" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="uses" name="Usos" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
