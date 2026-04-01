// =============================================
// KPI Cards — 4 top-level metrics
// =============================================

import { Link } from 'react-router-dom';
import { Clock, Search, FolderOpen, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardData {
  icon: React.ElementType;
  emoji: string;
  label: string;
  value: number;
  href: string;
  urgentThreshold: number;
}

interface DashboardKPICardsProps {
  plazosUrgentes: number;
  alertasSpider: number;
  expedientesActivos: number;
  misTareas: number;
}

export function DashboardKPICards({
  plazosUrgentes,
  alertasSpider,
  expedientesActivos,
  misTareas,
}: DashboardKPICardsProps) {
  const cards: KPICardData[] = [
    {
      icon: Clock,
      emoji: '⚡',
      label: 'Plazos Urgentes',
      value: plazosUrgentes,
      href: '/app/plazos',
      urgentThreshold: 1,
    },
    {
      icon: Search,
      emoji: '🔍',
      label: 'Alertas Spider',
      value: alertasSpider,
      href: '/app/expedientes/vigilancia',
      urgentThreshold: 1,
    },
    {
      icon: FolderOpen,
      emoji: '📁',
      label: 'Expedientes',
      value: expedientesActivos,
      href: '/app/expedientes',
      urgentThreshold: 0, // never urgent
    },
    {
      icon: CheckSquare,
      emoji: '✅',
      label: 'Mis Tareas',
      value: misTareas,
      href: '/app/operaciones',
      urgentThreshold: 5,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isUrgent = card.urgentThreshold > 0 && card.value >= card.urgentThreshold;
        const Icon = card.icon;

        return (
          <Link key={card.label} to={card.href}>
            <div
              className={cn(
                'rounded-xl border bg-white p-4 transition-all duration-200',
                'hover:shadow-md cursor-pointer',
                isUrgent ? 'border-l-[3px]' : 'border-slate-200'
              )}
              style={isUrgent ? { borderLeftColor: card.label === 'Plazos Urgentes' ? '#dc2626' : '#f59e0b' } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: isUrgent ? (card.value > 0 ? '#FEF2F2' : '#F0FDF4') : '#F1F5F9',
                  }}
                >
                  <Icon
                    className="h-4.5 w-4.5"
                    style={{
                      color: isUrgent ? '#dc2626' : '#64748b',
                    }}
                  />
                </div>
                <span className="text-lg">{card.emoji}</span>
              </div>
              <div
                className="text-3xl font-semibold mb-0.5"
                style={{ color: isUrgent && card.value > 0 ? '#dc2626' : '#0a2540' }}
              >
                {card.value}
              </div>
              <div className="text-xs font-medium" style={{ color: '#64748b' }}>
                {card.label}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
