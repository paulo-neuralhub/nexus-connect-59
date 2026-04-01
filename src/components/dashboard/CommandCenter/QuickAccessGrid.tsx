// =============================================
// Quick Access — 2×3 grid of shortcut cards
// SILK v2 Design System
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
  color: string;
  href?: string;
  onClick?: () => void;
}

interface QuickAccessGridProps {
  onOpenCopilot?: () => void;
}

export function QuickAccessGrid({ onOpenCopilot }: QuickAccessGridProps) {
  const shortcuts: ShortcutCard[] = [
    { icon: FolderPlus, label: '+ Nuevo Expediente', color: '#00b4d8', href: '/app/expedientes/nuevo' },
    { icon: Clock, label: 'Ver Plazos', color: '#ef4444', href: '/app/plazos' },
    { icon: Search, label: 'Alertas Spider', color: '#f59e0b', href: '/app/expedientes/vigilancia' },
    { icon: Shield, label: 'Oposiciones', color: '#2563eb', href: '/app/expedientes/oposiciones' },
    { icon: RefreshCw, label: 'Renovaciones', color: '#10b981', href: '/app/plazos?tab=renovaciones' },
    { icon: Sparkles, label: 'GENIUS Chat', color: '#b45309', onClick: onOpenCopilot },
  ];

  return (
    <div
      className="rounded-[14px] border p-[18px]"
      style={{ background: '#ffffff', borderColor: 'hsl(var(--border))' }}
    >
      <h3
        className="text-[13px] font-bold tracking-[0.15px] mb-3"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        Acceso Rápido
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          const inner = (
            <div
              className="flex flex-col items-center gap-2 p-3 rounded-[12px] border border-black/[0.04] transition-all duration-200 hover:border-[rgba(0,180,216,0.15)] hover:shadow-sm cursor-pointer"
              style={{ background: '#f8fafc' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: `${s.color}12` }}
              >
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <span
                className="text-[10px] font-medium text-center"
                style={{ color: 'hsl(var(--text-primary))' }}
              >
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
