import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { testConnection } from './actions/test-connection.ts'
import { discover } from './actions/discover.ts'
import { scrape } from './actions/scrape.ts'
import { getStatus } from './actions/status.ts'
import { cancelSession } from './actions/cancel.ts'

// ── Supabase Clients ────────────────────────────────────────

export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

export function getAnonClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
}

// ── Auth Helper ─────────────────────────────────────────────

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const anonClient = getAnonClient(authHeader)
  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  // Get organization_id from request header (multi-org support)
  const orgId = req.headers.get('x-organization-id')
  if (!orgId) throw new Error('Missing x-organization-id header')

  // Validate user has membership in this organization
  const serviceClient = getServiceClient()
  const { data: membership } = await serviceClient
    .from('memberships')
    .select('organization_id, role_id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single()

  if (!membership) throw new Error('No membership found for this organization')

  return {
    user,
    organization_id: membership.organization_id,
    role_id: membership.role_id,
  }
}

// ── Supported Actions ───────────────────────────────────────

type Action = 'test-connection' | 'discover' | 'scrape' | 'status' | 'cancel' | 'encrypt-credentials'

// Encrypt credentials action (inline — simple enough to not need its own file)
async function encryptCredentials(params: {
  source_id: string;
  credentials: { username: string; password: string };
  organization_id: string;
}) {
  const serviceClient = getServiceClient()

  // Verify source belongs to org
  const { data: source } = await serviceClient
    .from('import_sources')
    .select('id')
    .eq('id', params.source_id)
    .eq('organization_id', params.organization_id)
    .single()

  if (!source) throw new Error('Source not found')

  // Set the encryption key config and encrypt
  await serviceClient.rpc('encrypt_source_credentials', {
    p_source_id: params.source_id,
    p_credentials: params.credentials,
  })

  return { success: true, message: 'Credentials encrypted' }
}

const ACTIONS: Record<Action, (params: any) => Promise<any>> = {
  'test-connection': testConnection,
  'discover': discover,
  'scrape': scrape,
  'status': getStatus,
  'cancel': cancelSession,
  'encrypt-credentials': encryptCredentials,
}

// ── Main Handler ────────────────────────────────────────────

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate
    const auth = await authenticateRequest(req)

    // Parse body
    const body = await req.json()
    const { action, source_id, session_id, entity_types, options, credentials } = body

    // Validate action
    if (!action || !ACTIONS[action as Action]) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}. Valid: ${Object.keys(ACTIONS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate source_id for actions that need it
    if (['test-connection', 'discover', 'scrape', 'encrypt-credentials'].includes(action) && !source_id) {
      return new Response(
        JSON.stringify({ error: 'source_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate session_id for session actions
    if (['status', 'cancel'].includes(action) && !session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify source/connection belongs to user's organization
    if (source_id && !['encrypt-credentials'].includes(action)) {
      const serviceClient = getServiceClient()
      // Check migration_connections first (primary table for web portal connections)
      const { data: connection } = await serviceClient
        .from('migration_connections')
        .select('id, organization_id')
        .eq('id', source_id)
        .eq('organization_id', auth.organization_id)
        .single()

      if (!connection) {
        // Fallback: check import_sources for backward compatibility
        const { data: source } = await serviceClient
          .from('import_sources')
          .select('id, organization_id')
          .eq('id', source_id)
          .eq('organization_id', auth.organization_id)
          .single()

        if (!source) {
          return new Response(
            JSON.stringify({ error: 'Connection not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Execute action
    const handler = ACTIONS[action as Action]
    const result = await handler({
      source_id,
      session_id,
      entity_types,
      credentials,
      options: options || {},
      organization_id: auth.organization_id,
      user_id: auth.user.id,
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[web-scraper-engine] Error:', error.message)

    const status = error.message === 'Unauthorized' ? 401
      : error.message.includes('not found') ? 404
      : 500

    // Never leak internal details
    const safeMessage = status === 500
      ? 'Internal server error during scraping operation'
      : error.message

    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
