/**
 * Browserbase CDP Client
 *
 * Manages headless Chrome sessions via Browserbase using Chrome DevTools Protocol
 * over WebSocket. This replaces the previous REST-based approach which used
 * non-existent Browserbase endpoints.
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
 */

// ── Types ──────────────────────────────────────────────────

export interface NavigateResult {
  html: string
  url: string
  title: string
  screenshot?: string
}

export interface NavigationStepInput {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'scroll' | 'screenshot' | 'extract' | 'get_html'
  url?: string
  selector?: string
  value?: string
  timeout?: number
  _isLoginStep?: boolean
}

// ── CDP Browser Class ──────────────────────────────────────

export class CDPBrowser {
  private ws: WebSocket | null = null
  private messageId = 0
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: number }>()
  private cdpSessionId: string | null = null
  private bbSessionId: string
  private closed = false

  private constructor(bbSessionId: string) {
    this.bbSessionId = bbSessionId
  }

  /**
   * Create a new browser session via Browserbase and connect via CDP WebSocket.
   */
  static async create(): Promise<CDPBrowser> {
    const apiKey = Deno.env.get('BROWSERBASE_API_KEY')
    const projectId = Deno.env.get('BROWSERBASE_PROJECT_ID')
    if (!apiKey) throw new Error('BROWSERBASE_API_KEY not configured')
    if (!projectId) throw new Error('BROWSERBASE_PROJECT_ID not configured')

    // Create session via REST API
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch('https://api.browserbase.com/v1/sessions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-bb-api-key': apiKey,
        },
        body: JSON.stringify({
          projectId,
          browserSettings: {
            viewport: { width: 1280, height: 900 },
            blockAds: true,
          },
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Browserbase session creation failed (${response.status}): ${text.slice(0, 200)}`)
      }

      const data = await response.json()
      const browser = new CDPBrowser(data.id)

      // Connect via CDP WebSocket
      const wsUrl = data.connectUrl || `wss://connect.browserbase.com?sessionId=${data.id}&apiKey=${apiKey}`
      await browser.connectWebSocket(wsUrl)

      return browser
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Connect to Chrome via CDP WebSocket and attach to the default page.
   */
  private connectWebSocket(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error('CDP WebSocket connection timeout (15s)'))
      }, 15000)

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = async () => {
        clearTimeout(connectTimeout)
        try {
          // Get available targets
          const targets = await this.sendCDP('Target.getTargets')
          const pageTarget = targets?.targetInfos?.find((t: any) => t.type === 'page')

          if (pageTarget) {
            // Attach to the page target with flatten mode
            const result = await this.sendCDP('Target.attachToTarget', {
              targetId: pageTarget.targetId,
              flatten: true,
            })
            this.cdpSessionId = result?.sessionId
          }

          // Enable required CDP domains
          await this.sendCDP('Page.enable')
          await this.sendCDP('Runtime.enable')

          resolve()
        } catch (e) {
          reject(e)
        }
      }

      this.ws.onerror = (event: Event) => {
        clearTimeout(connectTimeout)
        reject(new Error('CDP WebSocket connection failed'))
      }

      this.ws.onclose = () => {
        this.closed = true
      }

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(String(event.data))
          // Match responses by id
          if (data.id !== undefined && this.pending.has(data.id)) {
            const handler = this.pending.get(data.id)!
            clearTimeout(handler.timer)
            this.pending.delete(data.id)
            if (data.error) {
              handler.reject(new Error(data.error.message || 'CDP error'))
            } else {
              handler.resolve(data.result)
            }
          }
          // Events (no id) are ignored for now — we use polling instead
        } catch {
          // Ignore parse errors
        }
      }
    })
  }

  /**
   * Send a CDP command and wait for the response.
   */
  private sendCDP(method: string, params?: any, timeoutMs = 30000): Promise<any> {
    if (this.closed || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('CDP connection is closed')
    }

    const id = ++this.messageId
    const msg: any = { id, method }
    if (params) msg.params = params
    if (this.cdpSessionId) msg.sessionId = this.cdpSessionId

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP timeout (${timeoutMs}ms): ${method}`))
      }, timeoutMs) as unknown as number

      this.pending.set(id, { resolve, reject, timer })
      this.ws!.send(JSON.stringify(msg))
    })
  }

  // ── Public API ─────────────────────────────────────────────

  /** Navigate to a URL and wait for page load. */
  async navigate(url: string): Promise<void> {
    await this.sendCDP('Page.navigate', { url })
    await this.waitForLoad()
  }

  /** Evaluate a JavaScript expression and return the result. */
  async evaluate(expression: string): Promise<any> {
    const result = await this.sendCDP('Runtime.evaluate', {
      expression,
      returnByValue: true,
      userGesture: true,
      awaitPromise: false,
    })

    if (result?.exceptionDetails) {
      const msg = result.exceptionDetails.exception?.description
        || result.exceptionDetails.text
        || 'JS evaluation error'
      throw new Error(msg)
    }

    return result?.result?.value
  }

  /** Get the full HTML of the current page. */
  async getHTML(): Promise<string> {
    return (await this.evaluate('document.documentElement.outerHTML')) || ''
  }

  /** Get page info (HTML, URL, title). */
  async getPageInfo(): Promise<NavigateResult> {
    const json = await this.evaluate(
      `JSON.stringify({url: window.location.href, title: document.title})`
    )
    const info = JSON.parse(json || '{}')
    const html = await this.getHTML()
    return { html, url: info.url || '', title: info.title || '' }
  }

  /**
   * Fill a form field. ONLY allowed during login (_isLoginStep).
   * Security: This is the ONLY mutation allowed, and only for authentication.
   */
  async fill(selector: string, value: string, isLoginStep: boolean): Promise<void> {
    if (!isLoginStep) {
      throw new Error(
        'SECURITY: fill action is restricted to login sequence only. ' +
        'The scraper operates in READ-ONLY mode on target portals.'
      )
    }
    validateSelector(selector)
    const escaped = escapeForJS(selector)
    const escapedValue = escapeForJS(value)
    await this.evaluate(`
      (function() {
        var el = document.querySelector('${escaped}');
        if (!el) return false;
        el.focus();
        el.value = '';
        el.value = '${escapedValue}';
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        return true;
      })()
    `)
  }

  /**
   * Click an element. Dangerous selectors are blocked unless _isLoginStep.
   */
  async click(selector: string, isLoginStep: boolean): Promise<void> {
    validateSelector(selector)

    // Block dangerous clicks unless login step
    if (!isLoginStep) {
      const selectorLower = selector.toLowerCase()
      const DANGEROUS_PATTERNS = [
        'delete', 'remove', 'eliminar', 'borrar', 'destroy',
        'edit', 'editar', 'modify', 'modificar', 'update', 'actualizar',
        'save', 'guardar', 'submit', 'enviar', 'create', 'crear', 'new', 'nuevo',
        'approve', 'aprobar', 'reject', 'rechazar', 'confirm', 'confirmar',
        'cancel', 'cancelar', 'close', 'cerrar',
        'upload', 'subir', 'download', 'descargar',
        'send', 'mail', 'email', 'notify', 'notificar',
      ]
      for (const pattern of DANGEROUS_PATTERNS) {
        if (selectorLower.includes(pattern)) {
          console.warn(`[READ-ONLY] Blocked click on dangerous selector: ${selector}`)
          return // Silently skip
        }
      }
    }

    const escaped = escapeForJS(selector)
    await this.evaluate(`
      (function() {
        var el = document.querySelector('${escaped}');
        if (el) el.click();
      })()
    `)
  }

  /** Wait for an element to appear on the page. */
  async waitForSelector(selector: string, timeoutMs = 10000): Promise<boolean> {
    validateSelector(selector)
    const escaped = escapeForJS(selector)
    const start = Date.now()
    const maxWait = Math.min(timeoutMs, 30000)

    while (Date.now() - start < maxWait) {
      try {
        const found = await this.evaluate(`!!document.querySelector('${escaped}')`)
        if (found) return true
      } catch {
        // Ignore transient errors during polling
      }
      await delay(500)
    }

    return false
  }

  /** Take a screenshot (base64 PNG). */
  async screenshot(): Promise<string> {
    try {
      const result = await this.sendCDP('Page.captureScreenshot', {
        format: 'png',
        quality: 70,
      })
      return result?.data || ''
    } catch {
      return ''
    }
  }

  /** Wait for page load to complete. */
  private async waitForLoad(timeoutMs = 15000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const ready = await this.evaluate('document.readyState')
        if (ready === 'complete' || ready === 'interactive') {
          await delay(500) // Extra wait for JS rendering
          return
        }
      } catch {
        // Page might be navigating — retry
      }
      await delay(300)
    }
    // Don't throw — some legacy pages never reach "complete"
    console.warn('[CDPBrowser] Page load timeout — proceeding anyway')
  }

  /** Close the browser session and release resources. */
  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true

    // Close WebSocket
    try { this.ws?.close() } catch { /* ignore */ }

    // Clear pending requests
    for (const [id, handler] of this.pending) {
      clearTimeout(handler.timer)
      handler.reject(new Error('Browser session closed'))
    }
    this.pending.clear()

    // Release Browserbase session via REST
    try {
      const apiKey = Deno.env.get('BROWSERBASE_API_KEY')
      if (apiKey) {
        await fetch(`https://api.browserbase.com/v1/sessions/${this.bbSessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bb-api-key': apiKey,
          },
          body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
        })
      }
    } catch {
      // Non-critical: session may have already expired
    }
  }

  /** Get the Browserbase session ID. */
  get sessionId(): string {
    return this.bbSessionId
  }
}

