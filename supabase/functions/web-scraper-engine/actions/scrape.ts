/**
 * Action: scrape
 *
 * Full data extraction flow:
 * 1. Login to portal
 * 2. Navigate to entity list pages
 * 3. Extract data with pagination
 * 4. Optionally visit detail pages for more fields
 * 5. Save results to scraping_session
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🔒 READ-ONLY MODE — This scraper NEVER modifies data on   ║
 * ║  the target portal. After login, it only uses navigateTo()  ║
 * ║  and clickAndGetHTML() (pagination). fill() is blocked by   ║
 * ║  client.ts unless _isLoginStep. Dangerous click selectors   ║
 * ║  (delete, edit, save, submit, etc.) are also blocked.       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { getServiceClient } from '../index.ts'
import { executeLoginSequence, navigateTo, clickAndGetHTML } from '../browser/navigator.ts'
import { extractList, extractDetailPage, type ExtractionRule } from '../browser/parser.ts'
import { loadConnectionAndCredentials } from '../_shared/connection-loader.ts'

interface ScrapeParams {
  source_id: string
  organization_id: string
  user_id: string
  entity_types: string[]
  options: {
    speed?: string
    max_pages?: number
    max_items?: number
    include_details?: boolean
    include_screenshots?: boolean
    create_import_job?: boolean
    delay_between_pages_ms?: number
  }
}

export async function scrape(params: ScrapeParams) {
  const {
    source_id,
    organization_id,
    user_id,
    entity_types,
    options,
  } = params

  const serviceClient = getServiceClient()
  const maxPages = Math.min(options.max_pages || 20, 50)
  const maxItems = Math.min(options.max_items || 5000, 10000)
  const includeDetails = options.include_details !== false

  // Calculate delay based on speed setting
  let delayMs = options.delay_between_pages_ms || 3000
  if (options.speed === 'conservative') delayMs = 6000
  else if (options.speed === 'moderate') delayMs = 3000
  else if (options.speed === 'fast') delayMs = 1500

  // 1. Load connection + credentials
  const { connection, credentials, scraperConfig } = await loadConnectionAndCredentials(
    source_id,
    organization_id
  )

  if (!scraperConfig) throw new Error('No scraper config found for this connection')

  // 2. Create scraping session
  const { data: session, error: sessionError } = await serviceClient
    .from('scraping_sessions')
    .insert({
      organization_id,
      connection_id: source_id,
      status: 'initializing',
      created_by: user_id,
    })
    .select()
    .single()

  if (sessionError || !session) {
    throw new Error(`Failed to create scraping session: ${sessionError?.message || 'unknown error'}`)
  }

  const sessionId = session.id
  let context: any = null

  try {
    // 3. Login
    await updateSession(serviceClient, sessionId, { status: 'authenticating' })

    try {
      context = await executeLoginSequence(
        scraperConfig.navigation_config,
        credentials,
        { takeScreenshots: options.include_screenshots !== false }
      )
    } catch (loginError: any) {
      // Save screenshots from failed login for debugging
      const failedContext = (loginError as any)._context
      await updateSession(serviceClient, sessionId, {
        status: 'error',
        error_log: [{
          page: 'login',
          error: loginError.message,
          timestamp: new Date().toISOString(),
          recoverable: false,
        }],
        completed_at: new Date().toISOString(),
      })
      throw loginError
    }

    // Log post-login URL for debugging
    console.log(`[scrape] Login completed. URL: ${context.currentUrl}`)
    console.log(`[scrape] Screenshots captured: ${context.screenshots.length}`)

    await updateSession(serviceClient, sessionId, {
      status: 'authenticated',
      browser_session_id: context.session.id,
    })

    // 4. Extract data for each entity type
    const extractedData: Record<string, any[]> = {}
    let totalItems = 0
    let totalRequests = 0
    const errors: any[] = []

    for (const entityType of (entity_types || [])) {
      const rules: ExtractionRule | undefined = scraperConfig.extraction_rules?.[entityType]
      if (!rules) {
        errors.push({
          page: entityType,
          error: `No extraction rules found for entity type: ${entityType}`,
          timestamp: new Date().toISOString(),
          recoverable: false,
        })
        continue
      }

      if (!rules.list_url) {
        errors.push({
          page: entityType,
          error: `No list URL configured for entity type: ${entityType}. Run "discover" first.`,
          timestamp: new Date().toISOString(),
          recoverable: false,
        })
        continue
      }

      await updateSession(serviceClient, sessionId, {
        status: 'scraping',
        current_entity: entityType,
        current_page: rules.list_url,
      })

      // Navigate to entity list page
      let html: string
      try {
        html = await navigateTo(context.browser, rules.list_url)
        totalRequests++
      } catch (error: any) {
        errors.push({
          page: rules.list_url,
          error: `Failed to navigate: ${error.message}`,
          timestamp: new Date().toISOString(),
          recoverable: true,
        })
        continue
      }

      // Extract items from the list
      const allItems: any[] = []
      let currentPage = 1

      while (currentPage <= maxPages) {
        const items = extractList(html, rules)
        allItems.push(...items)
        totalItems += items.length

        await updateSession(serviceClient, sessionId, {
          items_scraped: totalItems,
          pages_processed: currentPage,
          requests_made: totalRequests,
        })

        if (totalItems >= maxItems) break
        if (!rules.pagination || currentPage >= maxPages) break

        // Try to go to next page
        try {
          let nextHtml: string
          if (rules.pagination.type === 'click' && rules.pagination.selector) {
            nextHtml = await clickAndGetHTML(
              context.browser,
              rules.pagination.selector,
              delayMs
            )
            totalRequests++
          } else if (rules.pagination.type === 'url_param' && rules.pagination.param_name) {
            const nextUrl = new URL(rules.list_url)
            nextUrl.searchParams.set(rules.pagination.param_name, String(currentPage + 1))
            nextHtml = await navigateTo(context.browser, nextUrl.toString())
            totalRequests++
          } else {
            break
          }

          const nextItems = extractList(nextHtml, rules)
          if (nextItems.length === 0) break

          allItems.push(...nextItems)
          totalItems += nextItems.length
          currentPage++
          html = nextHtml

          await updateSession(serviceClient, sessionId, {
            items_scraped: totalItems,
            pages_processed: currentPage,
            requests_made: totalRequests,
          })

          if (totalItems >= maxItems) break
        } catch {
          break // Pagination failed — likely no more pages
        }

        await delay(delayMs)
      }

      // Optionally visit detail pages for richer data
      if (includeDetails && rules.detail_url_pattern && allItems.length > 0) {
        await updateSession(serviceClient, sessionId, {
          status: 'navigating',
          current_entity: `${entityType} (details)`,
        })

        for (let i = 0; i < allItems.length; i++) {
          const item = allItems[i]
          const detailUrl = buildDetailUrl(rules.detail_url_pattern, item)
          if (!detailUrl) continue

          try {
            const detailHtml = await navigateTo(context.browser, detailUrl)
            totalRequests++

            const detailData = extractDetailPage(detailHtml, rules.fields)
            Object.assign(item, detailData, { _detail_url: detailUrl })

            await updateSession(serviceClient, sessionId, {
              requests_made: totalRequests,
            })
          } catch (error: any) {
            errors.push({
              page: detailUrl,
              error: `Detail page failed: ${error.message}`,
              timestamp: new Date().toISOString(),
              recoverable: true,
            })
          }

          await delay(Math.max(delayMs / 2, 1000))
        }
      }

      extractedData[entityType] = allItems
    }

    // 5. Save results
    await updateSession(serviceClient, sessionId, {
      status: 'completed',
      extracted_data: extractedData,
      error_log: errors,
      items_scraped: totalItems,
      requests_made: totalRequests,
      completed_at: new Date().toISOString(),
    })

    // 6. Close browser session
    await context.browser.close()

    return {
      success: true,
      session_id: sessionId,
      extracted_data: extractedData,
      stats: {
        total_items: totalItems,
        pages_processed: Object.values(extractedData).length,
        items_by_entity: Object.fromEntries(
          Object.entries(extractedData).map(([k, v]) => [k, v.length])
        ),
        total_requests: totalRequests,
        errors_count: errors.length,
      },
      message: `Scraping completed. Extracted ${totalItems} items across ${entity_types.length} entity types.`,
    }
  } catch (error: any) {
    // Close browser to avoid leak
    if (context?.browser) {
      try { await context.browser.close() } catch { /* non-critical */ }
    }

    // Append to error log
    const { data: currentSession } = await serviceClient
      .from('scraping_sessions')
      .select('error_log')
      .eq('id', sessionId)
      .single()

    const existingErrors = Array.isArray(currentSession?.error_log) ? currentSession.error_log : []

    await updateSession(serviceClient, sessionId, {
      status: 'error',
      error_log: [...existingErrors, {
        page: 'global',
        error: error.message,
        timestamp: new Date().toISOString(),
        recoverable: false,
      }],
      completed_at: new Date().toISOString(),
    })

    throw error
  }
}

// ── Helpers ─────────────────────────────────────────────────

async function updateSession(
  client: any,
  sessionId: string,
  updates: Record<string, any>
) {
  await client
    .from('scraping_sessions')
    .update({ ...updates, last_activity_at: new Date().toISOString() })
    .eq('id', sessionId)
}

function buildDetailUrl(pattern: string, item: any): string | null {
  let url = pattern
  const matches = pattern.match(/\{\{(\w+)\}\}/g)
  if (!matches) return pattern

  for (const match of matches) {
    const key = match.replace(/\{\{|\}\}/g, '')
    const value = item[key] || item[`_${key}`]
    if (!value) return null
    url = url.replace(match, encodeURIComponent(String(value)))
  }

  return url
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
