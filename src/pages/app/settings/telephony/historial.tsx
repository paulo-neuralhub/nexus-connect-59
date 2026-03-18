// ============================================================
// IP-NEXUS APP - Tenant Telephony History Page
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  ShoppingCart,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Play,
  Download,
  Filter,
  Calendar,
  User,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTelephonyUsageLogs, useTenantTelephonyPurchases } from '@/hooks/useTenantTelephony';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return 'Desconocido';
  return phone;
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

export default function TelephonyHistoryPage() {
  const [period, setPeriod] = useState('month');
  const [userFilter, setUserFilter] = useState('all');
  const [tab, setTab] = useState('calls');

  const { data: usageLogs = [], isLoading: isLoadingLogs } = useTelephonyUsageLogs(100);
  const { data: purchases = [], isLoading: isLoadingPurchases } = useTenantTelephonyPurchases();

  const callLogs = usageLogs.filter(l => l.usage_type === 'call');
  const smsLogs = usageLogs.filter(l => l.usage_type === 'sms');

  // Group by date
  const groupLogsByDate = (logs: typeof usageLogs) => {
    return logs.reduce((acc, log) => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {} as Record<string, typeof usageLogs>);
  };

  const groupedCalls = groupLogsByDate(callLogs);
  const groupedSMS = groupLogsByDate(smsLogs);

  const getCallIcon = (log: typeof usageLogs[0]) => {
    if (log.status === 'failed' || log.status === 'no-answer') {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    // Use from_number to infer direction - if from_number matches tenant's caller ID, it's outbound
    return <PhoneOutgoing className="h-4 w-4 text-primary" />;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-success border-success">Completada</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallida</Badge>;
      case 'no-answer':
        return <Badge variant="secondary">Sin respuesta</Badge>;
      case 'busy':
        return <Badge variant="secondary">Ocupado</Badge>;
      default:
        return null;
    }
  };

  const getPurchaseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success">Activo</Badge>;
      case 'exhausted':
        return <Badge variant="secondary">Agotado</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/settings/telephony">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Historial de Telefonía</h1>
          <p className="text-muted-foreground">Consulta tu actividad y compras</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="calls" className="gap-2">
              <Phone className="h-4 w-4" />
              Llamadas
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Compras
            </TabsTrigger>
          </TabsList>

          {tab !== 'purchases' && (
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[160px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Calls Tab */}
        <TabsContent value="calls" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoadingLogs ? (
                <div className="animate-pulse space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              ) : callLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay llamadas en este período</p>
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedCalls).map(([date, calls]) => (
                    <div key={date}>
                      <div className="px-6 py-3 bg-muted/30">
                        <p className="text-sm font-medium text-muted-foreground">
                          {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="divide-y">
                        {calls.map(call => (
                          <div key={call.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getCallIcon(call)}
                                <div>
                                  <p className="font-medium text-foreground">
                                    {formatPhoneDisplay(call.to_number)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {call.from_number && `Desde ${formatPhoneDisplay(call.from_number)}`}
                                  </p>
                                  {call.country_code && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {call.country_code}
                                      {call.minutes_deducted && call.minutes_deducted > (call.duration_minutes || 0) && (
                                        <span className="ml-2 text-warning">
                                          <Zap className="h-3 w-3 inline mr-1" />
                                          -{call.minutes_deducted} min (tarifa internacional)
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-medium text-foreground">
                                  {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(call.created_at), 'HH:mm')}
                                </p>
                                {getStatusBadge(call.status)}
                              </div>
                            </div>
                            {call.recording_url && (
                              <div className="mt-3 flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <Play className="h-3 w-3 mr-1" />
                                  Reproducir grabación
                                </Button>
                                {call.recording_duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDuration(call.recording_duration)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoadingLogs ? (
                <div className="animate-pulse space-y-4 p-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted rounded" />
                  ))}
                </div>
              ) : smsLogs.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay SMS en este período</p>
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedSMS).map(([date, messages]) => (
                    <div key={date}>
                      <div className="px-6 py-3 bg-muted/30">
                        <p className="text-sm font-medium text-muted-foreground">
                          {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="divide-y">
                        {messages.map(sms => (
                          <div key={sms.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MessageSquare className="h-4 w-4 text-info" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {formatPhoneDisplay(sms.to_number)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {sms.country_code}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(sms.created_at), 'HH:mm')}
                                </p>
                                {getStatusBadge(sms.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de compras</CardTitle>
              <CardDescription>
                Todos los packs de minutos que has adquirido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPurchases ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No has realizado ninguna compra</p>
                  <Button asChild className="mt-4">
                    <Link to="/app/settings/telephony/packs">
                      Comprar minutos
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map(purchase => (
                    <div 
                      key={purchase.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {purchase.minutes_purchased} minutos
                            {purchase.sms_purchased > 0 && ` + ${purchase.sms_purchased} SMS`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(purchase.purchased_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                          {purchase.minutes_remaining !== null && (
                            <p className="text-xs text-muted-foreground">
                              Restantes: {purchase.minutes_remaining} min
                              {purchase.expires_at && (
                                <> · Expira: {format(new Date(purchase.expires_at), 'dd/MM/yyyy')}</>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium text-foreground">
                          {formatCurrency(purchase.price_paid, purchase.currency)}
                        </p>
                        {getPurchaseStatusBadge(purchase.status)}
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
