import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify superadmin via JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } =
      await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Verify super_admin role
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: "Forbidden: super_admin required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse input
    const body = await req.json().catch(() => ({}));
    const periodMonth =
      body.period_month ||
      new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const captureTypes: string[] = body.capture_types || [
      "ai",
      "telephony",
      "marketplace",
      "subscriptions",
    ];

    const [year, month] = periodMonth.split("-").map(Number);
    const periodStart = `${periodMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const periodEnd = `${periodMonth}-${String(lastDay).padStart(2, "0")}`;

    const results = {
      period_month: periodMonth,
      costs_captured: { ai: 0, telephony: 0, total: 0 },
      revenue_captured: { marketplace: 0, subscriptions: 0, total: 0 },
      mrr_snapshot: { mrr: 0, arr: 0, tenants: 0 },
      pending_review_count: 0,
    };

    // STEP 3: Capture AI costs
    if (captureTypes.includes("ai")) {
      const { data: aiResult } = await supabase.rpc(
        "capture_ai_costs_to_platform",
        { p_period_start: periodStart, p_period_end: periodEnd }
      );
      results.costs_captured.ai = aiResult || 0;
    }

    // STEP 4: Capture telephony costs
    if (captureTypes.includes("telephony")) {
      const { data: telResult } = await supabase.rpc(
        "capture_telephony_costs_to_platform",
        { p_period_start: periodStart, p_period_end: periodEnd }
      );
      results.costs_captured.telephony = telResult || 0;
    }

    results.costs_captured.total =
      results.costs_captured.ai + results.costs_captured.telephony;

    // STEP 5: Capture marketplace revenue
    if (captureTypes.includes("marketplace")) {
      const { data: mktData } = await supabase
        .from("market_service_requests")
        .select("platform_fee_amount, quoted_amount_eur")
        .eq("status", "completed")
        .gte("completed_at", `${periodStart}T00:00:00`)
        .lte("completed_at", `${periodEnd}T23:59:59`);

      if (mktData && mktData.length > 0) {
        const totalFee = mktData.reduce(
          (s: number, r: any) => s + (r.platform_fee_amount || 0),
          0
        );
        const totalGmv = mktData.reduce(
          (s: number, r: any) => s + (r.quoted_amount_eur || 0),
          0
        );

        // Check if already captured
        const { data: existing } = await supabase
          .from("platform_revenue")
          .select("id")
          .eq("revenue_type", "marketplace_commission")
          .eq("period_month", periodMonth)
          .maybeSingle();

        if (!existing) {
          await supabase.from("platform_revenue").insert({
            revenue_type: "marketplace_commission",
            gross_amount: totalFee,
            net_amount: totalFee,
            currency: "EUR",
            revenue_date: periodStart,
            period_month: periodMonth,
            status: "pending_review",
            description: `Comisiones Marketplace: ${mktData.length} transacciones, GMV €${totalGmv.toFixed(2)}`,
          });
          results.revenue_captured.marketplace = 1;
        }
      }
    }

    // STEP 6: Capture subscription revenue
    if (captureTypes.includes("subscriptions")) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_code, id")
        .eq("status", "active");

      if (subs && subs.length > 0) {
        const planPrices: Record<string, number> = {
          starter: 149,
          professional: 399,
          enterprise: 999,
        };
        const totalMrr = subs.reduce(
          (s: number, sub: any) => s + (planPrices[sub.plan_code] || 0),
          0
        );

        const { data: existing } = await supabase
          .from("platform_revenue")
          .select("id")
          .eq("revenue_type", "subscription")
          .eq("period_month", periodMonth)
          .maybeSingle();

        if (!existing && totalMrr > 0) {
          await supabase.from("platform_revenue").insert({
            revenue_type: "subscription",
            gross_amount: totalMrr,
            stripe_fee: Math.round(totalMrr * 0.014 * 100) / 100 + subs.length * 0.25,
            net_amount:
              totalMrr -
              (Math.round(totalMrr * 0.014 * 100) / 100 + subs.length * 0.25),
            currency: "EUR",
            revenue_date: periodStart,
            period_month: periodMonth,
            status: "pending_review",
            description: `Suscripciones: ${subs.length} tenants activos, MRR €${totalMrr.toFixed(2)}`,
          });
          results.revenue_captured.subscriptions = 1;
        }
      }
    }

    results.revenue_captured.total =
      results.revenue_captured.marketplace +
      results.revenue_captured.subscriptions;

    // STEP 7: Calculate MRR snapshot
    await supabase.rpc("calculate_mrr_snapshot", {
      p_period_month: periodMonth,
    });

    // Get snapshot for response
    const { data: snapshot } = await supabase
      .from("platform_mrr_snapshots")
      .select("mrr_total, arr_total, tenants_total")
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (snapshot) {
      results.mrr_snapshot = {
        mrr: snapshot.mrr_total,
        arr: snapshot.arr_total,
        tenants: snapshot.tenants_total,
      };
    }

    // Count pending reviews
    const { count: pendingCosts } = await supabase
      .from("platform_costs")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    const { count: pendingRevenue } = await supabase
      .from("platform_revenue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    results.pending_review_count = (pendingCosts || 0) + (pendingRevenue || 0);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("platform-finance-capture error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
