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

    const { service_request_id, milestone_number, release_type, admin_reason } = await req.json()

    if (!service_request_id || milestone_number == null || !release_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    if (!['client_confirmed', 'auto_release', 'admin_decision'].includes(release_type)) {
      return new Response(JSON.stringify({ error: 'Invalid release_type' }), { status: 400, headers: corsHeaders })
    }

    if (release_type === 'admin_decision' && !admin_reason) {
      return new Response(JSON.stringify({ error: 'admin_reason required for admin_decision' }), { status: 400, headers: corsHeaders })
    }

    // Fetch service request with agent info
    const { data: sr, error: srErr } = await supabase
      .from('market_service_requests')
      .select('*, market_agents!inner(id, user_id, stripe_account_id)')
      .eq('id', service_request_id)
      .single()

    if (srErr || !sr) {
      return new Response(JSON.stringify({ error: 'Service request not found' }), { status: 404, headers: corsHeaders })
    }

    const agent = sr.market_agents as any

    // Authorization check
    if (release_type === 'client_confirmed') {
      if (sr.client_user_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only the client can confirm' }), { status: 403, headers: corsHeaders })
      }
    } else if (release_type === 'admin_decision') {
      // Check superadmin via user_roles
      const { data: roleCheck } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .maybeSingle()
      if (!roleCheck) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
      }
    }
    // auto_release: no user auth check (called by cron), but verify conditions

    // Get milestone from JSONB
    const milestones = (sr.milestones || []) as any[]
    const msIndex = milestones.findIndex((m: any) => m.number === milestone_number)
    const milestone = msIndex >= 0 ? milestones[msIndex] : null

    // For auto_release: verify evidence exists
    if (release_type === 'auto_release') {
      const hasEvidence = milestone
        ? (milestone.evidence_files || []).length > 0
        : (sr.delivery_files || []).length > 0

      if (!hasEvidence) {
        // Block auto-release
        await supabase.from('market_milestone_events').insert({
          service_request_id,
          milestone_number,
          event_type: 'auto_release_blocked_no_evidence',
          event_data: { reason: 'No evidence files uploaded' },
          performed_by_type: 'system',
        })

        return new Response(JSON.stringify({
          released: false,
          reason: 'auto_release_blocked_no_evidence',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Verify auto_release_at has passed
      if (milestone?.auto_release_at && new Date(milestone.auto_release_at) > new Date()) {
        return new Response(JSON.stringify({ error: 'Auto-release date not reached' }), { status: 400, headers: corsHeaders })
      }
    }

    // Stripe transfer or mock
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    let transferId: string
    let isMock = false
    const payoutAmount = milestone?.amount_eur || sr.agent_payout_eur || 0
    const payoutCents = Math.round(payoutAmount * 100)

    if (stripeKey && agent.stripe_account_id && !agent.stripe_account_id.startsWith('MOCK_')) {
      const params = new URLSearchParams()
      params.set('amount', String(payoutCents))
      params.set('currency', 'eur')
      params.set('destination', agent.stripe_account_id)
      params.set('transfer_group', sr.stripe_transfer_group || `request_${service_request_id}`)

      const trRes = await fetch('https://api.stripe.com/v1/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      const trData = await trRes.json()

      if (!trRes.ok) {
        return new Response(JSON.stringify({ error: 'Stripe transfer failed', details: trData }), { status: 500, headers: corsHeaders })
      }
      transferId = trData.id
    } else {
      isMock = true
      transferId = `MOCK_TR_${crypto.randomUUID().slice(0, 8)}`
    }

    // Update milestone in JSONB
    if (msIndex >= 0) {
      milestones[msIndex] = {
        ...milestones[msIndex],
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_transfer_id: transferId,
      }
    }

    // Check if all milestones are completed
    const allCompleted = milestones.length === 0 || milestones.every((m: any) => m.status === 'completed')

    const updateData: any = {
      milestones,
      updated_at: new Date().toISOString(),
    }

    if (allCompleted) {
      updateData.status = 'completed'
      updateData.status_changed_at = new Date().toISOString()
      updateData.payment_status = 'released'
      updateData.completed_at = new Date().toISOString()
    }

    await supabase
      .from('market_service_requests')
      .update(updateData)
      .eq('id', service_request_id)

    // Log event
    await supabase.from('market_milestone_events').insert({
      service_request_id,
      milestone_number,
      event_type: release_type,
      event_data: {
        transfer_id: transferId,
        amount: payoutAmount,
        mock: isMock,
        admin_reason: admin_reason || null,
        all_completed: allCompleted,
      },
      performed_by: release_type !== 'auto_release' ? userId : null,
      performed_by_type: release_type === 'client_confirmed' ? 'client'
        : release_type === 'admin_decision' ? 'admin' : 'system',
    })

    return new Response(JSON.stringify({
      released: true,
      transfer_id: transferId,
      amount: payoutAmount,
      all_milestones_completed: allCompleted,
      mock: isMock,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('market-release-milestone error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
