/**
 * Tab Comercial — Pricing from ipo_offices fee columns
 * Simplified version without pricing_services dependency
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  officeCode: string;
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {value}
        {sub && <span className="text-xs text-muted-foreground ml-1">({sub})</span>}
      </span>
    </div>
  );
}

function formatMoney(amount: number, currency: string): string {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function DetailTabCommercial({ officeCode }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["office-commercial", officeCode],
    queryFn: async () => {
      const { data: office } = await supabase
        .from("ipo_offices")
        .select("id, code, name_official, name_short, office_acronym, tm_filing_fee, tm_renewal_fee, tm_class_extra_fee, tm_opposition_fee, tm_appeal_fee, tm_expedited_fee, tm_recordal_fee, tm_fee_currency, fee_last_verified_at, fees_url")
        .eq("code", officeCode)
        .maybeSingle();
      if (!office) return null;

      const currency = office.tm_fee_currency ?? "EUR";
      const officialFee = Number(office.tm_filing_fee ?? 0);
      const additionalClass = office.tm_class_extra_fee ? Number(office.tm_class_extra_fee) : null;

      const hasPrice = [
        office.tm_filing_fee, office.tm_renewal_fee, office.tm_class_extra_fee,
        office.tm_opposition_fee, office.tm_appeal_fee, office.tm_expedited_fee, office.tm_recordal_fee,
      ].some(v => Number(v ?? 0) > 0);

      return { office, currency, officialFee, additionalClass, hasPrice };
    },
  });

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Cargando...</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">No se encontró la oficina</div>;

  const { office, currency, officialFee, additionalClass, hasPrice } = data;
  const acronym = office.office_acronym || office.code;
  const sym = currency === "USD" ? "$" : "€";

  if (!hasPrice) {
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          ⚪ Sin datos de precios
        </h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No hay tasas oficiales configuradas para {acronym}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
        💰 Tasas Oficiales — {acronym}
      </h3>

      <Card className="border-muted">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Tasas oficiales de {acronym}
          </p>
          <div className="space-y-1">
            <Row label="Tasa oficial (1ª clase)" value={formatMoney(officialFee, currency)} sub={acronym} />
            {additionalClass != null && additionalClass > 0 && (
              <Row label="Clase adicional" value={formatMoney(additionalClass, currency)} />
            )}
            {Number(office.tm_renewal_fee ?? 0) > 0 && (
              <Row label="Renovación" value={formatMoney(Number(office.tm_renewal_fee), currency)} />
            )}
            {Number(office.tm_opposition_fee ?? 0) > 0 && (
              <Row label="Oposición" value={formatMoney(Number(office.tm_opposition_fee), currency)} />
            )}
            {Number(office.tm_appeal_fee ?? 0) > 0 && (
              <Row label="Apelación" value={formatMoney(Number(office.tm_appeal_fee), currency)} />
            )}
            {Number(office.tm_expedited_fee ?? 0) > 0 && (
              <Row label="Tramitación urgente" value={formatMoney(Number(office.tm_expedited_fee), currency)} />
            )}
            {Number(office.tm_recordal_fee ?? 0) > 0 && (
              <Row label="Inscripción/Transferencia" value={formatMoney(Number(office.tm_recordal_fee), currency)} />
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Total summary */}
      <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">TASA SOLICITUD</span>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(officialFee, currency)}</span>
          </div>
          {additionalClass != null && additionalClass > 0 && (
            <Row label="+ Clase adicional" value={`+${formatMoney(additionalClass, currency)}`} />
          )}
        </CardContent>
      </Card>

      {office.fees_url && (
        <a href={office.fees_url as string} target="_blank" rel="noopener noreferrer"
          className="text-xs text-primary hover:underline">
          📄 Fuente oficial de tasas ↗
        </a>
      )}
    </div>
  );
}
