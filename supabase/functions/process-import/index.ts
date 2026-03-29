import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ── Entity field definitions ─────────────────────────────
const ENTITY_FIELDS: Record<string, Record<string, string>> = {
  matters: {
    mark_name: 'Nombre de la marca',
    reference: 'Referencia interna (ej: TM-2024-001)',
    status: 'Estado (pending/examining/published/registered)',
    filing_date: 'Fecha de presentación',
    registration_date: 'Fecha de registro',
    expiry_date: 'Fecha de vencimiento/renovación',
    jurisdiction: 'Jurisdicción (código ISO país)',
    nice_classes: 'Clases de Niza (números separados por coma)',
    applicant_name: 'Nombre del titular/solicitante',
    agent_reference: 'Referencia del agente externo',
    matter_type: 'Tipo (trademark/patent/design/copyright)',
    description: 'Descripción o notas',
  },
  contacts: {
    name: 'Nombre completo',
    email: 'Email',
    phone: 'Teléfono',
    company: 'Empresa',
    country: 'País',
    contact_type: 'Tipo (client/agent/examiner/other)',
    notes: 'Notas',
  },
  crm_accounts: {
    name: 'Nombre de la empresa/cuenta',
    email: 'Email principal',
    phone: 'Teléfono',
    country: 'País',
    industry: 'Industria/sector',
    website: 'Sitio web',
    notes: 'Notas',
  },
}

const STATUS_MAP: Record<string, string> = {
  'registered': 'registered',
  'registrada': 'registered',
  'active': 'registered',
  'activa': 'registered',
  'pending': 'pending',
  'pendiente': 'pending',
  'filed': 'pending',
  'presentada': 'pending',
  'examining': 'examining',
  'examinando': 'examining',
  'under examination': 'examining',
  'published': 'published',
  'publicada': 'published',
  'opposed': 'examining',
  'abandoned': 'pending',
  'abandonada': 'pending',
}

// ── Auth helper ──────────────────────────────────────────
async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

