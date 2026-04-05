import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

// ── TIPOS ────────────────────────────────────────────────

export interface ParseResult {
  jobId: string
  columns: string[]
  preview: any[][]
}

export interface MappingResult {
  mapping: Record<string, string | null>
  confidence: number
  unmapped: string[]
}

export interface ImportResult {
  total: number
  processed: number
  failed: number
  duplicates: number
  errors: Array<{ row: number; error: string }>
}

export type EntityType = 'matters' | 'contacts' | 'crm_accounts' | 'ip_actions'

// ── PARSE FILE IN BROWSER ───────────────────────────────

function parseFileInBrowser(file: File): Promise<{
  headers: string[]
  rows: any[][]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const fileExt = file.name.split('.').pop()?.toLowerCase()

        let headers: string[] = []
        let rows: any[][] = []

        if (fileExt === 'csv') {
          const text = new TextDecoder().decode(arrayBuffer)
          const lines = text.split('\n').filter(l => l.trim())
          if (lines.length === 0) throw new Error('Archivo CSV vacío')
          const separator = lines[0].includes(';') ? ';' : ','
          headers = lines[0].split(separator).map(c => c.trim().replace(/"/g, ''))
          rows = lines.slice(1).map(line =>
            line.split(separator).map(c => c.trim().replace(/"/g, ''))
          )
        } else {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
          if (data.length === 0) throw new Error('Archivo Excel vacío')
          headers = (data[0] as string[]).map(c => String(c || '').trim())
          rows = data.slice(1).filter(row =>
            row.some((cell: any) => cell !== undefined && cell !== null && cell !== '')
          )
        }

        headers = headers.filter(c => c && c.length > 0)
        resolve({ headers, rows })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsArrayBuffer(file)
  })
}

// ── HOOK PRINCIPAL ───────────────────────────────────────

export function useImportProcessor() {
  const { currentOrganization } = useOrganization()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const orgId = currentOrganization?.id
  const userId = user?.id

  // FASE A — Subir archivo y parsear columnas (IN BROWSER)
  const parseFile = useMutation({
    mutationFn: async (file: File): Promise<ParseResult> => {
      if (!orgId || !userId) throw new Error('Sin organización')

      const toastId = toast.loading('Subiendo archivo...')

      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        const timestamp = Date.now()
        const filePath = `${orgId}/${timestamp}_${file.name}`

        // 1. Upload original file to storage (for audit/reference)
        const { error: uploadError } = await supabase.storage
          .from('imports')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw new Error(`Error al subir: ${uploadError.message}`)

        toast.loading('Analizando estructura...', { id: toastId })

        // 2. Parse file in browser (NO edge function needed!)
        const { headers, rows } = await parseFileInBrowser(file)
        const columns = headers
        const preview = rows.slice(0, 10)

        toast.loading(`Guardando ${rows.length} filas parseadas...`, { id: toastId })

        // 3. Upload parsed data as JSON to storage
        const parsedPath = `${orgId}/${timestamp}_parsed.json`
        const parsedBlob = new Blob(
          [JSON.stringify({ headers, rows })],
          { type: 'application/json' }
        )

        const { error: parsedUploadError } = await supabase.storage
          .from('imports')
          .upload(parsedPath, parsedBlob, {
            cacheControl: '3600',
            upsert: false,
          })

        if (parsedUploadError) throw new Error(`Error guardando datos: ${parsedUploadError.message}`)

        // 4. Create import_job with all metadata
        const { data: job, error: jobError } = await supabase
          .from('import_jobs')
          .insert({
            organization_id: orgId,
            source_type: fileExt === 'csv' ? 'csv' : 'excel',
            status: 'mapping',
            source_file_url: filePath,
            created_by: userId,
            metadata: {
              detected_columns: columns,
              preview_rows: preview,
              file_type: fileExt,
              total_rows_estimate: rows.length,
              parsed_file_url: parsedPath,
            },
          })
          .select()
          .single()

        if (jobError) throw new Error(jobError.message)

        toast.success(`${columns.length} columnas · ${rows.length} filas detectadas`, { id: toastId })

        return {
          jobId: job.id,
          columns,
          preview,
        }
      } catch (error: any) {
        toast.error(error.message, { id: toastId })
        throw error
      }
    },
  })

  // FASE B — Auto-mapeo con IA
  const mapFields = useMutation({
    mutationFn: async (params: {
      jobId: string
      detectedColumns: string[]
      entityType: EntityType
    }): Promise<MappingResult> => {
      const toastId = toast.loading('Analizando con IA...')

      try {
        const { data, error: fnError } = await supabase.functions
          .invoke('process-import', {
            body: {
              action: 'map',
              job_id: params.jobId,
              detected_columns: params.detectedColumns,
              entity_type: params.entityType,
            },
          })

        if (fnError) throw new Error(fnError.message)
        if (data?.error) throw new Error(data.error)

        const confidence = Math.round((data.confidence || 0) * 100)
        toast.success(`Mapeo completado — ${confidence}% de confianza`, { id: toastId })

        return {
          mapping: data.mapping || {},
          confidence: data.confidence || 0,
          unmapped: data.unmapped || [],
        }
      } catch (error: any) {
        toast.error(`Error en mapeo: ${error.message}`, { id: toastId })
        throw error
      }
    },
  })

  // FASE C — Importar datos en tandas (chunked, background-safe)
  const importData = useMutation({
    mutationFn: async (params: {
      jobId: string
      confirmedMapping: Record<string, string>
      entityType: EntityType
    }): Promise<ImportResult> => {
      if (!orgId) throw new Error('Sin organización')

      const toastId = toast.loading('Preparando importación...')

      try {
        // 1. Get job metadata to find parsed JSON URL
        const { data: job, error: jobError } = await supabase
          .from('import_jobs')
          .select('metadata')
          .eq('id', params.jobId)
          .single()

        if (jobError || !job) throw new Error('Job no encontrado')
        const meta = job.metadata as any
        const parsedUrl = meta?.parsed_file_url
        if (!parsedUrl) throw new Error('No se encontraron datos parseados. Re-suba el archivo.')

        // 2. Download parsed JSON in browser (fast, no edge function needed)
        toast.loading('Descargando datos parseados...', { id: toastId })
        const { data: blob, error: dlError } = await supabase.storage
          .from('imports')
          .download(parsedUrl)

        if (dlError || !blob) throw new Error(`Error descargando datos: ${dlError?.message}`)

        const text = await blob.text()
        const parsed = JSON.parse(text)
        const headers: string[] = parsed.headers
        const allRows: any[][] = parsed.rows
        const totalRows = allRows.length

        // 3. Split into chunks and process each one
        const CHUNK_SIZE = 500
        const totalChunks = Math.ceil(totalRows / CHUNK_SIZE)
        let totalProcessed = 0
        let totalFailed = 0
        let totalDuplicates = 0
        const allErrors: Array<{ row: number; error: string }> = []

        toast.loading(`Importando 0 de ${totalRows} registros (0/${totalChunks} tandas)...`, {
          id: toastId,
          duration: Infinity,
        })

        for (let i = 0; i < totalChunks; i++) {
          const chunkRows = allRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)

          const { data, error: fnError } = await supabase.functions
            .invoke('process-import', {
              body: {
                action: 'import-chunk',
                job_id: params.jobId,
                headers,
                rows: chunkRows,
                confirmed_mapping: params.confirmedMapping,
                entity_type: params.entityType,
                organization_id: orgId,
                chunk_index: i,
                total_chunks: totalChunks,
                records_total: totalRows,
              },
            })

          if (fnError) throw new Error(fnError.message)
          if (data?.error) throw new Error(data.error)

          totalProcessed += data.processed || 0
          totalFailed += data.failed || 0
          totalDuplicates += data.duplicates || 0
          if (data.errors) allErrors.push(...data.errors)

          // Update persistent toast with progress
          const progress = Math.round(((i + 1) / totalChunks) * 100)
          toast.loading(
            `Importando ${totalProcessed + totalFailed + totalDuplicates} de ${totalRows} registros (${i + 1}/${totalChunks} tandas) — ${progress}%`,
            { id: toastId, duration: Infinity }
          )
        }

        // 4. Done — invalidate queries
        queryClient.invalidateQueries({ queryKey: ['matters'] })
        queryClient.invalidateQueries({ queryKey: ['docket'] })
        queryClient.invalidateQueries({ queryKey: ['expedientes'] })
        queryClient.invalidateQueries({ queryKey: ['portfolio'] })
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['imports'] })

        toast.success(
          `${totalProcessed} registros importados${
            totalDuplicates > 0 ? ` · ${totalDuplicates} en revisión` : ''
          }${totalFailed > 0 ? ` · ${totalFailed} con error` : ''}`,
          { id: toastId }
        )

        return {
          total: totalRows,
          processed: totalProcessed,
          failed: totalFailed,
          duplicates: totalDuplicates,
          errors: allErrors.slice(0, 20),
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: toastId })
        throw error
      }
    },
  })

  return { parseFile, mapFields, importData }
}

