/**
 * Navigation Step Executor
 *
 * Translates WebScraperConfig navigation steps into browser service calls.
 * Handles credential injection (replaces {{username}}/{{password}} placeholders).
 */

import {
  type BrowserSession,
  type NavigationStepInput,
  createBrowserSession,
  closeBrowserSession,
  navigateAndExtract,
} from './client.ts'

// ── Types ───────────────────────────────────────────────────

export interface NavigationStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'scroll' | 'screenshot' | 'extract'
  url?: string
  selector?: string
  value?: string
  timeout?: number
}

export interface Credentials {
  username: string
  password: string
  [key: string]: string  // Additional fields if needed
}

export interface NavigationContext {
  session: BrowserSession
  credentials: Credentials
  currentUrl: string
  screenshots: { step: string; timestamp: string; base64?: string }[]
}

// ── Navigator ───────────────────────────────────────────────

/**
 * Execute a login sequence using navigation steps and credentials.
 * Returns the navigation context with the authenticated session.
 */
export async function executeLoginSequence(
  steps: NavigationStep[],
  credentials: Credentials,
  options: { takeScreenshots?: boolean } = {}
): Promise<NavigationContext> {
  // Create browser session
  const session = await createBrowserSession()

  const context: NavigationContext = {
    session,
    credentials,
    currentUrl: '',
    screenshots: [],
  }

  try {
    // Inject credentials into step values
    const resolvedSteps = resolveCredentials(steps, credentials)

    // Execute each step
    for (let i = 0; i < resolvedSteps.length; i++) {
      const step = resolvedSteps[i]

      const result = await navigateAndExtract(session.id, [step])

      if (result.url) {
        context.currentUrl = result.url
      }

      // Take screenshot after significant steps
      if (options.takeScreenshots && ['goto', 'click'].includes(step.action)) {
        try {
          const ssResult = await navigateAndExtract(session.id, [
            { action: 'screenshot' },
          ])
          if (ssResult.screenshot) {
            context.screenshots.push({
              step: `step_${i}_${step.action}`,
              timestamp: new Date().toISOString(),
              base64: ssResult.screenshot,
            })
          }
        } catch {
          // Screenshot failure is non-critical
        }
      }
    }

    return context
  } catch (error) {
    // Close session on error
    await closeBrowserSession(session.id)
    throw error
  }
}

/**
 * Navigate to a URL within an existing session.
 */
export async function navigateTo(
  sessionId: string,
  url: string
): Promise<string> {
  const result = await navigateAndExtract(sessionId, [
    { action: 'goto', url },
    { action: 'get_html' },
  ])
  return result.html
}

/**
 * Get the current page's HTML from an existing session.
 */
export async function getCurrentPageHTML(sessionId: string): Promise<string> {
  const result = await navigateAndExtract(sessionId, [
    { action: 'get_html' },
  ])
  return result.html
}

/**
 * Click a pagination element and get the resulting page HTML.
 */
export async function clickAndGetHTML(
  sessionId: string,
  selector: string,
  waitMs: number = 2000
): Promise<string> {
  const result = await navigateAndExtract(sessionId, [
    { action: 'click', selector, timeout: waitMs },
    { action: 'get_html' },
  ])
  return result.html
}

// ── Credential Resolution ───────────────────────────────────

/**
 * Replace {{username}}, {{password}}, and other placeholders
 * in navigation step values with actual credentials.
 */
function resolveCredentials(
  steps: NavigationStep[],
  credentials: Credentials
): NavigationStepInput[] {
  return steps.map(step => {
    const resolved: NavigationStepInput = { ...step }

    if (resolved.value) {
      // Replace all {{key}} placeholders
      resolved.value = resolved.value.replace(
        /\{\{(\w+)\}\}/g,
        (_match, key) => credentials[key] || ''
      )
    }

    if (resolved.url) {
      resolved.url = resolved.url.replace(
        /\{\{(\w+)\}\}/g,
        (_match, key) => credentials[key] || ''
      )
    }

    return resolved
  })
}
