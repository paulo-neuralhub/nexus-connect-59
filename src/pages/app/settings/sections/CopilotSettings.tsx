import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Compass, Sparkles, Save, Loader2 } from 'lucide-react';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1/+2' },
  { value: 'Europe/London', label: 'London', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+1/+2' },
  { value: 'Europe/Lisbon', label: 'Lisbon', offset: 'UTC+0/+1' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC+1/+2' },
  { value: 'America/New_York', label: 'New York', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Chicago', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Denver', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'UTC-8/-7' },
  { value: 'America/Mexico_City', label: 'México DF', offset: 'UTC-6' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'Kolkata', offset: 'UTC+5:30' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10/+11' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 'UTC+12/+13' },
];

const BRIEFING_HOURS = [
  { value: '6', label: '06:00' },
  { value: '7', label: '07:00' },
  { value: '8', label: '08:00' },
  { value: '9', label: '09:00' },
  { value: '10', label: '10:00' },
  { value: '11', label: '11:00' },
];

interface OrgConfig {
  copilot_mode: string;
  copilot_name: string;
  briefing_enabled: boolean;
  briefing_hour: number;
  timezone: string;
  guide_mode_enabled: boolean;
  proactive_enabled: boolean;
}

interface UserPrefs {
  copilot_visible: boolean;
  copilot_size: string;
  preferred_response_length: string;
}

export default function CopilotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgConfig, setOrgConfig] = useState<OrgConfig>({
    copilot_mode: 'basic',
    copilot_name: 'CoPilot Nexus',
    briefing_enabled: true,
    briefing_hour: 8,
    timezone: 'Europe/Madrid',
    guide_mode_enabled: true,
    proactive_enabled: false,
  });
  const [userPrefs, setUserPrefs] = useState<UserPrefs>({
    copilot_visible: true,
    copilot_size: 'bubble',
    preferred_response_length: 'normal',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await fromTable('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile?.organization_id) return;

      const { data: gtc } = await fromTable('genius_tenant_config')
        .select('copilot_mode, copilot_name, briefing_enabled, briefing_hour, timezone, guide_mode_enabled, proactive_enabled')
        .eq('organization_id', profile.organization_id)
        .single();

      if (gtc) {
        setOrgConfig({
          copilot_mode: gtc.copilot_mode || 'basic',
          copilot_name: gtc.copilot_name || 'CoPilot Nexus',
          briefing_enabled: gtc.briefing_enabled ?? true,
          briefing_hour: gtc.briefing_hour ?? 8,
          timezone: gtc.timezone || 'Europe/Madrid',
          guide_mode_enabled: gtc.guide_mode_enabled ?? true,
          proactive_enabled: gtc.proactive_enabled ?? false,
        });
      }

      const { data: prefs } = await fromTable('copilot_user_preferences')
        .select('copilot_visible, copilot_size, preferred_response_length')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (prefs) {
        setUserPrefs({
          copilot_visible: prefs.copilot_visible ?? true,
          copilot_size: prefs.copilot_size || 'bubble',
          preferred_response_length: prefs.preferred_response_length || 'normal',
        });
      }
    } catch (err) {
      console.error('Error loading copilot config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveOrgConfig() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await fromTable('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile?.organization_id) return;

      await fromTable('genius_tenant_config')
        .update({
          copilot_name: orgConfig.copilot_name,
          briefing_enabled: orgConfig.briefing_enabled,
          briefing_hour: orgConfig.briefing_hour,
          timezone: orgConfig.timezone,
          guide_mode_enabled: orgConfig.guide_mode_enabled,
          proactive_enabled: orgConfig.proactive_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', profile.organization_id);

      // Also update org timezone
      await fromTable('organizations')
        .update({ timezone: orgConfig.timezone })
        .eq('id', profile.organization_id);

      toast.success('Configuración del CoPilot guardada');
    } catch (err) {
      console.error('Error saving copilot config:', err);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  async function saveUserPrefs() {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      await supabase.functions.invoke('genius-user-prefs', {
        body: {
          copilot_visible: userPrefs.copilot_visible,
          copilot_size: userPrefs.copilot_size,
          preferred_response_length: userPrefs.preferred_response_length,
        },
      });

      toast.success('Preferencias personales guardadas');
    } catch (err) {
      console.error('Error saving user prefs:', err);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPro = orgConfig.copilot_mode === 'pro';
  const selectedTz = TIMEZONES.find(t => t.value === orgConfig.timezone);

  return (
    <div className="space-y-6">
      {/* Organization Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPro ? (
              <Sparkles className="h-5 w-5 text-amber-500" />
            ) : (
              <Compass className="h-5 w-5 text-slate-700" />
            )}
            Configuración del CoPilot
          </CardTitle>
          <CardDescription>Configura el asistente inteligente de tu despacho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode badge */}
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Modo actual</Label>
            {isPro ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                ⭐ IP-Genius CoPilot PRO
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                🔵 CoPilot Nexus BASIC
              </Badge>
            )}
            {!isPro && (
              <a href="/app/settings/subscription" className="text-xs text-primary hover:underline">
                Actualizar a Pro →
              </a>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="copilot-name">Nombre del asistente</Label>
            <Input
              id="copilot-name"
              value={orgConfig.copilot_name}
              onChange={(e) => setOrgConfig(p => ({ ...p, copilot_name: e.target.value }))}
              placeholder={isPro ? 'IP-Genius CoPilot' : 'CoPilot Nexus'}
            />
            <p className="text-xs text-muted-foreground">Este nombre lo ve todo tu equipo</p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Zona horaria del despacho</Label>
            <Select
              value={orgConfig.timezone}
              onValueChange={(v) => setOrgConfig(p => ({ ...p, timezone: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Briefing */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Briefing matutino</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Resumen diario de alertas y plazos
                </p>
              </div>
              <Switch
                checked={orgConfig.briefing_enabled}
                onCheckedChange={(v) => setOrgConfig(p => ({ ...p, briefing_enabled: v }))}
              />
            </div>

            {orgConfig.briefing_enabled && (
              <div className="space-y-2 pl-0">
                <Label>Hora del briefing</Label>
                <Select
                  value={String(orgConfig.briefing_hour)}
                  onValueChange={(v) => setOrgConfig(p => ({ ...p, briefing_hour: parseInt(v) }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRIEFING_HOURS.map(h => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Recibirás el briefing a las {BRIEFING_HOURS.find(h => h.value === String(orgConfig.briefing_hour))?.label || '08:00'} ({selectedTz?.label || orgConfig.timezone})
                </p>
              </div>
            )}
          </div>

          {/* Guides */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Guías paso a paso</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guías interactivas para nuevos usuarios
              </p>
            </div>
            <Switch
              checked={orgConfig.guide_mode_enabled}
              onCheckedChange={(v) => setOrgConfig(p => ({ ...p, guide_mode_enabled: v }))}
            />
          </div>

          {/* Pro-only features */}
          {isPro && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Análisis proactivo de cartera</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El CoPilot analiza tu portfolio y sugiere acciones
                </p>
              </div>
              <Switch
                checked={orgConfig.proactive_enabled}
                onCheckedChange={(v) => setOrgConfig(p => ({ ...p, proactive_enabled: v }))}
              />
            </div>
          )}

          <Button onClick={saveOrgConfig} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar configuración
          </Button>
        </CardContent>
      </Card>

      {/* Personal Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis preferencias personales</CardTitle>
          <CardDescription>Ajustes que solo aplican a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mostrar CoPilot</Label>
            <Switch
              checked={userPrefs.copilot_visible}
              onCheckedChange={(v) => setUserPrefs(p => ({ ...p, copilot_visible: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tamaño por defecto</Label>
            <Select
              value={userPrefs.copilot_size}
              onValueChange={(v) => setUserPrefs(p => ({ ...p, copilot_size: v }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bubble">Burbuja</SelectItem>
                <SelectItem value="compact">Compacto</SelectItem>
                <SelectItem value="expanded">Expandido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Longitud de respuestas</Label>
            <Select
              value={userPrefs.preferred_response_length}
              onValueChange={(v) => setUserPrefs(p => ({ ...p, preferred_response_length: v }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concisa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="detailed">Detallada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={saveUserPrefs} disabled={saving} variant="outline" className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar preferencias
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