// ── Backward-compatible exports ────────────────────────────
// These maintain the interface used by navigator.ts and other files

export interface BrowserSession {
  id: string
  browser: CDPBrowser
}

export async function createBrowserSession(): Promise<BrowserSession> {
  const browser = await CDPBrowser.create()
  return { id: browser.sessionId, browser }
}

export async function closeBrowserSession(sessionOrId: string | BrowserSession): Promise<void> {
  // For backward compatibility — if called with just a session ID,
  // we release via REST. If called with a BrowserSession, close the browser.
  if (typeof sessionOrId === 'string') {
    try {
      const apiKey = Deno.env.get('BROWSERBASE_API_KEY')
      if (apiKey) {
        await fetch(`https://api.browserbase.com/v1/sessions/${sessionOrId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bb-api-key': apiKey,
          },
          body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
        })
      }
    } catch { /* non-critical */ }
  } else {
    await sessionOrId.browser.close()
  }
}

// ── Utilities ──────────────────────────────────────────────

const SAFE_SELECTOR_RE = /^[a-zA-Z0-9\s\-_#.\[\]=:()>"'*,+~>]+$/

function validateSelector(selector: string): void {
  if (!selector || selector.length > 500) {
    throw new Error('Invalid selector: empty or too long')
  }
  if (!SAFE_SELECTOR_RE.test(selector)) {
    throw new Error('Invalid selector: contains unsafe characters')
  }
}

function escapeForJS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
