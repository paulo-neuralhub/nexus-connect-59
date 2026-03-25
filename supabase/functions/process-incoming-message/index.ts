import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

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

      const systemPrompt = `Eres IP-GENIUS, el asistente especializado en Propiedad Intelectual de IP-NEXUS. Recibes mensajes de clientes (emails, WhatsApp) y los analizas con precisión legal.

Tu tarea es analizar el mensaje y devolver ÚNICAMENTE un JSON con esta estructura exacta:

{
  "category": "instruction" | "query" | "urgent" | "admin" | "spam",
  "urgency_score": 1-10,
  "summary": "Resumen ejecutivo en máximo 2 frases",
  "proposed_action": "Acción concreta que debe tomar el agente",
  "draft_response": "Borrador de respuesta al cliente (opcional, solo si es query simple)",
  "entities": {
    "marks": ["nombres de marcas mencionadas"],
    "jurisdictions": ["países o oficinas mencionadas"],
    "nice_classes": [],
    "deadlines": ["fechas o plazos mencionados"]
  },
  "is_instruction": true | false,
  "instruction_type": "trademark_registration" | "trademark_renewal" | "patent_prosecution" | "other" | null,
  "instruction_details": {
    "mark_name": null,
    "jurisdictions": [],
    "nice_classes": [],
    "description": null
  }
}

REGLAS:
- category "instruction": el cliente solicita un servicio formal
- category "query": pregunta de estado o información
- category "urgent": OA recibida, plazo inminente, emergencia legal
- category "admin": factura, dirección, datos de contacto
- urgency_score 9-10: plazo < 7 días o acción legal inminente
- urgency_score 7-8: plazo < 30 días o instrucción urgente
- urgency_score 4-6: instrucción normal o consulta importante
- urgency_score 1-3: consulta rutinaria o admin
- NUNCA inventes datos que no estén en el mensaje
- Responde SOLO con JSON, sin texto adicional`

      const userPrompt = `Cliente: ${message.account?.name || 'Desconocido'}
Canal: ${message.channel}
Remitente: ${message.sender_name || 'Desconocido'}
${message.subject ? `Asunto: ${message.subject}` : ''}

Mensaje:
${message.body || '(sin contenido)'}`

      let analysis: any
      try {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            temperature: 0.1,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        const anthropicData = await anthropicResponse.json()
        const rawText = anthropicData.content?.[0]?.text?.trim() || ''
        const cleanJson = rawText.replace(/```json|```/g, '').trim()
        analysis = JSON.parse(cleanJson)
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

      // Update incoming_messages
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