// ── PHASE A: PARSE ───────────────────────────────────────
async function parseFile(params: {
  job_id: string
  file_url: string
  file_type: string
  organization_id: string
}) {
  const { job_id, file_url, file_type } = params

  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage.from('imports').download(file_url)

  if (downloadError) throw new Error(`Error descargando archivo: ${downloadError.message}`)

  const arrayBuffer = await fileData.arrayBuffer()
  let columns: string[] = []
  let preview: any[][] = []

  if (file_type === 'csv') {
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length === 0) throw new Error('Archivo CSV vacío')
    const separator = lines[0].includes(';') ? ';' : ','
    columns = lines[0].split(separator).map(c => c.trim().replace(/"/g, ''))
    preview = lines.slice(1, 11).map(line =>
      line.split(separator).map(c => c.trim().replace(/"/g, ''))
    )
  } else {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
    if (data.length === 0) throw new Error('Archivo Excel vacío')
    columns = (data[0] as string[]).map(c => String(c || '').trim())
    preview = data.slice(1, 11)
  }

  columns = columns.filter(c => c && c.length > 0)

  await supabaseAdmin
    .from('import_jobs')
    .update({
      status: 'mapping',
      metadata: { detected_columns: columns, preview_rows: preview, file_type, total_rows_estimate: preview.length },
      updated_at: new Date().toISOString(),
    })
    .eq('id', job_id)

  return { columns, preview }
}

// ── PHASE B: AI MAPPING ──────────────────────────────────
async function mapFields(params: {
  job_id: string
  detected_columns: string[]
  entity_type: string
}) {
  const { job_id, detected_columns, entity_type } = params
  const availableFields = ENTITY_FIELDS[entity_type] || ENTITY_FIELDS.matters

  const fieldsList = Object.entries(availableFields)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join('\n')

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Eres un experto en sistemas de gestión de propiedad intelectual.

Tienes estas columnas de un archivo importado:
${detected_columns.map(c => `- "${c}"`).join('\n')}

Mapéalas a los campos de IP-NEXUS para la entidad "${entity_type}".

Columnas típicas de sistemas PI como Anaqua, PatSnap o CPA Global suelen llamarse:
- 'Mark Name', 'Brand', 'Trademark' → mark_name
- 'App. Number', 'Application No', 'File No' → reference
- 'Filing Date', 'Application Date' → filing_date
- 'Reg. Date', 'Registration Date' → registration_date
- 'Renewal Date', 'Expiry Date', 'Expiration' → expiry_date
- 'Country', 'Territory', 'Jurisdiction' → jurisdiction
- 'Class', 'Classes', 'Nice Classes', 'Goods' → nice_classes
- 'Owner', 'Applicant', 'Holder' → applicant_name
- 'Status', 'State', 'Stage' → status
- 'Agent Ref', 'Our Ref', 'File Ref' → agent_reference

Campos disponibles:
${fieldsList}

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "mapping": {
    "columna_original": "campo_ip_nexus_o_null"
  },
  "confidence": 0.87,
  "unmapped": ["columnas sin mapeo claro"]
}

Si una columna no tiene mapeo claro, usar null como valor.
confidence es un número entre 0 y 1.`
      }]
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${err}`)
  }

  const message = await response.json()
  const responseText = (message.content[0] as any).text.trim()
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const aiResult = JSON.parse(cleanJson)

  await supabaseAdmin
    .from('import_jobs')
    .update({
      mapping: {
        ai_mapping: aiResult.mapping,
        confidence: aiResult.confidence,
        unmapped_columns: aiResult.unmapped || [],
        entity_type,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', job_id)

  return aiResult
}

// ── PHASE C: IMPORT ──────────────────────────────────────
async function importData(params: {
  job_id: string
  confirmed_mapping: Record<string, string>
  entity_type: string
  organization_id: string
}) {
  const { job_id, confirmed_mapping, entity_type, organization_id } = params

  const { data: job } = await supabaseAdmin
    .from('import_jobs')
    .select('source_file_url, metadata')
    .eq('id', job_id)
    .single()

  if (!job) throw new Error('Job no encontrado')

  const { data: fileData } = await supabaseAdmin
    .storage.from('imports').download(job.source_file_url)

  const arrayBuffer = await fileData!.arrayBuffer()
  const fileType = job.source_file_url.split('.').pop()

  let allRows: any[][] = []
  let headers: string[] = []

  if (fileType === 'csv') {
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split('\n').filter(l => l.trim())
    const separator = lines[0].includes(';') ? ';' : ','
    headers = lines[0].split(separator).map(c => c.trim().replace(/"/g, ''))
    allRows = lines.slice(1).map(line =>
      line.split(separator).map(c => c.trim().replace(/"/g, ''))
    )
  } else {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
    headers = (data[0] as string[]).map(c => String(c || '').trim())
    allRows = data.slice(1)
  }

  let processed = 0
  let failed = 0
  let duplicates = 0
  const errors: any[] = []

  await supabaseAdmin
    .from('import_jobs')
    .update({ status: 'importing', records_total: allRows.length, started_at: new Date().toISOString() })
    .eq('id', job_id)

  for (const row of allRows) {
    try {
      const mapped: Record<string, any> = { organization_id }

      for (const [sourceCol, targetField] of Object.entries(confirmed_mapping)) {
        if (!targetField || targetField === 'null') continue
        const colIndex = headers.indexOf(sourceCol)
        if (colIndex === -1) continue

        let value = row[colIndex]
        if (value === undefined || value === null || value === '') continue
        value = String(value).trim()

        if (targetField === 'status') {
          value = STATUS_MAP[value.toLowerCase()] || 'pending'
        } else if (targetField === 'nice_classes') {
          value = value.split(/[,;]/).map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n))
        } else if (['filing_date', 'registration_date', 'expiry_date'].includes(targetField)) {
          const date = new Date(value)
          if (!isNaN(date.getTime())) { value = date.toISOString() } else { continue }
        }

        mapped[targetField] = value
      }

      // Sincronizar title con mark_name para matters
      if (entity_type === 'matters') {
        if (mapped.mark_name && !mapped.title) {
          mapped.title = mapped.mark_name
        }
        if (mapped.title && !mapped.mark_name) {
          mapped.mark_name = mapped.title
        }
        if (!mapped.title && !mapped.mark_name) {
          errors.push({ row: processed + failed, error: 'Falta nombre de marca (mark_name/title)' })
          failed++
          continue
        }
      }

      if (entity_type === 'matters' && mapped.reference) {
        const { data: existing } = await supabaseAdmin
          .from('matters').select('id')
          .eq('organization_id', organization_id)
          .eq('reference', mapped.reference)
          .maybeSingle()

        if (existing) {
          await supabaseAdmin.from('import_review_queue').insert({
            organization_id, import_job_id: job_id,
            entity_type, proposed_data: mapped,
            conflict_type: 'duplicate', status: 'pending',
          })
          duplicates++
          continue
        }
      }

      const table = entity_type === 'matters' ? 'matters'
        : entity_type === 'contacts' ? 'contacts' : 'crm_accounts'

      // F1: UPSERT — si tiene reference existente → UPDATE, si no → INSERT
      let insertError = null
      if (entity_type === 'matters' && mapped.reference) {
        const { data: existing } = await supabaseAdmin
          .from('matters')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('reference', mapped.reference)
          .maybeSingle()

        if (existing) {
          const { id, organization_id: _org, ...updateData } = mapped
          const { error } = await supabaseAdmin
            .from('matters')
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
          insertError = error
        } else {
          const { error } = await supabaseAdmin.from(table).insert(mapped)
          insertError = error
        }
      } else {
        const { error } = await supabaseAdmin.from(table).insert(mapped)
        insertError = error
      }

      if (insertError) {
        errors.push({ row: processed + failed, error: insertError.message })
        failed++
      } else {
        processed++
      }

      if ((processed + failed) % 50 === 0) {
        await supabaseAdmin.from('import_jobs')
          .update({ records_processed: processed, records_failed: failed })
          .eq('id', job_id)
      }
    } catch (rowError: any) {
      errors.push({ row: processed + failed, error: rowError.message })
      failed++
    }
  }

  const finalStatus = failed === 0 ? 'completed' : 'completed_with_errors'

  await supabaseAdmin.from('import_jobs').update({
    status: finalStatus,
    records_total: allRows.length,
    records_processed: processed,
    records_failed: failed,
    error_log: errors.length > 0 ? errors : null,
    completed_at: new Date().toISOString(),
    metadata: { ...((job.metadata as any) || {}), duplicates_found: duplicates, final_status: finalStatus },
  }).eq('id', job_id)

  return { total: allRows.length, processed, failed, duplicates, errors: errors.slice(0, 20) }
}

// ── MAIN HANDLER ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    await authenticateRequest(req)

    const body = await req.json()
    const { action } = body
    let result

    if (action === 'parse') {
      result = await parseFile(body)
    } else if (action === 'map') {
      result = await mapFields(body)
    } else if (action === 'import') {
      result = await importData(body)
    } else {
      throw new Error(`Acción desconocida: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[process-import] Error:', error)
    const status = error.message === 'Unauthorized' ? 401 : 500
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
