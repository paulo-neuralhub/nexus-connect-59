import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-organization-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

Columnas típicas de sistemas PI como Anaqua, PatSnap, CPA Global o PuntoIP Galena:
- 'Mark Name', 'Brand', 'Trademark', 'Nombre', 'Denominacion' → mark_name
- 'App. Number', 'Application No', 'File No', 'Codigo', 'SolicitudNro', 'Expediente' → reference
- 'Filing Date', 'Application Date', 'SolicitudFecha', 'FechaCreacion' → filing_date
- 'Reg. Date', 'Registration Date', 'FechaRegistro' → registration_date
- 'Renewal Date', 'Expiry Date', 'Expiration', 'FechaVencimiento' → expiry_date
- 'Country', 'Territory', 'Jurisdiction', 'Paises', 'Pais' → jurisdiction
- 'Class', 'Classes', 'Nice Classes', 'Goods', 'Clases' → nice_classes
- 'Owner', 'Applicant', 'Holder', 'Cliente', 'Propietario', 'Titular' → applicant_name
- 'Status', 'State', 'Stage', 'Estado' → status
- 'Agent Ref', 'Our Ref', 'File Ref', 'OficinaResponsable' → agent_reference
- 'Type', 'Materia', 'TipoSigno' → matter_type
- 'Description', 'DescripcionFigura', 'Notas' → description

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

/**
 * Transform a value according to the target field type.
 * Shared by both file-based and scraping-based imports.
 */
function transformValue(value: any, targetField: string): any {
  if (value === undefined || value === null || value === '') return undefined
  let v = String(value).trim()

  if (targetField === 'status') {
    return STATUS_MAP[v.toLowerCase()] || 'pending'
  } else if (targetField === 'nice_classes') {
    return v.split(/[,;\s]+/).map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n))
  } else if (['filing_date', 'registration_date', 'expiry_date'].includes(targetField)) {
    // Try ISO first, then common date formats
    const date = new Date(v)
    if (!isNaN(date.getTime())) return date.toISOString()
    // Try DD/MM/YYYY (common in Spanish systems)
    const parts = v.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
    if (parts) {
      const d = new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
    return undefined // Skip unparseable dates
  } else if (targetField === 'jurisdiction') {
    // Normalize country codes: "España" → "ES", etc.
    const COUNTRY_MAP: Record<string, string> = {
      'españa': 'ES', 'spain': 'ES', 'mexico': 'MX', 'méxico': 'MX',
      'colombia': 'CO', 'argentina': 'AR', 'chile': 'CL', 'peru': 'PE',
      'perú': 'PE', 'estados unidos': 'US', 'united states': 'US',
      'eeuu': 'US', 'usa': 'US', 'european union': 'EU', 'union europea': 'EU',
      'wipo': 'WO', 'ompi': 'WO', 'internacional': 'WO',
    }
    return COUNTRY_MAP[v.toLowerCase()] || v.toUpperCase().slice(0, 2)
  }

  return v
}

/**
 * Ensure mark_name/title sync and validate required fields for matters.
 * Returns null if valid, or error string if invalid.
 */
function validateAndSyncMatter(mapped: Record<string, any>): string | null {
  if (mapped.mark_name && !mapped.title) mapped.title = mapped.mark_name
  if (mapped.title && !mapped.mark_name) mapped.mark_name = mapped.title
  if (!mapped.title && !mapped.mark_name) return 'Falta nombre de marca (mark_name/title)'
  return null
}

/**
 * Upsert a record into the appropriate table.
 * Returns { error: string | null, isDuplicate: boolean }
 */
async function upsertRecord(
  mapped: Record<string, any>,
  entity_type: string,
  organization_id: string,
): Promise<{ error: string | null; isDuplicate: boolean }> {
  const table = entity_type === 'matters' ? 'matters'
    : entity_type === 'contacts' ? 'contacts' : 'crm_accounts'

  if (entity_type === 'matters' && mapped.reference) {
    const { data: existing } = await supabaseAdmin
      .from('matters')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('reference', mapped.reference)
      .maybeSingle()

    if (existing) {
      const { id: _id, organization_id: _org, ...updateData } = mapped
      const { error } = await supabaseAdmin
        .from('matters')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      return { error: error?.message || null, isDuplicate: true }
    }
  }

  const { error } = await supabaseAdmin.from(table).insert(mapped)
  return { error: error?.message || null, isDuplicate: false }
}

/**
 * Import from file (CSV/Excel) — original Phase C.
 */
