import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── NO xlsx dependency! Excel parsing happens in the browser ───

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ── Entity field definitions (for AI mapping prompt) ────────
const ENTITY_FIELDS: Record<string, Record<string, string>> = {
  matters: {
    title: 'Titulo / nombre de la marca o expediente',
    mark_name: 'Nombre de la marca',
    reference: 'Referencia interna (ej: TM-2024-001)',
    legacy_system_id: 'ID o codigo del sistema de origen',
    status: 'Estado (pending/filed/examining/published/granted/registered/opposed/cancelled/expired/abandoned/renewal)',
    status_detail: 'Estado detallado original del sistema fuente',
    ip_type: 'Tipo de PI (trademark/patent/design/copyright)',
    ip_subtype: 'Subtipo (Nominativa/Mixta/Figurativa/Tridimensional)',
    filing_date: 'Fecha de presentacion',
    registration_date: 'Fecha de registro',
    expiry_date: 'Fecha de vencimiento o renovacion',
    application_number: 'Numero de solicitud',
    registration_number: 'Numero de registro',
    certificate_number: 'Numero de certificado',
    jurisdiction: 'Jurisdiccion / pais',
    jurisdiction_code: 'Codigo de pais ISO (VE, CO, US...)',
    nice_classes: 'Clases de Niza (numeros separados por coma)',
    goods_services: 'Productos y servicios (texto descriptivo)',
    owner_name: 'Propietario / titular',
    applicant_name: 'Solicitante',
    client_ref: 'Cliente / referencia de cliente',
    agent_name: 'Agente / oficina de PI',
    correspondent_name: 'Tramitante / corresponsal',
    physical_folder: 'Carpeta fisica / referencia de archivo',
    notes: 'Notas / observaciones / eventos',
    description: 'Descripcion',
    proof_of_use_date: 'Fecha de prueba de uso',
    publication_number: 'Numero de publicacion',
    publication_date: 'Fecha de publicacion',
    priority_date: 'Fecha de prioridad',
  },
  ip_actions: {
    title: 'Titulo de la accion',
    reference: 'Referencia',
    action_type: 'Tipo de accion',
    action_category: 'Categoria (offensive/defensive)',
    status: 'Estado',
    plaintiff_name: 'Demandante',
    defendant_name: 'Demandado',
    base_mark_name: 'Marca base',
    opposed_mark_name: 'Marca opuesta',
    filing_number: 'Numero de solicitud',
    filing_date: 'Fecha de presentacion',
    jurisdiction: 'Jurisdiccion',
    nice_classes: 'Clases de Niza',
    legal_basis: 'Fundamento legal',
    agent_name: 'Agente / abogado',
    legacy_system_id: 'ID del sistema de origen',
  },
  contacts: {
    name: 'Nombre completo',
    email: 'Email',
    phone: 'Telefono',
    company: 'Empresa',
    country: 'Pais',
    contact_type: 'Tipo (client/agent/examiner/other)',
    notes: 'Notas',
  },
  crm_accounts: {
    name: 'Nombre de la empresa/cuenta',
    email: 'Email principal',
    phone: 'Telefono',
    country: 'Pais',
    industry: 'Industria/sector',
    website: 'Sitio web',
    notes: 'Notas',
  },
}

// ── Status normalization ────────────────────────────────────

interface StatusPrefixRule {
  prefix: string
  status: string
}

