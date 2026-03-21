// ============================================================
// Providers Tab — CPaaS provider management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Wifi, WifiOff, Star, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Provider {
  id: string;
  name: string;
  provider_type: string;
  api_endpoint: string | null;
  is_active: boolean;
  priority: number;
  supported_features: unknown;
  created_at: string;
  updated_at: string;
}

const PROVIDER_CONFIG: Record<string, { label: string; fields: { key: string; label: string; placeholder: string }[]; color: string }> = {
  telnyx: {
    label: 'Telnyx',
    fields: [{ key: 'TELNYX_API_KEY', label: 'API Key', placeholder: 'KEY...' }],
    color: 'bg-emerald-500',
  },
  twilio: {
    label: 'Twilio',
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'AC...' },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'Token...' },
    ],
    color: 'bg-red-500',
  },
  plivo: {
    label: 'Plivo',
    fields: [
      { key: 'PLIVO_AUTH_ID', label: 'Auth ID', placeholder: 'ID...' },
      { key: 'PLIVO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'Token...' },
    ],
    color: 'bg-blue-500',
  },
};

export function ProvidersTab() {
  const queryClient = useQueryClient();
  const [configSheet, setConfigSheet] = useState<Provider | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['bo-telephony-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telephony_providers')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data || []) as Provider[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('telephony_providers').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-providers'] });
      toast.success('Proveedor actualizado');
    },
  });

  const makePrimary = useMutation({
    mutationFn: async (id: string) => {
      // Set all to priority >= 2, then set this one to 1
      await supabase.from('telephony_providers').update({ priority: 99 }).neq('id', id);
      const { error } = await supabase.from('telephony_providers').update({ priority: 1 }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-telephony-providers'] });
      toast.success('Proveedor principal cambiado');
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map(p => {
          const cfg = PROVIDER_CONFIG[p.provider_type] || { label: p.name, fields: [], color: 'bg-muted' };
          return (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${cfg.color}`} />
                    <CardTitle className="text-base">{p.name}</CardTitle>
                  </div>
                  <Badge variant={p.is_active ? 'default' : 'secondary'}>
                    {p.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <CardDescription>
                  Prioridad: P{p.priority}
                  {p.priority === 1 && (
                    <Badge variant="outline" className="ml-2 gap-1 text-xs">
                      <Star className="h-3 w-3" /> Principal
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activar</span>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: p.id, is_active: checked })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setConfigSheet(p)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configurar
                  </Button>
                  {p.priority !== 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => makePrimary.mutate(p.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Hacer principal
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs"
                  onClick={() => toast.info('Test de conectividad: Los secrets del proveedor se configuran en Supabase → Edge Functions → Secrets')}
                >
                  <Wifi className="h-3.5 w-3.5" />
                  Test conexión
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Sheet */}
      <Sheet open={!!configSheet} onOpenChange={() => setConfigSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurar {configSheet?.name}</SheetTitle>
            <SheetDescription>
              Los API keys se almacenan como Secrets en Supabase Edge Functions.
              Configúralos desde el panel de Supabase.
            </SheetDescription>
          </SheetHeader>
          {configSheet && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Secrets requeridos
                </div>
                {(PROVIDER_CONFIG[configSheet.provider_type]?.fields || []).map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <code className="block text-xs bg-background rounded px-2 py-1 border">{f.key}</code>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Para configurar los secrets:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Ve a <strong>Supabase Dashboard → Settings → Edge Functions</strong></li>
                  <li>Añade cada secret con el nombre exacto mostrado arriba</li>
                  <li>Las Edge Functions de telefonía los leerán automáticamente</li>
                </ol>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  window.open(
                    `https://supabase.com/dashboard/project/uaqniahteuzhetuyzvak/settings/functions`,
                    '_blank'
                  );
                }}
              >
                Abrir Supabase Secrets
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