async function importData(params: {
  job_id: string
  confirmed_mapping: Record<string, string>
  entity_type: string
  organization_id: string
}) {
  const { job_id, confirmed_mapping, entity_type, organization_id } = params

  const { data: job } = await supabaseAdmin
    .from('import_jobs')
    .select('source_file_url, source_type, metadata')
    .eq('id', job_id)
    .single()

  if (!job) throw new Error('Job no encontrado')

  // ── Web scraping source: delegate to importFromScraping ──
  if (job.source_type === 'web_scraping') {
    return importFromScraping({
      job_id,
      confirmed_mapping,
      entity_type,
      organization_id,
      session_id: (job.metadata as any)?.session_id,
    })
  }

  // ── File-based source: original flow ──
  if (!job.source_file_url) throw new Error('No hay archivo de origen ni sesión de scraping')

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
        const value = transformValue(row[colIndex], targetField)
        if (value !== undefined) mapped[targetField] = value
      }

      if (entity_type === 'matters') {
        const validationError = validateAndSyncMatter(mapped)
        if (validationError) {
          errors.push({ row: processed + failed, error: validationError })
          failed++
          continue
        }
      }

      const result = await upsertRecord(mapped, entity_type, organization_id)
      if (result.isDuplicate) duplicates++
      if (result.error) {
        errors.push({ row: processed + failed, error: result.error })
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

// ── PHASE C-WEB: IMPORT FROM SCRAPING SESSION ───────────
/**
 * Import data from a web scraping session's extracted_data JSONB.
 * This is called when an import_job has source_type='web_scraping'.
 * Data comes from scraping_sessions.extracted_data instead of a file.
 */
async function importFromScraping(params: {
  job_id: string
  confirmed_mapping: Record<string, string>
  entity_type: string
  organization_id: string
  session_id?: string
}) {
  const { job_id, confirmed_mapping, entity_type, organization_id } = params

  // 1. Get the job to find the session
  const { data: job } = await supabaseAdmin
    .from('import_jobs')
    .select('metadata')
    .eq('id', job_id)
    .single()

  if (!job) throw new Error('Job no encontrado')

  const sessionId = params.session_id || (job.metadata as any)?.session_id
  if (!sessionId) throw new Error('No hay session_id vinculado al job')

  // 2. Load extracted data from the scraping session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('scraping_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) throw new Error(`Sesión no encontrada: ${sessionError?.message}`)
  if (!session.extracted_data) throw new Error('La sesión no tiene datos extraídos')

  // 3. Find the entity data — try exact key match, then fallback to first array
  const extractedData = session.extracted_data as Record<string, any>
  let records: any[] = extractedData[entity_type]
  if (!Array.isArray(records) || records.length === 0) {
    // Fallback: find first non-debug array (e.g. "matters", "marcas", etc.)
    for (const [key, value] of Object.entries(extractedData)) {
      if (!key.startsWith('_') && Array.isArray(value) && value.length > 0) {
        records = value
        console.log(`[import-from-scraping] Using "${key}" entity data (${value.length} records) for entity_type "${entity_type}"`)
        break
      }
    }
  }

  if (!records || records.length === 0) throw new Error('No hay registros en la sesión para este tipo de entidad')

  // 4. Get column names from the first record
  const headers = Object.keys(records[0]).filter(k => !k.startsWith('_'))
  console.log(`[import-from-scraping] Starting import: ${records.length} records, ${headers.length} columns, mapping: ${JSON.stringify(confirmed_mapping)}`)

  let processed = 0
  let failed = 0
  let duplicates = 0
  const errors: any[] = []

  await supabaseAdmin
    .from('import_jobs')
    .update({ status: 'importing', records_total: records.length, started_at: new Date().toISOString() })
    .eq('id', job_id)

  // 5. Process each record
  for (const record of records) {
    try {
      const mapped: Record<string, any> = { organization_id }

      for (const [sourceCol, targetField] of Object.entries(confirmed_mapping)) {
        if (!targetField || targetField === 'null') continue

        // Web scraping data is key-value (not array-indexed), read directly
        let value = record[sourceCol]
        if (value === undefined || value === null || value === '') continue

        const transformed = transformValue(value, targetField)
        if (transformed !== undefined) mapped[targetField] = transformed
      }

      // Validate entity-specific requirements
      if (entity_type === 'matters') {
        const validationError = validateAndSyncMatter(mapped)
        if (validationError) {
          errors.push({ row: processed + failed, error: validationError, record_sample: record.Nombre || record.Id })
          failed++
          continue
        }
      }

      const result = await upsertRecord(mapped, entity_type, organization_id)
      if (result.isDuplicate) duplicates++
      if (result.error) {
        errors.push({ row: processed + failed, error: result.error, record_sample: record.Nombre || record.Id })
        failed++
      } else {
        processed++
      }

      // Update progress every 50 records
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
    records_total: records.length,
    records_processed: processed,
    records_failed: failed,
    error_log: errors.length > 0 ? errors : null,
    completed_at: new Date().toISOString(),
    metadata: {
      ...((job.metadata as any) || {}),
      duplicates_found: duplicates,
      final_status: finalStatus,
      import_source: 'web_scraping',
      session_id: sessionId,
    },
  }).eq('id', job_id)

  console.log(`[import-from-scraping] Done: ${processed} ok, ${failed} failed, ${duplicates} duplicates out of ${records.length}`)

  return { total: records.length, processed, failed, duplicates, errors: errors.slice(0, 20) }
}

// ── PHASE D: CREATE FROM SCRAPING ────────────────────────
async function createFromScraping(params: {
  session_id: string
  connection_id: string
  organization_id: string
  user_id: string
}) {
  const { session_id, connection_id, organization_id, user_id } = params

  // 1. Load the scraping session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('scraping_sessions')
    .select('extracted_data, items_scraped, status')
    .eq('id', session_id)
    .single()

  if (sessionError || !session) throw new Error(`Sesión de scraping no encontrada: ${sessionError?.message}`)
  if (!session.extracted_data) throw new Error('La sesión no tiene datos extraídos')

  // 2. Separate entity data from debug data
  const entityData: Record<string, any[]> = {}
  let totalRecords = 0
  for (const [key, value] of Object.entries(session.extracted_data)) {
    if (!key.startsWith('_') && Array.isArray(value) && value.length > 0) {
      entityData[key] = value
      totalRecords += value.length
    }
  }

  if (totalRecords === 0) throw new Error('No se encontraron registros para importar')

  // 3. Create import job for each entity type with data
  const results: any[] = []
  for (const [entityType, records] of Object.entries(entityData)) {
    // Detect columns from the first record
    const sampleRecord = records[0]
    const columns = Object.keys(sampleRecord).filter(k => !k.startsWith('_'))
    if (columns.length === 0) continue

    // Create import job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('import_jobs')
      .insert({
        organization_id,
        created_by: user_id,
        source_type: 'web_scraping',
        status: 'mapping',
        records_total: records.length,
        metadata: {
          source: 'web_scraping',
          session_id,
          connection_id,
          entity_type: entityType,
          detected_columns: columns,
          preview_rows: records.slice(0, 5).map(r => columns.map(c => r[c] || '')),
          preview_records: records.slice(0, 10).map(r => {
            const clean: Record<string, any> = {}
            for (const c of columns) { if (r[c] != null && r[c] !== '') clean[c] = r[c] }
            return clean
          }),
          total_rows_estimate: records.length,
        },
      })
      .select()
      .single()

    if (jobError) {
      console.error(`[create-from-scraping] Error creating job for ${entityType}:`, jobError)
      continue
    }

    // Auto-map fields using AI
    try {
      const aiMapping = await mapFields({
        job_id: job.id,
        detected_columns: columns,
        entity_type: entityType === 'matters' ? 'matters'
          : entityType === 'contacts' ? 'contacts'
          : entityType === 'deadlines' ? 'matters' // Map deadlines to matters for now
          : 'matters',
      })

      results.push({
        entity_type: entityType,
        job_id: job.id,
        records: records.length,
        mapping: aiMapping,
      })
    } catch (mapError: any) {
      console.error(`[create-from-scraping] Mapping error for ${entityType}:`, mapError.message)
      results.push({
        entity_type: entityType,
        job_id: job.id,
        records: records.length,
        mapping_error: mapError.message,
      })
    }
  }

  // 4. Link import job(s) to scraping session
  if (results.length > 0) {
    await supabaseAdmin
      .from('scraping_sessions')
      .update({ import_job_id: results[0].job_id })
      .eq('id', session_id)
  }

  return {
    success: true,
    job_id: results[0]?.job_id || null,
    entity_jobs: results,
    total_records: totalRecords,
    message: `Creadas ${results.length} importaciones con ${totalRecords} registros`,
  }
}

// ── MAIN HANDLER ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const user = await authenticateRequest(req)

    const body = await req.json()
    const { action } = body
    let result

    if (action === 'parse') {
      result = await parseFile(body)
    } else if (action === 'map') {
      result = await mapFields(body)
    } else if (action === 'import') {
      const orgId = req.headers.get('x-organization-id') || body.organization_id
      if (!orgId) throw new Error('Missing organization_id for import')
      result = await importData({ ...body, organization_id: orgId })
    } else if (action === 'create-from-scraping') {
      const orgId = req.headers.get('x-organization-id') || body.organization_id
      if (!orgId) throw new Error('Missing organization_id')
      result = await createFromScraping({
        ...body,
        organization_id: orgId,
        user_id: user.id,
      })
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
