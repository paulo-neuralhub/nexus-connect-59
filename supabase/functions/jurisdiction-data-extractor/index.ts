import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALIDATION_RULES = {
  MIN_CONFIDENCE_TO_USE: 0.80,
  AUTO_APPROVE_MAX_CHANGE_PCT: 15,
  REJECT_IF_CHANGE_PCT_ABOVE: 50,
  MIN_FEE_EUR: 10,
  MAX_FEE_EUR: 50000,
} as const

interface ExtractedFee {
  service_type: string
  canonical_key: string
  fee_class_1: number
  fee_additional_class: number | null
  currency: string
  confidence: number
  source_evidence: string
  source_url?: string
  valid_from?: string
  valid_until?: string
}

interface ValidationResult {
  service_type: string
  canonical_key: string
  old_value: number | null
  new_value: number
  change_pct: number | null
  confidence: number
  decision: 'auto_approve' | 'needs_review' | 'reject'
  decision_reason: string
}

function calcChangePct(oldVal: number | null, newVal: number): number | null {
  if (oldVal === null || oldVal === 0) return null
  return Math.abs((newVal - oldVal) / oldVal * 100)
}

function validateFee(extracted: ExtractedFee, currentFee: any | null): ValidationResult {
  const oldValue = currentFee?.classes_1_fee ?? null
  const newValue = extracted.fee_class_1
  const changePct = calcChangePct(oldValue, newValue)

  if (extracted.confidence < VALIDATION_RULES.MIN_CONFIDENCE_TO_USE) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'reject', decision_reason: `Confianza ${extracted.confidence} < mínimo ${VALIDATION_RULES.MIN_CONFIDENCE_TO_USE}` }
  }

  if (newValue < VALIDATION_RULES.MIN_FEE_EUR || newValue > VALIDATION_RULES.MAX_FEE_EUR) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'reject', decision_reason: `Valor €${newValue} fuera del rango válido (€${VALIDATION_RULES.MIN_FEE_EUR}-€${VALIDATION_RULES.MAX_FEE_EUR}).` }
  }

  if (currentFee === null) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: null, new_value: newValue, change_pct: null, confidence: extracted.confidence, decision: 'needs_review', decision_reason: 'Primer dato para esta jurisdicción+servicio. Verificación humana requerida.' }
  }

  if (changePct !== null && changePct < 0.1) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'auto_approve', decision_reason: 'Sin cambio detectado (variación < 0.1%). Confirmado sin cambios.' }
  }

  if (changePct !== null && changePct > VALIDATION_RULES.REJECT_IF_CHANGE_PCT_ABOVE) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'reject', decision_reason: `Cambio de ${changePct.toFixed(1)}% supera umbral de rechazo (${VALIDATION_RULES.REJECT_IF_CHANGE_PCT_ABOVE}%).` }
  }

  if (changePct !== null && changePct <= VALIDATION_RULES.AUTO_APPROVE_MAX_CHANGE_PCT && extracted.confidence >= 0.90) {
    return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'auto_approve', decision_reason: `Cambio de ${changePct.toFixed(1)}% dentro del umbral y confianza alta (${extracted.confidence}). Auto-aprobado.` }
  }

  return { service_type: extracted.service_type, canonical_key: extracted.canonical_key, old_value: oldValue, new_value: newValue, change_pct: changePct, confidence: extracted.confidence, decision: 'needs_review', decision_reason: changePct !== null ? `Cambio de ${changePct.toFixed(1)}% requiere verificación humana antes de aplicar.` : 'Situación no prevista — revisión humana por precaución.' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now()
  let requestBody: any = {}

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    requestBody = await req.json()
    const { job_id, office_code, extraction_method, primary_url, verification_url, extraction_prompt_hint, ipo_office_id, dry_run = false } = requestBody

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    // 1. Get current fees
    const { data: currentFees } = await supabase
      .from('jurisdiction_fees')
      .select('*')
      .eq('ipo_office_id', ipo_office_id)
      .eq('is_active', true)

    const currentFeesMap = Object.fromEntries(
      (currentFees || []).map((f: any) => [f.canonical_key, f])
    )

    // 2. Extract data with Claude
    const extractionSystem = `Eres un extractor especializado en tasas oficiales de propiedad intelectual.

MISIÓN: Extraer tasas de registro de marcas de fuentes oficiales.

REGLAS ABSOLUTAS:
1. Solo usas la información que encuentras en las fuentes. NUNCA inventas valores. Si no encuentras un dato → confidence 0.5.
2. Las tasas oficiales son las que cobra la OFICINA, no honorarios de agentes.
3. Las tasas de marcas y patentes son DIFERENTES. Solo extraes MARCAS (trademarks).

FORMATO DE RESPUESTA: Solo JSON válido, sin texto ni markdown.

{
  "office_code": "...",
  "extraction_date": "...",
  "fees": [
    {
      "service_type": "registration",
      "canonical_key": "REGISTER_1CLASS",
      "fee_class_1": 850.00,
      "fee_additional_class": 50.00,
      "currency": "EUR",
      "confidence": 0.95,
      "source_evidence": "Encontrado en tabla 'EUTM fees': €850",
      "source_url": "https://...",
      "valid_from": "2024-01-01",
      "valid_until": null
    }
  ],
  "extraction_notes": "Observaciones"
}`

    const userMessage = `Extrae las tasas oficiales de registro de marcas de: ${office_code}

URL principal: ${primary_url}
URL verificación: ${verification_url || 'No disponible'}

Instrucciones específicas:
${extraction_prompt_hint}

canonical_keys que necesito:
- REGISTER_1CLASS → tasa de solicitud para 1 clase
- EXTRA_CLASS → tasa por clase adicional
- RENEWAL_1CLASS → tasa de renovación para 1 clase

Si no encuentras alguno → incluirlo con confidence: 0.5`

    const modelToUse = 'claude-sonnet-4-5-20250514'

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        max_tokens: 2000,
        system: extractionSystem,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userMessage }]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      throw new Error(`Anthropic API error ${claudeResponse.status}: ${errText}`)
    }

    const claudeData = await claudeResponse.json()

    const textContent = claudeData.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    let extractedData: any
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      throw new Error(`Error parsing Claude response: ${parseError}. Raw: ${textContent.substring(0, 500)}`)
    }

    if (!extractedData.fees || extractedData.fees.length === 0) {
      throw new Error('Claude no extrajo ninguna tasa')
    }

    // 3. Validate each extracted fee
    const validationResults: ValidationResult[] = extractedData.fees.map((fee: ExtractedFee) =>
      validateFee(fee, currentFeesMap[fee.canonical_key] || null)
    )

    const autoApproved = validationResults.filter(r => r.decision === 'auto_approve' && r.change_pct !== null && r.change_pct >= 0.1)
    const needsReview = validationResults.filter(r => r.decision === 'needs_review')
    const rejected = validationResults.filter(r => r.decision === 'reject')
    const unchanged = validationResults.filter(r => r.decision === 'auto_approve' && (r.change_pct === null || r.change_pct < 0.1))

    const processingMs = Date.now() - startTime

    // 4. Apply auto-approved changes
    if (!dry_run && autoApproved.length > 0) {
      for (const result of autoApproved) {
        const extractedFee = extractedData.fees.find((f: ExtractedFee) => f.canonical_key === result.canonical_key)
        if (!extractedFee) continue

        await supabase
          .from('jurisdiction_fees')
          .upsert({
            ipo_office_id,
            service_type: result.service_type,
            canonical_key: result.canonical_key,
            classes_1_fee: result.new_value,
            class_additional_fee: extractedFee.fee_additional_class,
            currency: extractedFee.currency,
            confidence: extractedFee.confidence,
            fee_type: 'official',
            source_url: extractedFee.source_url || primary_url,
            source_name: `Auto-extraído ${office_code} — ${new Date().toISOString().split('T')[0]}`,
            extraction_method,
            last_verified_at: new Date().toISOString(),
            verified_by: 'auto_extractor_v1',
            valid_from: extractedFee.valid_from || null,
            valid_until: extractedFee.valid_until || null,
            is_active: true,
            notes: result.decision_reason
          }, { onConflict: 'ipo_office_id,canonical_key' })
      }
    }

    // 5. Log items needing human review
    if (!dry_run && needsReview.length > 0) {
      await supabase.from('jurisdiction_updates_log').insert(
        needsReview.map(result => ({
          ipo_office_id,
          check_type: 'scheduled',
          had_changes: true,
          changes_detected: result,
          auto_approved: false,
          requires_human_review: true,
          review_reason: result.decision_reason,
          raw_extraction: extractedData,
          processing_ms: processingMs
        }))
      )
    }

    // 6. Update job status
    const jobStatus = needsReview.length > 0 ? 'needs_review' : 'completed'

    if (!dry_run && job_id) {
      await supabase
        .from('jurisdiction_update_queue')
        .update({
          status: jobStatus,
          completed_at: new Date().toISOString(),
          extracted_data: extractedData,
          changes_detected: validationResults,
          auto_approved_count: autoApproved.length,
          needs_review_count: needsReview.length,
          rejected_count: rejected.length,
          admin_notified: false
        })
        .eq('id', job_id)
    }

    return new Response(JSON.stringify({
      success: true,
      dry_run,
      office_code,
      processing_ms: Date.now() - startTime,
      summary: {
        fees_extracted: extractedData.fees.length,
        auto_approved: autoApproved.length,
        needs_review: needsReview.length,
        rejected: rejected.length,
        unchanged: unchanged.length
      },
      validation_results: validationResults,
      needs_review_details: needsReview,
      extraction_notes: extractedData.extraction_notes
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Extractor error:', error)

    if (requestBody.job_id) {
      try {
        await supabase
          .from('jurisdiction_update_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', requestBody.job_id)
      } catch (updateErr) {
        console.error('Failed to update job status:', updateErr)
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      office_code: requestBody.office_code || 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