// ── HOOK DE ESTADO DE UN JOB ─────────────────────────────

export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ['import-job', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return ['importing', 'mapping', 'validating'].includes(status) ? 2000 : false
    },
  })
}

// ── CAMPOS DISPONIBLES POR ENTIDAD ───────────────────────

export const AVAILABLE_FIELDS: Record<
  EntityType,
  Array<{ value: string; label: string }>
> = {
  matters: [
    { value: 'title', label: 'Título / Nombre' },
    { value: 'mark_name', label: 'Nombre de marca' },
    { value: 'reference', label: 'Referencia interna' },
    { value: 'legacy_system_id', label: 'ID sistema origen' },
    { value: 'status', label: 'Estado' },
    { value: 'status_detail', label: 'Estado detallado' },
    { value: 'ip_type', label: 'Tipo PI (trademark/patent/design)' },
    { value: 'ip_subtype', label: 'Subtipo (Nominativa, Mixta, etc.)' },
    { value: 'filing_date', label: 'Fecha de presentación' },
    { value: 'registration_date', label: 'Fecha de registro' },
    { value: 'expiry_date', label: 'Fecha de vencimiento' },
    { value: 'application_number', label: 'Nº de solicitud' },
    { value: 'registration_number', label: 'Nº de registro' },
    { value: 'certificate_number', label: 'Nº de certificado' },
    { value: 'jurisdiction', label: 'Jurisdicción / País' },
    { value: 'jurisdiction_code', label: 'Código de país (ISO)' },
    { value: 'nice_classes', label: 'Clases de Niza' },
    { value: 'goods_services', label: 'Productos/Servicios' },
    { value: 'owner_name', label: 'Propietario/Titular' },
    { value: 'applicant_name', label: 'Solicitante' },
    { value: 'client_ref', label: 'Cliente (nombre)' },
    { value: 'client_reference', label: 'Referencia del cliente' },
    { value: 'agent_name', label: 'Agente / Oficina' },
    { value: 'correspondent_name', label: 'Tramitante' },
    { value: 'inventor_name', label: 'Inventor (patentes)' },
    { value: 'physical_folder', label: 'Carpeta física' },
    { value: 'notes', label: 'Notas' },
    { value: 'description', label: 'Descripción' },
    { value: 'figure_description', label: 'Descripción de figura' },
    { value: 'mark_image_url', label: 'URL imagen marca' },
    { value: 'proof_of_use_date', label: 'Fecha prueba de uso' },
    { value: 'first_use_date', label: 'Fecha primer uso' },
    { value: 'publication_number', label: 'Nº publicación' },
    { value: 'publication_date', label: 'Fecha publicación' },
    { value: 'priority_date', label: 'Fecha de prioridad' },
    { value: 'owner_country', label: 'País del propietario' },
    { value: 'client_country', label: 'País del cliente' },
    { value: 'correspondent_country', label: 'País del tramitante' },
    { value: 'contact_name', label: 'Contacto (persona)' },
    { value: 'contact_email', label: 'Email del contacto' },
    { value: 'source_modified_at', label: 'Fecha última modificación (origen)' },
    { value: 'source_modified_by', label: 'Modificado por (origen)' },
    { value: 'legacy_internal_id', label: 'ID interno sistema origen' },
  ],
  ip_actions: [
    { value: 'title', label: 'Título de la acción' },
    { value: 'reference', label: 'Referencia' },
    { value: 'action_type', label: 'Tipo de acción' },
    { value: 'action_category', label: 'Categoría (offensive/defensive)' },
    { value: 'status', label: 'Estado' },
    { value: 'plaintiff_name', label: 'Demandante' },
    { value: 'defendant_name', label: 'Demandado' },
    { value: 'base_mark_name', label: 'Marca base' },
    { value: 'opposed_mark_name', label: 'Marca opuesta' },
    { value: 'filing_number', label: 'Nº solicitud' },
    { value: 'filing_date', label: 'Fecha presentación' },
    { value: 'jurisdiction', label: 'Jurisdicción' },
    { value: 'nice_classes', label: 'Clases Niza' },
    { value: 'legal_basis', label: 'Fundamento legal' },
    { value: 'agent_name', label: 'Agente/Abogado' },
    { value: 'legacy_system_id', label: 'ID sistema origen' },
  ],
  contacts: [
    { value: 'name', label: 'Nombre completo' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'company', label: 'Empresa' },
    { value: 'country', label: 'País' },
    { value: 'contact_type', label: 'Tipo de contacto' },
    { value: 'notes', label: 'Notas' },
  ],
  crm_accounts: [
    { value: 'name', label: 'Nombre de cuenta' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'country', label: 'País' },
    { value: 'industry', label: 'Industria' },
    { value: 'website', label: 'Sitio web' },
    { value: 'notes', label: 'Notas' },
  ],
}
