// ============================================================
// IP-NEXUS - Matter Detail Page (Matters V2)
// ============================================================

import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, MoreHorizontal, Trash2, Archive,
  Tag, Clock, Building2, User, FileText, Users, History
} from 'lucide-react';
import { useMatterV2, useMatterFilings, useMatterTimeline, useMatterParties, useMatterTypes } from '@/hooks/use-matters-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageTitle } from '@/contexts/page-context';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  filed: { label: 'Presentado', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publicado', color: 'bg-purple-100 text-purple-700' },
  granted: { label: 'Concedido', color: 'bg-green-100 text-green-700' },
  active: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700' },
  opposed: { label: 'En oposición', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-500' },
  abandoned: { label: 'Abandonado', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: matter, isLoading, error } = useMatterV2(id!);
  const { data: filings } = useMatterFilings(id!);
  const { data: timeline } = useMatterTimeline(id!);
  const { data: parties } = useMatterParties(id!);
  const { data: matterTypes } = useMatterTypes();
  
  usePageTitle(matter?.matter_number || 'Expediente');
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (error || !matter) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error al cargar el expediente</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/app/expedientes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const typeConfig = matterTypes?.find(t => t.code === matter.matter_type) || {
    name_es: matter.matter_type,
    color: '#6B7280',
    icon: 'File'
  };
  const statusConfig = STATUS_CONFIG[matter.status] || STATUS_CONFIG.draft;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/expedientes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{matter.matter_number}</h1>
              <Badge 
                variant="outline"
                style={{ 
                  backgroundColor: `${typeConfig.color}20`,
                  color: typeConfig.color,
                  borderColor: `${typeConfig.color}40`
                }}
              >
                {typeConfig.name_es}
              </Badge>
              <Badge className={statusConfig.color} variant="secondary">
                {statusConfig.label}
              </Badge>
              {matter.is_urgent && (
                <Badge variant="destructive">Urgente</Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground mt-1">{matter.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/app/expedientes/${id}/editar`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archivar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <FileText className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="filings" className="gap-2">
            <Building2 className="h-4 w-4" />
            Presentaciones ({filings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="parties" className="gap-2">
            <Users className="h-4 w-4" />
            Partes ({parties?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <History className="h-4 w-4" />
            Timeline ({timeline?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Información del Derecho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matter.mark_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marca</label>
                    <p className="text-lg font-semibold">{matter.mark_name}</p>
                  </div>
                )}
                {matter.invention_title && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título de invención</label>
                    <p className="text-lg">{matter.invention_title}</p>
                  </div>
                )}
                {matter.nice_classes && matter.nice_classes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Clases Nice</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {matter.nice_classes.map(c => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {matter.goods_services && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Productos/Servicios</label>
                    <p className="text-sm mt-1">{matter.goods_services}</p>
                  </div>
                )}
                {matter.internal_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notas internas</label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{matter.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    Fechas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creado</span>
                    <span>{format(new Date(matter.created_at), 'dd/MM/yyyy')}</span>
                  </div>
                  {matter.instruction_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instrucción</span>
                      <span>{format(new Date(matter.instruction_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {matter.priority_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridad</span>
                      <span>{format(new Date(matter.priority_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Costs */}
              {(matter.estimated_official_fees || matter.estimated_professional_fees) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Costes estimados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {matter.estimated_official_fees && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tasas oficiales</span>
                        <span>{matter.estimated_official_fees.toLocaleString('es-ES')} {matter.currency}</span>
                      </div>
                    )}
                    {matter.estimated_professional_fees && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Honorarios</span>
                        <span>{matter.estimated_professional_fees.toLocaleString('es-ES')} {matter.currency}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Tags */}
              {matter.tags && matter.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Etiquetas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matter.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Filings Tab */}
        <TabsContent value="filings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Presentaciones por Jurisdicción</CardTitle>
              <Button size="sm">
                Añadir presentación
              </Button>
            </CardHeader>
            <CardContent>
              {!filings?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay presentaciones registradas
                </p>
              ) : (
                <div className="space-y-4">
                  {filings.map(filing => (
                    <div key={filing.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {filing.jurisdiction_code}
                          </Badge>
                          <Badge className={STATUS_CONFIG[filing.status]?.color || 'bg-gray-100'}>
                            {STATUS_CONFIG[filing.status]?.label || filing.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {filing.application_number && (
                          <div>
                            <span className="text-muted-foreground">Nº Solicitud</span>
                            <p className="font-medium">{filing.application_number}</p>
                          </div>
                        )}
                        {filing.registration_number && (
                          <div>
                            <span className="text-muted-foreground">Nº Registro</span>
                            <p className="font-medium">{filing.registration_number}</p>
                          </div>
                        )}
                        {filing.filing_date && (
                          <div>
                            <span className="text-muted-foreground">Fecha presentación</span>
                            <p>{format(new Date(filing.filing_date), 'dd/MM/yyyy')}</p>
                          </div>
                        )}
                        {filing.expiry_date && (
                          <div>
                            <span className="text-muted-foreground">Vencimiento</span>
                            <p>{format(new Date(filing.expiry_date), 'dd/MM/yyyy')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Parties Tab */}
        <TabsContent value="parties">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Partes del Expediente</CardTitle>
              <Button size="sm">
                Añadir parte
              </Button>
            </CardHeader>
            <CardContent>
              {!parties?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay partes registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {parties.map(party => (
                    <div key={party.id} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{party.name}</p>
                          <p className="text-sm text-muted-foreground">{party.company}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{party.party_role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              {!timeline?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin actividad registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-border flex-1" />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.title}</p>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(event.event_date), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
