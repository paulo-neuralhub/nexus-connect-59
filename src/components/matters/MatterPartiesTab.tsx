// ============================================
// src/components/matters/MatterPartiesTab.tsx
// Enhanced parties tab with edit/delete actions
// ============================================

import { useState } from 'react';
import { 
  Users, Plus, Pencil, Trash2, Copy, Mail, Phone, MapPin,
  Building2, User, ChevronDown, Shield, Crown, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMatterParties, useDeleteMatterParty, type MatterParty } from '@/hooks/legal-ops/useMatterParties';
import { AddPartyModal } from './AddPartyModal';
import { EditPartyModal } from './EditPartyModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Role icons mapping
const ROLE_ICONS: Record<string, typeof User> = {
  holder: Crown,
  co_holder: Crown,
  applicant: User,
  inventor: User,
  designer: User,
  representative: Shield,
  agent: Briefcase,
  licensee: Building2,
};

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ownership: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  creation: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  representation: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

interface MatterPartiesTabProps {
  matterId: string;
  matterType?: string;
}

export function MatterPartiesTab({ matterId, matterType }: MatterPartiesTabProps) {
  const { data: groupedParties, isLoading } = useMatterParties(matterId);
  const deleteParty = useDeleteMatterParty();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParty, setEditingParty] = useState<MatterParty | null>(null);
  const [deletingParty, setDeletingParty] = useState<MatterParty | null>(null);

  // Flatten all parties for total count
  const allParties = groupedParties 
    ? [...(groupedParties.ownership || []), ...(groupedParties.creation || []), ...(groupedParties.representation || []), ...(groupedParties.other || [])]
    : [];

  // Copy party data to clipboard
  const handleCopyData = (party: MatterParty) => {
    const name = party.client?.name || party.external_name || 'Sin nombre';
    const email = party.client?.email || party.external_email || '';
    const phone = party.external_phone || '';
    const address = party.external_address || '';
    
    const text = [
      `Nombre: ${name}`,
      email && `Email: ${email}`,
      phone && `Teléfono: ${phone}`,
      address && `Dirección: ${address}`,
      `Rol: ${party.role_info?.name_es || party.party_role}`,
      party.percentage && `Porcentaje: ${party.percentage}%`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Datos copiados al portapapeles');
  };

  // Delete party
  const handleDelete = async () => {
    if (!deletingParty) return;
    
    try {
      await deleteParty.mutateAsync({
        partyId: deletingParty.id,
        matterId: matterId,
      });
      toast.success('Parte eliminada correctamente');
      setDeletingParty(null);
    } catch {
      toast.error('Error al eliminar la parte');
    }
  };

  // Get display name
  const getPartyName = (party: MatterParty) => {
    return party.client?.name || party.external_name || 'Sin nombre';
  };

  // Get company/organization
  const getPartyCompany = (party: MatterParty) => {
    return party.client?.company_name || null;
  };

  // Render party card
  const renderPartyCard = (party: MatterParty, category: string) => {
    const name = getPartyName(party);
    const company = getPartyCompany(party);
    const email = party.client?.email || party.external_email;
    const phone = party.external_phone;
    const address = party.external_address;
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
    const IconComponent = ROLE_ICONS[party.party_role] || User;

    return (
      <div 
        key={party.id}
        className={cn(
          "group relative border rounded-xl p-4 transition-all hover:shadow-sm",
          colors.border,
          "bg-white"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Avatar and Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              colors.bg
            )}>
              <IconComponent className={cn("h-5 w-5", colors.text)} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-900 truncate">{name}</h4>
                {party.is_primary && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Principal
                  </Badge>
                )}
                {party.percentage && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {party.percentage}%
                  </Badge>
                )}
              </div>

              {company && (
                <p className="text-sm text-slate-600 truncate mb-1">{company}</p>
              )}

              <Badge 
                variant="secondary"
                className={cn("text-xs", colors.bg, colors.text)}
              >
                {party.role_info?.name_es || party.party_role}
              </Badge>

              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                {email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {phone}
                  </span>
                )}
                {address && (
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-700"
                  onClick={() => setEditingParty(party)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-700"
                  onClick={() => handleCopyData(party)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar datos</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeletingParty(party)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  // Render category section
  const renderCategory = (categoryKey: string, parties: MatterParty[], title: string) => {
    if (!parties || parties.length === 0) return null;
    
    const colors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.other;

    return (
      <div key={categoryKey} className="space-y-3">
        <h3 className={cn("text-sm font-semibold flex items-center gap-2", colors.text)}>
          <span className={cn("w-2 h-2 rounded-full", colors.bg.replace('50', '500'))} />
          {title}
          <Badge variant="secondary" className="text-xs">
            {parties.length}
          </Badge>
        </h3>
        <div className="space-y-2">
          {parties.map(party => renderPartyCard(party, categoryKey))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partes del Expediente
            {allParties.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {allParties.length}
              </Badge>
            )}
          </CardTitle>

          {/* Add Party Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir parte
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tipo de parte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Crown className="h-4 w-4 mr-2 text-emerald-600" />
                Titular / Solicitante
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <User className="h-4 w-4 mr-2 text-blue-600" />
                Inventor / Diseñador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                Representante legal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Briefcase className="h-4 w-4 mr-2 text-amber-600" />
                Agente de PI
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Building2 className="h-4 w-4 mr-2 text-cyan-600" />
                Licenciatario
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Users className="h-4 w-4 mr-2 text-slate-600" />
                Otro tipo...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando partes...
            </div>
          ) : allParties.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground mb-4">
                No hay partes registradas en este expediente
              </p>
              <Button variant="outline" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir primera parte
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {renderCategory('ownership', groupedParties?.ownership || [], 'Titularidad')}
              {renderCategory('creation', groupedParties?.creation || [], 'Creación')}
              {renderCategory('representation', groupedParties?.representation || [], 'Representación')}
              {renderCategory('other', groupedParties?.other || [], 'Otros')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Party Modal */}
      <AddPartyModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        matterId={matterId}
        matterType={matterType}
      />

      {/* Edit Party Modal */}
      <EditPartyModal
        open={!!editingParty}
        onOpenChange={(open) => !open && setEditingParty(null)}
        party={editingParty}
        matterId={matterId}
        matterType={matterType}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingParty} onOpenChange={(open) => !open && setDeletingParty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar parte?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a <strong>{deletingParty ? getPartyName(deletingParty) : ''}</strong> 
              {' '}({deletingParty?.role_info?.name_es || deletingParty?.party_role}) del expediente.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteParty.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
