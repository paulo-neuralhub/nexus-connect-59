import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { fromTable } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CurrencyDisplay {
  mode: string;
  reference_currency: string;
  show_rate_timestamp: boolean;
}

const MODES = [
  { value: 'reference_only', label: 'Solo en mi moneda de referencia' },
  { value: 'tenant_only', label: 'Solo en la moneda de mi organización' },
  { value: 'jurisdiction_only', label: 'Solo en la moneda de la jurisdicción' },
  { value: 'reference_and_jurisdiction', label: 'Referencia + jurisdicción', recommended: true },
  { value: 'all_three', label: 'Las tres: referencia + jurisdicción + organización' },
];

const DEFAULTS: CurrencyDisplay = {
  mode: 'reference_and_jurisdiction',
  reference_currency: 'USD',
  show_rate_timestamp: true,
};

export default function CurrencyPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<CurrencyDisplay>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  // Load current preferences from profile
  const { data: profilePrefs } = useQuery({
    queryKey: ['profile-currency-prefs', user?.id],
    queryFn: async () => {
      const { data, error } = await fromTable('profiles')
        .select('preferences')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return (data?.preferences as Record<string, unknown>)?.currency_display as CurrencyDisplay | undefined;
    },
    enabled: !!user?.id,
  });

  // Load available currencies
  const { data: currencies } = useQuery({
    queryKey: ['exchange-currencies-list'],
    queryFn: async () => {
      const { data, error } = await fromTable('exchange_rates')
        .select('target_currency, currency_name, symbol')
        .not('currency_name', 'is', null)
        .order('target_currency');
      if (error) throw error;
      return data as Array<{ target_currency: string; currency_name: string; symbol: string }>;
    },
  });

  useEffect(() => {
    if (profilePrefs) {
      setPrefs({
        mode: profilePrefs.mode || DEFAULTS.mode,
        reference_currency: profilePrefs.reference_currency || DEFAULTS.reference_currency,
        show_rate_timestamp: profilePrefs.show_rate_timestamp ?? DEFAULTS.show_rate_timestamp,
      });
    }
  }, [profilePrefs]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Use RPC-style raw update with jsonb_set to preserve other preferences
      const { error } = await fromTable('profiles')
        .update({
          preferences: await (async () => {
            // First read current preferences
            const { data } = await fromTable('profiles')
              .select('preferences')
              .eq('id', user.id)
              .single();
            const current = (data?.preferences as Record<string, unknown>) || {};
            return { ...current, currency_display: prefs };
          })(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Preferencias de moneda guardadas');
    } catch {
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  // Add EUR to the list since it's the base currency
  const allCurrencies = [
    { target_currency: 'EUR', currency_name: 'Euro', symbol: '€' },
    ...(currencies || []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💱 Preferencias de Moneda
        </CardTitle>
        <CardDescription>
          Configura cómo deseas ver los precios e importes en toda la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reference currency */}
        <div className="space-y-2">
          <Label>Moneda de referencia</Label>
          <Select
            value={prefs.reference_currency}
            onValueChange={(v) => setPrefs({ ...prefs, reference_currency: v })}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              {allCurrencies.map((c) => (
                <SelectItem key={c.target_currency} value={c.target_currency}>
                  {c.target_currency} — {c.currency_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Puedes elegir cualquier moneda como referencia
          </p>
        </div>

        {/* Display mode */}
        <div className="space-y-3">
          <Label>¿Cómo deseas ver los precios e importes?</Label>
          <RadioGroup
            value={prefs.mode}
            onValueChange={(v) => setPrefs({ ...prefs, mode: v })}
            className="space-y-2"
          >
            {MODES.map((m) => (
              <div key={m.value} className="flex items-center space-x-2">
                <RadioGroupItem value={m.value} id={`mode-${m.value}`} />
                <Label htmlFor={`mode-${m.value}`} className="font-normal cursor-pointer">
                  {m.label}
                  {m.recommended && (
                    <span className="ml-2 text-xs text-primary font-medium">(RECOMENDADO)</span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Timestamp checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show_rate_timestamp"
            checked={prefs.show_rate_timestamp}
            onCheckedChange={(checked) =>
              setPrefs({ ...prefs, show_rate_timestamp: checked === true })
            }
          />
          <Label htmlFor="show_rate_timestamp" className="font-normal cursor-pointer">
            Mostrar fecha y hora de la tasa de conversión
          </Label>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar preferencias'}
          </Button>
        </div>

        {/* Info footer */}
        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Los tipos de cambio se actualizan diariamente.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Tasas de referencia, no transaccionales.
          </p>
          <p className="text-xs text-muted-foreground">
            Puedes ver las tasas actuales en{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                // Navigate to exchange rates tab — settings page uses tab state
                const event = new CustomEvent('settings-navigate', { detail: { tab: 'exchange-rates' } });
                window.dispatchEvent(event);
              }}
            >
              Tipos de Cambio
            </button>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
