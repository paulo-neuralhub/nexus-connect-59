import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

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

export type EntityType = 'matters' | 'contacts' | 'crm_accounts'

// ── HOOK PRINCIPAL ───────────────────────────────────────

export function useImportProcessor() {
  const { currentOrganization } = useOrganization()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const orgId = currentOrganization?.id
  const userId = user?.id

  // FASE A — Subir archivo y parsear columnas
  const parseFile = useMutation({
    mutationFn: async (file: File): Promise<ParseResult> => {
      if (!orgId || !userId) throw new Error('Sin organización')

      const toastId = toast.loading('Subiendo archivo...')

      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        const timestamp = Date.now()
        const filePath = `${orgId}/${timestamp}_${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('imports')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw new Error(`Error al subir: ${uploadError.message}`)

        toast.loading('Analizando estructura...', { id: toastId })

        const { data: job, error: jobError } = await supabase
          .from('import_jobs')
          .insert({
            organization_id: orgId,
            source_type: fileExt === 'csv' ? 'csv' : 'excel',
            status: 'pending',
            source_file_url: filePath,
            created_by: userId,
          })
          .select()
          .single()

        if (jobError) throw new Error(jobError.message)

        const { data, error: fnError } = await supabase.functions
          .invoke('process-import', {
            body: {
              action: 'parse',
              job_id: job.id,
              file_url: filePath,
              file_type: fileExt,
              organization_id: orgId,
            },
          })

        if (fnError) throw new Error(fnError.message)
        if (data?.error) throw new Error(data.error)

        toast.success(`${data.columns.length} columnas detectadas`, { id: toastId })

        return {
          jobId: job.id,
          columns: data.columns,
          preview: data.preview,
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

  // FASE C — Importar datos reales
  const importData = useMutation({
    mutationFn: async (params: {
      jobId: string
      confirmedMapping: Record<string, string>
      entityType: EntityType
    }): Promise<ImportResult> => {
      if (!orgId) throw new Error('Sin organización')

      const toastId = toast.loading('Importando registros...')

      try {
        const { data, error: fnError } = await supabase.functions
          .invoke('process-import', {
            body: {
              action: 'import',
              job_id: params.jobId,
              confirmed_mapping: params.confirmedMapping,
              entity_type: params.entityType,
              organization_id: orgId,
            },
          })

        if (fnError) throw new Error(fnError.message)
        if (data?.error) throw new Error(data.error)

        queryClient.invalidateQueries({ queryKey: ['matters'] })
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['imports'] })

        const { processed, failed, duplicates } = data
        toast.success(
          `${processed} registros importados${
            duplicates > 0 ? ` · ${duplicates} en revisión` : ''
          }${failed > 0 ? ` · ${failed} con error` : ''}`,
          { id: toastId }
        )

        return data as ImportResult
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
      return status === 'importing' || status === 'mapping' ? 2000 : false
    },
  })
}

// ── CAMPOS DISPONIBLES POR ENTIDAD ───────────────────────

export const AVAILABLE_FIELDS: Record<
  EntityType,
  Array<{ value: string; label: string }>
> = {
  matters: [
    { value: 'mark_name', label: 'Nombre de marca' },
    { value: 'reference', label: 'Referencia interna' },
    { value: 'status', label: 'Estado' },
    { value: 'filing_date', label: 'Fecha de presentación' },
    { value: 'registration_date', label: 'Fecha de registro' },
    { value: 'expiry_date', label: 'Fecha de vencimiento' },
    { value: 'jurisdiction', label: 'Jurisdicción' },
    { value: 'nice_classes', label: 'Clases de Niza' },
    { value: 'applicant_name', label: 'Titular/Solicitante' },
    { value: 'agent_reference', label: 'Referencia del agente' },
    { value: 'matter_type', label: 'Tipo de expediente' },
    { value: 'description', label: 'Descripción' },
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
