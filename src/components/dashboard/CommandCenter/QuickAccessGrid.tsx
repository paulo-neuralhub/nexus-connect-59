// =============================================
// Quick Access — 2×3 grid of shortcut cards
// =============================================

import { Link } from 'react-router-dom';
import {
  FolderPlus,
  Clock,
  Search,
  Shield,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ShortcutCard {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface QuickAccessGridProps {
  onOpenCopilot?: () => void;
}

export function QuickAccessGrid({ onOpenCopilot }: QuickAccessGridProps) {
  const shortcuts: ShortcutCard[] = [
    { icon: FolderPlus, label: '+ Nuevo Expediente', href: '/app/expedientes/nuevo' },
    { icon: Clock, label: 'Ver Plazos', href: '/app/plazos' },
    { icon: Search, label: 'Alertas Spider', href: '/app/expedientes/vigilancia' },
    { icon: Shield, label: 'Oposiciones', href: '/app/expedientes/oposiciones' },
    { icon: RefreshCw, label: 'Renovaciones', href: '/app/plazos?tab=renovaciones' },
    { icon: Sparkles, label: 'GENIUS Chat', onClick: onOpenCopilot },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3
        className="text-[13px] font-bold tracking-[0.15px] mb-3"
        style={{ color: '#0a2540' }}
      >
        Acceso Rápido
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          const inner = (
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer">
              <Icon className="h-5 w-5" style={{ color: '#475569' }} />
              <span className="text-[11px] font-medium text-center" style={{ color: '#374151' }}>
                {s.label}
              </span>
            </div>
          );

          if (s.href) {
            return <Link key={s.label} to={s.href}>{inner}</Link>;
          }
          return (
            <div key={s.label} onClick={s.onClick}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
