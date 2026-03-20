/**
 * WizardDatesStep - Step 4: Dates, status, and auto-deadline toggle
 */

import { Calendar, Clock, ToggleLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MATTER_STATUSES } from '@/lib/constants/matters';

export interface WizardDatesData {
  application_number: string;
  filing_date: string;
  priority_claimed: boolean;
  priority_date: string;
  priority_number: string;
  priority_country: string;
  status: string;
  registration_number: string;
  registration_date: string;
  expiry_date: string;
  auto_deadlines: boolean;
}

interface WizardDatesStepProps {
  data: WizardDatesData;
  onChange: (updates: Partial<WizardDatesData>) => void;
  matterType: string;
}

export function WizardDatesStep({ data, onChange, matterType }: WizardDatesStepProps) {
  const showRegistrationFields = ['registered', 'granted', 'active', 'renewal', 'published'].includes(data.status);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Fechas y estado</h2>
        <p className="text-sm text-muted-foreground">
          Configura las fechas clave y el estado actual del expediente
        </p>
      </div>

      {/* Filing info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Datos de solicitud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número de solicitud</Label>
              <Input
                value={data.application_number}
                onChange={(e) => onChange({ application_number: e.target.value })}
                placeholder="Ej: 018123456"
              />
            </div>
            <div>
              <Label>Fecha de solicitud</Label>
              <Input
                type="date"
                value={data.filing_date}
                onChange={(e) => onChange({ filing_date: e.target.value })}
              />
            </div>
          </div>

          {/* Priority claim */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              checked={data.priority_claimed}
              onCheckedChange={(v) => onChange({ priority_claimed: !!v })}
            />
            <Label className="cursor-pointer" onClick={() => onChange({ priority_claimed: !data.priority_claimed })}>
              Reclamo de prioridad
            </Label>
          </div>

          {data.priority_claimed && (
            <div className="grid grid-cols-3 gap-3 pl-6 border-l-2 border-blue-200">
              <div>
                <Label>Fecha de prioridad</Label>
                <Input
                  type="date"
                  value={data.priority_date}
                  onChange={(e) => onChange({ priority_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Número de prioridad</Label>
                <Input
                  value={data.priority_number}
                  onChange={(e) => onChange({ priority_number: e.target.value })}
                  placeholder="Nº solicitud prioritaria"
                />
              </div>
              <div>
                <Label>País de prioridad</Label>
                <Input
                  value={data.priority_country}
                  onChange={(e) => onChange({ priority_country: e.target.value })}
                  placeholder="ES, EU, US..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            Estado actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Estado del expediente</Label>
            <Select value={data.status} onValueChange={(v) => onChange({ status: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MATTER_STATUSES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                      {val.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showRegistrationFields && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div>
                <Label>Número de registro</Label>
                <Input
                  value={data.registration_number}
                  onChange={(e) => onChange({ registration_number: e.target.value })}
                  placeholder="Nº registro"
                />
              </div>
              <div>
                <Label>Fecha de registro</Label>
                <Input
                  type="date"
                  value={data.registration_date}
                  onChange={(e) => onChange({ registration_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha de expiración</Label>
                <Input
                  type="date"
                  value={data.expiry_date}
                  onChange={(e) => onChange({ expiry_date: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto deadlines */}
      <Card className="border-slate-200 bg-blue-50/30">
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-sm">Plazos automáticos</h4>
              <p className="text-xs text-slate-500 mt-1">
                Basándonos en la jurisdicción y fecha de solicitud, calcularemos automáticamente los plazos estándar al crear el expediente.
              </p>
            </div>
            <Switch
              checked={data.auto_deadlines}
              onCheckedChange={(v) => onChange({ auto_deadlines: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
