/**
 * DeadlineDataModal — Modal for manual input when jurisdiction data is incomplete
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { ClipboardList, CheckCircle2, AlertTriangle, Info, Bot } from 'lucide-react';

interface MissingField {
  field: string;
  label: string;
  type: string;
  suggestion: string | number | null;
  help?: string;
}

interface GeniusSuggestion {
  source: string;
  message: string;
  documents?: { id: string; name: string }[];
  references?: { title: string; confidence: string; excerpt: string }[];
}

interface DeadlineDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officeCode: string;
  officeName: string;
  officeId: string | null;
  countryCode: string | null;
  missingFields: MissingField[];
  availableData: Record<string, any>;
  geniusSuggestions: GeniusSuggestion[];
  matterId: string;
  organizationId: string;
  onComplete: () => void;
}

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Istanbul', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'America/Mexico_City', 'America/Buenos_Aires',
  'America/Bogota', 'America/Santiago', 'America/Lima', 'America/Toronto',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Singapore',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Jakarta',
  'Asia/Riyadh', 'Asia/Jerusalem', 'Asia/Manila',
  'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Lagos', 'Africa/Nairobi',
  'Indian/Comoro', 'Indian/Antananarivo',
  'Australia/Sydney', 'Pacific/Auckland',
];

export function DeadlineDataModal({
  open,
  onOpenChange,
  officeCode,
  officeName,
  officeId,
  countryCode,
  missingFields,
  availableData,
  geniusSuggestions,
  matterId,
  organizationId,
  onComplete,
}: DeadlineDataModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    missingFields.forEach((f) => {
      initial[f.field] = f.suggestion ?? '';
    });
    return initial;
  });
  const [source, setSource] = useState('website');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build update for ipo_offices
      const update: Record<string, any> = {
        data_quality_flag: 'user_contributed',
        data_quality_notes: `Aportado por ${user?.email || 'usuario'} vía IP-NEXUS el ${new Date().toISOString()}. Fuente: ${source}. URL: ${verificationUrl || 'no proporcionada'}`,
        data_last_verified_at: new Date().toISOString(),
        data_last_verified_by: user?.email || null,
      };

      missingFields.forEach((f) => {
        const val = formData[f.field];
        if (val !== '' && val !== null && val !== undefined) {
          update[f.field] = f.type === 'number' ? Number(val) : val;
        }
      });

      if (officeId) {
        const client: any = supabase;
        await client.from('ipo_offices').update(update).eq('id', officeId);
      }

      // Audit log
      const client: any = supabase;
      await client.from('data_audit_log').insert({
        organization_id: organizationId,
        table_name: 'ipo_offices',
        record_id: officeId,
        action: 'user_data_contribution',
        new_values: formData,
        performed_by: user?.id || null,
        notes: `Datos aportados desde modal de plazos. Fuente: ${source}`,
      }).catch(() => {/* non-critical */});

      // Re-invoke deadline generation
      const { data: result } = await supabase.functions.invoke(
        'generate-matter-deadlines',
        { body: { matter_id: matterId, event_type: 'created' } }
      );

      if (result?.success) {
        toast.success(
          `✅ Datos guardados. ${result.deadlines_created} plazos y ${result.calendar_events_created} recordatorios generados.`
        );
      } else {
        toast.success('✅ Datos guardados en el directorio.');
      }

      onOpenChange(false);
      onComplete();
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    toast.info('Puedes generar los plazos manualmente más adelante.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">
              Datos requeridos — {officeName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs font-mono">
              {officeCode}
            </Badge>
            {countryCode && (
              <span className="text-xs text-muted-foreground">
                {countryCode}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Para calcular los plazos automáticamente necesitamos los siguientes
            datos de esta jurisdicción.
          </p>

          {/* Available data */}
          {Object.keys(availableData).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Datos verificados ✅
              </h4>
              {Object.entries(availableData).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="capitalize text-muted-foreground">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Missing fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Datos necesarios
            </h4>

            {missingFields.map((field) => (
              <div key={field.field} className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {field.label} <span className="text-destructive">*</span>
                </Label>

                {field.type === 'timezone_select' ? (
                  <Select
                    value={String(formData[field.field] || '')}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, [field.field]: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    value={formData[field.field] ?? ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        [field.field]: e.target.value,
                      }))
                    }
                    min={0}
                  />
                )}

                {field.help && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    💡 {field.help}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Genius suggestions */}
          {geniusSuggestions.length > 0 && (
            <div className="space-y-2">
              {geniusSuggestions.map((sug, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Bot className="h-3.5 w-3.5" />
                    IP-GENIUS
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sug.message}
                  </p>
                  {sug.references?.map((ref, j) => (
                    <div key={j} className="text-xs mt-1">
                      <span className="font-medium">{ref.title}</span>
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {ref.confidence}
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Source */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Fuente de estos datos <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={source} onValueChange={setSource}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="official_document" id="src-doc" />
                <Label htmlFor="src-doc" className="text-sm font-normal cursor-pointer">
                  Documento oficial adjunto
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="website" id="src-web" />
                <Label htmlFor="src-web" className="text-sm font-normal cursor-pointer">
                  Sitio web oficial de la oficina
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="professional" id="src-pro" />
                <Label htmlFor="src-pro" className="text-sm font-normal cursor-pointer">
                  Conocimiento profesional propio
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Verification URL */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              URL verificación (opcional)
            </Label>
            <Input
              type="url"
              placeholder="https://..."
              value={verificationUrl}
              onChange={(e) => setVerificationUrl(e.target.value)}
            />
          </div>

          {/* Community note */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Estos datos enriquecerán el Directorio Mundial IP-NEXUS y
              beneficiarán a toda la comunidad.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Omitir — crear plazos después
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar y continuar →'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
