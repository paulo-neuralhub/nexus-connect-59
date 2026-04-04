/**
 * Action: test-connection
 *
 * Verifies that credentials can successfully log into the target portal.
 * Returns: success status, screenshot of dashboard, detected page structure.
 *
 * Reads from migration_connections table (not import_sources).
 */

import { getServiceClient } from '../index.ts'
import { executeLoginSequence } from '../browser/navigator.ts'
import { discoverPageStructure } from '../browser/parser.ts'
import { getSystemConfig } from '../systems/galena.ts'
import { loadConnectionAndCredentials } from '../_shared/connection-loader.ts'

interface TestConnectionParams {
  source_id: string
  organization_id: string
  user_id: string
  options: {
    take_screenshot?: boolean
  }
}

export async function testConnection(params: TestConnectionParams) {
  const { source_id, organization_id, options } = params

  // 1. Load connection config and credentials
  const { connection, credentials, scraperConfig } = await loadConnectionAndCredentials(
    source_id,
    organization_id
  )

  if (!scraperConfig?.navigation_config) {
    throw new Error('No navigation config found for this connection. Configure login steps first.')
  }

  // 2. Execute login sequence
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

  // 3. Analyze the resulting page (should be dashboard/home after login)
  let pageStructure
  try {
    const html = await context.browser.getHTML()
    pageStructure = discoverPageStructure(html)
  } catch {
    pageStructure = null
  }

  // 4. Close browser session
  await context.browser.close()

  // 5. Build response
  return {
    success: true,
    authenticated: true,
    current_url: context.currentUrl,
    page_title: pageStructure?.title || 'Unknown',
    screenshots: context.screenshots.map(s => ({
      step: s.step,
      timestamp: s.timestamp,
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
