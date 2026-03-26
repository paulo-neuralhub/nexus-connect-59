import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function safeQuery(label: string, queryFn: () => Promise<any>) {
  try {
    const result = await queryFn()
    if (result.error) {
      console.error(`[Briefing] ${label}:`, result.error.message)
      return null
    }
    return result.data
  } catch (e) {
    console.error(`[Briefing] ${label} exception:`, e)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id: userId, organization_id: orgId } = await req.json()
    if (!userId || !orgId) throw new Error('user_id y organization_id requeridos')
    console.log('[B1] userId:', userId, 'orgId:', orgId)

    const today = new Date().toISOString().split('T')[0]

    // RATE LIMITING: si existe briefing < 1h → cache
    const { data: existing } = await supabase
      .from('genius_daily_briefings')
      .select('id, created_at, content_json')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .eq('briefing_date', today)
      .single()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    if (existing?.created_at > oneHourAgo) {
      return new Response(
        JSON.stringify({ success: true, cached: true, data: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // IP_GENIUS check
    const { data: genius } = await supabase
      .from('ai_capability_assignments')
      .select('is_enabled')
      .eq('organization_id', orgId)
      .eq('capability_id', 'b0100001-0000-0000-0000-000000000001')
      .single()
    const hasIPGenius = genius?.is_enabled === true

    // DATOS BASE
    const profile = await safeQuery('profile', () =>
      supabase.from('profiles')
        .select('id, first_name, last_name, role')
        .eq('id', userId).single()
    )

    const assignedAccounts = await safeQuery('accounts', () =>
      supabase.from('account_team_members')
        .select('account_id').eq('user_id', userId)
    )
    const accountIds = assignedAccounts?.map((a: any) => a.account_id) || []
    const safeAccountIds = accountIds.length > 0
      ? accountIds : ['00000000-0000-0000-0000-000000000000']

    const matters = await safeQuery('matters', () =>
      supabase.from('matters')
        .select('id, reference, title, type, status, jurisdiction_code')
        .eq('assigned_to', userId)
        .eq('organization_id', orgId)
        .not('status', 'in', '("completed","abandoned","lapsed")')
    )
    const matterIds = matters?.map((m: any) => m.id) || []
    const safeMatterIds = matterIds.length > 0
      ? matterIds : ['00000000-0000-0000-0000-000000000000']
    console.log('[B2] matters count:', matters?.length ?? 'NULL')
    console.log('[B2] safeMatterIds:', JSON.stringify(safeMatterIds?.slice(0, 2)))

    // PLAZOS — 4 NIVELES LEGALES
    const nonExtensibleTypes = [
      'opposition', 'appeal', 'cancellation',
      'response_euipo', 'priority_claim'
    ]
    const allDeadlines = await safeQuery('deadlines', () =>
      supabase.from('matter_deadlines')
        .select('id, title, deadline_date, priority, type, matter_id')
        .in('matter_id', safeMatterIds)
        .eq('status', 'pending')
        .lte('deadline_date',
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('deadline_date', { ascending: true })
    )

    console.log('[B3] allDeadlines:', allDeadlines?.length ?? 'NULL - FAILED')

    const urgentItems: any = { fatal: [], critical: [], urgent: [], attention: [] }
    const briefingItems: any[] = []

    allDeadlines?.forEach((d: any) => {
      const daysLeft = Math.ceil(
        (new Date(d.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const matterInfo = matters?.find((m: any) => m.id === d.matter_id)
      const item = {
        item_id: `deadline-${d.id}`,
        item_type: 'deadline',
        item_source_id: d.id,
        item_ref: matterInfo?.reference,
        item_title: d.title,
        title: d.title,
        matter_ref: matterInfo?.reference,
        matter_title: matterInfo?.title,
        jurisdiction: matterInfo?.jurisdiction_code,
        deadline_date: d.deadline_date,
        days_remaining: daysLeft,
        is_non_extensible: nonExtensibleTypes.includes(d.type),
        assignee_name: null,
        is_unassigned: true,
        action_url: '/app/matters',
        status: 'pending'
      }
      let severity = 'attention'
      if (daysLeft <= 0) { urgentItems.fatal.push(item); severity = 'fatal' }
      else if (daysLeft <= 3) { urgentItems.critical.push(item); severity = 'critical' }
      else if (daysLeft <= 7) { urgentItems.urgent.push(item); severity = 'urgent' }
      else urgentItems.attention.push(item)

      briefingItems.push({ ...item, severity, days_remaining_at_briefing: daysLeft })
    })

    // HEALTH SCORE (solo IP_GENIUS)
    let healthScore = null
    let healthDimensions = null
    if (hasIPGenius) {
      const oasCount = matters?.filter((m: any) => m.status === 'office_action').length || 0
      const sinAcuse = await safeQuery('sinAcuse', () =>
        supabase.from('bulk_instructions')
          .select('id')
          .eq('organization_id', orgId)
          .in('crm_account_id', safeAccountIds)
          .is('acknowledgement_sent_at', null)
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      )
      const pendingOld = await safeQuery('pendingOld', () =>
        supabase.from('incoming_messages')
          .select('id')
          .eq('organization_id', orgId)
          .eq('assigned_to', userId)
          .eq('status', 'awaiting_approval')
          .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      )
      const watches = await safeQuery('watches', () =>
        supabase.from('watch_items')
          .select('id')
          .eq('organization_id', orgId)
          .eq('status', 'active')
      )
      const dims = {
        plazos: Math.max(0, 100
          - (urgentItems.fatal.length * 25)
          - (urgentItems.critical.length * 10)
          - (urgentItems.urgent.length * 5)),
        comunicacion: Math.max(0, 100 - ((pendingOld?.length || 0) * 15)),
        instrucciones: Math.max(0, 100 - ((sinAcuse?.length || 0) * 20)),
        cartera: Math.max(0, 100 - (oasCount * 15)),
        facturacion: 85,
        vigilancia: Math.min(100, (watches?.length || 0) * 20)
      }
      healthDimensions = { ...dims, penalties: [] as string[] }
      if (urgentItems.fatal.length > 0)
        healthDimensions.penalties.push(
          `${urgentItems.fatal.length} plazo(s) vencido(s)`
        )
      if (oasCount > 0)
        healthDimensions.penalties.push(`${oasCount} OA(s) sin responder`)
      if ((sinAcuse?.length || 0) > 0)
        healthDimensions.penalties.push(
          `${sinAcuse?.length} instrucción(es) sin acuse`
        )
      healthScore = Math.round(
        dims.plazos * 0.30 + dims.comunicacion * 0.20 +
        dims.instrucciones * 0.15 + dims.cartera * 0.20 +
        dims.facturacion * 0.10 + dims.vigilancia * 0.05
      )
    }

    // WHAT'S NEW
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const newMessages = await safeQuery('newMsgs', () =>
      supabase.from('incoming_messages')
        .select('id, sender_name, ai_category')
        .eq('organization_id', orgId)
        .eq('assigned_to', userId)
        .gte('created_at', yesterday)
        .not('ai_category', 'in', '("spam","promo","notification")')
    )
    const newDeadlines = await safeQuery('newDL', () =>
      supabase.from('matter_deadlines')
        .select('title, matter:matters(reference)')
        .in('matter_id', safeMatterIds)
        .gte('created_at', yesterday)
    )
    const approvedBudgets = await safeQuery('budgets', () =>
      supabase.from('bulk_instructions')
        .select('title, crm_account:crm_accounts(name)')
        .eq('organization_id', orgId)
        .in('crm_account_id', safeAccountIds)
        .not('quote_approved_at', 'is', null)
        .gte('quote_approved_at', yesterday)
    )

    // CLIENT RISK RADAR (solo IP_GENIUS)
    let clientRisks: any[] = []
    if (hasIPGenius) {
      const riskMsgs = await safeQuery('riskMsgs', () =>
        supabase.from('incoming_messages')
          .select('sender_name, subject, account:crm_accounts(name), created_at')
          .eq('organization_id', orgId)
          .eq('assigned_to', userId)
          .gte('ai_urgency_score', 7)
          .eq('status', 'awaiting_approval')
          .lt('created_at', yesterday)
      )
      const riskInstr = await safeQuery('riskInstr', () =>
        supabase.from('bulk_instructions')
          .select('title, crm_account:crm_accounts(name), created_at')
          .eq('organization_id', orgId)
          .in('crm_account_id', safeAccountIds)
          .is('acknowledgement_sent_at', null)
          .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      )
      clientRisks = [
        ...(riskMsgs?.map((m: any) => ({
          type: 'urgent_message',
          client: m.account?.name || m.sender_name,
          description: `Email urgente sin responder`,
          severity: 'high',
          action_url: '/app/communications'
        })) || []),
        ...(riskInstr?.map((i: any) => ({
          type: 'no_acknowledgement',
          client: i.crm_account?.name,
          description: `Instrucción sin acuse: ${i.title}`,
          severity: 'medium',
          action_url: '/app/instructions'
        })) || [])
      ].slice(0, 5)
    }

    // INBOX
    const pendingMsgs = await safeQuery('inbox', () =>
      supabase.from('incoming_messages')
        .select('ai_category, channel')
        .eq('organization_id', orgId)
        .eq('assigned_to', userId)
        .in('status', ['pending', 'awaiting_approval'])
        .not('ai_category', 'in', '("spam","promo","notification")')
    )
    const inboxData = {
      total: pendingMsgs?.length || 0,
      instructions: pendingMsgs?.filter((m: any) => m.ai_category === 'instruction').length || 0,
      urgent: pendingMsgs?.filter((m: any) => m.ai_category === 'urgent').length || 0,
      queries: pendingMsgs?.filter((m: any) => m.ai_category === 'query').length || 0,
      admin: pendingMsgs?.filter((m: any) => m.ai_category === 'admin').length || 0,
      by_channel: {
        email: pendingMsgs?.filter((m: any) => m.channel === 'email').length || 0,
        whatsapp: pendingMsgs?.filter((m: any) => m.channel === 'whatsapp').length || 0
      }
    }

    // Añadir mensajes urgentes a briefingItems
    pendingMsgs?.filter((m: any) => m.ai_category === 'urgent')
      .forEach((m: any, i: number) => {
        briefingItems.push({
          item_id: `message-urgent-${i}`,
          item_type: 'message',
          item_title: 'Mensaje urgente sin procesar',
          severity: 'urgent',
          status: 'pending',
          action_url: '/app/communications'
        })
      })

    // AGENDA
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const agenda = await safeQuery('agenda', () =>
      supabase.from('calendar_events')
        .select('title, start_at, end_at, event_type, color, matter:matters(reference)')
        .eq('organization_id', orgId)
        .gte('start_at', todayStart.toISOString())
        .lte('start_at', todayEnd.toISOString())
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true })
        .limit(8)
    )

    // APROBACIONES
    const approvals = await safeQuery('approvals', () =>
      supabase.from('pending_approvals')
        .select('id, title, urgency_level, expires_at, account:crm_accounts(name)')
        .eq('organization_id', orgId)
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .order('urgency_level', { ascending: false })
        .limit(5)
    )

    // PORTFOLIO
    const portfolioStats = {
      total: matterIds.length,
      by_status: {
        pending: matters?.filter((m: any) => m.status === 'pending').length || 0,
        examining: matters?.filter((m: any) => m.status === 'examining').length || 0,
        office_action: matters?.filter((m: any) => m.status === 'office_action').length || 0,
        published: matters?.filter((m: any) => m.status === 'published').length || 0,
        registered: matters?.filter((m: any) => m.status === 'registered').length || 0
      },
      by_type: {
        trademark: matters?.filter((m: any) => m.type === 'trademark').length || 0,
        patent: matters?.filter((m: any) => m.type === 'patent').length || 0,
        design: matters?.filter((m: any) => m.type === 'design').length || 0
      }
    }

    // OPORTUNIDADES (solo IP_GENIUS)
    let opportunities: any[] = []
    if (hasIPGenius) {
      const trademarks = await safeQuery('trademarks', () =>
        supabase.from('trademark_assets')
          .select('mark_name, matter:matters(jurisdiction_code)')
          .in('matter_id', safeMatterIds)
      )
      const majorJ = ['US', 'EM', 'ES', 'EP', 'CN', 'GB']
      const oppMap: Record<string, string[]> = {}
      trademarks?.forEach((tm: any) => {
        if (!oppMap[tm.mark_name]) oppMap[tm.mark_name] = []
        if (tm.matter?.jurisdiction_code)
          oppMap[tm.mark_name].push(tm.matter.jurisdiction_code)
      })
      opportunities = Object.entries(oppMap)
        .map(([mark, jurisdictions]) => {
          const missing = majorJ.filter(j => !jurisdictions.includes(j))
          return missing.length > 0
            ? {
              mark, covered: jurisdictions, missing,
              estimated_value: missing.length * 800
            }
            : null
        })
        .filter(Boolean)
        .slice(0, 2) as any[]
    }

    // ADMIN STATS
    let adminStats = null
    if (profile?.role === 'admin') {
      const invoices = await safeQuery('invoices', () =>
        supabase.from('invoices')
          .select('total_amount, status')
          .eq('organization_id', orgId)
          .in('status', ['sent', 'overdue'])
      )
      adminStats = {
        pending_invoices: invoices?.length || 0,
        pending_amount: invoices?.reduce(
          (s: number, i: any) => s + (i.total_amount || 0), 0
        ) || 0,
        overdue: invoices?.filter((i: any) => i.status === 'overdue').length || 0
      }
    }

    // CONSTRUIR content_json
    const totalFatal = urgentItems.fatal.length
    const totalCritical = urgentItems.critical.length
    const totalUrgent = totalFatal + totalCritical

    const contentJson = {
      generated_at: new Date().toISOString(),
      has_ip_genius: hasIPGenius,
      user_name: profile?.first_name || 'Usuario',
      role: profile?.role,
      health_score: healthScore,
      health_dimensions: healthDimensions,
      whats_new: {
        new_messages: newMessages?.length || 0,
        new_deadlines: newDeadlines?.map((d: any) => ({
          title: d.title, matter_ref: d.matter?.reference
        })) || [],
        approved_budgets: approvedBudgets?.map((b: any) => ({
          title: b.title, client: b.crm_account?.name
        })) || []
      },
      sections: {
        urgent: urgentItems,
        client_risks: clientRisks,
        inbox: inboxData,
        agenda: agenda?.map((e: any) => ({
          title: e.title, start_at: e.start_at, end_at: e.end_at,
          type: e.event_type, color: e.color,
          matter_ref: e.matter?.reference
        })),
        approvals: {
          count: approvals?.length || 0,
          items: approvals?.map((a: any) => ({
            id: a.id, title: a.title, urgency: a.urgency_level,
            client: a.account?.name, expires_at: a.expires_at
          }))
        },
        portfolio: portfolioStats,
        opportunities,
        admin: adminStats
      }
    }

    // UPSERT BRIEFING
    const { data: savedBriefing } = await supabase
      .from('genius_daily_briefings')
      .upsert({
        organization_id: orgId,
        user_id: userId,
        briefing_date: today,
        content_json: contentJson,
        total_items: (pendingMsgs?.length || 0) +
          (agenda?.length || 0) +
          (approvals?.length || 0),
        urgent_items: totalUrgent,
        was_read: false,
        model_used: hasIPGenius ? 'ip_genius_v3' : 'data_aggregation_v3',
        generation_seconds: (Date.now() - startTime) / 1000
      }, {
        onConflict: 'organization_id,user_id,briefing_date'
      })
      .select('id')
      .single()

    // INSERTAR briefing_item_resolutions
    if (savedBriefing?.id && briefingItems.length > 0) {
      const resolutionItems = briefingItems.map((item: any) => ({
        organization_id: orgId,
        briefing_id: savedBriefing.id,
        briefing_date: today,
        user_id: userId,
        item_id: item.item_id,
        item_type: item.item_type,
        item_ref: item.item_ref || null,
        item_title: item.item_title,
        item_source_id: item.item_source_id || null,
        severity: item.severity,
        days_remaining_at_briefing: item.days_remaining_at_briefing || null,
        status: 'pending'
      }))

      await supabase
        .from('briefing_item_resolutions')
        .upsert(resolutionItems, {
          onConflict: 'briefing_id,item_id',
          ignoreDuplicates: true
        })
    }

    // NOTIFICACIÓN IDEMPOTENTE
    const todayStartStr = todayStart.toISOString()
    await supabase.from('notifications').delete()
      .eq('user_id', userId)
      .eq('type', 'briefing')
      .gte('created_at', todayStartStr)

    await supabase.from('notifications').insert({
      organization_id: orgId,
      user_id: userId,
      title: totalUrgent > 0
        ? `🌅 Buenos días ${profile?.first_name} — ${totalFatal > 0 ? '⚠️ ' + totalFatal + ' FATALES' : totalCritical + ' urgentes'}`
        : `🌅 Buenos días ${profile?.first_name} — ${inboxData.total} mensajes pendientes`,
      body: urgentItems.fatal[0]
        ? `⛔ FATAL: ${urgentItems.fatal[0].matter_ref} — ${urgentItems.fatal[0].title}${urgentItems.fatal[0].is_non_extensible ? ' (SIN PRÓRROGA)' : ''}`
        : urgentItems.critical[0]
          ? `🔴 ${urgentItems.critical[0].matter_ref}: vence en ${urgentItems.critical[0].days_remaining} días`
          : `${inboxData.total} mensajes esperan atención`,
      type: 'briefing',
      priority: totalFatal > 0 ? 'critical' : totalCritical > 0 ? 'high' : 'normal',
      action_url: '/app/briefing',
      action_label: 'Ver briefing',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        urgent_items: totalUrgent,
        health_score: healthScore,
        has_ip_genius: hasIPGenius,
        briefing_id: savedBriefing?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Briefing] Fatal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message, stack: error.stack?.slice(0, 500) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
