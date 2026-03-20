// ============================================================
// IP-NEXUS - Matter Detail Header (Enterprise Redesign L130)
// Premium enterprise-level header with enhanced visual hierarchy
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Mail, Phone, MessageCircle, MoreHorizontal,
  Star, Building2, Copy, Download, Share2, FileText, Settings,
  Archive, Trash2, AlertTriangle, Calendar, User, Hash,
  Shield, Lightbulb, Wrench, Palette, Store, BookOpen, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MatterV2 } from '@/hooks/use-matters-v2';
import { WorkflowCards } from './WorkflowCards';
import { PhasePanelContainer } from '@/components/phases';

// Dynamic type configuration with Lucide icons for avatar
const MATTER_TYPE_ICONS: Record<string, { 
  icon: typeof Shield; 
  gradientFrom: string; 
  gradientTo: string; 
  borderColor: string;
  shadowColor: string;
}> = {
  // Trademarks — violet #8B5CF6
  TM_NAT: { icon: Shield, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  TM_EU: { icon: Shield, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  TM_INT: { icon: Shield, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  trademark: { icon: Shield, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  // Patents — sky #0EA5E9
  PT_NAT: { icon: Lightbulb, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  PT_EU: { icon: Lightbulb, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  PT_PCT: { icon: Lightbulb, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  patent: { icon: Lightbulb, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  // Utility Model
  UM: { icon: Wrench, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  utility_model: { icon: Wrench, gradientFrom: '#0EA5E9', gradientTo: '#0284C7', borderColor: '#38BDF8', shadowColor: 'rgba(14, 165, 233, 0.4)' },
  // Designs — indigo #6366F1
  DS_NAT: { icon: Palette, gradientFrom: '#6366F1', gradientTo: '#4F46E5', borderColor: '#818CF8', shadowColor: 'rgba(99, 102, 241, 0.4)' },
  DS_EU: { icon: Palette, gradientFrom: '#6366F1', gradientTo: '#4F46E5', borderColor: '#818CF8', shadowColor: 'rgba(99, 102, 241, 0.4)' },
  design: { icon: Palette, gradientFrom: '#6366F1', gradientTo: '#4F46E5', borderColor: '#818CF8', shadowColor: 'rgba(99, 102, 241, 0.4)' },
  // Trade Name
  NC: { icon: Store, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  trade_name: { icon: Store, gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', borderColor: '#A78BFA', shadowColor: 'rgba(139, 92, 246, 0.4)' },
  // Domain — green #10B981
  domain: { icon: Store, gradientFrom: '#10B981', gradientTo: '#059669', borderColor: '#34D399', shadowColor: 'rgba(16, 185, 129, 0.4)' },
  DOM: { icon: Store, gradientFrom: '#10B981', gradientTo: '#059669', borderColor: '#34D399', shadowColor: 'rgba(16, 185, 129, 0.4)' },
  // Copyright — amber #F59E0B
  copyright: { icon: BookOpen, gradientFrom: '#F59E0B', gradientTo: '#D97706', borderColor: '#FBBF24', shadowColor: 'rgba(245, 158, 11, 0.4)' },
  // Trade Secret — slate #64748B
  trade_secret: { icon: Lock, gradientFrom: '#64748B', gradientTo: '#475569', borderColor: '#94A3B8', shadowColor: 'rgba(100, 116, 139, 0.4)' },
  // Default
  default: { icon: FileText, gradientFrom: '#94a3b8', gradientTo: '#64748b', borderColor: '#cbd5e1', shadowColor: 'rgba(148, 163, 184, 0.4)' },
};

// Type configuration - colors for badges (aligned with spec)
const TYPE_CONFIG: Record<string, { label: string; borderColor: string; textColor: string; bgLight: string; gradientFrom: string; gradientTo: string }> = {
  TM_NAT: { label: 'Marca Nacional', borderColor: 'border-violet-300', textColor: 'text-violet-700', bgLight: 'bg-violet-50', gradientFrom: '#8B5CF6', gradientTo: '#7C3AED' },
  TM_EU: { label: 'Marca UE', borderColor: 'border-violet-300', textColor: 'text-violet-700', bgLight: 'bg-violet-50', gradientFrom: '#8B5CF6', gradientTo: '#7C3AED' },
  TM_INT: { label: 'Marca Internacional', borderColor: 'border-violet-300', textColor: 'text-violet-700', bgLight: 'bg-violet-50', gradientFrom: '#8B5CF6', gradientTo: '#7C3AED' },
  PT_NAT: { label: 'Patente Nacional', borderColor: 'border-sky-300', textColor: 'text-sky-700', bgLight: 'bg-sky-50', gradientFrom: '#0EA5E9', gradientTo: '#0284C7' },
  PT_EU: { label: 'Patente Europea', borderColor: 'border-sky-300', textColor: 'text-sky-700', bgLight: 'bg-sky-50', gradientFrom: '#0EA5E9', gradientTo: '#0284C7' },
  PT_PCT: { label: 'Patente PCT', borderColor: 'border-sky-300', textColor: 'text-sky-700', bgLight: 'bg-sky-50', gradientFrom: '#0EA5E9', gradientTo: '#0284C7' },
  UM: { label: 'Modelo Utilidad', borderColor: 'border-sky-300', textColor: 'text-sky-700', bgLight: 'bg-sky-50', gradientFrom: '#0EA5E9', gradientTo: '#0284C7' },
  DS_NAT: { label: 'Diseño Nacional', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', bgLight: 'bg-indigo-50', gradientFrom: '#6366F1', gradientTo: '#4F46E5' },
  DS_EU: { label: 'Diseño Comunitario', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', bgLight: 'bg-indigo-50', gradientFrom: '#6366F1', gradientTo: '#4F46E5' },
  DOM: { label: 'Dominio', borderColor: 'border-emerald-300', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', gradientFrom: '#10B981', gradientTo: '#059669' },
  NC: { label: 'Nombre Comercial', borderColor: 'border-violet-300', textColor: 'text-violet-700', bgLight: 'bg-violet-50', gradientFrom: '#8B5CF6', gradientTo: '#7C3AED' },
  OPO: { label: 'Oposición', borderColor: 'border-orange-300', textColor: 'text-orange-700', bgLight: 'bg-orange-50', gradientFrom: '#F97316', gradientTo: '#EA580C' },
  VIG: { label: 'Vigilancia', borderColor: 'border-slate-300', textColor: 'text-slate-700', bgLight: 'bg-slate-50', gradientFrom: '#64748B', gradientTo: '#475569' },
  LIT: { label: 'Litigio', borderColor: 'border-gray-300', textColor: 'text-gray-700', bgLight: 'bg-gray-50', gradientFrom: '#6B7280', gradientTo: '#4B5563' },
  trademark: { label: 'Marca', borderColor: 'border-violet-300', textColor: 'text-violet-700', bgLight: 'bg-violet-50', gradientFrom: '#8B5CF6', gradientTo: '#7C3AED' },
  patent: { label: 'Patente', borderColor: 'border-sky-300', textColor: 'text-sky-700', bgLight: 'bg-sky-50', gradientFrom: '#0EA5E9', gradientTo: '#0284C7' },
  design: { label: 'Diseño', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', bgLight: 'bg-indigo-50', gradientFrom: '#6366F1', gradientTo: '#4F46E5' },
  domain: { label: 'Dominio', borderColor: 'border-emerald-300', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', gradientFrom: '#10B981', gradientTo: '#059669' },
  copyright: { label: 'Copyright', borderColor: 'border-amber-300', textColor: 'text-amber-700', bgLight: 'bg-amber-50', gradientFrom: '#F59E0B', gradientTo: '#D97706' },
  trade_secret: { label: 'Secreto Empresarial', borderColor: 'border-slate-300', textColor: 'text-slate-700', bgLight: 'bg-slate-50', gradientFrom: '#64748B', gradientTo: '#475569' },
};

// Trademark type labels
const TRADEMARK_TYPE_LABELS: Record<string, string> = {
  nominative: 'Nominativa',
  figurative: 'Figurativa',
  mixed: 'Mixta',
  '3d': 'Tridimensional',
  color: 'De color',
  sound: 'Sonora',
  olfactory: 'Olfativa',
  motion: 'De movimiento',
  position: 'De posición',
};

// Jurisdiction flags
const JURISDICTION_FLAGS: Record<string, { flag: string; name: string }> = {
  ES: { flag: '🇪🇸', name: 'España' },
  EU: { flag: '🇪🇺', name: 'Unión Europea (EUIPO)' },
  EUIPO: { flag: '🇪🇺', name: 'EUIPO' },
  EP: { flag: '🇪🇺', name: 'EPO' },
  US: { flag: '🇺🇸', name: 'Estados Unidos' },
  WIPO: { flag: '🌐', name: 'WIPO' },
  GB: { flag: '🇬🇧', name: 'Reino Unido' },
  DE: { flag: '🇩🇪', name: 'Alemania' },
  FR: { flag: '🇫🇷', name: 'Francia' },
  CN: { flag: '🇨🇳', name: 'China' },
  JP: { flag: '🇯🇵', name: 'Japón' },
};

// Status config with enhanced colors
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; dotColor?: string }> = {
  draft: { label: 'Borrador', bgColor: 'bg-slate-50', textColor: 'text-slate-700', borderColor: 'border-slate-200' },
  pending: { label: 'Pendiente', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  filed: { label: 'Presentado', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  published: { label: 'Publicado', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  granted: { label: 'Concedido', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', dotColor: 'bg-green-500' },
  active: { label: 'Activo', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  opposed: { label: 'En oposición', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  expired: { label: 'Expirado', bgColor: 'bg-gray-50', textColor: 'text-gray-500', borderColor: 'border-gray-200' },
  abandoned: { label: 'Abandonado', bgColor: 'bg-gray-50', textColor: 'text-gray-500', borderColor: 'border-gray-200' },
  cancelled: { label: 'Cancelado', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
};

interface MatterDetailHeaderProps {
  matter: MatterV2;
  onEmailClick: () => void;
  onWhatsAppClick: () => void;
  onCallClick: () => void;
  onDeleteClick: () => void;
}

export function MatterDetailHeader({
  matter,
  onEmailClick,
  onWhatsAppClick,
  onCallClick,
  onDeleteClick,
}: MatterDetailHeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for phase panel
  const [showPhasePanel, setShowPhasePanel] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('F0');

  // Get current phase from direct matter fields (not custom_fields!)
  const currentPhase = matter.current_phase || 'F0';
  const phaseEnteredAt = matter.phase_entered_at;

  // Type and jurisdiction config
  const typeConfig = TYPE_CONFIG[matter.matter_type] || TYPE_CONFIG.trademark;
  const jurisdictionConfig = JURISDICTION_FLAGS[matter.jurisdiction_primary || 'ES'] || { flag: '🌐', name: matter.jurisdiction_primary };
  const statusConfig = STATUS_CONFIG[matter.status] || STATUS_CONFIG.active;

  // Calculate urgency
  const nextDeadline = (matter.custom_fields as any)?.next_deadline;
  const daysRemaining = nextDeadline ? differenceInDays(new Date(nextDeadline), new Date()) : null;
  const isUrgent = matter.is_urgent || (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isConfidential = (matter.custom_fields as any)?.is_confidential;

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const isStarred = (matter.custom_fields as any)?.is_starred || false;
      const { error } = await supabase
        .from('matters')
        .update({ 
          custom_fields: { 
            ...matter.custom_fields, 
            is_starred: !isStarred 
          } 
        })
        .eq('id', matter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-v2', matter.id] });
      const wasStarred = (matter.custom_fields as any)?.is_starred;
      toast.success(wasStarred ? 'Quitado de favoritos' : 'Añadido a favoritos');
    },
  });

  const isStarred = (matter.custom_fields as any)?.is_starred || false;
  const trademarkType = (matter.custom_fields as any)?.trademark_type;
  const isTrademark = matter.matter_type?.startsWith('TM') || matter.matter_type === 'trademark' || matter.matter_type === 'NC';

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-200">

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/expedientes')}
          className="text-slate-500 hover:text-slate-800 font-medium text-sm -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Expedientes
        </Button>

        {/* Quick Action Icons - Top Right */}
        <div className="flex items-center gap-1">
          {/* Edit Matter - discrete gear icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/app/expedientes/${matter.id}/editar`)}
                className="h-9 w-9 rounded-lg hover:bg-slate-100"
              >
                <Settings className="h-4.5 w-4.5 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar expediente</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite.mutate()}
                className="h-9 w-9 rounded-lg hover:bg-slate-100"
              >
                <Star className={cn("h-4 w-4", isStarred && "fill-amber-400 text-amber-400")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isStarred ? 'Quitar de favoritos' : 'Añadir a favoritos'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onCallClick} className="h-9 w-9 rounded-lg hover:bg-slate-100">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Llamar</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" /> Duplicar expediente
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" /> Compartir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" /> Archivar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDeleteClick}>
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Header Content - Enterprise Design */}
      <div className="px-6 py-6">
        <div className="flex items-start gap-6">
          
          {/* Large Avatar/Logo - Dynamic by matter type */}
          {(() => {
            const iconConfig = MATTER_TYPE_ICONS[matter.matter_type] || MATTER_TYPE_ICONS.default;
            const IconComponent = iconConfig.icon;
            
            // Determine the short type label and color for the subtle text
            const getTypeLabel = (type: string) => {
              if (type?.startsWith('TM') || type === 'trademark') return { label: 'MARCA', color: '#06b6d4' };
              if (type?.startsWith('PT') || type === 'patent') return { label: 'PATENTE', color: '#3b82f6' };
              if (type?.startsWith('DS') || type === 'design') return { label: 'DISEÑO', color: '#f59e0b' };
              if (type === 'UM' || type === 'utility_model') return { label: 'MODELO U.', color: '#8b5cf6' };
              if (type === 'NC' || type === 'trade_name') return { label: 'NOMBRE C.', color: '#14b8a6' };
              if (type === 'copyright') return { label: 'COPYRIGHT', color: '#f43f5e' };
              return { label: '', color: '#64748b' };
            };
            const typeLabel = getTypeLabel(matter.matter_type);
            
            return (
              <div className="flex flex-col items-center shrink-0">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${iconConfig.gradientFrom}, ${iconConfig.gradientTo})`,
                    border: `3px solid ${iconConfig.borderColor}`,
                    boxShadow: `0 8px 24px ${iconConfig.shadowColor}`,
                  }}
                >
                  {/* If has mark image, show it */}
                  {matter.mark_image_url ? (
                    <img 
                      src={matter.mark_image_url} 
                      alt={matter.title || 'Marca'} 
                      className="w-full h-full object-contain p-1.5 bg-white rounded-xl"
                    />
                  ) : (
                    <IconComponent className="w-8 h-8 text-white drop-shadow-md" />
                  )}
                </div>
                {/* Subtle type label below avatar */}
                {typeLabel.label && (
                  <span 
                    className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-80"
                    style={{ color: typeLabel.color }}
                  >
                    {typeLabel.label}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Main Information */}
          <div className="flex-1 min-w-0">
            {/* Reference Number */}
            <p className="font-mono text-sm text-slate-500 mb-1">
              {matter.matter_number || matter.reference}
            </p>

            {/* Main Title - Most Prominent */}
            <h1 className="text-2xl font-bold text-slate-900 mb-3 truncate">
              {matter.title || matter.mark_name || 'Sin título'}
            </h1>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Type Badge */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                "bg-cyan-50 border-cyan-200 text-cyan-700"
              )}>
                {typeConfig.label}
              </span>

              {/* Trademark Type Badge - Only for trademarks */}
              {isTrademark && trademarkType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 border-blue-200 text-blue-700">
                  {TRADEMARK_TYPE_LABELS[trademarkType] || trademarkType}
                </span>
              )}

              {/* Status Badge with animated dot */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                statusConfig.bgColor, statusConfig.borderColor, statusConfig.textColor
              )}>
                {statusConfig.dotColor && (
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusConfig.dotColor)} />
                )}
                {statusConfig.label}
              </span>

              {/* Urgent Badge */}
              {isUrgent && !isOverdue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {daysRemaining === 0 ? 'Vence hoy' : `${daysRemaining}d restantes`}
                </span>
              )}

              {/* Overdue Badge */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-red-50 border-red-200 text-red-700 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Vencido
                </span>
              )}

              {/* Confidential Badge */}
              {isConfidential && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700">
                  🔒 Confidencial
                </span>
              )}
            </div>

            {/* Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              {/* Client - Clickable */}
              {matter.client_id ? (
                <Link 
                  to={`/app/clientes/${matter.client_id}`}
                  className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors group"
                >
                  <User className="h-4 w-4 text-slate-400 group-hover:text-cyan-500" />
                  <span className="group-hover:underline">{matter.client_name || 'Sin cliente'}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  {matter.client_name || 'Sin cliente'}
                </span>
              )}

              {/* Jurisdiction with Flag */}
              <span className="flex items-center gap-1.5">
                <span className="text-base">{jurisdictionConfig.flag}</span>
                {jurisdictionConfig.name}
              </span>

              {/* Creation Date */}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {format(new Date(matter.created_at), 'd MMM yyyy', { locale: es })}
              </span>

              {/* Internal Reference if exists */}
              {matter.reference && matter.reference !== matter.matter_number && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-slate-400" />
                  {matter.reference}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* REMOVED: Email/WhatsApp/Document/Edit buttons - now accessed via Communications tab */}
        {/* Edit action moved to top-right gear icon */}
      </div>

      {/* =============================================== */}
      {/* WORKFLOW CARDS - New L122 Design */}
      {/* =============================================== */}
      <div className="px-6 pb-4">
        <WorkflowCards
          currentPhase={currentPhase}
          expedienteId={matter.id}
          matterReference={matter.matter_number || matter.reference || ''}
          phaseEnteredAt={phaseEnteredAt}
          typeColor={typeConfig.textColor}
          onPhaseClick={(phase) => {
            setSelectedPhase(phase);
            setShowPhasePanel(true);
          }}
        />
      </div>

      {/* =============================================== */}
      {/* PHASE PANEL MODAL */}
      {/* =============================================== */}
      <PhasePanelContainer
        open={showPhasePanel}
        onOpenChange={setShowPhasePanel}
        matterId={matter.id}
        matterReference={matter.matter_number || matter.reference || ''}
        matterTitle={matter.title || matter.mark_name || 'Sin título'}
        currentPhase={selectedPhase}
        clientId={matter.client_id}
        clientName={matter.client_name}
        clientEmail={matter.client_email}
        clientPhone={matter.client_phone}
        onAdvancePhase={() => {
          // Close panel after advance
          setShowPhasePanel(false);
        }}
        onGoBack={() => {
          // Could navigate to previous phase or close
          setShowPhasePanel(false);
        }}
      />
    </div>
  );
}
