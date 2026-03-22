import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Get org_id from portal_access
    const { data: portalAccess } = await supabaseAdmin
      .from("portal_access")
      .select("id, organization_id, crm_account_id, status, can_request_services")
      .eq("portal_user_id", userId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!portalAccess) {
      return new Response(JSON.stringify({ error: "No portal access" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = portalAccess.organization_id;
    const buyerCrmAccountId = portalAccess.crm_account_id;

    // STEP 1: Check feature flag
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("feature_storefront_enabled")
      .eq("id", orgId)
      .single();

    if (!orgData?.feature_storefront_enabled) {
      return new Response(JSON.stringify({ error: "feature_not_enabled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 2: Verify can_request_services
    if (!portalAccess.can_request_services) {
      return new Response(JSON.stringify({ error: "services_not_permitted" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { storefront_item_id, intake_data = {}, on_behalf_of_account_id } = body;

    if (!storefront_item_id) {
      return new Response(JSON.stringify({ error: "storefront_item_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 3: Verify item exists and is active
    const { data: item } = await supabaseAdmin
      .from("service_storefront_items")
      .select("*")
      .eq("id", storefront_item_id)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single();

    if (!item) {
      return new Response(JSON.stringify({ error: "Storefront item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 4: If on_behalf_of, verify relationship
    let onBehalfName: string | null = null;
    if (on_behalf_of_account_id) {
      const { data: rel } = await supabaseAdmin
        .from("account_relationships")
        .select("id")
        .eq("agent_account_id", buyerCrmAccountId)
        .eq("client_account_id", on_behalf_of_account_id)
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!rel) {
        return new Response(JSON.stringify({ error: "not_authorized_for_client" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: clientAccount } = await supabaseAdmin
        .from("crm_accounts")
        .select("name")
        .eq("id", on_behalf_of_account_id)
        .single();
      onBehalfName = clientAccount?.name || null;
    }

    // Get buyer name
    const { data: buyerAccount } = await supabaseAdmin
      .from("crm_accounts")
      .select("name")
      .eq("id", buyerCrmAccountId)
      .single();
    const buyerName = buyerAccount?.name || "Unknown";

    // STEP 5: Create order
    const orderStatus = item.price_type === "fixed" ? "accepted" : "pending_review";

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("storefront_orders")
      .insert({
        organization_id: orgId,
        buyer_account_id: buyerCrmAccountId,
        buyer_portal_user_id: userId,
        on_behalf_of_account_id: on_behalf_of_account_id || null,
        storefront_item_id,
        intake_data,
        quoted_price_eur: item.base_price_eur || null,
        includes_official_fees: item.includes_official_fees || false,
        status: orderStatus,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message || "Failed to create order");
    }

    // STEP 6: Notify the firm
    await supabaseAdmin.from("portal_notifications").insert({
      organization_id: orgId,
      notification_type: "new_storefront_order",
      priority: "high",
      title: `Nueva solicitud: ${item.title}`,
      message: `De ${buyerName}${on_behalf_of_account_id ? ` para ${onBehalfName}` : ""}`,
      metadata: { order_id: order.id, item_id: storefront_item_id },
    });

    // STEP 7: Payment handling (mock if no Stripe key)
    let paymentIntentClientSecret: string | null = null;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (item.price_type === "fixed" && item.base_price_eur && item.base_price_eur > 0) {
      if (stripeKey) {
        // Real Stripe PaymentIntent
        try {
          const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${stripeKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              amount: Math.round(item.base_price_eur * 100).toString(),
              currency: "eur",
              "metadata[order_id]": order.id,
              "metadata[org_id]": orgId,
            }),
          });
          const pi = await stripeRes.json();
          paymentIntentClientSecret = pi.client_secret || null;

          await supabaseAdmin
            .from("storefront_orders")
            .update({
              payment_required: true,
              payment_status: "pending",
              stripe_payment_intent_id: pi.id,
            })
            .eq("id", order.id);
        } catch (e) {
          console.error("Stripe error:", e);
        }
      } else {
        // Mock payment
        const mockPiId = `MOCK_PI_${crypto.randomUUID().slice(0, 8)}`;
        await supabaseAdmin
          .from("storefront_orders")
          .update({
            payment_required: true,
            payment_status: "pending",
            stripe_payment_intent_id: mockPiId,
          })
          .eq("id", order.id);
      }
    }

    // Determine next step
    let nextStep: string;
    if (item.price_type === "quote") {
      nextStep = "awaiting_review";
    } else if (item.base_price_eur && item.base_price_eur > 0) {
      nextStep = "payment_pending";
    } else {
      nextStep = "in_progress";
    }

    const response: any = {
      order_id: order.id,
      status: orderStatus,
      item_title: item.title,
      price_type: item.price_type,
      next_step: nextStep,
    };

    if (paymentIntentClientSecret) {
      response.payment_intent_client_secret = paymentIntentClientSecret;
    }

    if (!stripeKey && item.price_type === "fixed" && item.base_price_eur > 0) {
      response.mock = true;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("storefront-create-order error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
