import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CURRENCY_META: Record<string, { name: string; symbol: string; region: string; flag: string }> = {
  USD: { name: "Dólar EEUU", symbol: "$", region: "americas", flag: "🇺🇸" },
  GBP: { name: "Libra esterlina", symbol: "£", region: "europe", flag: "🇬🇧" },
  CHF: { name: "Franco suizo", symbol: "CHF", region: "europe", flag: "🇨🇭" },
  JPY: { name: "Yen japonés", symbol: "¥", region: "asia_pacific", flag: "🇯🇵" },
  CNY: { name: "Yuan chino", symbol: "¥", region: "asia_pacific", flag: "🇨🇳" },
  AUD: { name: "Dólar australiano", symbol: "A$", region: "asia_pacific", flag: "🇦🇺" },
  CAD: { name: "Dólar canadiense", symbol: "C$", region: "americas", flag: "🇨🇦" },
  INR: { name: "Rupia india", symbol: "₹", region: "asia_pacific", flag: "🇮🇳" },
  KRW: { name: "Won coreano", symbol: "₩", region: "asia_pacific", flag: "🇰🇷" },
  MXN: { name: "Peso mexicano", symbol: "MX$", region: "latam", flag: "🇲🇽" },
  BRL: { name: "Real brasileño", symbol: "R$", region: "latam", flag: "🇧🇷" },
  ARS: { name: "Peso argentino", symbol: "AR$", region: "latam", flag: "🇦🇷" },
  CLP: { name: "Peso chileno", symbol: "CL$", region: "latam", flag: "🇨🇱" },
  COP: { name: "Peso colombiano", symbol: "CO$", region: "latam", flag: "🇨🇴" },
  PEN: { name: "Sol peruano", symbol: "S/", region: "latam", flag: "🇵🇪" },
  PLN: { name: "Zloty polaco", symbol: "zł", region: "europe", flag: "🇵🇱" },
  CZK: { name: "Corona checa", symbol: "Kč", region: "europe", flag: "🇨🇿" },
  NOK: { name: "Corona noruega", symbol: "kr", region: "europe", flag: "🇳🇴" },
  SEK: { name: "Corona sueca", symbol: "kr", region: "europe", flag: "🇸🇪" },
  DKK: { name: "Corona danesa", symbol: "kr", region: "europe", flag: "🇩🇰" },
  TRY: { name: "Lira turca", symbol: "₺", region: "europe", flag: "🇹🇷" },
  AED: { name: "Dírham EAU", symbol: "د.إ", region: "africa_mideast", flag: "🇦🇪" },
  SAR: { name: "Riyal saudí", symbol: "﷼", region: "africa_mideast", flag: "🇸🇦" },
  ZAR: { name: "Rand sudafricano", symbol: "R", region: "africa_mideast", flag: "🇿🇦" },
  NGN: { name: "Naira nigeriana", symbol: "₦", region: "africa_mideast", flag: "🇳🇬" },
  EGP: { name: "Libra egipcia", symbol: "E£", region: "africa_mideast", flag: "🇪🇬" },
  SGD: { name: "Dólar singapur", symbol: "S$", region: "asia_pacific", flag: "🇸🇬" },
  HKD: { name: "Dólar HK", symbol: "HK$", region: "asia_pacific", flag: "🇭🇰" },
  TWD: { name: "Dólar taiwanés", symbol: "NT$", region: "asia_pacific", flag: "🇹🇼" },
  THB: { name: "Baht tailandés", symbol: "฿", region: "asia_pacific", flag: "🇹🇭" },
  ILS: { name: "Shekel israelí", symbol: "₪", region: "africa_mideast", flag: "🇮🇱" },
  RUB: { name: "Rublo ruso", symbol: "₽", region: "europe", flag: "🇷🇺" },
  UAH: { name: "Grivna ucraniana", symbol: "₴", region: "europe", flag: "🇺🇦" },
};

const API_URL = `https://open.er-api.com/v6/latest/EUR`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
    const data = await res.json();
    const allRates = data.rates as Record<string, number>;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: existingRates } = await supabase
      .from("exchange_rates")
      .select("target_currency, rate")
      .eq("base_currency", "EUR");

    const existingMap = new Map<string, number>();
    (existingRates || []).forEach((r: any) => existingMap.set(r.target_currency, Number(r.rate)));

    let updated = 0;

    for (const [currency, rate] of Object.entries(allRates)) {
      if (currency === "EUR") continue;
      const previousRate = existingMap.get(currency) ?? rate;
      const changePct = previousRate > 0 ? ((Number(rate) - previousRate) / previousRate) * 100 : 0;
      const meta = CURRENCY_META[currency];

      const upsertData: Record<string, any> = {
        base_currency: "EUR",
        target_currency: currency,
        rate,
        previous_rate: previousRate,
        change_pct: Math.round(changePct * 10000) / 10000,
        source: "open.er-api",
        fetched_at: now,
        expires_at: expiresAt,
      };

      if (meta) {
        upsertData.currency_name = meta.name;
        upsertData.symbol = meta.symbol;
        upsertData.region = meta.region;
      }

      await supabase.from("exchange_rates").upsert(upsertData, {
        onConflict: "base_currency,target_currency",
        ignoreDuplicates: false,
      });
      updated++;
    }

    return new Response(JSON.stringify({ success: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating exchange rates:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
