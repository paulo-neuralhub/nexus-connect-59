/**
 * CommSettingsPage — Tenant communication settings (COMM-01)
 * 4 tabs: Email, WhatsApp, Templates, Usage
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, MessageCircle, FileText, BarChart3,
  Check, AlertCircle, Send, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useCommConfig } from '@/hooks/communications';
import { toast } from 'sonner';
import type { CommTenantConfig, CommTemplate } from '@/types/communications';

export function CommSettingsPage() {
  const { organizationId } = useOrganization();
  const qc = useQueryClient();
  const { data: config, isLoading } = useCommConfig();
  const [activeTab, setActiveTab] = useState('email');

  // Templates
  const { data: templates = [] } = useQuery<CommTemplate[]>({
    queryKey: ['comm-templates', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await fromTable('comm_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Save config
  const saveConfig = useMutation({
    mutationFn: async (updates: Partial<CommTenantConfig>) => {
      if (!organizationId) throw new Error('No org');
      const { error } = await fromTable('comm_tenant_config')
        .upsert({
          organization_id: organizationId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración guardada');
      qc.invalidateQueries({ queryKey: ['comm-config'] });
    },
    onError: (e: Error) => toast.error('Error: ' + e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const emailPct = config ? (config.current_month_emails / config.max_email_per_month) * 100 : 0;
  const waPct = config ? (config.current_month_whatsapp / config.max_whatsapp_per_month) * 100 : 0;
  const smsPct = config ? (config.current_month_sms / config.max_sms_per_month) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Configuración de Comunicaciones</h2>
        <p className="text-sm text-muted-foreground">Canales, templates y límites del módulo COMM-01</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1.5" />Email</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="h-4 w-4 mr-1.5" />Uso</TabsTrigger>
        </TabsList>

        {/* ── Email ──────────────────────────── */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración Email</CardTitle>
              <CardDescription>Proveedor, dominio de envío y firma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Proveedor</Label>
                  <Select defaultValue={config?.email_provider || 'resend'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="smtp_custom">SMTP propio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dominio de envío</Label>
                  <div className="flex items-center gap-2">
                    <Input defaultValue={config?.sending_domain || ''} placeholder="mail.tuempresa.com" className="flex-1" />
                    {config?.domain_verified ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">
                        <Check className="h-3 w-3 mr-0.5" /> Verificado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 text-[10px]">
                        <AlertCircle className="h-3 w-3 mr-0.5" /> Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre remitente</Label>
                  <Input defaultValue={config?.email_from_name || ''} placeholder="IP-NEXUS" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email remitente</Label>
                  <Input defaultValue={config?.email_from_address || ''} placeholder="noreply@tuempresa.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Firma del despacho (HTML)</Label>
                <Textarea
                  defaultValue={config?.email_signature_html || ''}
                  placeholder="<p>Saludos cordiales,<br/>El Equipo</p>"
                  className="min-h-[100px] font-mono text-xs"
                />
              </div>
              <Button size="sm">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Enviar email de prueba
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WhatsApp ───────────────────────── */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración WhatsApp</CardTitle>
              <CardDescription>Twilio WhatsApp Business API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>WhatsApp habilitado</Label>
                <Switch checked={config?.whatsapp_enabled || false} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number ID</Label>
                <Input defaultValue={config?.whatsapp_phone_number_id || ''} placeholder="Phone Number ID de Twilio" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre de pantalla</Label>
                <Input defaultValue={config?.whatsapp_display_name || ''} placeholder="Tu Despacho IP" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL Webhook (auto-generada)</Label>
                <Input
                  readOnly
                  value={`https://uaqniahteuzhetuyzvak.supabase.co/functions/v1/comm-whatsapp-inbound`}
                  className="bg-muted text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-3 w-3 rounded-full',
                  config?.whatsapp_enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
                )} />
                <span className="text-sm text-muted-foreground">
                  {config?.whatsapp_enabled ? 'Conexión activa' : 'No configurado'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Templates ──────────────────────── */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantillas de comunicación</CardTitle>
              <CardDescription>{templates.length} plantilla(s) configurada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  Sin plantillas. Crea tu primera plantilla para agilizar comunicaciones.
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-4">
                            {t.channel === 'email' ? '✉️ Email' : t.channel === 'whatsapp' ? '💬 WA' : '📱 SMS'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{t.category}</Badge>
                          {t.is_system_default && (
                            <Badge variant="secondary" className="text-[10px] h-4">Sistema</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {t.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Usage ──────────────────────────── */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso del mes actual</CardTitle>
              <CardDescription>Límites según plan {config?.plan_code || 'comm_basic'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <UsageBar
                label="✉️ Emails"
                current={config?.current_month_emails || 0}
                max={config?.max_email_per_month || 1000}
                pct={emailPct}
              />
              <UsageBar
                label="💬 WhatsApp"
                current={config?.current_month_whatsapp || 0}
                max={config?.max_whatsapp_per_month || 500}
                pct={waPct}
              />
              <UsageBar
                label="📱 SMS"
                current={config?.current_month_sms || 0}
                max={config?.max_sms_per_month || 200}
                pct={smsPct}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsageBar({ label, current, max, pct }: { label: string; current: number; max: number; pct: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <Progress value={Math.min(pct, 100)} className="h-2" />
      {pct >= 80 && (
        <p className="text-[11px] text-amber-600">
          ⚠️ Cerca del límite ({Math.round(pct)}%)
        </p>
      )}
    </div>
  );
}
