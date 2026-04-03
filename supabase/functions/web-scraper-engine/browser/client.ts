/**
 * Browserbase API Client
 *
 * Manages headless Chrome sessions via Browserbase's managed service.
 * Falls back to Browserless if Browserbase is unavailable.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🔒 READ-ONLY MODE — CRITICAL SECURITY INVARIANT           ║
 * ║                                                              ║
 * ║  This scraper operates in STRICT READ-ONLY mode on target   ║
 * ║  portals. It MUST NEVER modify, delete, create, or submit   ║
 * ║  any data on the client's portal.                            ║
 * ║                                                              ║
 * ║  Allowed write operations (login ONLY):                      ║
 * ║  - fill: BLOCKED unless _isLoginStep === true                ║
 * ║  - click: dangerous selectors BLOCKED unless _isLoginStep    ║
 * ║                                                              ║
 * ║  Everything else is navigation + HTML extraction.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Environment variables:
 * - BROWSERBASE_API_KEY: API key for Browserbase
 * - BROWSERBASE_PROJECT_ID: Project ID for Browserbase
 * - BROWSERLESS_API_KEY: (fallback) API key for Browserless
 */

export interface BrowserSession {
  id: string
  wsUrl: string       // WebSocket URL for CDP connection
  status: 'running' | 'completed' | 'error'
  provider: 'browserbase' | 'browserless'
}

export interface NavigateResult {
  html: string
  url: string
  title: string
  status: number
  screenshot?: string  // Base64 encoded PNG
}

// ── Browserbase API ─────────────────────────────────────────

const BROWSERBASE_API = 'https://www.browserbase.com/v1'

