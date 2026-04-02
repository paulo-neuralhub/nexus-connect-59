import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";

interface ExchangeRate {
  target_currency: string;
  rate: number;
  symbol: string | null;
  fetched_at: string | null;
}

export function useExchangeRates() {
  return useQuery<ExchangeRate[]>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const { data, error } = await fromTable("exchange_rates")
        .select("target_currency, rate, symbol, fetched_at")
        .eq("base_currency", "EUR");
      if (error) throw error;
      return (data ?? []) as ExchangeRate[];
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  });
}

export function convert(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Map<string, number>
): number | null {
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === "EUR") {
    const r = rates.get(toCurrency);
    return r ? amount * r : null;
  }
  if (toCurrency === "EUR") {
    const r = rates.get(fromCurrency);
    return r ? amount / r : null;
  }
  const rFrom = rates.get(fromCurrency);
  const rTo = rates.get(toCurrency);
  if (!rFrom || !rTo) return null;
  return amount * (rTo / rFrom);
}
