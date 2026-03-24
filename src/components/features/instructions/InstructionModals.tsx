// @ts-nocheck
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFeesForJurisdiction } from '@/hooks/use-instruction-actions';
import type { Instruction } from '@/hooks/use-instructions';

const JURISDICTION_FLAGS: Record<string, string> = {
  EU: '🇪🇺', ES: '🇪🇸', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', PT: '🇵🇹', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', CA: '🇨🇦', AR: '🇦🇷', WO: '🌍',
  EP: '🇪🇺', PCT: '🌍',
};

/* ══════════════════════════════════════════
   Conflict Check Results Modal
   ══════════════════════════════════════════ */
interface ConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matters: any[];
  alerts: any[];
}

export function ConflictResultsModal({ open, onOpenChange, matters, alerts }: ConflictModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔍 Verificación de conflictos
          </DialogTitle>
          <DialogDescription>
            Resultado del análisis de conflictos de intereses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing matters */}
          {matters.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Expedientes activos del cliente ({matters.length}):
              </h4>
              <div className="space-y-1.5">
                {matters.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{m.reference}</span>
                      <span className="text-muted-foreground truncate">{m.title}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{m.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se encontraron expedientes previos del cliente.</p>
          )}

          {/* Spider alerts */}
          {alerts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas activas: {alerts.length}
              </h4>
              <div className="space-y-1.5">
                {alerts.map((a: any) => (
                  <div key={a.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-800">
                    {a.mark_name_detected || a.title || 'Alerta de vigilancia'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conclusion */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Sin conflictos de intereses</p>
              <p className="text-xs text-green-700">Misma firma, mismo cliente — no hay conflicto.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Quote Modal
   ══════════════════════════════════════════ */
interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: Instruction;
  onConfirm: () => void;
  isLoading: boolean;
}

export function QuoteModal({ open, onOpenChange, instruction, onConfirm, isLoading }: QuoteModalProps) {
  const [notes, setNotes] = useState('');
  const items = instruction.items || [];

  const rows = items.map(item => {
    const code = (item.jurisdiction_code || '').toUpperCase();
    const fees = getFeesForJurisdiction(code);
    return { code, flag: JURISDICTION_FLAGS[code] || '🏳️', ...fees, total: fees.official + fees.professional };
  });

  const totals = rows.reduce(
    (acc, r) => ({ official: acc.official + r.official, professional: acc.professional + r.professional, total: acc.total + r.total }),
    { official: 0, professional: 0, total: 0 }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💶 Generar Presupuesto
          </DialogTitle>
          <DialogDescription>{instruction.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fees table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Jurisd.</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Tasas est.</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Honorarios</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.code} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">
                      {r.flag} {r.code}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">€{r.official.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">€{r.professional.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">€{r.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-bold">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right tabular-nums">€{totals.official.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">€{totals.professional.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">€{totals.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground">Notas adicionales</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas opcionales para el cliente..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar al cliente →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Execute Confirmation Modal
   ══════════════════════════════════════════ */
interface ExecuteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: Instruction;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ExecuteConfirmModal({ open, onOpenChange, instruction, onConfirm, isLoading }: ExecuteModalProps) {
  const items = (instruction.items || []).filter(
    it => it.status === 'pending' || it.status === 'confirmed'
  );
  const jurisdictions = items.map(it => (it.jurisdiction_code || '').toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚡ Confirmar ejecución
          </DialogTitle>
          <DialogDescription>
            Esta acción creará automáticamente expedientes y deals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">
              📁 {items.length} expedientes nuevos en IP-DOCKET
            </p>
            <p className="text-sm font-medium text-blue-900">
              📊 {items.length} deals en Pipeline
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Jurisdicciones
            </h4>
            <div className="flex gap-2 flex-wrap">
              {jurisdictions.map(jc => (
                <span key={jc} className="inline-flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm">
                  {JURISDICTION_FLAGS[jc] || '🏳️'} {jc}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            ✅ Ejecutar todo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
