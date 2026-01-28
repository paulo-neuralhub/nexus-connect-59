/**
 * PipelineCard - Tarjeta visual para Lead/Deal en el Pipeline
 * Diseño profesional con badge tipo, valor, acciones y tarea pendiente
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Building2,
  Clock,
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Lead } from '@/hooks/crm/useLeads';
import type { Deal } from '@/hooks/crm/useDeals';

interface PipelineCardProps {
  item: Lead | Deal;
  type: 'leads' | 'deals';
  onClick?: () => void;
  isDragging?: boolean;
}

// Badge de tipo según el servicio
const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  marca_es: { label: 'MARCA ES', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  marca_eu: { label: 'MARCA EU', className: 'bg-purple-100 text-purple-800 border-purple-300' },
  patente: { label: 'PATENTE', className: 'bg-green-100 text-green-800 border-green-300' },
  diseno: { label: 'DISEÑO', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  oposicion: { label: 'OPOSICIÓN', className: 'bg-red-100 text-red-800 border-red-300' },
  vigilancia: { label: 'VIGILANCIA', className: 'bg-slate-100 text-slate-800 border-slate-300' },
  default: { label: 'OTROS', className: 'bg-slate-100 text-slate-800 border-slate-300' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function isLead(item: Lead | Deal): item is Lead {
  return 'contact_name' in item;
}

export function PipelineCard({ item, type, onClick, isDragging }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.id,
    data: { type, item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Extract data
  const lead = isLead(item) ? item : null;
  const deal = !isLead(item) ? item : null;

  const name = lead?.contact_name || deal?.name || 'Sin nombre';
  const company = lead?.company_name || deal?.client?.name;
  const value = lead?.estimated_value || deal?.amount || 0;
  const phone = lead?.contact_phone || deal?.client?.phone;
  const email = lead?.contact_email || deal?.client?.email;
  const nextAction = lead?.next_action || deal?.next_action;
  const nextActionDate = lead?.next_action_date || deal?.next_action_date;
  const ownerName = 'Responsable'; // TODO: connect to actual owner
  const lastActivity = item.updated_at || item.created_at;
  const clientNumber = deal?.client?.client_number;

  // Get type badge - use interested_in array or default
  const serviceType = lead?.interested_in?.[0] || 'default';
  const typeBadge = TYPE_BADGES[serviceType] || TYPE_BADGES.default;

  // Urgency check
  const isOverdue = nextActionDate && isPast(new Date(nextActionDate));
  const isUrgent = nextActionDate && differenceInDays(new Date(nextActionDate), new Date()) <= 2;

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onClick?.();
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) window.dispatchEvent(new CustomEvent('ip-nexus:initiate-call', { detail: { number: phone } }));
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (email) window.open(`mailto:${email}`, '_blank');
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        'w-full p-3 cursor-pointer transition-all duration-200',
        'bg-background hover:shadow-md hover:scale-[1.02] active:scale-100',
        isDragging && 'opacity-60 shadow-xl ring-2 ring-primary rotate-2',
        isOverdue && 'border-destructive/50 bg-destructive/5',
        onClick && 'cursor-pointer'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Row 1: Badge tipo + Valor */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge 
          variant="outline" 
          className={cn('text-[10px] font-semibold px-1.5 py-0 h-5', typeBadge.className)}
        >
          {typeBadge.label}
        </Badge>
        <span className="text-sm font-bold text-green-600">
          {formatCurrency(value)}
        </span>
      </div>

      {/* Row 2: Company + Contact */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="truncate">{company || name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <User className="w-3 h-3" />
          <span className="truncate">{name}</span>
        </div>
      </div>

      {/* Row 3: Quick actions */}
      <div className="flex items-center gap-1 mb-3">
        <TooltipProvider>
          {phone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white"
                  onClick={handleCall}
                >
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Llamar</TooltipContent>
            </Tooltip>
          )}
          {phone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#25D366] hover:text-white"
                  onClick={handleWhatsApp}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>WhatsApp</TooltipContent>
            </Tooltip>
          )}
          {email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white"
                  onClick={handleEmail}
                >
                  <Mail className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Email</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        {clientNumber && (
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
            {clientNumber}
          </span>
        )}
      </div>

      {/* Row 4: Pending task */}
      {nextAction && (
        <div className={cn(
          'p-2 rounded-lg text-xs mb-3',
          isOverdue 
            ? 'bg-destructive/10 text-destructive border border-destructive/20'
            : isUrgent
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'bg-muted'
        )}>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'w-2 h-2 rounded-full',
              isOverdue ? 'bg-destructive' : isUrgent ? 'bg-orange-500' : 'bg-blue-500'
            )} />
            <span className="font-medium truncate">{nextAction}</span>
          </div>
          {nextActionDate && (
            <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80">
              <Calendar className="w-3 h-3" />
              {format(new Date(nextActionDate), 'd MMM', { locale: es })}
            </div>
          )}
        </div>
      )}

      {/* Row 5: Footer - Last activity + Owner */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lastActivity && format(new Date(lastActivity), 'd MMM', { locale: es })}
        </div>
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{ownerName}</span>
        </div>
      </div>
    </Card>
  );
}
