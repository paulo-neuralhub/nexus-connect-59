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

    const { service_request_id, milestone_number, dispute_type, description, evidence_storage_paths } = await req.json()

    if (!service_request_id || !dispute_type || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields (service_request_id, dispute_type, description)' }), { status: 400, headers: corsHeaders })
    }

    if (!['non_delivery', 'quality', 'delay', 'other'].includes(dispute_type)) {
      return new Response(JSON.stringify({ error: 'Invalid dispute_type' }), { status: 400, headers: corsHeaders })
    }

    // Fetch service request
    const { data: sr, error: srErr } = await supabase
      .from('market_service_requests')
      .select('*, market_agents!inner(id, user_id)')
      .eq('id', service_request_id)
      .single()

    if (srErr || !sr) {
      return new Response(JSON.stringify({ error: 'Service request not found' }), { status: 404, headers: corsHeaders })
    }

    // Verify user is client or agent
    const agent = sr.market_agents as any
    const isClient = sr.client_user_id === userId
    const isAgent = agent.user_id === userId

    if (!isClient && !isAgent) {
      return new Response(JSON.stringify({ error: 'Not a party to this service request' }), { status: 403, headers: corsHeaders })
    }

    // Check status is disputable
    const nonDisputableStatuses = ['disputed', 'completed', 'cancelled', 'refunded']
    if (nonDisputableStatuses.includes(sr.status)) {
      return new Response(JSON.stringify({ error: `Cannot dispute a request with status: ${sr.status}` }), { status: 400, headers: corsHeaders })
    }

    const initiatedBy = isClient ? 'client' : 'agent'
    const now = new Date()
    // SLA: 5 business days (simplified as 7 calendar days)
    const slaDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Freeze funds & update status
    const { error: updateErr } = await supabase
      .from('market_service_requests')
      .update({
        status: 'disputed',
        status_changed_at: now.toISOString(),
        payment_status: 'frozen',
        resolution_center_opened_at: now.toISOString(),
        resolution_center_initiated_by: initiatedBy,
        resolution_center_action: 'dispute_opened',
        resolution_center_response_deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        resolution_center_resolved: false,
        updated_at: now.toISOString(),
      })
      .eq('id', service_request_id)

    if (updateErr) {
      console.error('Update error:', updateErr)
      return new Response(JSON.stringify({ error: 'Failed to update service request' }), { status: 500, headers: corsHeaders })
    }

    // Log immutable event
    await supabase.from('market_milestone_events').insert({
      service_request_id,
      milestone_number: milestone_number ?? 0,
      event_type: 'dispute_opened',
      event_data: {
        dispute_type,
        description,
        evidence_storage_paths: evidence_storage_paths || [],
        initiated_by: initiatedBy,
        sla_resolve_by: slaDeadline.toISOString(),
      },
      performed_by: userId,
      performed_by_type: initiatedBy,
    })

    // Notify backoffice (admin_notifications table)
    await supabase.from('admin_notifications').insert({
      type: 'market_dispute',
      severity: 'high',
      title: `Disputa abierta: ${sr.title || sr.request_number}`,
      message: `${initiatedBy === 'client' ? 'Cliente' : 'Agente'} ha abierto una disputa (${dispute_type}). SLA: ${slaDeadline.toISOString().slice(0, 10)}. Descripción: ${description.slice(0, 200)}`,
      metadata: {
        service_request_id,
        milestone_number,
        dispute_type,
        initiated_by: initiatedBy,
        sla_deadline: slaDeadline.toISOString(),
      },
      is_read: false,
    })

    return new Response(JSON.stringify({
      success: true,
      dispute_id: service_request_id,
      initiated_by: initiatedBy,
      sla_deadline: slaDeadline.toISOString(),
      funds_frozen: true,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('market-open-dispute error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