async function browserbaseRequest(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<any> {
  const apiKey = Deno.env.get('BROWSERBASE_API_KEY')
  if (!apiKey) throw new Error('BROWSERBASE_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BROWSERBASE_API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-bb-api-key': apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Browserbase API error ${response.status}`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

// ── Session Management ──────────────────────────────────────

export async function createBrowserSession(): Promise<BrowserSession> {
  const projectId = Deno.env.get('BROWSERBASE_PROJECT_ID')
  if (!projectId) throw new Error('BROWSERBASE_PROJECT_ID not configured')

  const data = await browserbaseRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      browserSettings: {
        // Standard Chrome with reasonable viewport
        viewport: { width: 1280, height: 900 },
        // Block unnecessary resources for faster loading
        blockAds: true,
      },
      // Keep session alive for up to 15 minutes
      keepAlive: true,
      timeout: 900000,
    }),
  })

  return {
    id: data.id,
    wsUrl: data.connectUrl || `wss://connect.browserbase.com?apiKey=${Deno.env.get('BROWSERBASE_API_KEY')}&sessionId=${data.id}`,
    status: 'running',
    provider: 'browserbase',
  }
}

export async function closeBrowserSession(sessionId: string): Promise<void> {
  try {
    await browserbaseRequest(`/sessions/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
    })
  } catch (error) {
    // Non-critical: session may have already expired
    console.warn(`[browser-client] Failed to close session ${sessionId}:`, error)
  }
}

// ── Page Navigation via REST (no WebSocket needed) ──────────

/**
 * Execute a sequence of navigation steps and return the final page HTML.
 *
 * This uses Browserbase's REST Content API which is simpler than CDP.
 * For Phase 1, we use the content API to get rendered HTML.
 * Phase 2+ can upgrade to CDP WebSocket for real-time interaction.
 */
export async function navigateAndExtract(
  sessionId: string,
  steps: NavigationStepInput[]
): Promise<NavigateResult> {
  // ── READ-ONLY VALIDATION (defense-in-depth) ──────────────
  // Reject any 'fill' step that isn't part of the login sequence.
  // This is a second layer of protection — executeStep() also checks.
  for (const step of steps) {
    if (step.action === 'fill' && !step._isLoginStep) {
      throw new Error(
        'SECURITY: fill action rejected — not a login step. ' +
        'Scraper is READ-ONLY on target portals.'
      )
    }
  }

  let lastResult: NavigateResult = {
    html: '',
    url: '',
    title: '',
    status: 0,
  }

  for (const step of steps) {
    lastResult = await executeStep(sessionId, step, lastResult)
  }

  return lastResult
}

export interface NavigationStepInput {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'scroll' | 'screenshot' | 'extract' | 'get_html'
  url?: string
  selector?: string
  value?: string
  timeout?: number
  /** Mark step as part of login sequence — only login steps can use 'fill' */
  _isLoginStep?: boolean
}

async function executeSessionRequest(
  sessionId: string,
  path: string,
  body: any,
  timeoutMs: number = 15000
): Promise<any> {
  return browserbaseRequest(
    `/sessions/${sessionId}${path}`,
    { method: 'POST', body: JSON.stringify(body) },
    timeoutMs
  )
}

async function executeStep(
  sessionId: string,
  step: NavigationStepInput,
  _previous: NavigateResult
): Promise<NavigateResult> {
  switch (step.action) {
    case 'goto': {
      const data = await executeSessionRequest(
        sessionId, '/navigate', { url: step.url }, 30000
      )
      return {
        html: data.html || '',
        url: step.url || '',
        title: data.title || '',
        status: data.status || 200,
      }
    }

    case 'fill': {
      // ── READ-ONLY GUARD ──────────────────────────────────
      // 'fill' is ONLY allowed during login sequence.
      // This prevents accidental form submissions, edits, or
      // data modifications on the target portal.
      if (!step._isLoginStep) {
        throw new Error(
          'SECURITY: fill action is restricted to login sequence only. ' +
          'The scraper operates in READ-ONLY mode on target portals.'
        )
      }
      // Validate selector strictly before interpolation
      const safeSelector = escapeSelector(step.selector || '')
      // Value is passed via JSON.stringify — safe from injection
      const safeValue = JSON.stringify(step.value || '')
      await executeSessionRequest(sessionId, '/execute', {
        script: `(function(){var el=document.querySelector('${safeSelector}');if(el){el.value='';el.focus();el.value=${safeValue};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}})()`,
      })
      return _previous
    }

    case 'click': {
      // ── READ-ONLY GUARD ──────────────────────────────────
      // Block clicks on dangerous elements (delete, edit, remove, submit forms)
      // to ensure the scraper NEVER modifies data on the target portal.
      const selectorLower = (step.selector || '').toLowerCase()
      const DANGEROUS_PATTERNS = [
        'delete', 'remove', 'eliminar', 'borrar', 'destroy',
        'edit', 'editar', 'modify', 'modificar', 'update', 'actualizar',
        'save', 'guardar', 'submit', 'enviar', 'create', 'crear', 'new', 'nuevo',
        'approve', 'aprobar', 'reject', 'rechazar', 'confirm', 'confirmar',
        'cancel', 'cancelar', 'close', 'cerrar',
        'upload', 'subir', 'download', 'descargar',
        'send', 'mail', 'email', 'notify', 'notificar',
      ]
      // Allow clicks on login buttons (marked as _isLoginStep) without restriction
      if (!step._isLoginStep) {
        for (const pattern of DANGEROUS_PATTERNS) {
          if (selectorLower.includes(pattern)) {
            console.warn(`[READ-ONLY] Blocked click on dangerous selector: ${step.selector}`)
            return _previous // Silently skip — never click dangerous elements
          }
        }
      }
      const safeSelector = escapeSelector(step.selector || '')
      await executeSessionRequest(sessionId, '/execute', {
        script: `(function(){var el=document.querySelector('${safeSelector}');if(el)el.click()})()`,
      })
      if (step.timeout) {
        await delay(Math.min(step.timeout, 10000))
      } else {
        await delay(2000)
      }
      return _previous
    }

    case 'wait': {
      const safeSelector = escapeSelector(step.selector || '')
      const maxWait = Math.min(step.timeout || 10000, 30000)
      const startTime = Date.now()

      while (Date.now() - startTime < maxWait) {
        const checkData = await executeSessionRequest(sessionId, '/execute', {
          script: `!!document.querySelector('${safeSelector}')`,
        }, 10000)
        if (checkData.result === true) return _previous
        await delay(500)
      }
      throw new Error('Timeout waiting for element')
    }

    case 'get_html':
    case 'extract': {
      const htmlData = await executeSessionRequest(sessionId, '/execute', {
        script: `JSON.stringify({html:document.documentElement.outerHTML,url:window.location.href,title:document.title})`,
      }, 20000)
      const pageInfo = JSON.parse(htmlData.result || '{}')
      return {
        html: pageInfo.html || '',
        url: pageInfo.url || '',
        title: pageInfo.title || '',
        status: 200,
      }
    }

    case 'screenshot': {
      const ssData = await browserbaseRequest(
        `/sessions/${sessionId}/screenshot`,
        { method: 'GET' },
        15000
      )
      return {
        ..._previous,
        screenshot: ssData.base64 || ssData.image || '',
      }
    }

    default:
      return _previous
  }
}

// ── Utilities ───────────────────────────────────────────────

// Strict allowlist for CSS selectors — reject anything outside safe chars
// Strict CSS selector allowlist — only valid CSS selector characters
const SAFE_SELECTOR_RE = /^[a-zA-Z0-9\s\-_#.\[\]=:()>"'*,+~>]+$/

function validateSelector(selector: string): string {
  if (!selector || selector.length > 500) {
    throw new Error('Invalid selector: empty or too long')
  }
  if (!SAFE_SELECTOR_RE.test(selector)) {
    throw new Error(`Invalid selector: contains unsafe characters`)
  }
  return selector
}

function escapeSelector(selector: string): string {
  // Validate first, then escape — backslashes FIRST, then quotes
  validateSelector(selector)
  return selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
