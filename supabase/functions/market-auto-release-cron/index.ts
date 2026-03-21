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
    // Use service role for cron operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Optional: verify caller is system/admin
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const token = authHeader.replace('Bearer ', '')
      const { data: claims } = await supabaseUser.auth.getClaims(token)
      if (claims?.claims) {
        const userId = claims.claims.sub as string
        const { data: roleCheck } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'super_admin')
          .maybeSingle()
        if (!roleCheck) {
          return new Response(JSON.stringify({ error: 'Admin or system access required' }), { status: 403, headers: corsHeaders })
        }
      }
    }
    // If no auth header, allow (pg_cron calls without auth)

    const now = new Date().toISOString()

    // Find candidates for auto-release
    const { data: candidates, error: fetchErr } = await supabaseAdmin
      .from('market_service_requests')
      .select('id, agent_id, milestones, delivery_files, auto_release_at, agent_payout_eur, stripe_transfer_group, market_agents!inner(id, user_id, stripe_account_id)')
      .eq('status', 'delivered')
      .eq('payment_status', 'held')
      .not('auto_release_at', 'is', null)
      .lt('auto_release_at', now)

    if (fetchErr) {
      console.error('Fetch candidates error:', fetchErr)
      return new Response(JSON.stringify({ error: 'Failed to fetch candidates' }), { status: 500, headers: corsHeaders })
    }

    const results = {
      processed: 0,
      released: 0,
      blocked_no_evidence: 0,
      errors: [] as string[],
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

    for (const sr of (candidates || [])) {
      results.processed++

      try {
        // Check evidence
        const deliveryFiles = sr.delivery_files as any[] || []
        const milestones = sr.milestones as any[] || []

        // Check if there's any evidence (delivery_files or milestone evidence)
        const hasDeliveryEvidence = deliveryFiles.length > 0
        const hasMilestoneEvidence = milestones.some((m: any) =>
          m.status === 'evidence_uploaded' && (m.evidence_files || []).length > 0
        )

        if (!hasDeliveryEvidence && !hasMilestoneEvidence) {
          // Block auto-release
          results.blocked_no_evidence++
          await supabaseAdmin.from('market_milestone_events').insert({
            service_request_id: sr.id,
            milestone_number: 0,
            event_type: 'auto_release_blocked_no_evidence',
            event_data: { reason: 'No evidence files uploaded at auto_release_at deadline' },
            performed_by_type: 'system',
          })
          continue
        }

        // Release: create Stripe transfer or mock
        const agent = sr.market_agents as any
        const payoutAmount = sr.agent_payout_eur || 0
        const payoutCents = Math.round(payoutAmount * 100)
        let transferId: string
        let isMock = false

        if (stripeKey && agent.stripe_account_id && !agent.stripe_account_id.startsWith('MOCK_')) {
          const params = new URLSearchParams()
          params.set('amount', String(payoutCents))
          params.set('currency', 'eur')
          params.set('destination', agent.stripe_account_id)
          params.set('transfer_group', sr.stripe_transfer_group || `request_${sr.id}`)

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
            results.errors.push(`Transfer failed for ${sr.id}: ${JSON.stringify(trData)}`)
            continue
          }
          transferId = trData.id
        } else {
          isMock = true
          transferId = `MOCK_TR_${crypto.randomUUID().slice(0, 8)}`
        }

        // Update service request
        const updatedMilestones = milestones.map((m: any) => {
          if (m.status === 'evidence_uploaded') {
            return { ...m, status: 'completed', completed_at: now, stripe_transfer_id: transferId }
          }
          return m
        })

        await supabaseAdmin
          .from('market_service_requests')
          .update({
            status: 'completed',
            status_changed_at: now,
            payment_status: 'released',
            completed_at: now,
            milestones: updatedMilestones,
            updated_at: now,
          })
          .eq('id', sr.id)

        // Log event
        await supabaseAdmin.from('market_milestone_events').insert({
          service_request_id: sr.id,
          milestone_number: 0,
          event_type: 'auto_released',
          event_data: { transfer_id: transferId, amount: payoutAmount, mock: isMock },
          performed_by_type: 'system',
        })

        results.released++

      } catch (innerErr) {
        results.errors.push(`Error processing ${sr.id}: ${(innerErr as Error).message}`)
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('market-auto-release-cron error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders })
  }
})
