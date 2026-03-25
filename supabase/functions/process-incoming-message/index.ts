import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ── Helper: read prompt + model config from DB ──
async function getPromptFromDB(
  supabase: any,
  taskType: string
): Promise<{ systemPrompt: string; userTemplate: string; model: string; maxTokens: number; temperature: number } | null> {
  const { data: prompt } = await supabase
    .from('ai_prompt_templates')
    .select('system_prompt, user_prompt_template')
    .eq('task_type', taskType)
    .eq('is_active', true)
    .single()

  const { data: task } = await supabase
    .from('ai_tasks')
    .select('primary_model, temperature, max_tokens')
    .eq('task_code', taskType)
    .eq('is_active', true)
    .single()

  if (!prompt || !task) return null

  return {
    systemPrompt: prompt.system_prompt,
    userTemplate: prompt.user_prompt_template,
    model: task.primary_model,
    maxTokens: task.max_tokens || 1000,
    temperature: task.temperature || 0.1,
  }
}

// ── Helper: fill {{var}} placeholders ──
function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
  }
  return result
}

// ── Helper: generic Claude call ──
async function callClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text?.trim() || ''
}

// ── Hardcoded fallback system prompt (used if DB has no SPAM_FILTER prompt) ──
const FALLBACK_SPAM_SYSTEM = `You classify emails. Return JSON: {"type":"business"|"spam"|"promo"|"notification","confidence":0.0-1.0}. Only JSON, no extra text.`
const FALLBACK_IP_SYSTEM = `Eres IP-GENIUS, el asistente especializado en Propiedad Intelectual de IP-NEXUS. Analizas mensajes de clientes y devuelves ÚNICAMENTE JSON con: category, urgency_score, summary, proposed_action, draft_response, entities, is_instruction, instruction_type, instruction_details.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { message_id, process_all_pending } = await req.json()

    let messages: any[] = []

    if (message_id) {
      const { data } = await supabase
        .from('incoming_messages')
        .select(`*, account:crm_accounts(id, name, discount_pct, tier)`)
        .eq('id', message_id)
        .single()
      if (data) messages = [data]
    } else if (process_all_pending) {
      const { data } = await supabase
        .from('incoming_messages')
        .select(`*, account:crm_accounts(id, name, discount_pct, tier)`)
        .eq('status', 'pending')
        .is('ai_category', null)
        .limit(20)
      messages = data || []
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: any[] = []

    for (const message of messages) {
      // Mark as processing
      await supabase
        .from('incoming_messages')
        .update({ status: 'processing' })
        .eq('id', message.id)

      // ═══════════════════════════════════════
      // NIVEL 1: SPAM FILTER
      // ═══════════════════════════════════════

      // Check whitelist: known contact in CRM → skip spam filter
      const isKnownContact = message.sender_email
        ? await supabase
            .from('contacts')
            .select('id')
            .ilike('email', message.sender_email)
            .eq('organization_id', message.organization_id)
            .maybeSingle()
        : { data: null }

      const skipSpamFilter = !!isKnownContact.data

      let messageType = 'business' // safe default

      if (!skipSpamFilter && message.sender_email) {
        const spamConfig = await getPromptFromDB(supabase, 'SPAM_FILTER')

        const senderDomain = message.sender_email.split('@')[1] || ''
        const bodyPreview = (message.body || '').split(' ').slice(0, 50).join(' ')

        const systemPrompt = spamConfig?.systemPrompt || FALLBACK_SPAM_SYSTEM
        const userPrompt = spamConfig
          ? fillTemplate(spamConfig.userTemplate, {
              sender_email: message.sender_email || '',
              sender_domain: senderDomain,
              is_known_contact: 'NO',
              subject: message.subject || '',
              body_preview: bodyPreview,
            })
          : `From: ${message.sender_email}\nSubject: ${message.subject || ''}\nBody preview: ${bodyPreview}`

        const model = spamConfig?.model || 'claude-haiku-4-5-20251001'
        const maxTokens = spamConfig?.maxTokens || 150
        const temperature = spamConfig?.temperature || 0.1

        try {
          const rawResult = await callClaude(anthropicKey, model, systemPrompt, userPrompt, maxTokens, temperature)
          const spamResult = JSON.parse(rawResult.replace(/```json|```/g, '').trim())
          messageType = spamResult.type || 'business'
        } catch {
          messageType = 'business' // If fails → treat as business
        }
      }

      // If spam/promo/notification → archive without deep analysis
      if (messageType !== 'business') {
        await supabase
          .from('incoming_messages')
          .update({
            status: 'archived',
            ai_category: messageType,
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', message.id)

        results.push({
          message_id: message.id,
          filtered_as: messageType,
          processed: false,
          success: true,
        })
        continue // Next message
      }

      // ═══════════════════════════════════════
      // NIVEL 2: DEEP IP ANALYSIS (business only)
      // ═══════════════════════════════════════

      // Load org context
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', message.organization_id)
        .single()

      // Load active matters for thread matching
      const { data: matters } = await supabase
        .from('matters')
        .select('reference, title, type, status')
        .eq('crm_account_id', message.account_id)
        .in('status', ['pending', 'examining', 'office_action', 'published'])
        .limit(10)

      const mattersList = matters?.map((m: any) =>
        `${m.reference}: ${m.title} (${m.type}, ${m.status})`
      ).join('\n') || 'Sin expedientes activos'

      // Get IP classification prompt from DB
      const ipConfig = await getPromptFromDB(supabase, 'EMAIL_CLASSIFICATION_IP')

      const ipSystemPrompt = ipConfig?.systemPrompt || FALLBACK_IP_SYSTEM
      const ipUserPrompt = ipConfig
        ? fillTemplate(ipConfig.userTemplate, {
            org_name: org?.name || '',
            main_jurisdictions: 'EU, ES, US, EP',
            account_name: message.account?.name || 'Desconocido',
            channel: message.channel || 'email',
            sender_name: message.sender_name || '',
            sender_email: message.sender_email || '',
            subject_line: message.subject ? `Asunto: ${message.subject}` : '',
            body: message.body || '',
          })
        : `Cliente: ${message.account?.name || 'Desconocido'}\nCanal: ${message.channel}\nRemitente: ${message.sender_name || 'Desconocido'}\n${message.subject ? `Asunto: ${message.subject}` : ''}\n\nMensaje:\n${message.body || '(sin contenido)'}`

      const ipModel = ipConfig?.model || 'claude-sonnet-4-5-20250929'
      const ipMaxTokens = ipConfig?.maxTokens || 1000
      const ipTemperature = ipConfig?.temperature || 0.1

      let analysis: any
      try {
        const rawAnalysis = await callClaude(anthropicKey, ipModel, ipSystemPrompt, ipUserPrompt, ipMaxTokens, ipTemperature)
        analysis = JSON.parse(rawAnalysis.replace(/```json|```/g, '').trim())
      } catch (parseErr) {
        console.error('Claude parse error:', parseErr)
        analysis = {
          category: 'query',
          urgency_score: 3,
          summary: 'No se pudo analizar automáticamente',
          proposed_action: 'Revisar manualmente',
          is_instruction: false,
        }
      }

      // ── NIVEL 2B: THREAD MATCHER (if matters exist) ──
      let matchedMatterRef = null
      if (matters && matters.length > 0) {
        const threadConfig = await getPromptFromDB(supabase, 'EMAIL_THREAD_MATCHER')

        if (threadConfig) {
          const threadPrompt = fillTemplate(threadConfig.userTemplate, {
            matters_list: mattersList,
            body: message.body || '',
          })

          try {
            const threadRaw = await callClaude(
              anthropicKey, threadConfig.model, threadConfig.systemPrompt,
              threadPrompt, threadConfig.maxTokens, threadConfig.temperature
            )
            const threadResult = JSON.parse(threadRaw.replace(/```json|```/g, '').trim())

            if (threadResult.confidence >= 0.6) {
              matchedMatterRef = threadResult.matched_matter_reference

              if (matchedMatterRef) {
                const { data: matter } = await supabase
                  .from('matters')
                  .select('id')
                  .eq('reference', matchedMatterRef)
                  .eq('organization_id', message.organization_id)
                  .single()

                if (matter) {
                  await supabase
                    .from('incoming_messages')
                    .update({ matter_id: matter.id })
                    .eq('id', message.id)
                }
              }
            }
          } catch { /* silent fail for thread matcher */ }
        }
      }

      // Update incoming_messages with full analysis
      await supabase
        .from('incoming_messages')
        .update({
          ai_category: analysis.category,
          ai_urgency_score: analysis.urgency_score,
          ai_summary: analysis.summary,
          ai_confidence: 0.92,
          ai_proposed_action: analysis.proposed_action,
          ai_draft_response: analysis.draft_response || null,
          ai_processed_at: new Date().toISOString(),
          status: 'awaiting_approval',
        })
        .eq('id', message.id)

      // Determine urgency level for pending_approvals
      let urgencyLevel = 'normal'
      if (analysis.urgency_score >= 9) urgencyLevel = 'critical'
      else if (analysis.urgency_score >= 7) urgencyLevel = 'urgent'
      else if (analysis.urgency_score >= 4) urgencyLevel = 'normal'
      else urgencyLevel = 'low'

      const expiresAt = new Date()
      if (urgencyLevel === 'critical') expiresAt.setHours(expiresAt.getHours() + 2)
      else if (urgencyLevel === 'urgent') expiresAt.setHours(expiresAt.getHours() + 8)
      else expiresAt.setHours(expiresAt.getHours() + 48)

      // Create pending_approval
      await supabase
        .from('pending_approvals')
        .insert({
          organization_id: message.organization_id,
          source_type: 'incoming_message',
          source_id: message.id,
          account_id: message.account_id,
          title: analysis.is_instruction
            ? `Nueva instrucción: ${analysis.instruction_details?.mark_name || analysis.summary}`
            : `${analysis.category === 'urgent' ? '🚨 URGENTE: ' : ''}${message.subject || analysis.summary}`,
          summary: analysis.summary,
          ai_analysis: JSON.stringify(analysis.entities || {}),
          ai_confidence: 0.92,
          proposed_action: analysis.proposed_action,
          proposed_data: {
            category: analysis.category,
            is_instruction: analysis.is_instruction,
            instruction_type: analysis.instruction_type,
            instruction_details: analysis.instruction_details,
            draft_response: analysis.draft_response,
            entities: analysis.entities,
          },
          urgency_level: urgencyLevel,
          expires_at: expiresAt.toISOString(),
          assigned_to: message.assigned_to,
          status: 'pending',
        })

      // If instruction → create bulk_instruction draft
      if (analysis.is_instruction && analysis.instruction_type) {
        const markName = analysis.instruction_details?.mark_name
        const jurisdictions = analysis.instruction_details?.jurisdictions || []
        const instructionTitle = markName
          ? `${markName}${jurisdictions.length > 0 ? ' — ' + jurisdictions.join(', ') : ''}`
          : analysis.summary

        const { data: newInstruction } = await supabase
          .from('bulk_instructions')
          .insert({
            organization_id: message.organization_id,
            sent_by: message.assigned_to,
            instruction_type: analysis.instruction_type,
            title: instructionTitle,
            description: message.body,
            target_type: 'account',
            target_ids: message.account_id ? [message.account_id] : [],
            status: 'draft',
            total_targets: jurisdictions.length || 1,
            executed_count: 0,
            failed_count: 0,
            is_urgent: analysis.urgency_score >= 7,
            source: message.channel,
            source_message_id: message.id,
            crm_account_id: message.account_id,
            conflict_checked: false,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (newInstruction && jurisdictions.length > 0) {
          const items = jurisdictions.map((j: string) => ({
            bulk_instruction_id: newInstruction.id,
            organization_id: message.organization_id,
            account_id: message.account_id,
            jurisdiction_code: j.toUpperCase(),
            status: 'pending',
            specific_instruction: `${instructionTitle} — ${j}`,
          }))
          await supabase.from('bulk_instruction_items').insert(items)
        }

        // Link instruction to pending_approval
        if (newInstruction) {
          await supabase
            .from('pending_approvals')
            .update({ instruction_id: newInstruction.id })
            .eq('source_id', message.id)
            .eq('source_type', 'incoming_message')
        }
      }

      results.push({
        message_id: message.id,
        category: analysis.category,
        urgency: analysis.urgency_score,
        is_instruction: analysis.is_instruction,
        matched_matter: matchedMatterRef,
        success: true,
      })
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('process-incoming-message error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
