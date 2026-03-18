import { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartData } from '@/types/reports';
import { CHART_COLORS } from '@/lib/constants/reports';

interface ChartProps {
  data: ChartData;
  height?: number;
}

export function LineChart({ data, height = 250 }: ChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, i) => {
      const point: Record<string, string | number> = { name: label };
      data.datasets.forEach((ds, di) => {
        point[ds.label || `value${di}`] = ds.data[i];
      });
      return point;
    });
  }, [data]);
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#6B7280' }} 
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }} 
        />
        {data.datasets.map((ds, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={ds.label || `value${i}`}
            stroke={typeof ds.borderColor === 'string' ? ds.borderColor : CHART_COLORS[i % CHART_COLORS.length]}
            fill={typeof ds.backgroundColor === 'string' ? ds.backgroundColor : `${CHART_COLORS[i % CHART_COLORS.length]}20`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, height = 250 }: ChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, i) => {
      const point: Record<string, string | number> = { name: label };
      data.datasets.forEach((ds, di) => {
        point[ds.label || `value${di}`] = ds.data[i];
      });
      return point;
    });
  }, [data]);
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }} 
        />
        {data.datasets.map((ds, i) => (
          <Bar
            key={i}
            dataKey={ds.label || `value${i}`}
            fill={typeof ds.backgroundColor === 'string' 
              ? ds.backgroundColor 
              : CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({ data, height = 250 }: ChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, i) => ({
      name: label,
      value: data.datasets[0]?.data[i] || 0,
      fill: Array.isArray(data.datasets[0]?.backgroundColor) 
        ? data.datasets[0].backgroundColor[i % data.datasets[0].backgroundColor.length]
        : CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 250 }: ChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, i) => ({
      name: label,
      value: data.datasets[0]?.data[i] || 0,
      fill: Array.isArray(data.datasets[0]?.backgroundColor) 
        ? data.datasets[0].backgroundColor[i % data.datasets[0].backgroundColor.length]
        : CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Stat card para dashboards
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  href?: string;
  alert?: boolean;
  alertText?: string;
  isFormatted?: boolean;
  subtitle?: string;
  change?: number;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  href,
  alert,
  alertText,
  isFormatted,
  subtitle,
  change,
}: StatCardProps) {
  const content = (
    <div className="bg-card rounded-xl border p-4 hover:border-muted-foreground/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {isFormatted ? value : typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          {alert && alertText && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              ⚠️ {alertText}
            </p>
          )}
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
  
  if (href) {
    return <a href={href}>{content}</a>;
  }
  
  return content;
}
