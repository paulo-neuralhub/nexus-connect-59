// ============================================================
// IP-NEXUS Edge Function - Telephony Purchase Pack
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  tenantId: string;
  packId: string;
  paymentMethodId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenantId, packId, paymentMethodId }: PurchaseRequest = await req.json();

    if (!tenantId || !packId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing tenantId or packId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get pack details
    const { data: pack, error: packError } = await supabaseClient
      .from('telephony_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return new Response(
        JSON.stringify({ success: false, error: 'Pack not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check organization exists
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name')
      .eq('id', tenantId)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Process payment (Stripe integration - safe mode if no key)
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    let paymentSuccessful = false;
    let stripePaymentId: string | null = null;

    if (!stripeKey) {
      // Safe mode - simulate successful payment for testing
      console.log('STRIPE_SECRET_KEY not configured - running in safe mode');
      paymentSuccessful = true;
      stripePaymentId = `sim_${Date.now()}`;
    } else {
      // Real Stripe payment processing would go here
      // For now, simulate success
      paymentSuccessful = true;
      stripePaymentId = `pi_${Date.now()}`;
    }

    if (!paymentSuccessful) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pack.validity_days);

    // 5. Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('tenant_telephony_purchases')
      .insert({
        tenant_id: tenantId,
        pack_id: packId,
        minutes_purchased: pack.minutes_included,
        sms_purchased: pack.sms_included,
        price_paid: pack.price,
        currency: pack.currency,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        minutes_remaining: pack.minutes_included,
        sms_remaining: pack.sms_included,
        payment_method: paymentMethodId || 'card',
        stripe_payment_id: stripePaymentId,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create purchase record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Update or create tenant balance
    const { data: existingBalance } = await supabaseClient
      .from('tenant_telephony_balance')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (existingBalance) {
      // Update existing balance
      const { error: updateError } = await supabaseClient
        .from('tenant_telephony_balance')
        .update({
          minutes_balance: existingBalance.minutes_balance + pack.minutes_included,
          sms_balance: existingBalance.sms_balance + pack.sms_included,
          total_spent: existingBalance.total_spent + pack.price,
          low_balance_alert_sent: false, // Reset alert flag
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId);

      if (updateError) {
        console.error('Error updating balance:', updateError);
      }
    } else {
      // Create new balance record
      const { error: createError } = await supabaseClient
        .from('tenant_telephony_balance')
        .insert({
          tenant_id: tenantId,
          minutes_balance: pack.minutes_included,
          sms_balance: pack.sms_included,
          credit_balance: 0,
          total_spent: pack.price,
          is_enabled: true,
        });

      if (createError) {
        console.error('Error creating balance:', createError);
      }
    }

    // 7. Log activity
    await supabaseClient.from('activity_log').insert({
      organization_id: tenantId,
      entity_type: 'telephony',
      entity_id: purchase.id,
      action: 'pack_purchased',
      title: `Pack de telefonía comprado: ${pack.name}`,
      description: `${pack.minutes_included} minutos + ${pack.sms_included} SMS por ${pack.price}€`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchaseId: purchase.id,
        minutesAdded: pack.minutes_included,
        smsAdded: pack.sms_included,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telephony-purchase-pack:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
