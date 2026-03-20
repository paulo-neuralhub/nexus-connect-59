/**
 * Detail Tab: Official Fees — reads fee columns from ipo_offices
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface Props {
  office: Record<string, unknown>;
}

const FEE_TYPE_LABELS: Record<string, string> = {
  filing: "Solicitud", renewal: "Renovación", opposition: "Oposición",
  appeal: "Recurso", examination: "Tramitación urgente", transfer: "Transferencia",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CNY: "¥",
};

function FreshnessBadge({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const months = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 6) return <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{months}m</Badge>;
  if (months < 12) return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{months}m</Badge>;
  return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />{months}m</Badge>;
}

export function DetailTabFees({ office }: Props) {
  const currency = (office.tm_fee_currency as string) || "EUR";
  const verifiedAt = office.fee_last_verified_at as string | null;
  const sourceUrl = office.fees_url as string | null;
  const sym = CURRENCY_SYMBOLS[currency] || currency + " ";

  const fees: { id: string; type: string; label: string; amount: number; additionalClass?: number | null }[] = [];

  if (Number(office.tm_filing_fee ?? 0) > 0) {
    fees.push({ id: "filing", type: "filing", label: "Tasa de solicitud (1ª clase)", amount: Number(office.tm_filing_fee), additionalClass: office.tm_class_extra_fee ? Number(office.tm_class_extra_fee) : null });
  }
  if (Number(office.tm_renewal_fee ?? 0) > 0) {
    fees.push({ id: "renewal", type: "renewal", label: "Tasa de renovación", amount: Number(office.tm_renewal_fee) });
  }
  if (Number(office.tm_opposition_fee ?? 0) > 0) {
    fees.push({ id: "opposition", type: "opposition", label: "Tasa de oposición", amount: Number(office.tm_opposition_fee) });
  }
  if (Number(office.tm_appeal_fee ?? 0) > 0) {
    fees.push({ id: "appeal", type: "appeal", label: "Tasa de apelación/recurso", amount: Number(office.tm_appeal_fee) });
  }
  if (Number(office.tm_expedited_fee ?? 0) > 0) {
    fees.push({ id: "expedited", type: "examination", label: "Tramitación urgente", amount: Number(office.tm_expedited_fee) });
  }
  if (Number(office.tm_recordal_fee ?? 0) > 0) {
    fees.push({ id: "recordal", type: "transfer", label: "Inscripción/transferencia", amount: Number(office.tm_recordal_fee) });
  }

  if (fees.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay tasas oficiales cargadas para esta oficina.
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: number) => {
    return `${sym}${amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            💰 Tasas Oficiales — Marcas
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Nacional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b whitespace-nowrap">Servicio</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b whitespace-nowrap">Importe</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b whitespace-nowrap">Clase adicional</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b whitespace-nowrap">Verificado</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs mr-1">
                        {FEE_TYPE_LABELS[fee.type] || fee.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">{fee.label}</p>
                    </td>
                    <td className="px-4 text-right whitespace-nowrap font-medium">{formatAmount(fee.amount)}</td>
                    <td className="px-4 text-right whitespace-nowrap">
                      {fee.additionalClass && fee.additionalClass > 0 ? (
                        <span className="text-primary font-medium">+{formatAmount(fee.additionalClass)}/clase</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 text-right">
                      <FreshnessBadge date={verifiedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          Fuente oficial ↗ <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}
