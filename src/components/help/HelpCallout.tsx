// ============================================================
// IP-NEXUS HELP - CALLOUT BLOCKS FOR ARTICLES
// ============================================================

import { Info, Lightbulb, AlertTriangle, AlertCircle, StickyNote } from 'lucide-react';
import { ReactNode } from 'react';

type CalloutType = 'info' | 'tip' | 'warning' | 'danger' | 'note';

const config: Record<CalloutType, {
  bg: string; border: string; icon: typeof Info; iconColor: string; titleColor: string; label: string;
}> = {
  info:    { bg: 'bg-blue-50 dark:bg-blue-950/30',      border: 'border-blue-100 dark:border-blue-900/50',    icon: Info,          iconColor: 'text-blue-500',    titleColor: 'text-blue-700 dark:text-blue-400',    label: 'Información' },
  tip:     { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/50', icon: Lightbulb, iconColor: 'text-emerald-500', titleColor: 'text-emerald-700 dark:text-emerald-400', label: 'Consejo' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30',    border: 'border-amber-100 dark:border-amber-900/50',  icon: AlertTriangle, iconColor: 'text-amber-500',   titleColor: 'text-amber-700 dark:text-amber-400',   label: 'Importante' },
  danger:  { bg: 'bg-red-50 dark:bg-red-950/30',        border: 'border-red-100 dark:border-red-900/50',      icon: AlertCircle,   iconColor: 'text-red-500',     titleColor: 'text-red-700 dark:text-red-400',     label: 'Atención' },
  note:    { bg: 'bg-muted',                             border: 'border-border',                               icon: StickyNote,    iconColor: 'text-muted-foreground', titleColor: 'text-foreground',        label: 'Nota' },
};

interface HelpCalloutProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}

export function HelpCallout({ type, title, children }: HelpCalloutProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${c.bg} border ${c.border} my-4`}>
      <Icon className={`w-5 h-5 ${c.iconColor} flex-shrink-0 mt-0.5`} />
      <div>
        <span className={`text-xs font-semibold ${c.titleColor} uppercase tracking-wider`}>
          {title || c.label}
        </span>
        <div className="text-sm text-foreground/80 mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
