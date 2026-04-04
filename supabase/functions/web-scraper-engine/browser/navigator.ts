/**
 * Navigation Step Executor
 *
 * Translates WebScraperConfig navigation steps into CDPBrowser calls.
 * Handles credential injection (replaces {{username}}/{{password}} placeholders).
 */

import {
  type BrowserSession,
  type CDPBrowser,
  createBrowserSession,
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
  [key: string]: string
}

export interface NavigationContext {
  session: BrowserSession
  browser: CDPBrowser
  credentials: Credentials
  currentUrl: string
  screenshots: { step: string; timestamp: string; base64?: string }[]
}

// ── Navigator ───────────────────────────────────────────────

/**
 * Execute a login sequence using navigation steps and credentials.
 * Returns the navigation context with the authenticated browser session.
 */
export async function executeLoginSequence(
  steps: NavigationStep[],
  credentials: Credentials,
  options: { takeScreenshots?: boolean } = {}
): Promise<NavigationContext> {
  const session = await createBrowserSession()

  const context: NavigationContext = {
    session,
    browser: session.browser,
    credentials,
    currentUrl: '',
    screenshots: [],
  }

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // Resolve credential placeholders
      const resolvedValue = step.value
        ? step.value.replace(/\{\{(\w+)\}\}/g, (_, key) => credentials[key] || '')
        : undefined
      const resolvedUrl = step.url
        ? step.url.replace(/\{\{(\w+)\}\}/g, (_, key) => credentials[key] || '')
        : undefined

      // All login steps are marked as login (allows fill/click)
      const isLoginStep = true

      console.log(`[navigator] Step ${i}: ${step.action}${step.selector ? ` → ${step.selector.slice(0, 60)}` : ''}${resolvedUrl ? ` → ${resolvedUrl}` : ''}`)

      switch (step.action) {
        case 'goto':
          if (resolvedUrl) {
            await session.browser.navigate(resolvedUrl)
            context.currentUrl = resolvedUrl
            console.log(`[navigator] Navigated to: ${resolvedUrl}`)
          }
          break

        case 'fill':
          if (step.selector && resolvedValue !== undefined) {
            await session.browser.fill(step.selector, resolvedValue, isLoginStep)
            // Log fill but NEVER log the actual value (could be password)
            console.log(`[navigator] Filled: ${step.selector.slice(0, 60)}`)
          }
          break

        case 'click':
          if (step.selector) {
            await session.browser.click(step.selector, isLoginStep)
            await delay(step.timeout || 2000)
            console.log(`[navigator] Clicked: ${step.selector.slice(0, 60)}`)
          }
          break

        case 'wait':
          if (step.selector) {
            const found = await session.browser.waitForSelector(
              step.selector,
              step.timeout || 10000
            )
            if (!found) {
              // Take diagnostic screenshot before failing
              console.warn(`[navigator] Wait timeout for: ${step.selector}`)
              try {
                const diagBase64 = await session.browser.screenshot()
                if (diagBase64) {
                  context.screenshots.push({
                    step: `step_${i}_wait_TIMEOUT`,
                    timestamp: new Date().toISOString(),
                    base64: diagBase64,
                  })
                }
                // Log current URL and page title for diagnosis
                const info = await session.browser.getPageInfo()
                console.warn(`[navigator] Current URL at timeout: ${info.url}`)
                console.warn(`[navigator] Page title at timeout: ${info.title}`)
              } catch (_e) { /* non-critical */ }

              throw new Error(`Timeout waiting for element: ${step.selector}`)
            }
            console.log(`[navigator] Found element: ${step.selector.slice(0, 60)}`)
          }
          break

        case 'screenshot':
          // Explicit screenshot step
          try {
            const ssBase64 = await session.browser.screenshot()
            if (ssBase64) {
              context.screenshots.push({
                step: `step_${i}_screenshot`,
                timestamp: new Date().toISOString(),
                base64: ssBase64,
              })
              console.log(`[navigator] Screenshot captured: step_${i}`)
            }
          } catch (_e) {
            console.warn(`[navigator] Screenshot failed at step ${i}`)
          }
          break

        case 'extract':
          // No-op during login — extraction happens later
          break
      }

      // Also take screenshot after significant steps (if enabled)
      if (options.takeScreenshots && ['goto', 'click', 'wait'].includes(step.action)) {
        try {
          const base64 = await session.browser.screenshot()
          if (base64) {
            context.screenshots.push({
              step: `step_${i}_${step.action}`,
              timestamp: new Date().toISOString(),
              base64,
            })
          }
        } catch (_e) {
          // Screenshot failure is non-critical
        }
      }
    }

    // Update current URL after login
    try {
      const info = await session.browser.getPageInfo()
      context.currentUrl = info.url
    } catch { /* non-critical */ }

    return context
  } catch (error) {
    // Close browser on login failure
    await session.browser.close()
    throw error
  }
}

/**
 * Navigate to a URL within an existing browser session.
 * Returns the page HTML.
 */
export async function navigateTo(
  browser: CDPBrowser,
  url: string
): Promise<string> {
  await browser.navigate(url)
  return await browser.getHTML()
}

/**
 * Get the current page's HTML from an existing browser session.
 */
export async function getCurrentPageHTML(browser: CDPBrowser): Promise<string> {
  return await browser.getHTML()
}

/**
 * Click a pagination element and get the resulting page HTML.
 * This is a READ-ONLY click (not login step) — dangerous selectors are blocked.
 */
export async function clickAndGetHTML(
  browser: CDPBrowser,
  selector: string,
  waitMs: number = 2000
): Promise<string> {
  await browser.click(selector, false) // isLoginStep = false
  await delay(waitMs)
  return await browser.getHTML()
}

// ── Utilities ───────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
