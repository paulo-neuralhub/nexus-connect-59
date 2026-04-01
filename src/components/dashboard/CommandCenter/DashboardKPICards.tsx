// =============================================
// KPI Cards — 4 top-level metrics
// SILK v2 Design System
// =============================================

import { Link } from 'react-router-dom';
import { Clock, Search, FolderOpen, CheckSquare } from 'lucide-react';
import { NeoBadge } from '@/components/ui/neo-badge';

interface KPICardData {
  icon: React.ElementType;
  emoji: string;
  label: string;
  sublabel: string;
  value: number;
  href: string;
  color: string;
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
      sublabel: 'Vencen en ≤ 7 días',
      value: plazosUrgentes,
      href: '/app/plazos',
      color: '#ef4444',
    },
    {
      icon: Search,
      emoji: '🕷️',
      label: 'Alertas Spider',
      sublabel: 'Conflictos detectados',
      value: alertasSpider,
      href: '/app/expedientes/vigilancia',
      color: '#f59e0b',
    },
    {
      icon: FolderOpen,
      emoji: '📁',
      label: 'Expedientes',
      sublabel: 'Activos',
      value: expedientesActivos,
      href: '/app/expedientes',
      color: '#00b4d8',
    },
    {
      icon: CheckSquare,
      emoji: '✅',
      label: 'Mis Tareas',
      sublabel: 'Pendientes',
      value: misTareas,
      href: '/app/operaciones',
      color: '#10b981',
    },
  ];

  return (
    <div
      className="p-3 rounded-[14px]"
      style={{
        background: '#ffffff',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.href}>
              <div
                className="flex items-center gap-3 py-[13px] px-3 rounded-[14px] border border-black/[0.06] cursor-pointer transition-all duration-200 hover:border-[rgba(0,180,216,0.15)] hover:shadow-sm"
                style={{ background: '#f8fafc' }}
              >
                {/* NeoBadge value */}
                <NeoBadge
                  value={card.value}
                  color={card.color}
                  size="md"
                />

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12px] font-semibold truncate"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: 'hsl(var(--text-secondary))' }}
                  >
                    {card.sublabel}
                  </p>
                </div>

                {/* Emoji hint */}
                <span className="text-base flex-shrink-0 opacity-60">{card.emoji}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
