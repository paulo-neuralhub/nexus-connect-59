/**
 * KanbanDealCard — Pipedrive/HubSpot-level deal card for CRM Kanban
 * Left border colored by stage, avatar, probability bar, hover actions
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Phone, Mail, StickyNote, Eye, MoreHorizontal, Calendar, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CRMDeal } from '@/hooks/crm/v2/types';

interface KanbanDealCardProps {
  deal: CRMDeal;
  stageColor: string;
  onClick?: () => void;
  isDragOverlay?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#EF4444', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getProbabilityColor(pct: number): string {
  if (pct < 30) return '#EF4444';
  if (pct < 70) return '#F59E0B';
  return '#22C55E';
}

function getDealTypeLabel(type: string | null): string {
  const map: Record<string, string> = {
    trademark: 'Trademark', patent: 'Patent', design: 'Design',
    opposition: 'Oposición', renewal: 'Renovación',
  };
  return type ? map[type] || type : '';
}

export function KanbanDealCard({ deal, stageColor, onClick, isDragOverlay }: KanbanDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { type: 'deal', deal },
    disabled: isDragOverlay,
  });

  const style = isDragOverlay
    ? {}
    : { transform: CSS.Translate.toString(transform) };

  const dragging = isDragging && !isDragOverlay;

  const accountName = deal.account?.name || deal.account_name_cache || 'Sin empresa';
  const contactName = deal.contact?.name || deal.contact?.full_name || '';
  const amount = deal.amount_eur ?? deal.amount ?? 0;
  const probability = deal.probability_pct ?? deal.pipeline_stage?.probability ?? 0;
  const jurisdiction = deal.jurisdiction_code?.toUpperCase() || '';
  const dealType = getDealTypeLabel(deal.deal_type || deal.opportunity_type);
  const lastActivity = deal.updated_at || deal.created_at;
  const expectedClose = deal.expected_close_date;
  const avatarColor = getAvatarColor(accountName);
  const probColor = getProbabilityColor(probability);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onClick?.();
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        'group relative bg-white dark:bg-card rounded-xl border border-border/60',
        'transition-all duration-200 cursor-grab active:cursor-grabbing',
        'hover:shadow-lg hover:-translate-y-0.5',
        dragging && 'opacity-40 scale-95',
        isDragOverlay && 'shadow-2xl rotate-2 scale-105',
      )}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
    >
      {/* Left border accent */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: stageColor }}
      />

      <div className="p-3 pl-4">
        {/* Row 1: Account avatar + name + menu */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(accountName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {accountName}
              </p>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted flex-shrink-0">
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Deal name */}
        <p className="text-xs text-muted-foreground truncate mb-2.5 pl-9">
          {deal.name}
        </p>

        {/* Row 2: Amount + Close date */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-foreground">
            💶 {formatCurrency(amount)}
          </span>
          {expectedClose && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(expectedClose).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
            </span>
          )}
        </div>

        {/* Row 3: Jurisdiction + Type */}
        {(jurisdiction || dealType) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
            {jurisdiction && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {jurisdiction}
              </span>
            )}
            {dealType && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium">
                ⚖️ {dealType}
              </span>
            )}
          </div>
        )}

        {/* Probability bar */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, probability)}%`,
                backgroundColor: probColor,
              }}
            />
          </div>
          <span className="text-[10px] font-bold" style={{ color: probColor }}>
            {probability}%
          </span>
        </div>

        {/* Row 4: Responsible avatar + quick actions (hover) + last activity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold">
              {contactName ? getInitials(contactName) : '??'}
            </div>
            {/* Hover actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 transition-colors">
                <Phone className="w-3 h-3" />
              </button>
              <button className="p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-500 transition-colors">
                <Mail className="w-3 h-3" />
              </button>
              <button className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 transition-colors">
                <StickyNote className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Last activity */}
          <span className="text-[10px] text-muted-foreground">
            {lastActivity
              ? formatDistanceToNow(new Date(lastActivity), { locale: es, addSuffix: false })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