const STATUS_PREFIX_RULES: StatusPrefixRule[] = [
  { prefix: 'SOLO PARA FACTURAR', status: 'registered' },
  { prefix: 'DISPOSICION ADMINISTRATIVA', status: 'examining' },
  { prefix: 'REGISTRO. RENOVACION', status: 'renewal' },
  { prefix: 'REGISTRO. RENOVACIÓN', status: 'renewal' },
  { prefix: 'REGISTRO. ABANDONO', status: 'abandoned' },
  { prefix: 'REGISTRO. CANCELACION', status: 'cancelled' },
  { prefix: 'REGISTRO', status: 'registered' },
  { prefix: 'PUBLICACION OFICIAL', status: 'published' },
  { prefix: 'PUBLICACIÓN OFICIAL', status: 'published' },
  { prefix: 'CONCESION', status: 'granted' },
  { prefix: 'CONCESIÓN', status: 'granted' },
  { prefix: 'MARCA CONCEDIDA', status: 'granted' },
  { prefix: 'OPOSICION', status: 'opposed' },
  { prefix: 'OPOSICIÓN', status: 'opposed' },
  { prefix: 'RATIFICACION DE OPOSICION', status: 'opposed' },
  { prefix: 'NEGATIVA RECONSIDERACION ADMITIDA. MARCA CONCEDIDA', status: 'granted' },
  { prefix: 'NEGATIVA-REVOCADA', status: 'examining' },
  { prefix: 'NEGATIVA. RECONSIDERACION NO ADMITIDA', status: 'cancelled' },
  { prefix: 'NEGATIVA. RECONSIDERACIÓN NO ADMITIDA', status: 'cancelled' },
  { prefix: 'NEGATIVA. RECURSO', status: 'examining' },
  { prefix: 'NEGATIVA', status: 'cancelled' },
  { prefix: 'BUSQUEDA', status: 'pending' },
  { prefix: 'BÚSQUEDA', status: 'pending' },
  { prefix: 'SOLICITUD DESISTIDA', status: 'abandoned' },
  { prefix: 'SOLICITUD NEGADA', status: 'cancelled' },
  { prefix: 'SOLICITUD DETENIDA', status: 'pending' },
  { prefix: 'SOLICITUD', status: 'filed' },
  { prefix: 'RECURSO JERARQUICO', status: 'examining' },
  { prefix: 'RECURSO JERÁRQUICO', status: 'examining' },
  { prefix: 'CADUCIDAD', status: 'expired' },
  { prefix: 'PRIORIDAD EXTINGUIDA', status: 'expired' },
  { prefix: 'NULIDAD', status: 'opposed' },
  { prefix: 'PERENCION', status: 'expired' },
  { prefix: 'PERENCIÓN', status: 'expired' },
  { prefix: 'ABANDONADA', status: 'abandoned' },
  { prefix: 'ESCRITO DE DESISTIMIENTO', status: 'abandoned' },
  { prefix: 'ACCION OFICIAL', status: 'examining' },
  { prefix: 'ACCIÓN OFICIAL', status: 'examining' },
  { prefix: 'CONTINUACION', status: 'examining' },
  { prefix: 'DEVOLUCION', status: 'examining' },
  { prefix: 'DEVOLUCIÓN', status: 'examining' },
  { prefix: 'PRORROGA', status: 'examining' },
  { prefix: 'PRÓRROGA', status: 'examining' },
]

const SIMPLE_STATUS_MAP: Record<string, string> = {
  'registered': 'registered', 'registrada': 'registered', 'registrado': 'registered',
  'active': 'registered', 'activa': 'registered', 'activo': 'registered',
  'vigente': 'registered',
  'pending': 'pending', 'pendiente': 'pending',
  'filed': 'filed', 'presentada': 'filed',
  'examining': 'examining', 'examinando': 'examining',
  'published': 'published', 'publicada': 'published',
  'granted': 'granted', 'concedida': 'granted',
  'opposed': 'opposed',
  'abandoned': 'abandoned', 'abandonada': 'abandoned',
  'cancelled': 'cancelled', 'cancelada': 'cancelled',
  'expired': 'expired', 'vencida': 'expired', 'vencido': 'expired',
  'renewal': 'renewal',
}

function normalizeStatus(raw: string): { status: string; status_detail: string } {
  const trimmed = raw.trim()
  const upper = trimmed.toUpperCase()

  for (const rule of STATUS_PREFIX_RULES) {
    if (upper.startsWith(rule.prefix.toUpperCase())) {
      return { status: rule.status, status_detail: trimmed }
    }
  }

  const lower = trimmed.toLowerCase()
  const simple = SIMPLE_STATUS_MAP[lower]
  if (simple) return { status: simple, status_detail: trimmed }

  return { status: 'pending', status_detail: trimmed }
}

// ── Country normalization ───────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
  'venezuela': 'VE', 'colombia': 'CO', 'guyana': 'GY', 'suriname': 'SR',
  'panama': 'PA', 'panamá': 'PA', 'costa rica': 'CR',
  'republica dominicana': 'DO', 'república dominicana': 'DO',
  'estados unidos de america': 'US', 'estados unidos de américa': 'US',
  'ecuador': 'EC', 'guatemala': 'GT', 'peru': 'PE', 'perú': 'PE',
  'brasil': 'BR', 'argentina': 'AR', 'chile': 'CL', 'el salvador': 'SV',
  'mexico': 'MX', 'méxico': 'MX', 'trinidad/tobago': 'TT', 'trinidad y tobago': 'TT',
  'aruba': 'AW', 'bolivia': 'BO', 'cuba': 'CU', 'curazao': 'CW', 'curaçao': 'CW',
  'europa': 'EU', 'comunidad europea': 'EU',
  'islas bes (bonaire, st. eustatius, saba)': 'BQ', 'islas bes': 'BQ',
  'p.r. china': 'CN', 'china': 'CN', 'paraguay': 'PY',
  'z-internacional': 'WO', 'internacional': 'WO',
  'españa': 'ES', 'jamaica': 'JM', 'canada': 'CA', 'canadá': 'CA', 'honduras': 'HN',
  'actualizar': 'VE', 'sin nombre': 'VE',
}

