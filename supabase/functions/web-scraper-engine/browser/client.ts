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

  // ── Network capture ──
  private _networkRequests: { url: string; method: string; type: string; requestId?: string }[] = []
  private _networkResponses: { requestId: string; url: string; status: number; mimeType: string }[] = []
  private _captureNetwork = false

  // ── Execution contexts (frame → contextId) ──
  private _executionContexts = new Map<string, number>()  // frameId → contextId
  private _contextFrameMap = new Map<number, string>()     // contextId → frameId

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

          // ── Event handling (no id) ──
          if (data.id === undefined && data.method) {
            // Capture network requests
            if (data.method === 'Network.requestWillBeSent' && this._captureNetwork) {
              const req = data.params?.request
              if (req?.url) {
                this._networkRequests.push({
                  url: req.url,
                  method: req.method || 'GET',
                  type: data.params.type || 'Other',
                  requestId: data.params.requestId || '',
                })
              }
            }
            // Capture network responses
            if (data.method === 'Network.responseReceived' && this._captureNetwork) {
              const resp = data.params?.response
              const reqId = data.params?.requestId
              if (resp?.url && reqId) {
                this._networkResponses.push({
                  requestId: reqId,
                  url: resp.url,
                  status: resp.status || 0,
                  mimeType: resp.mimeType || '',
                })
              }
            }
            // Track execution contexts (for frame-aware evaluation)
            if (data.method === 'Runtime.executionContextCreated') {
              const ctx = data.params?.context
              if (ctx?.id && ctx?.auxData?.frameId) {
                this._executionContexts.set(ctx.auxData.frameId, ctx.id)
                this._contextFrameMap.set(ctx.id, ctx.auxData.frameId)
              }
            }
            if (data.method === 'Runtime.executionContextDestroyed') {
              const ctxId = data.params?.executionContextId
              if (ctxId) {
                const frameId = this._contextFrameMap.get(ctxId)
                if (frameId) this._executionContexts.delete(frameId)
                this._contextFrameMap.delete(ctxId)
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    })
  }

  /**
   * Send a CDP command and wait for the response.
   * NOTE: Made public in v33 to support Input.dispatchMouseEvent for trusted clicks.
   */
  public sendCDP(method: string, params?: any, timeoutMs = 30000): Promise<any> {
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

  // ── Network Capture API ──────────────────────────────────

  /** Enable network request capture. Call before navigating. */
  async enableNetworkCapture(): Promise<void> {
    this._captureNetwork = true
    this._networkRequests = []
    await this.sendCDP('Network.enable')
  }

  /** Get all captured network requests. */
  getNetworkRequests(): { url: string; method: string; type: string }[] {
    return [...this._networkRequests]
  }

  /** Clear captured requests (keep capture enabled). */
  clearNetworkRequests(): void {
    this._networkRequests = []
    this._networkResponses = []
  }

  /** Get all captured network responses. */
  getNetworkResponses(): { requestId: string; url: string; status: number; mimeType: string }[] {
    return [...this._networkResponses]
  }

  /** Get the body of a captured network response by requestId. */
  async getResponseBody(requestId: string): Promise<string> {
    try {
      const result = await this.sendCDP('Network.getResponseBody', { requestId })
      if (result?.base64Encoded) {
        // Decode base64 response
        return atob(result.body || '')
      }
      return result?.body || ''
    } catch {
      return ''
    }
  }

  // ── Frame API ──────────────────────────────────────────

  /** Get the full frame tree (all frames/iframes). */
  async getFrameTree(): Promise<any> {
    return await this.sendCDP('Page.getFrameTree')
  }

  /** Get all frame URLs in a flat list. */
  async getAllFrameUrls(): Promise<{ frameId: string; url: string; name: string }[]> {
    const tree = await this.getFrameTree()
    const frames: { frameId: string; url: string; name: string }[] = []

    function walk(node: any) {
      if (node?.frame) {
        frames.push({
          frameId: node.frame.id,
          url: node.frame.url || '',
          name: node.frame.name || '',
        })
      }
      if (node?.childFrames) {
        for (const child of node.childFrames) walk(child)
      }
    }
    walk(tree?.frameTree || tree)

    return frames
  }

  /**
   * Evaluate JavaScript in a specific frame by frameId.
   * Uses the execution context tracked from Runtime.executionContextCreated events.
   * Falls back to creating an isolated world if context not found.
   */
  async evaluateInFrame(frameId: string, expression: string): Promise<any> {
    let contextId = this._executionContexts.get(frameId)

    // Fallback: create isolated world for the frame
    if (!contextId) {
      try {
        const world = await this.sendCDP('Page.createIsolatedWorld', {
          frameId,
          worldName: 'scraper',
          grantUniveralAccess: true,
        })
        contextId = world?.executionContextId
      } catch {
        // Isolated world not supported or frame gone
      }
    }

    if (!contextId) {
      throw new Error(`No execution context for frame: ${frameId}`)
    }

    const result = await this.sendCDP('Runtime.evaluate', {
      expression,
      contextId,
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

  /**
   * Try to evaluate an expression in ALL frames until one succeeds.
   * Returns { frameId, value } or null.
   */
  async evaluateInAnyFrame(expression: string): Promise<{ frameId: string; value: any } | null> {
    const frames = await this.getAllFrameUrls()
    for (const frame of frames) {
      try {
        const value = await this.evaluateInFrame(frame.frameId, expression)
        if (value !== undefined && value !== null) {
          return { frameId: frame.frameId, value }
        }
      } catch {
        // Try next frame
      }
    }
    return null
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
