/**
 * Action: test-connection
 *
 * Verifies that credentials can successfully log into the target portal.
 * Returns: success status, screenshot of dashboard, detected page structure.
 */

import { getServiceClient } from '../index.ts'
import { executeLoginSequence } from '../browser/navigator.ts'
import { closeBrowserSession } from '../browser/client.ts'
import { discoverPageStructure } from '../browser/parser.ts'
import { getSystemConfig } from '../systems/galena.ts'

interface TestConnectionParams {
  source_id: string
  organization_id: string
  user_id: string
  options: {
    take_screenshot?: boolean
  }
}

export async function testConnection(params: TestConnectionParams) {
  const { source_id, options } = params
  const serviceClient = getServiceClient()

  // 1. Load source config
  const { data: source, error: sourceError } = await serviceClient
    .from('import_sources')
    .select('*')
    .eq('id', source_id)
    .single()

  if (sourceError || !source) {
    throw new Error('Import source not found')
  }

  // 2. Decrypt credentials
  const { data: credentialsRaw, error: credError } = await serviceClient
    .rpc('decrypt_source_credentials', { p_source_id: source_id })

  if (credError || !credentialsRaw) {
    throw new Error('Failed to decrypt credentials. Ensure credentials are saved for this source.')
  }

  const credentials = typeof credentialsRaw === 'string'
    ? JSON.parse(credentialsRaw)
    : credentialsRaw

  // 3. Get scraper config (from source or known system)
  const scraperConfig = source.scraper_config || getSystemConfig(source.system_id)
  if (!scraperConfig?.navigation_config) {
    throw new Error('No navigation config found for this source. Configure login steps first.')
  }

  // 4. Execute login sequence
  let context
  try {
    context = await executeLoginSequence(
      scraperConfig.navigation_config,
      credentials,
      { takeScreenshots: options.take_screenshot !== false }
    )
  } catch (error: any) {
    return {
      success: false,
      error: `Login failed: ${error.message}`,
      step: 'authentication',
    }
  }

  // 5. Analyze the resulting page (should be dashboard/home after login)
  let pageStructure
  try {
    const { navigateAndExtract } = await import('../browser/client.ts')
    const pageResult = await navigateAndExtract(context.session.id, [
      { action: 'get_html' },
    ])

    pageStructure = discoverPageStructure(pageResult.html)
  } catch {
    pageStructure = null
  }

  // 6. Close browser session
  await closeBrowserSession(context.session.id)

  // 7. Build response
  return {
    success: true,
    authenticated: true,
    current_url: context.currentUrl,
    page_title: pageStructure?.title || 'Unknown',
    screenshots: context.screenshots.map(s => ({
      step: s.step,
      timestamp: s.timestamp,
      // Don't return full base64 in response — store it if needed
      available: !!s.base64,
    })),
    detected_structure: pageStructure ? {
      navigation_links: pageStructure.navigation.length,
      tables: pageStructure.tables.length,
      forms: pageStructure.forms.length,
      sample_navigation: pageStructure.navigation.slice(0, 10),
      sample_tables: pageStructure.tables.slice(0, 5),
    } : null,
    message: 'Login successful. Portal structure detected.',
  }
}
