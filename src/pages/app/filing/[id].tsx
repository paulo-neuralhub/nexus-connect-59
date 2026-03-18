import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, FileText, Building2, User, Calendar, DollarSign,
  Clock, Send, CheckCircle, XCircle, AlertTriangle, Edit,
  Download, History, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFilingApplication, useFilingStatusHistory } from '@/hooks/filing/useFiling';
import { FILING_STATUS_CONFIG, IP_TYPES, MARK_TYPES } from '@/types/filing.types';
import { Spinner } from '@/components/ui/spinner';

export default function FilingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: application, isLoading } = useFilingApplication(id);
  const { data: history = [] } = useFilingStatusHistory(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Solicitud no encontrada</h2>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/app/filing')}
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  const statusConfig = FILING_STATUS_CONFIG[application.status] || { label: application.status, color: '' };
  const trademarkData = application.trademark_data?.[0];
  const ipTypeLabel = IP_TYPES.find(t => t.value === application.ip_type)?.label || application.ip_type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/app/filing')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{application.tracking_number}</h1>
              <Badge 
                variant="outline" 
                className={`${statusConfig.color} border-current`}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {ipTypeLabel} • 
              Creada el {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {application.status === 'draft' && (
            <Button onClick={() => navigate(`/app/filing/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="communications">Comunicaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Office Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Oficina de Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Oficina</span>
                    <span className="font-medium">
                      {application.office?.name_official || application.office?.name_short || 'No especificada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-medium">
                      {application.office?.code?.toUpperCase() || application.office_code?.toUpperCase()}
                    </span>
                  </div>
                  {application.official_filing_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nº Oficial</span>
                      <span className="font-medium">{application.official_filing_number}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="font-medium">{application.applicant_data?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium">
                      {application.applicant_data?.type === 'legal_entity' ? 'Persona Jurídica' : 'Persona Física'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">País</span>
                    <span className="font-medium">{application.applicant_data?.country || '-'}</span>
                  </div>
                  {application.representative_data?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Representante</span>
                      <span className="font-medium">{application.representative_data.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trademark Data (if applicable) */}
            {application.ip_type === 'trademark' && trademarkData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos de la Marca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre</span>
                      <span className="font-medium">
                        {trademarkData.mark_text}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium">
                        {MARK_TYPES.find(t => t.value === trademarkData.mark_type)?.label || trademarkData.mark_type}
                      </span>
                    </div>
                    {trademarkData.nice_classes?.length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm">Clases Nice:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trademarkData.nice_classes.map((cls: number) => (
                            <Badge key={cls} variant="secondary">
                              {cls}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tasas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasas Oficiales</span>
                    <span className="font-medium">
                      {application.fees_calculated?.total 
                        ? `${application.fees_calculated.total} ${application.fees_calculated.currency || 'EUR'}`
                        : 'No calculadas'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado Pago</span>
                    <Badge variant={application.fees_paid ? 'default' : 'secondary'}>
                      {application.fees_paid ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Claim */}
          {application.priority_claims && application.priority_claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Prioridad Reivindicada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground text-sm">País</span>
                    <p className="font-medium">{application.priority_claims[0]?.country}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Fecha</span>
                    <p className="font-medium">
                      {application.priority_claims[0]?.date 
                        ? format(new Date(application.priority_claims[0].date), 'dd/MM/yyyy')
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Número</span>
                    <p className="font-medium">{application.priority_claims[0]?.number || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Estados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial de cambios de estado
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry: any, index: number) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          {entry.status_from && (
                            <>
                              <Badge variant="outline">
                                {FILING_STATUS_CONFIG[entry.status_from as keyof typeof FILING_STATUS_CONFIG]?.label || entry.status_from}
                              </Badge>
                              <span>→</span>
                            </>
                          )}
                          <Badge variant="outline" className={FILING_STATUS_CONFIG[entry.status_to as keyof typeof FILING_STATUS_CONFIG]?.color}>
                            {FILING_STATUS_CONFIG[entry.status_to as keyof typeof FILING_STATUS_CONFIG]?.label || entry.status_to}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(entry.changed_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                        {entry.notes && (
                          <p className="text-sm mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Adjuntos</CardTitle>
              <CardDescription>
                Documentación presentada con la solicitud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No hay documentos adjuntos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comunicaciones
              </CardTitle>
              <CardDescription>
                Comunicaciones con la oficina de PI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No hay comunicaciones registradas
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}