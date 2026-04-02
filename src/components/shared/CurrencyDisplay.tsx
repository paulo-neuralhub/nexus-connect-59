import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useExchangeRates, convert } from "@/hooks/useExchangeRates";
import { useCurrencyPreferences } from "@/hooks/useCurrencyPreferences";

export interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  jurisdictionCurrency?: string;
  compact?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

function fmt(amount: number, currency: string, compact?: boolean, symbol?: string | null) {
  if (compact && symbol) {
    return `${symbol}${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  }
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function CurrencyDisplay({
  amount,
  currency,
  jurisdictionCurrency,
  compact = false,
  showTimestamp,
  className,
}: CurrencyDisplayProps) {
  const { data: rates, isLoading } = useExchangeRates();
  const { prefs, orgCurrency } = useCurrencyPreferences();

  const rateMap = useMemo(() => {
    const m = new Map<string, number>();
    if (rates) for (const r of rates) m.set(r.target_currency, r.rate);
    return m;
  }, [rates]);

  const symbolMap = useMemo(() => {
    const m = new Map<string, string | null>();
    if (rates) for (const r of rates) m.set(r.target_currency, r.symbol);
    return m;
  }, [rates]);

  const fetchedAt = useMemo(() => {
    if (!rates?.length) return null;
    return rates[0].fetched_at;
  }, [rates]);

  if (isLoading) {
    return <span className={cn("animate-pulse text-muted-foreground", className)}>…</span>;
  }

  const mode = prefs.mode;
  const refCur = prefs.reference_currency;
  const jCur = jurisdictionCurrency ?? currency;
  const tsVisible = showTimestamp ?? prefs.show_rate_timestamp;

  type Entry = { amount: number; currency: string; primary?: boolean };
  const entries: Entry[] = [];

  const addEntry = (toCurrency: string, primary?: boolean) => {
    const converted = convert(amount, currency, toCurrency, rateMap);
    if (converted !== null) entries.push({ amount: converted, currency: toCurrency, primary });
  };

  switch (mode) {
    case "reference_only":
      addEntry(refCur, true);
      break;
    case "tenant_only":
      addEntry(orgCurrency, true);
      break;
    case "jurisdiction_only":
      addEntry(jCur, true);
      break;
    case "reference_and_jurisdiction":
      addEntry(refCur, true);
      if (jCur !== refCur) addEntry(jCur);
      break;
    case "all_three": {
      addEntry(refCur, true);
      const seen = new Set([refCur]);
      if (!seen.has(jCur)) { addEntry(jCur); seen.add(jCur); }
      if (!seen.has(orgCurrency)) addEntry(orgCurrency);
      break;
    }
  }

  if (entries.length === 0) {
    entries.push({ amount, currency, primary: true });
  }

  const formattedTimestamp = fetchedAt
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "UTC",
      }).format(new Date(fetchedAt)) + " UTC"
    : null;

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="inline-flex flex-wrap items-baseline gap-x-1">
        {entries.map((e, i) => (
          <span key={e.currency}>
            {i > 0 && <span className="text-muted-foreground mx-0.5">·</span>}
            <span className={e.primary ? "font-medium" : "text-muted-foreground"}>
              {compact
                ? fmt(e.amount, e.currency, true, symbolMap.get(e.currency))
                : `${fmt(e.amount, e.currency)} ${e.currency}`}
            </span>
          </span>
        ))}
      </span>
      {!compact && tsVisible && formattedTimestamp && (
        <span className="text-xs text-muted-foreground">
          Tasa al {formattedTimestamp} · Ref. no transaccional
        </span>
      )}
    </span>
  );
}

export default CurrencyDisplay;