function normalizeCountry(raw: string): string {
  const lower = raw.trim().toLowerCase()
  return COUNTRY_MAP[lower] || raw.trim()
}

// ── Date fields list ────────────────────────────────────────

const DATE_FIELDS = new Set([
  'filing_date', 'registration_date', 'expiry_date',
  'proof_of_use_date', 'first_use_date', 'publication_date', 'priority_date',
])

// ── Auth ────────────────────────────────────────────────────

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

// ── PHASE A: PARSE ──────────────────────────────────────────
// New frontend: parses in browser, stores results in metadata.
// Old frontend fallback: parse CSV server-side (no xlsx needed).

async function parseFile(params: {
  job_id: string
  file_url?: string
  file_type?: string
  organization_id?: string
}) {
  const { job_id, file_url, file_type } = params

  // Check if frontend already parsed (new flow)
  const { data: job } = await supabaseAdmin
    .from('import_jobs')
    .select('metadata')
    .eq('id', job_id)
    .single()

  const meta = job?.metadata as any
  if (meta?.detected_columns?.length > 0) {
    return {
      columns: meta.detected_columns,
      preview: meta.preview_rows || [],
    }
  }

  // Old frontend fallback: parse server-side
  if (!file_url) throw new Error('No file URL provided')

  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage.from('imports').download(file_url)
  if (downloadError) throw new Error(`Error descargando: ${downloadError.message}`)

  const arrayBuffer = await fileData.arrayBuffer()

  // CSV: parse server-side (lightweight, no deps)
  if (file_type === 'csv') {
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length === 0) throw new Error('Archivo CSV vacío')
    const separator = lines[0].includes(';') ? ';' : ','
    const columns = lines[0].split(separator).map(c => c.trim().replace(/"/g, '')).filter(c => c)
    const preview = lines.slice(1, 11).map(line =>
      line.split(separator).map(c => c.trim().replace(/"/g, ''))
    )
    const allRows = lines.slice(1).map(line =>
      line.split(separator).map(c => c.trim().replace(/"/g, ''))
    )

    // Store parsed data as JSON in storage for import phase
    const parsedPath = file_url.replace(/\.[^.]+$/, '_parsed.json')
    const parsedBlob = new Blob(
      [JSON.stringify({ headers: columns, rows: allRows })],
      { type: 'application/json' }
    )
    await supabaseAdmin.storage.from('imports').upload(parsedPath, parsedBlob, {
      cacheControl: '3600', upsert: true,
    })

    await supabaseAdmin.from('import_jobs').update({
      status: 'mapping',
      metadata: {
        detected_columns: columns,
        preview_rows: preview,
        file_type,
        total_rows_estimate: allRows.length,
        parsed_file_url: parsedPath,
      },
      updated_at: new Date().toISOString(),
    }).eq('id', job_id)

    return { columns, preview }
  }

  // Excel: cannot parse server-side (xlsx removed for performance)
  // Convert to CSV in a lightweight way using the raw bytes
  // Try to detect if it's actually a CSV with wrong extension
  try {
    const text = new TextDecoder().decode(arrayBuffer)
    if (text.includes(',') || text.includes(';')) {
      // Might be a CSV with wrong extension - try parsing as CSV
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length > 0) {
        const separator = lines[0].includes(';') ? ';' : ','
        const columns = lines[0].split(separator).map(c => c.trim().replace(/"/g, '')).filter(c => c)
        if (columns.length > 2) {
          const preview = lines.slice(1, 11).map(line =>
            line.split(separator).map(c => c.trim().replace(/"/g, ''))
          )
          const allRows = lines.slice(1).map(line =>
            line.split(separator).map(c => c.trim().replace(/"/g, ''))
          )

          const parsedPath = file_url.replace(/\.[^.]+$/, '_parsed.json')
          const parsedBlob = new Blob(
            [JSON.stringify({ headers: columns, rows: allRows })],
            { type: 'application/json' }
          )
          await supabaseAdmin.storage.from('imports').upload(parsedPath, parsedBlob, {
            cacheControl: '3600', upsert: true,
          })

          await supabaseAdmin.from('import_jobs').update({
            status: 'mapping',
            metadata: {
              detected_columns: columns,
              preview_rows: preview,
              file_type: 'csv',
              total_rows_estimate: allRows.length,
              parsed_file_url: parsedPath,
            },
            updated_at: new Date().toISOString(),
          }).eq('id', job_id)

          return { columns, preview }
        }
      }
    }
  } catch { /* not text-based, truly Excel binary */ }

  throw new Error(
    'Para archivos Excel, por favor actualice la página (Ctrl+Shift+R) para usar la nueva versión que procesa Excel en el navegador. ' +
    'Alternativamente, exporte su archivo como CSV y vuelva a intentar.'
  )
}

// ── PHASE B: AI MAPPING ─────────────────────────────────────

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
        content: `Eres un experto en sistemas de gestion de propiedad intelectual.

Tienes estas columnas de un archivo importado:
${detected_columns.map(c => `- "${c}"`).join('\n')}

Mapealas a los campos de IP-NEXUS para la entidad "${entity_type}".

Campos disponibles:
${fieldsList}

Responde UNICAMENTE con JSON valido, sin texto adicional, sin markdown:
{
  "mapping": {
    "columna_original": "campo_ip_nexus_o_null"
  },
  "confidence": 0.87,
  "unmapped": ["columnas sin mapeo claro"]
}

Si una columna no tiene mapeo claro, usar null como valor.
confidence es un numero entre 0 y 1.`
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

// ── PHASE C: IMPORT ─────────────────────────────────────────

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

  const meta = job.metadata as any
  const parsedUrl = meta?.parsed_file_url
  if (!parsedUrl) throw new Error('No se encontraron datos parseados. Re-suba el archivo.')

  // Download pre-parsed JSON (created by frontend)
  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage.from('imports').download(parsedUrl)
  if (downloadError) throw new Error(`Error descargando datos: ${downloadError.message}`)

  const text = await fileData.text()
  const parsed = JSON.parse(text)
  const headers: string[] = parsed.headers
  const allRows: any[][] = parsed.rows

  let processed = 0
  let failed = 0
  let duplicates = 0
  const errors: any[] = []

  await supabaseAdmin
    .from('import_jobs')
    .update({
      status: 'importing',
      records_total: allRows.length,
      started_at: new Date().toISOString(),
    })
    .eq('id', job_id)

  const table = entity_type === 'matters' ? 'matters'
    : entity_type === 'contacts' ? 'contacts'
    : entity_type === 'ip_actions' ? 'ip_actions'
    : 'crm_accounts'

  const BATCH_SIZE = 500
  const seenLegacyIds = new Set<string>()

  for (let batchStart = 0; batchStart < allRows.length; batchStart += BATCH_SIZE) {
    const batchRows = allRows.slice(batchStart, batchStart + BATCH_SIZE)
    const mappedBatch: Record<string, any>[] = []

    // 1) Map columns to fields for each row
    for (let r = 0; r < batchRows.length; r++) {
      const row = batchRows[r]
      try {
        const mapped: Record<string, any> = { organization_id }

        for (const [sourceCol, targetField] of Object.entries(confirmed_mapping)) {
          if (!targetField || targetField === 'null') continue
          const colIndex = headers.indexOf(sourceCol)
          if (colIndex === -1) continue

          let value = row[colIndex]
          if (value === undefined || value === null || value === '') continue
          value = String(value).trim()
          if (!value) continue

          // Transform by field type
          if (targetField === 'status') {
            const result = normalizeStatus(value)
            mapped['status'] = result.status
            mapped['status_detail'] = result.status_detail
            continue
          }

          if (targetField === 'nice_classes') {
            mapped[targetField] = value.split(/[,;\s]+/)
              .map((c: string) => parseInt(c.trim()))
              .filter((n: number) => !isNaN(n) && n > 0)
            continue
          }

          if (DATE_FIELDS.has(targetField)) {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              mapped[targetField] = date.toISOString()
            }
            continue
          }

          if (targetField === 'jurisdiction' || targetField === 'jurisdiction_code') {
            // Try to resolve country name to ISO code
            const code = normalizeCountry(value)
            if (code.length === 2) {
              mapped['jurisdiction_code'] = code
              mapped['jurisdiction'] = value
            } else {
              mapped[targetField] = value
            }
            continue
          }

          mapped[targetField] = value
        }

        // Sync title <-> mark_name for matters
        if (entity_type === 'matters') {
          if (mapped.title && !mapped.mark_name) mapped.mark_name = mapped.title
          if (mapped.mark_name && !mapped.title) mapped.title = mapped.mark_name

          if (!mapped.title && !mapped.mark_name && !mapped.reference) {
            errors.push({ row: batchStart + r, error: 'Falta title, mark_name o reference' })
            failed++
            continue
          }
        }

        // Deduplicate within file by legacy_system_id
        if (mapped.legacy_system_id) {
          if (seenLegacyIds.has(mapped.legacy_system_id)) {
            duplicates++
            continue
          }
          seenLegacyIds.add(mapped.legacy_system_id)
        }

        mappedBatch.push(mapped)
      } catch (rowError: any) {
        errors.push({ row: batchStart + r, error: rowError.message })
        failed++
      }
    }

    if (mappedBatch.length === 0) continue

    // 2) Batch dedup check against DB (matters only)
    let toInsert = mappedBatch
    if (entity_type === 'matters') {
      const reviewQueue: Record<string, any>[] = []

      // Check legacy_system_id
      const legacyIds = mappedBatch
        .filter(m => m.legacy_system_id)
        .map(m => m.legacy_system_id)

      const existingLegacyIds = new Set<string>()
      if (legacyIds.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from(table).select('legacy_system_id')
          .eq('organization_id', organization_id)
          .in('legacy_system_id', legacyIds)
        for (const e of existing || []) {
          if (e.legacy_system_id) existingLegacyIds.add(e.legacy_system_id)
        }
      }

      // Check reference
      const refs = mappedBatch
        .filter(m => m.reference && !existingLegacyIds.has(m.legacy_system_id))
        .map(m => m.reference)

      const existingRefs = new Set<string>()
      if (refs.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from(table).select('reference')
          .eq('organization_id', organization_id)
          .in('reference', refs)
        for (const e of existing || []) {
          if (e.reference) existingRefs.add(e.reference)
        }
      }

      toInsert = []
      for (const mapped of mappedBatch) {
        const isDup =
          (mapped.legacy_system_id && existingLegacyIds.has(mapped.legacy_system_id)) ||
          (mapped.reference && existingRefs.has(mapped.reference))

        if (isDup) {
          reviewQueue.push({
            organization_id,
            import_job_id: job_id,
            entity_type,
            proposed_data: mapped,
            conflict_type: 'duplicate',
            status: 'pending',
          })
          duplicates++
        } else {
          toInsert.push(mapped)
        }
      }

      // Batch insert review queue
      if (reviewQueue.length > 0) {
        await supabaseAdmin.from('import_review_queue').insert(reviewQueue)
      }
    }

    // 3) Batch insert
    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from(table).insert(toInsert)
      if (insertError) {
        // Fallback: insert one by one to find which rows fail
        for (const row of toInsert) {
          const { error: singleError } = await supabaseAdmin.from(table).insert(row)
          if (singleError) {
            errors.push({ row: 0, error: singleError.message, data: row.title || row.reference || row.legacy_system_id })
            failed++
          } else {
            processed++
          }
        }
      } else {
        processed += toInsert.length
      }
    }

    // 4) Update progress
    await supabaseAdmin.from('import_jobs')
      .update({
        records_processed: processed,
        records_failed: failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id)
  }

  const finalStatus = failed === 0 && errors.length === 0 ? 'completed' : 'completed_with_errors'

  await supabaseAdmin.from('import_jobs').update({
    status: finalStatus,
    records_total: allRows.length,
    records_processed: processed,
    records_failed: failed,
    error_log: errors.length > 0 ? errors.slice(0, 200) : null,
    completed_at: new Date().toISOString(),
    metadata: {
      ...(meta || {}),
      duplicates_found: duplicates,
      final_status: finalStatus,
    },
  }).eq('id', job_id)

  return {
    total: allRows.length,
    processed,
    failed,
    duplicates,
    errors: errors.slice(0, 20),
  }
}

// ── MAIN HANDLER ────────────────────────────────────────────

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
      throw new Error(`Accion desconocida: ${action}`)
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
