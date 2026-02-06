// ============================================================
// TEMPLATE CATEGORY TABS - Tabs estilo SILK para categorías
// ============================================================

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  Grid3X3, Banknote, Mail, BarChart3, Scale, Award 
} from 'lucide-react';
import type { DocumentCategory } from '@/lib/document-templates/designTokens';

interface CategoryTabsProps {
  activeCategory: 'all' | DocumentCategory;
  onCategoryChange: (category: 'all' | DocumentCategory) => void;
  counts: Record<'all' | DocumentCategory, number>;
  className?: string;
}

const CATEGORIES: { key: 'all' | DocumentCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: Grid3X3 },
  { key: 'financiero', label: 'Financiero', icon: Banknote },
  { key: 'comunicacion', label: 'Comunicación', icon: Mail },
  { key: 'informe', label: 'Informes', icon: BarChart3 },
  { key: 'legal', label: 'Legal', icon: Scale },
  { key: 'ip', label: 'IP', icon: Award },
];

export function TemplateCategoryTabs({ 
  activeCategory, 
  onCategoryChange, 
  counts,
  className 
}: CategoryTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl', className)}>
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const isActive = activeCategory === key;
        const count = counts[key] || 0;
        
        return (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className={cn(
              'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
              isActive
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white'
                : 'bg-slate-200 text-slate-600'
            )}>
              {count}
            </span>
            {/* SILK accent bar for active */}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
