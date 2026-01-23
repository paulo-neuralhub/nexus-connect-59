import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BillingCycle = 'monthly' | 'yearly';

function isoDateOnly(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to continue.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: auth, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !auth?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = auth.user;
    const {
      voip_plan_id,
      billing_cycle,
      success_url,
      cancel_url,
    }: {
      voip_plan_id: string;
      billing_cycle?: BillingCycle;
      success_url?: string;
      cancel_url?: string;
    } = await req.json();

    if (!voip_plan_id) {
      return new Response(JSON.stringify({ error: 'Missing voip_plan_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cycle: BillingCycle = billing_cycle === 'yearly' ? 'yearly' : 'monthly';

    // Org from membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('organization_id, organizations(name)')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const organizationId = membership.organization_id as string;
    const organizationName = (membership.organizations as { name?: string } | null)?.name;

    const { data: plan, error: planError } = await supabase
      .from('voip_pricing_plans')
      .select('*')
      .eq('id', voip_plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan no disponible' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stripe product mapping for this VoIP plan
    const { data: product, error: productError } = await supabase
      .from('stripe_products')
      .select('stripe_product_id, active')
      .eq('voip_plan_id', voip_plan_id)
      .eq('active', true)
      .single();

    if (productError || !product?.stripe_product_id) {
      return new Response(
        JSON.stringify({ error: 'Plan sin producto Stripe asociado (stripe_products.voip_plan_id)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // pick a recurring price for that product
    const desiredInterval = cycle === 'yearly' ? 'year' : 'month';
    const { data: prices, error: priceError } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id, recurring_interval, active, unit_amount')
      .eq('stripe_product_id', product.stripe_product_id)
      .eq('active', true)
      .eq('recurring_interval', desiredInterval)
      .order('unit_amount', { ascending: true })
      .limit(1);

    if (priceError || !prices?.length) {
      return new Response(
        JSON.stringify({ error: `No hay price activo para interval=${desiredInterval}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripePriceId = prices[0].stripe_price_id as string;

    // Get or create Stripe customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    let stripeCustomerId = existingCustomer?.stripe_customer_id as string | undefined;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: organizationName || 'IP-NEXUS VoIP Customer',
        metadata: {
          organization_id: organizationId,
          source: 'ip-nexus',
          module: 'voip',
        },
      });

      stripeCustomerId = customer.id;

      await supabase.from('stripe_customers').insert({
        organization_id: organizationId,
        stripe_customer_id: stripeCustomerId,
        email: user.email,
        name: organizationName,
        metadata: { module: 'voip' },
      });
    }

    const appUrl =
      Deno.env.get('APP_URL') ||
      'https://id-preview--ec943dde-ae1e-40db-be06-10d553dd2119.lovable.app';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: success_url || `${appUrl}/app/settings/voip?success=true&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${appUrl}/app/settings/voip?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'es',
      metadata: {
        module: 'voip',
        organization_id: organizationId,
        user_id: user.id,
        voip_plan_id,
        billing_cycle: cycle,
        voip_plan_code: plan.code,
      },
      subscription_data: {
        metadata: {
          module: 'voip',
          organization_id: organizationId,
          voip_plan_id,
          voip_plan_code: plan.code,
        },
      },
    });

    // Event log (best-effort)
    try {
      await supabase.rpc('log_event', {
        p_event_type: 'payment.checkout.started',
        p_title: `Checkout VoIP iniciado: ${plan.name}`,
        p_description: `Usuario iniciando checkout para plan ${plan.code}`,
        p_organization_id: organizationId,
        p_user_id: user.id,
        p_event_data: {
          voip_plan_id,
          voip_plan_code: plan.code,
          stripe_price_id: stripePriceId,
          billing_cycle: cycle,
          checkout_session_id: session.id,
        },
        p_source: 'stripe',
        p_tags: ['voip', 'stripe', 'checkout'],
        p_related_entity_type: 'voip_plan',
        p_related_entity_id: voip_plan_id,
      });
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('stripe-create-checkout error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
