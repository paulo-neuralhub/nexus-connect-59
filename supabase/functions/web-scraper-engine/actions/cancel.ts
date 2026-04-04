/**
 * Action: cancel
 *
 * Cancels a running scraping session.
 * Closes the browser session and marks the DB session as cancelled.
 */

import { getServiceClient } from '../index.ts'
import { closeBrowserSession } from '../browser/client.ts'
// closeBrowserSession accepts a string (session ID) for backward compatibility

interface CancelParams {
  session_id: string
  organization_id: string
  user_id: string
  options: Record<string, any>
}

export async function cancelSession(params: CancelParams) {
  const { session_id, organization_id } = params
  const serviceClient = getServiceClient()

  // 1. Fetch the session
  const { data: session, error } = await serviceClient
    .from('scraping_sessions')
    .select('id, status, browser_session_id, items_scraped')
    .eq('id', session_id)
    .eq('organization_id', organization_id)
    .single()

  if (error || !session) {
    throw new Error('Session not found or access denied')
  }

  // 2. Check if session is in a cancellable state
  const cancellableStates = [
    'initializing', 'authenticating', 'authenticated',
    'navigating', 'scraping', 'paused', 'rate_limited',
  ]

  if (!cancellableStates.includes(session.status)) {
    return {
      success: false,
      message: `Session is already ${session.status} and cannot be cancelled.`,
    }
  }

  // 3. Close browser session if active
  if (session.browser_session_id) {
    try {
      await closeBrowserSession(session.browser_session_id)
    } catch {
      // Non-critical: browser session may have already expired
    }
  }

  // 4. Update session status
  await serviceClient
    .from('scraping_sessions')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', session_id)

  return {
    success: true,
    items_scraped_before_cancel: session.items_scraped,
    message: `Session cancelled. ${session.items_scraped} items were scraped before cancellation.`,
  }
}
