/**
 * LeadCard - Card para lead en el Kanban CRM
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/hooks/crm/useLeads';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  Mail,
  CheckCircle,
  Trash2,
  MoreVertical,
  Building2,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onCall?: () => void;
  onEmail?: () => void;
  onApprove?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referral: 'Referido',
  linkedin: 'LinkedIn',
  cold_call: 'Llamada fría',
  event: 'Evento',
  partner: 'Partner',
  other: 'Otro',
};

export function LeadCard({
  lead,
  onCall,
  onEmail,
  onApprove,
  onDelete,
  isDragging,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials = lead.contact_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      {/* Header con drag handle y menú */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{lead.contact_name}</p>
            {lead.company_name && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 shrink-0" />
                {lead.company_name}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onCall && lead.contact_phone && (
              <DropdownMenuItem onClick={onCall}>
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </DropdownMenuItem>
            )}
            {onEmail && lead.contact_email && (
              <DropdownMenuItem onClick={onEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onApprove && (
              <DropdownMenuItem onClick={onApprove} className="text-[hsl(var(--ip-success-text))]">
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar → Deal
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Valor estimado */}
      {lead.estimated_value && lead.estimated_value > 0 && (
        <div className="mb-2">
          <span className="text-sm font-semibold text-primary">
            {lead.estimated_value.toLocaleString('es-ES')} €
          </span>
        </div>
      )}

      {/* Tags de interés */}
      {lead.interested_in && lead.interested_in.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.interested_in.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {lead.interested_in.length > 3 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{lead.interested_in.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer: origen + fecha */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>{lead.source ? SOURCE_LABELS[lead.source] || lead.source : 'Sin origen'}</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
        </span>
      </div>

      {/* Stand-by indicator */}
      {lead.status === 'standby' && lead.standby_until && (
        <div className="mt-2 p-2 bg-[hsl(var(--ip-pending-bg))] rounded text-xs">
          <span className="text-[hsl(var(--ip-pending-text))]">
            Reactivar: {new Date(lead.standby_until).toLocaleDateString('es-ES')}
          </span>
          {lead.standby_reason && (
            <p className="text-muted-foreground mt-0.5">{lead.standby_reason}</p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-1 mt-2 pt-2 border-t">
        {onCall && lead.contact_phone && (
          <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onCall}>
            <Phone className="w-3 h-3 mr-1" />
            Llamar
          </Button>
        )}
        {onEmail && lead.contact_email && (
          <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onEmail}>
            <Mail className="w-3 h-3 mr-1" />
            Email
          </Button>
        )}
        {onApprove && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onApprove}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobar
          </Button>
        )}
      </div>
    </Card>
  );
}
