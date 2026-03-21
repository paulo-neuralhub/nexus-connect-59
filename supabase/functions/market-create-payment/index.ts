import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEE_RATES: Record<string, number> = {
  free: 0.12,
  verified: 0.10,
  pro: 0.08,
  premium: 0.06,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth
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

    // Input
    const { service_request_id, milestone_number, payment_plan } = await req.json()
    if (!service_request_id || !payment_plan) {
      return new Response(JSON.stringify({ error: 'Missing service_request_id or payment_plan' }), { status: 400, headers: corsHeaders })
    }

    // Verify ownership & status
    const { data: sr, error: srErr } = await supabase
      .from('market_service_requests')
      .select('*, market_agents!inner(id, user_id, market_plan, stripe_account_id)')
      .eq('id', service_request_id)
      .single()

    if (srErr || !sr) {
      return new Response(JSON.stringify({ error: 'Service request not found' }), { status: 404, headers: corsHeaders })
    }

    if (sr.client_user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not your service request' }), { status: 403, headers: corsHeaders })
    }

    if (sr.status !== 'accepted') {
      return new Response(JSON.stringify({ error: 'Request must be in accepted status' }), { status: 400, headers: corsHeaders })
    }

    if (sr.payment_status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Payment already initiated' }), { status: 400, headers: corsHeaders })
    }

    // Calculate amounts
    let amount: number
    if (milestone_number != null) {
      const milestones = (sr.milestones || []) as any[]
      const ms = milestones.find((m: any) => m.number === milestone_number)
      if (!ms) {
        return new Response(JSON.stringify({ error: `Milestone ${milestone_number} not found` }), { status: 400, headers: corsHeaders })
      }
      amount = ms.amount_eur || 0
    } else {
      amount = sr.total_amount_eur || 0
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: corsHeaders })
    }

    const agent = sr.market_agents as any
    const feeRate = FEE_RATES[agent.market_plan] || FEE_RATES.free
    const platformFee = Math.round(amount * feeRate * 100) / 100
    const agentPayout = Math.round((amount - platformFee) * 100) / 100

    // Stripe or mock
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    let paymentIntentId: string
    let clientSecret: string | null = null
    let isMock = false

    if (stripeKey && agent.stripe_account_id && !agent.stripe_account_id.startsWith('MOCK_')) {
      // Real Stripe
      const amountCents = Math.round(amount * 100)
      const platformFeeCents = Math.round(platformFee * 100)

      const params = new URLSearchParams()
      params.set('amount', String(amountCents))
      params.set('currency', 'eur')
      params.set('payment_method_types[]', 'card')
      params.set('transfer_group', `request_${service_request_id}`)
      params.set('application_fee_amount', String(platformFeeCents))
      params.set('on_behalf_of', agent.stripe_account_id)
      params.set('metadata[service_request_id]', service_request_id)
      params.set('metadata[milestone_number]', String(milestone_number ?? 'full'))
      params.set('metadata[agent_id]', agent.id)

      const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      const piData = await piRes.json()

      if (!piRes.ok) {
        return new Response(JSON.stringify({ error: 'Stripe error', details: piData }), { status: 500, headers: corsHeaders })
      }

      paymentIntentId = piData.id
      clientSecret = piData.client_secret
    } else {
      // Mock mode
      isMock = true
      paymentIntentId = `MOCK_PI_${crypto.randomUUID().slice(0, 8)}`
    }

    // Update service request
    const paymentStatus = isMock ? 'mock_held' : 'held'
    const { error: updateErr } = await supabase
      .from('market_service_requests')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        stripe_transfer_group: `request_${service_request_id}`,
        payment_status: paymentStatus,
        payment_plan: payment_plan,
        platform_fee_eur: platformFee,
        agent_payout_eur: agentPayout,
        status: 'in_progress',
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', service_request_id)

    if (updateErr) {
      console.error('Update error:', updateErr)
    }

    // Log milestone event
    await supabase.from('market_milestone_events').insert({
      service_request_id,
      milestone_number: milestone_number ?? 0,
      event_type: 'funded',
      event_data: { amount, platform_fee: platformFee, agent_payout: agentPayout, mock: isMock },
      performed_by: userId,
      performed_by_type: 'client',
    })

    return new Response(JSON.stringify({
      payment_intent_id: paymentIntentId,
      client_secret: clientSecret,
      amount,
      platform_fee: platformFee,
      agent_payout: agentPayout,
      mock: isMock,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('market-create-payment error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
