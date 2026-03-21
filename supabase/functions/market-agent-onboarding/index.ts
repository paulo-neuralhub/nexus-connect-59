import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token)
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = claims.claims.sub as string

    const { action } = await req.json()

    if (!action || !['create_account', 'get_onboarding_link', 'check_status'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
    }

    // Verify user has a market_agents record
    const { data: agentRecord, error: agentErr } = await supabase
      .from('market_agents')
      .select('id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, display_name, country_code')
      .eq('user_id', userId)
      .maybeSingle()

    if (agentErr || !agentRecord) {
      return new Response(JSON.stringify({ error: 'No agent profile found. Create one first.' }), { status: 404, headers: corsHeaders })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const isMock = !stripeKey

    // ──────────────────────────────
    // ACTION: create_account
    // ──────────────────────────────
    if (action === 'create_account') {
      if (agentRecord.stripe_account_id) {
        return new Response(JSON.stringify({
          error: 'Stripe account already exists',
          stripe_account_id: agentRecord.stripe_account_id,
        }), { status: 400, headers: corsHeaders })
      }

      let stripeAccountId: string

      if (!isMock) {
        const params = new URLSearchParams()
        params.set('type', 'express')
        params.set('country', agentRecord.country_code || 'ES')
        params.set('capabilities[card_payments][requested]', 'true')
        params.set('capabilities[transfers][requested]', 'true')
        params.set('business_type', 'individual')
        params.set('metadata[agent_id]', agentRecord.id)
        params.set('metadata[platform]', 'ip-nexus-market')

        const res = await fetch('https://api.stripe.com/v1/accounts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        })
        const data = await res.json()

        if (!res.ok) {
          return new Response(JSON.stringify({ error: 'Stripe account creation failed', details: data }), { status: 500, headers: corsHeaders })
        }
        stripeAccountId = data.id
      } else {
        stripeAccountId = `MOCK_ACCT_${crypto.randomUUID().slice(0, 8)}`
      }

      // Update agent record
      await supabase
        .from('market_agents')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_onboarding_complete: isMock, // mock = auto-complete
          stripe_charges_enabled: isMock,
          stripe_payouts_enabled: isMock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentRecord.id)

      return new Response(JSON.stringify({
        stripe_account_id: stripeAccountId,
        mock: isMock,
        status: isMock ? 'mock_complete' : 'pending_onboarding',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ──────────────────────────────
    // ACTION: get_onboarding_link
    // ──────────────────────────────
    if (action === 'get_onboarding_link') {
      if (!agentRecord.stripe_account_id) {
        return new Response(JSON.stringify({ error: 'No Stripe account. Call create_account first.' }), { status: 400, headers: corsHeaders })
      }

      if (isMock || agentRecord.stripe_account_id.startsWith('MOCK_')) {
        return new Response(JSON.stringify({
          url: '/app/market/agent/settings?stripe=mock_success',
          mock: true,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      // Derive frontend URL from Supabase URL (convention)
      const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
      const returnBase = `https://${projectRef}.lovable.app`

      const params = new URLSearchParams()
      params.set('account', agentRecord.stripe_account_id)
      params.set('refresh_url', `${returnBase}/app/market/agent/settings?stripe=refresh`)
      params.set('return_url', `${returnBase}/app/market/agent/settings?stripe=success`)
      params.set('type', 'account_onboarding')

      const res = await fetch('https://api.stripe.com/v1/account_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      const data = await res.json()

      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create onboarding link', details: data }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({
        url: data.url,
        expires_at: data.expires_at,
        mock: false,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ──────────────────────────────
    // ACTION: check_status
    // ──────────────────────────────
    if (action === 'check_status') {
      if (!agentRecord.stripe_account_id) {
        return new Response(JSON.stringify({
          has_account: false,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (isMock || agentRecord.stripe_account_id.startsWith('MOCK_')) {
        return new Response(JSON.stringify({
          has_account: true,
          stripe_account_id: agentRecord.stripe_account_id,
          onboarding_complete: true,
          charges_enabled: true,
          payouts_enabled: true,
          mock: true,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Real Stripe: retrieve account
      const res = await fetch(`https://api.stripe.com/v1/accounts/${agentRecord.stripe_account_id}`, {
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      })
      const acct = await res.json()

      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Failed to retrieve Stripe account', details: acct }), { status: 500, headers: corsHeaders })
      }

      const chargesEnabled = acct.charges_enabled === true
      const payoutsEnabled = acct.payouts_enabled === true
      const onboardingComplete = chargesEnabled && payoutsEnabled

      // Sync status to DB
      await supabase
        .from('market_agents')
        .update({
          stripe_onboarding_complete: onboardingComplete,
          stripe_charges_enabled: chargesEnabled,
          stripe_payouts_enabled: payoutsEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentRecord.id)

      return new Response(JSON.stringify({
        has_account: true,
        stripe_account_id: agentRecord.stripe_account_id,
        onboarding_complete: onboardingComplete,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        mock: false,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })

  } catch (err) {
    console.error('market-agent-onboarding error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders })
  }
})
