/**
 * Action: scrape
 *
 * Full data extraction flow:
 * 1. Login to portal
 * 2. Navigate to entity list pages
 * 3. Extract data with pagination
 * 4. Optionally visit detail pages for more fields
 * 5. Save results to scraping_session
 * 6. Optionally create an import_job for the process-import pipeline
 */

import { getServiceClient } from '../index.ts'
import { executeLoginSequence, navigateTo, clickAndGetHTML } from '../browser/navigator.ts'
import { closeBrowserSession } from '../browser/client.ts'
import { extractList, extractDetailPage, type ExtractionRule } from '../browser/parser.ts'
import { getSystemConfig } from '../systems/galena.ts'

interface ScrapeParams {
  source_id: string
  session_id?: string   // Resume existing session
  organization_id: string
  user_id: string
  entity_types: string[]  // ['matters', 'contacts', 'deadlines']
  options: {
    max_pages?: number
    max_items?: number
    include_details?: boolean
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
  const maxPages = Math.min(options.max_pages || 20, 50) // Hard cap: 50 pages
  const maxItems = Math.min(options.max_items || 5000, 10000) // Hard cap: 10k items
  const includeDetails = options.include_details !== false
  const delayMs = options.delay_between_pages_ms || 3000

  // 1. Load source + credentials
  const { data: source } = await serviceClient
    .from('import_sources')
    .select('*')
    .eq('id', source_id)
    .single()

  if (!source) throw new Error('Import source not found')

  const { data: credentialsRaw } = await serviceClient
    .rpc('decrypt_source_credentials', { p_source_id: source_id })

  if (!credentialsRaw) throw new Error('Failed to decrypt credentials')

  const credentials = typeof credentialsRaw === 'string'
    ? JSON.parse(credentialsRaw)
    : credentialsRaw

  const scraperConfig = source.scraper_config || getSystemConfig(source.system_id)
  if (!scraperConfig) throw new Error('No scraper config found')

  // 2. Create scraping session
  const { data: session, error: sessionError } = await serviceClient
    .from('scraping_sessions')
    .insert({
      organization_id,
      source_id,
      status: 'initializing',
      created_by: user_id,
    })
    .select()
    .single()

  if (sessionError || !session) {
    throw new Error('Failed to create scraping session')
  }

  const sessionId = session.id

  let context: any = null

  try {
    // 3. Login
    await updateSession(serviceClient, sessionId, { status: 'authenticating' })

    context = await executeLoginSequence(
      scraperConfig.navigation_config,
      credentials,
      { takeScreenshots: true }
    )

    await updateSession(serviceClient, sessionId, {
      status: 'authenticated',
      browser_session_id: context.session.id,
    })

    // 4. Extract data for each entity type
    const extractedData: Record<string, any[]> = {}
    let totalItems = 0
    let totalRequests = 0
    const errors: any[] = []

    for (const entityType of entity_types) {
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

      await updateSession(serviceClient, sessionId, {
        status: 'scraping',
        current_entity: entityType,
        current_page: rules.list_url,
      })

      // Navigate to entity list page
      let html: string
      try {
        html = await navigateTo(context.session.id, rules.list_url)
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
        // Extract list items from current page
        const items = extractList(html, rules)
        allItems.push(...items)
        totalItems += items.length

        await updateSession(serviceClient, sessionId, {
          items_scraped: totalItems,
          pages_processed: currentPage,
          requests_made: totalRequests,
          last_activity_at: new Date().toISOString(),
        })

        // Hard cap on total items to prevent unbounded memory
        if (totalItems >= maxItems) break

        // Check for pagination
        if (!rules.pagination || currentPage >= maxPages) break

        // Try to go to next page
        try {
          let nextHtml: string
          if (rules.pagination.type === 'click' && rules.pagination.selector) {
            nextHtml = await clickAndGetHTML(
              context.session.id,
              rules.pagination.selector,
              delayMs
            )
            totalRequests++
          } else if (rules.pagination.type === 'url_param' && rules.pagination.param_name) {
            const nextUrl = new URL(rules.list_url)
            nextUrl.searchParams.set(rules.pagination.param_name, String(currentPage + 1))
            nextHtml = await navigateTo(context.session.id, nextUrl.toString())
            totalRequests++
          } else {
            break // Unknown pagination type
          }

          // Extract from next page directly (avoid double-extraction)
          const nextItems = extractList(nextHtml, rules)
          if (nextItems.length === 0) break

          allItems.push(...nextItems)
          totalItems += nextItems.length
          currentPage++
          // Skip the extractList at top of loop — use continue to jump to pagination check
          html = nextHtml

          await updateSession(serviceClient, sessionId, {
            items_scraped: totalItems,
            pages_processed: currentPage,
            requests_made: totalRequests,
            last_activity_at: new Date().toISOString(),
          })

          if (totalItems >= maxItems) break
        } catch {
          // Pagination failed — likely no more pages
          break
        }

        // Rate limiting delay
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

          // Build detail URL from pattern
          const detailUrl = buildDetailUrl(rules.detail_url_pattern, item)
          if (!detailUrl) continue

          try {
            const detailHtml = await navigateTo(context.session.id, detailUrl)
            totalRequests++

            const detailData = extractDetailPage(detailHtml, rules.fields)
            // Merge detail data into item (detail overrides list data)
            Object.assign(item, detailData, { _detail_url: detailUrl })

            await updateSession(serviceClient, sessionId, {
              requests_made: totalRequests,
              last_activity_at: new Date().toISOString(),
            })
          } catch (error: any) {
            errors.push({
              page: detailUrl,
              error: `Detail page failed: ${error.message}`,
              timestamp: new Date().toISOString(),
              recoverable: true,
            })
          }

          // Rate limit between detail page visits
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
    await closeBrowserSession(context.session.id)

    // 7. Optionally create import job
    let importJobId = null
    if (options.create_import_job && totalItems > 0) {
      const { data: importJob } = await serviceClient
        .from('import_jobs')
        .insert({
          organization_id,
          source_type: 'web_scraper',
          status: 'mapping',
          records_total: totalItems,
          metadata: {
            scraping_session_id: sessionId,
            entity_types,
            source_id,
          },
        })
        .select()
        .single()

      if (importJob) {
        importJobId = importJob.id
        await updateSession(serviceClient, sessionId, {
          import_job_id: importJob.id,
        })
      }
    }

    return {
      success: true,
      session_id: sessionId,
      import_job_id: importJobId,
      summary: {
        entities_scraped: Object.keys(extractedData),
        items_by_entity: Object.fromEntries(
          Object.entries(extractedData).map(([k, v]) => [k, v.length])
        ),
        total_items: totalItems,
        total_requests: totalRequests,
        errors_count: errors.length,
        duration_ms: Date.now() - new Date(session.created_at).getTime(),
      },
      message: `Scraping completed. Extracted ${totalItems} items across ${entity_types.length} entity types.`,
    }
  } catch (error: any) {
    // Close browser session to avoid leak + cost
    if (context?.session?.id) {
      try { await closeBrowserSession(context.session.id) } catch { /* non-critical */ }
    }

    // Append to existing error log instead of overwriting
    const { data: currentSession } = await serviceClient
      .from('scraping_sessions')
      .select('error_log')
      .eq('id', sessionId)
      .single()

    const existingErrors = Array.isArray(currentSession?.error_log) ? currentSession.error_log : []

    await updateSession(serviceClient, sessionId, {
      status: 'error',
      error_log: [...existingErrors, { page: 'global', error: error.message, timestamp: new Date().toISOString(), recoverable: false }],
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
  // Pattern like: /expediente/{{reference}} or /mark/{{id}}
  let url = pattern
  const matches = pattern.match(/\{\{(\w+)\}\}/g)
  if (!matches) return pattern

  for (const match of matches) {
    const key = match.replace(/\{\{|\}\}/g, '')
    const value = item[key] || item[`_${key}`]
    if (!value) return null // Can't build URL without required field
    url = url.replace(match, encodeURIComponent(String(value)))
  }

  return url
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
