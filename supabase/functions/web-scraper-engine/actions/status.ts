/**
 * Action: status
 *
 * Returns the current state of a scraping session.
 * Used by the frontend scraping-monitor.tsx for real-time updates.
 */

import { getServiceClient } from '../index.ts'

interface StatusParams {
  session_id: string
  organization_id: string
  user_id: string
  options: Record<string, any>
}

export async function getStatus(params: StatusParams) {
  const { session_id, organization_id } = params
  const serviceClient = getServiceClient()

  const { data: session, error } = await serviceClient
    .from('scraping_sessions')
    .select(`
      id,
      status,
      current_page,
      current_entity,
      items_scraped,
      items_total,
      pages_processed,
      requests_made,
      error_log,
      screenshots,
      browser_session_id,
      import_job_id,
      started_at,
      completed_at,
      last_activity_at,
      created_at
    `)
    .eq('id', session_id)
    .eq('organization_id', organization_id)
    .single()

  if (error || !session) {
    throw new Error('Session not found or access denied')
  }

  // Calculate progress percentage
  const progress = session.items_total && session.items_total > 0
    ? Math.round((session.items_scraped / session.items_total) * 100)
    : null

  // Calculate elapsed time
  const elapsed = session.started_at
    ? Date.now() - new Date(session.started_at).getTime()
    : 0

  // Estimate remaining time based on rate
  let estimatedRemaining = null
  if (progress && progress > 0 && progress < 100) {
    estimatedRemaining = Math.round(elapsed * (100 - progress) / progress)
  }

  return {
    session: {
      ...session,
      // Don't expose raw extracted_data in status (can be huge)
      extracted_data_summary: session.import_job_id
        ? 'Data sent to import pipeline'
        : 'Data available in session',
    },
    progress: {
      percentage: progress,
      elapsed_ms: elapsed,
      estimated_remaining_ms: estimatedRemaining,
    },
    is_active: ['initializing', 'authenticating', 'authenticated', 'navigating', 'scraping'].includes(session.status),
    errors_count: Array.isArray(session.error_log) ? session.error_log.length : 0,
    last_errors: Array.isArray(session.error_log)
      ? session.error_log.slice(-5)
      : [],
  }
}
