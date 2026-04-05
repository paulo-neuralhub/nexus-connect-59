/**
 * Action: scrape — v36
 *
 * Frame-aware CDP + Network Response Interception + Ext.NET DirectEvent support.
 *
 * Key fix in v36:
 * - v35 BUG: When CDP timeout occurs during batch search (e.g. letter "f"),
 *   the error bubbles to the entity catch → final save OVERWRITES incrementally
 *   saved data with empty local variables → items_scraped drops to 0.
 *   Fix: (1) clickBuscarAndCollect never throws (internal try-catch returns error in result),
 *   (2) batch loop tracks consecutive failures and breaks at 3,
 *   (3) final save MERGES with DB data instead of overwriting,
 *   (4) grid extraction has its own try-catch to fall back to network responses.
 * - Batched alphabetical search on the Denominacion (brand name) field.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  READ-ONLY MODE — Never modifies data on target portal      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { getServiceClient } from '../index.ts'
import { executeLoginSequence, navigateTo, getCurrentPageHTML, clickAndGetHTML } from '../browser/navigator.ts'
import { extractList, extractDetailPage, discoverPageStructure, type ExtractionRule } from '../browser/parser.ts'
import { loadConnectionAndCredentials } from '../_shared/connection-loader.ts'

// ── Entity keyword mapping (Spanish + English) ──────────

const ENTITY_KEYWORDS: Record<string, string[]> = {
  matters: [
    'marca', 'expediente', 'caso', 'trademark', 'mark', 'case', 'portfolio',
    'listado', 'buscar', 'consulta', 'search', 'registro', 'tramite', 'solicitud',
    'patente', 'patent', 'diseno', 'design', 'propiedad', 'dossier',
    'accionestercero', 'inventore',
  ],
  contacts: [
    'cliente', 'contacto', 'titular', 'client', 'contact', 'owner', 'applicant',
    'persona', 'empresa', 'company', 'solicitante', 'representante',
    'propietario',
  ],
  deadlines: [
    'plazo', 'vencimiento', 'deadline', 'renewal', 'renovacion', 'fecha',
    'calendario', 'recordatorio', 'alerta', 'reminder', 'expir',
    'evento', 'agenda',
  ],
}

// ── Main scrape function ────────────────────────────────

export async function scrape(params: any) {
  const { source_id, organization_id, user_id, entity_types, options } = params
  const serviceClient = getServiceClient()
  const maxPages = Math.min(options.max_pages || 20, 50)
  const maxItems = Math.min(options.max_items || 5000, 10000)

  let delayMs = options.delay_between_pages_ms || 3000
  if (options.speed === 'conservative') delayMs = 6000
  else if (options.speed === 'moderate') delayMs = 3000
  else if (options.speed === 'fast') delayMs = 1500

  const { connection, credentials, scraperConfig } = await loadConnectionAndCredentials(source_id, organization_id)
  if (!scraperConfig) throw new Error('No scraper config found')

  const { data: session, error: sessionError } = await serviceClient
    .from('scraping_sessions')
    .insert({ organization_id, connection_id: source_id, source_id, status: 'initializing', created_by: user_id })
    .select().single()
  if (sessionError || !session) throw new Error(`Failed to create session: ${sessionError?.message}`)
  const sessionId = session.id
  let context: any = null

  try {
    // ═══════════════════════════════════════════════════════
    // 1. LOGIN
    // ═══════════════════════════════════════════════════════
    await updateSession(serviceClient, sessionId, { status: 'authenticating', current_page: 'Autenticando...' })
    try {
      context = await executeLoginSequence(
        scraperConfig.navigation_config,
        credentials,
        { takeScreenshots: options.include_screenshots !== false }
      )
    } catch (loginError: any) {
      (loginError as any)._context = context
      await updateSession(serviceClient, sessionId, {
        status: 'error',
        error_log: [{ page: 'login', error: loginError.message, timestamp: ts(), recoverable: false }],
        completed_at: ts(),
      })
      throw loginError
    }
    console.log(`[scrape] Login OK → ${context.currentUrl}`)
    await updateSession(serviceClient, sessionId, { status: 'authenticated', browser_session_id: context.session.id })

    // ═══════════════════════════════════════════════════════
    // 2. ENABLE NETWORK CAPTURE + WAIT FOR FULL LOAD
    // ═══════════════════════════════════════════════════════
    console.log('[scrape] Enabling network capture...')
    await context.browser.enableNetworkCapture()

    // Wait for ExtJS/Ext.NET to fully initialize (AJAX-loaded components)
    console.log('[scrape] Waiting 4s for framework initialization...')
    await delay(4000)

    // ═══════════════════════════════════════════════════════
    // 3. FRAME-AWARE DISCOVERY
    // ═══════════════════════════════════════════════════════
    // Global timeout tracking — bail before 150s wall clock
    const GLOBAL_START = Date.now()
    const TIMEOUT_MS = 130_000
    function timeLeft() { return TIMEOUT_MS - (Date.now() - GLOBAL_START) }
    function timedOut() { return timeLeft() < 15_000 }

    const needsDiscovery = (entity_types || []).some(
      (et: string) => !scraperConfig.extraction_rules?.[et]?.list_url
    )

    const debug: any = {
      version: 'v31',
      dashboard_url: context.currentUrl,
      frames: [],
      network_urls: [],
      extjs_frame: null,
      extjs_version: null,
      extjs_components: 0,
      menu_items: [],
      discovered_urls: [],
      entity_matches: {},
      errors: [],
    }

    if (needsDiscovery) {
      console.log('[scrape] Running v19 frame-aware discovery...')
      await updateSession(serviceClient, sessionId, { status: 'navigating', current_entity: 'discovery' })

      try {
        // ── Step A: Discover ALL frames ──
        const frames = await context.browser.getAllFrameUrls()
        debug.frames = frames.map((f: any) => ({ id: f.frameId, url: f.url, name: f.name }))
        console.log(`[scrape] Frames found: ${frames.length}`)
        for (const f of frames) console.log(`[scrape]   Frame: ${f.name || '(main)'} → ${f.url}`)

        // ── Step B: Collect network requests (loaded during page init) ──
        const netRequests = context.browser.getNetworkRequests()
        const aspxNetUrls = new Set<string>()
        for (const req of netRequests) {
          if (req.url.includes('.aspx') && !req.url.includes('ext.axd') && !req.url.includes('ScriptResource')) {
            aspxNetUrls.add(req.url.split('?')[0]) // Remove query params for uniqueness
          }
        }
        debug.network_urls = Array.from(aspxNetUrls).slice(0, 50)
        console.log(`[scrape] Network .aspx URLs captured: ${aspxNetUrls.size}`)
        for (const u of aspxNetUrls) console.log(`[scrape]   Net: ${u}`)

        // ── Step C: Find the frame where ExtJS lives ──
        let extjsFrameId: string | null = null
        let extjsResult: any = null

        // First try main frame evaluate
        try {
          const mainResult = await context.browser.evaluate(`
            (function() {
              if (typeof Ext === 'undefined') return null;
              return JSON.stringify({
                version: Ext.getVersion ? Ext.getVersion().version : (Ext.version || 'unknown'),
                componentCount: Ext.ComponentManager && Ext.ComponentManager.all
                  ? (Ext.ComponentManager.all.getCount ? Ext.ComponentManager.all.getCount() : Object.keys(Ext.ComponentManager.all.map || {}).length)
                  : 0
              });
            })()
          `)
          if (mainResult) {
            extjsResult = JSON.parse(mainResult)
            extjsFrameId = 'main'
            console.log(`[scrape] ExtJS found in MAIN frame: v${extjsResult.version}, ${extjsResult.componentCount} components`)
          }
        } catch (e: any) {
          console.log(`[scrape] ExtJS not in main frame: ${e.message}`)
        }

        // If not in main, try each iframe
        if (!extjsFrameId) {
          for (const frame of frames) {
            if (!frame.url || frame.url === 'about:blank') continue
            try {
              const result = await context.browser.evaluateInFrame(frame.frameId, `
                (function() {
                  if (typeof Ext === 'undefined') return null;
                  return JSON.stringify({
                    version: Ext.getVersion ? Ext.getVersion().version : (Ext.version || 'unknown'),
                    componentCount: Ext.ComponentManager && Ext.ComponentManager.all
                      ? (Ext.ComponentManager.all.getCount ? Ext.ComponentManager.all.getCount() : Object.keys(Ext.ComponentManager.all.map || {}).length)
                      : 0
                  });
                })()
              `)
              if (result) {
                extjsResult = JSON.parse(result)
                extjsFrameId = frame.frameId
                console.log(`[scrape] ExtJS found in frame "${frame.name}" (${frame.url}): v${extjsResult.version}, ${extjsResult.componentCount} components`)
                break
              }
            } catch {
              // Not in this frame
            }
          }
        }

        debug.extjs_frame = extjsFrameId
        debug.extjs_version = extjsResult?.version || null
        debug.extjs_components = extjsResult?.componentCount || 0

        // ── Step D: Query ExtJS menu in the correct frame ──
        if (extjsFrameId) {
          const evalFn = extjsFrameId === 'main'
            ? (expr: string) => context.browser.evaluate(expr)
            : (expr: string) => context.browser.evaluateInFrame(extjsFrameId!, expr)

          try {
            const menuJson = await evalFn(`
              (function() {
                var items = [];

                // Strategy 1: TreePanel (Ext.NET menu panels)
                try {
                  var trees = Ext.ComponentQuery.query('treepanel');
                  for (var t = 0; t < trees.length; t++) {
                    var root = trees[t].getRootNode();
                    if (root) root.cascadeBy(function(node) {
                      var d = node.data || node.attributes || {};
                      if (d.text) items.push({
                        text: d.text,
                        url: d.url || d.href || d.qtip || d.navigateUrl || '',
                        leaf: !!d.leaf,
                        id: node.id || d.id || '',
                        panelId: trees[t].id,
                        source: 'treepanel'
                      });
                    });
                  }
                } catch(e) {}

                // Strategy 2: Specific MenuPanel1 (Ext.NET)
                try {
                  var mp = Ext.getCmp('MenuPanel1');
                  if (mp && mp.getRootNode) {
                    mp.getRootNode().cascadeBy(function(node) {
                      var d = node.data || node.attributes || {};
                      if (d.text) items.push({
                        text: d.text,
                        url: d.url || d.href || d.qtip || d.navigateUrl || '',
                        leaf: !!d.leaf,
                        id: node.id || '',
                        source: 'MenuPanel1'
                      });
                    });
                  }
                } catch(e) {}

                // Strategy 3: Ext.menu.Menu components
                try {
                  var menus = Ext.ComponentQuery.query('menu');
                  for (var m = 0; m < menus.length; m++) {
                    if (menus[m].items) menus[m].items.each(function(item) {
                      if (item.text) items.push({
                        text: item.text,
                        url: item.url || item.href || '',
                        id: item.id || '',
                        source: 'menu'
                      });
                    });
                  }
                } catch(e) {}

                // Strategy 4: All components with URLs or loaders
                try {
                  var all = Ext.ComponentManager.all;
                  var keys = all.getKeys ? all.getKeys() : Object.keys(all.map || {});
                  for (var i = 0; i < keys.length; i++) {
                    var comp = all.get ? all.get(keys[i]) : all.map[keys[i]];
                    if (comp) {
                      var url = comp.url || (comp.loader && comp.loader.url) || '';
                      if (url && url.includes('.aspx')) {
                        items.push({
                          text: comp.title || comp.text || comp.id || '',
                          url: url,
                          id: comp.id,
                          xtype: comp.xtype || '',
                          source: 'component'
                        });
                      }
                    }
                  }
                } catch(e) {}

                // Strategy 5: Panel body links (accordion menus with <a> tags)
                try {
                  var panels = Ext.ComponentQuery.query('panel');
                  for (var p = 0; p < panels.length; p++) {
                    var panel = panels[p];
                    if (panel.body && panel.body.dom) {
                      var links = panel.body.dom.querySelectorAll('a[href]');
                      for (var l = 0; l < links.length; l++) {
                        var href = links[l].getAttribute('href') || '';
                        if (href && href !== '#' && !href.startsWith('javascript:')) {
                          items.push({
                            text: links[l].textContent || '',
                            url: href,
                            source: 'panel_link'
                          });
                        }
                      }
                    }
                  }
                } catch(e) {}

                // Strategy 6: DOM scan for menu-like elements
                try {
                  var selectors = '.x-tree-node-text, .x-menu-item-text, .x-panel-header-text, .x-tab-inner, [class*="menu"] a, [class*="nav"] a';
                  var els = document.querySelectorAll(selectors);
                  for (var d = 0; d < els.length; d++) {
                    var el = els[d];
                    var text = (el.textContent || '').trim();
                    var href = el.getAttribute('href') || el.closest('a')?.getAttribute('href') || '';
                    if (text && text.length < 100) {
                      items.push({ text: text, url: href || '', source: 'dom_scan' });
                    }
                  }
                } catch(e) {}

                // Strategy 7: Search for addTab function calls in ALL script elements
                try {
                  var scripts = document.querySelectorAll('script');
                  for (var s = 0; s < scripts.length; s++) {
                    var src = scripts[s].textContent || '';
                    var re = /addTab\\s*\\([^,]*,\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]+\\.aspx[^'"]*)['"]\\s*,\\s*['"]([^'"]+)['"]/g;
                    var m;
                    while ((m = re.exec(src)) !== null) {
                      items.push({ text: m[3], url: m[2], id: m[1], source: 'addTab_script' });
                    }
                  }
                } catch(e) {}

                // Strategy 8: Look for onclick handlers with URL patterns
                try {
                  var clickEls = document.querySelectorAll('[onclick]');
                  for (var c = 0; c < clickEls.length; c++) {
                    var onclick = clickEls[c].getAttribute('onclick') || '';
                    var aspxMatch = onclick.match(/['"]([^'"]*\\.aspx[^'"]*)['"]/);
                    if (aspxMatch) {
                      items.push({
                        text: (clickEls[c].textContent || '').trim(),
                        url: aspxMatch[1],
                        source: 'onclick'
                      });
                    }
                  }
                } catch(e) {}

                // Deduplicate
                var seen = new Set();
                var unique = [];
                for (var u = 0; u < items.length; u++) {
                  var key = items[u].text + '|' + items[u].url;
                  if (!seen.has(key)) { seen.add(key); unique.push(items[u]); }
                }
                return JSON.stringify(unique);
              })()
            `)

            if (menuJson) {
              const menuItems = JSON.parse(menuJson)
              debug.menu_items = menuItems.slice(0, 100)
              console.log(`[scrape] Menu items discovered: ${menuItems.length}`)
              for (const item of menuItems.slice(0, 30)) {
                console.log(`[scrape]   [${item.source}] "${item.text}" → ${item.url || '(no url)'}`)
              }
            }
          } catch (e: any) {
            debug.errors.push(`ExtJS menu query: ${e.message}`)
            console.warn(`[scrape] ExtJS menu query failed: ${e.message}`)
          }

          // ── Step D2: Intercept addTab + trigger menu handlers ──
          // Ext.NET/Galena menu items have NO URLs — they use DirectEvent
          // handlers that call addTab(tabPanel, id, url, title, menuItem)
          // on the server response. We intercept addTab to capture URLs.
          const menuItemsWithoutUrl = (debug.menu_items || []).filter(
            (i: any) => !i.url && i.text && (i.source === 'menu' || i.source === 'treepanel')
          )
          if (menuItemsWithoutUrl.length > 0) {
            console.log(`[scrape] ${menuItemsWithoutUrl.length} menu items without URLs — intercepting addTab...`)

            // First, try to extract URLs from handler source code
            try {
              const handlerJson = await evalFn(`
                (function() {
                  var results = [];
                  var items = Ext.ComponentQuery.query('menuitem');
                  for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var src = '';
                    try { if (item.handler) src = item.handler.toString(); } catch(e) {}
                    try { if (!src && item.directEvents && item.directEvents.click) src = JSON.stringify(item.directEvents.click); } catch(e) {}
                    try { if (!src && item.listeners && item.listeners.click) src = item.listeners.click.fn ? item.listeners.click.fn.toString() : item.listeners.click.toString(); } catch(e) {}
                    var urlMatch = src.match(/['"]([^'"]*\\.aspx[^'"]*)['"]/);
                    results.push({
                      id: item.id,
                      text: item.text || '',
                      handlerLen: src.length,
                      handlerSnippet: src.substring(0, 300),
                      extractedUrl: urlMatch ? urlMatch[1] : ''
                    });
                  }
                  return JSON.stringify(results);
                })()
              `)

              if (handlerJson) {
                const handlers = JSON.parse(handlerJson)
                debug.menu_handlers = handlers
                console.log(`[scrape] Handler analysis: ${handlers.length} items`)
                for (const h of handlers) {
                  if (h.extractedUrl) {
                    console.log(`[scrape]   Handler "${h.text}" → ${h.extractedUrl}`)
                    // Update the menu item URL
                    const menuItem = debug.menu_items.find((m: any) => m.id === h.id || m.text === h.text)
                    if (menuItem) menuItem.url = h.extractedUrl
                  } else {
                    console.log(`[scrape]   Handler "${h.text}": ${h.handlerLen} chars, snippet: ${h.handlerSnippet.substring(0, 80)}...`)
                  }
                }
              }
            } catch (e: any) {
              console.warn(`[scrape] Handler analysis failed: ${e.message}`)
            }

            // Second approach: Override addTab and trigger each menu item click
            // This captures URLs from server-side DirectEvent responses
            const stillMissing = menuItemsWithoutUrl.filter((i: any) => !i.url)
            if (stillMissing.length > 0) {
              console.log(`[scrape] Overriding addTab to capture ${stillMissing.length} URLs via click...`)

              try {
                // Install addTab interceptor
                await evalFn(`
                  (function() {
                    window.__capturedTabs = [];
                    window.__origAddTab = window.addTab;
                    window.addTab = function(tabPanel, id, url, title, menuItem) {
                      window.__capturedTabs.push({id: id, url: url, title: title});
                      // Don't actually open the tab — just capture the URL
                    };
                  })()
                `)
                console.log('[scrape] addTab interceptor installed')

                // Click each menu item and wait for DirectEvent response
                for (const item of stillMissing.slice(0, 10)) {
                  if (timedOut()) { console.warn('[scrape] ⏱ Timeout during addTab intercept'); break }
                  try {
                    context.browser.clearNetworkRequests()
                    // Trigger the menu item via ExtJS API
                    await evalFn(`
                      (function() {
                        var item = Ext.getCmp('${escapeJS(item.id)}');
                        if (item) {
                          try { item.fireHandler(); } catch(e1) {
                            try { item.fireEvent('click', item); } catch(e2) {
                              try { if (item.handler) item.handler.call(item.scope || item, item); } catch(e3) {}
                            }
                          }
                        }
                      })()
                    `)
                    // Wait for DirectEvent response (server round-trip)
                    await delay(1200)

                    // Check if addTab was called
                    const captured = await evalFn(`
                      (function() {
                        var tabs = window.__capturedTabs || [];
                        var result = JSON.stringify(tabs);
                        window.__capturedTabs = []; // Reset for next item
                        return result;
                      })()
                    `)

                    if (captured) {
                      const tabs = JSON.parse(captured)
                      if (tabs.length > 0) {
                        const tab = tabs[0]
                        item.url = tab.url
                        console.log(`[scrape]   ✓ addTab captured: "${item.text}" → ${tab.url} (title: "${tab.title}")`)
                      } else {
                        // Fallback: check network for .aspx requests
                        const netReqs = context.browser.getNetworkRequests()
                        const aspxReqs = netReqs.filter(r =>
                          r.url.includes('.aspx') &&
                          !r.url.includes('ext.axd') &&
                          !r.url.includes('ScriptResource') &&
                          !r.url.includes('panelcontrol') &&
                          !r.url.includes('Inicio') &&
                          r.type !== 'Script'
                        )
                        if (aspxReqs.length > 0) {
                          item.url = aspxReqs[0].url.split('?')[0]
                          console.log(`[scrape]   ✓ Network captured: "${item.text}" → ${item.url}`)
                        } else {
                          console.log(`[scrape]   ✗ No URL for "${item.text}" (${netReqs.length} requests)`)
                        }
                      }
                    }
                  } catch (e: any) {
                    console.warn(`[scrape]   Click "${item.text}" error: ${e.message}`)
                  }
                }

                // Restore original addTab
                await evalFn(`
                  (function() {
                    if (window.__origAddTab) {
                      window.addTab = window.__origAddTab;
                      delete window.__origAddTab;
                    }
                    delete window.__capturedTabs;
                  })()
                `)
                console.log('[scrape] addTab interceptor removed, original restored')

              } catch (e: any) {
                debug.errors.push(`addTab intercept: ${e.message}`)
                console.warn(`[scrape] addTab intercept failed: ${e.message}`)
                // Try to restore addTab even on error
                try {
                  await evalFn(`if(window.__origAddTab){window.addTab=window.__origAddTab}`)
                } catch {}
              }
            }

            // Log final URL discovery state
            const withUrls = debug.menu_items.filter((i: any) => i.url && i.url !== '#')
            console.log(`[scrape] After intercept: ${withUrls.length}/${debug.menu_items.length} items have URLs`)
          }
        } else {
          debug.errors.push('ExtJS not found in any frame')
          console.warn('[scrape] ExtJS not found in any frame!')
        }

        // ── Step E: Combine ALL discovered URLs ──
        const allUrls = new Map<string, { text: string; source: string }>()

        // Resolve relative URLs using the dashboard URL directory (not base_url)
        // e.g. dashboard = /app/panelcontrol.aspx → base dir = /app/
        // so "marcas.aspx" → "/app/marcas.aspx" (not "/marcas.aspx")
        const dashboardUrl = context.currentUrl || debug.dashboard_url || ''
        const dashboardDir = dashboardUrl.substring(0, dashboardUrl.lastIndexOf('/') + 1)
        const baseForRelative = dashboardDir || `${scraperConfig.base_url}/`
        console.log(`[scrape] URL resolution base: ${baseForRelative}`)

        function resolveUrl(rawUrl: string): string {
          if (!rawUrl || rawUrl === '#' || rawUrl === '') return ''
          if (rawUrl.startsWith('http')) return rawUrl
          if (rawUrl.startsWith('/')) return `${scraperConfig.base_url}${rawUrl}`
          // Relative URL — resolve against dashboard directory
          return `${baseForRelative}${rawUrl}`
        }

        // From ExtJS menu items (skip # and empty URLs)
        for (const item of (debug.menu_items || [])) {
          if (item.url && item.url !== '#' && item.url !== '') {
            const url = resolveUrl(item.url)
            if (url && !url.endsWith('#')) allUrls.set(url, { text: item.text, source: item.source })
          }
        }

        // From network capture
        for (const url of aspxNetUrls) {
          if (!allUrls.has(url)) {
            allUrls.set(url, { text: '', source: 'network' })
          }
        }

        // From frame URLs
        for (const frame of frames) {
          if (frame.url && frame.url.includes('.aspx') && !allUrls.has(frame.url)) {
            allUrls.set(frame.url, { text: frame.name, source: 'frame' })
          }
        }

        // From HTML regex (fallback)
        try {
          const fullHtml = await getCurrentPageHTML(context.browser)
          debug.html_length = fullHtml.length
          const aspxRegex = /["']([^"'\s]*?\.aspx[^"'\s]*?)["']/gi
          let match
          while ((match = aspxRegex.exec(fullHtml)) !== null) {
            let url = match[1].replace(/&amp;/g, '&')
            if (!url.includes('login') && !url.includes('Login') && !url.includes('ext.axd')) {
              if (!url.startsWith('http')) url = `${scraperConfig.base_url}/${url.replace(/^\.?\//, '')}`
              if (!allUrls.has(url)) allUrls.set(url, { text: '', source: 'html_regex' })
            }
          }
        } catch {}

        debug.discovered_urls = Array.from(allUrls.entries()).map(([url, info]) => ({
          url, text: info.text, source: info.source
        })).slice(0, 80)
        console.log(`[scrape] Total unique URLs: ${allUrls.size}`)

        // ── Step F: Match URLs to entity types ──
        for (const entityType of (entity_types || [])) {
          const rules = scraperConfig.extraction_rules?.[entityType]
          if (!rules || rules.list_url) continue

          const keywords = ENTITY_KEYWORDS[entityType] || [entityType]

          // Priority 1: Menu items with matching text and REAL URLs (most reliable)
          for (const item of (debug.menu_items || [])) {
            if (!item.url || item.url === '#' || item.url === '') continue
            const textLower = (item.text || '').toLowerCase()
            if (keywords.some(k => textLower.includes(k))) {
              const url = resolveUrl(item.url)
              if (url) {
                rules.list_url = url
                console.log(`[scrape] ✓ ${entityType} → ${url} (menu: "${item.text}")`)
                break
              }
            }
          }

          // Priority 2: URL path matching (only real URLs, not # or empty)
          if (!rules.list_url) {
            for (const [url, info] of allUrls) {
              if (url.endsWith('#') || url.endsWith('/') || !url.includes('.aspx')) continue
              const combined = `${(info.text || '').toLowerCase()} ${url.toLowerCase()}`
              if (keywords.some(k => combined.includes(k))) {
                rules.list_url = url
                console.log(`[scrape] ✓ ${entityType} → ${url} (${info.source}: "${info.text}")`)
                break
              }
            }
          }

          debug.entity_matches[entityType] = rules.list_url || 'NOT FOUND'
        }

        // ── Step G: Explore unmatched URLs for grids ──
        const missing = (entity_types || []).filter(
          (et: string) => scraperConfig.extraction_rules?.[et] && !scraperConfig.extraction_rules[et].list_url
        )

        if (missing.length > 0 && allUrls.size > 2 && !timedOut()) {
          console.log(`[scrape] ${missing.length} entities unmatched — probing ${Math.min(allUrls.size, 10)} URLs for grids...`)
          const toProbe = Array.from(allUrls.entries())
            .filter(([url]) =>
              url.includes('.aspx') &&
              !url.includes('login') && !url.includes('Login') &&
              !url.includes('Inicio') && !url.includes('panelcontrol') &&
              !url.includes('Default')
            )
            .slice(0, 10)

          for (const [url, info] of toProbe) {
            if (timedOut() || missing.every(et => scraperConfig.extraction_rules?.[et]?.list_url)) break
            try {
              console.log(`[scrape] Probing: ${url}`)
              await navigateTo(context.browser, url)
              await delay(3000)

              // Check for ExtJS grids in any frame
              const gridCheck = await context.browser.evaluate(`
                (function() {
                  try {
                    if (typeof Ext === 'undefined') return null;
                    var grids = Ext.ComponentQuery.query('gridpanel, grid');
                    if (grids.length === 0) return null;
                    var g = grids[0]; var s = g.getStore();
                    var cols = (g.columns || []).map(function(c) { return c.text || c.header || c.dataIndex || ''; }).filter(Boolean);
                    return JSON.stringify({
                      rows: s ? s.getCount() : 0,
                      total: s && s.getTotalCount ? s.getTotalCount() : 0,
                      columns: cols
                    });
                  } catch(e) { return null; }
                })()
              `)

              // Also check HTML tables
              let gridData = gridCheck ? JSON.parse(gridCheck) : null
              if (!gridData) {
                const html = await getCurrentPageHTML(context.browser)
                const structure = discoverPageStructure(html)
                if (structure.tables.length > 0) {
                  const t = structure.tables.reduce((a: any, b: any) => a.rowCount > b.rowCount ? a : b)
                  if (t.rowCount > 0) {
                    gridData = { rows: t.rowCount, total: t.rowCount, columns: t.headers }
                  }
                }
              }

              if (gridData && (gridData.rows > 0 || gridData.total > 0)) {
                console.log(`[scrape] Grid at ${url}: ${gridData.total || gridData.rows} rows, cols: [${gridData.columns.join(', ')}]`)
                for (const et of [...missing]) {
                  const rules = scraperConfig.extraction_rules?.[et]
                  if (!rules || rules.list_url) continue
                  const kws = ENTITY_KEYWORDS[et] || []
                  const colStr = gridData.columns.join(' ').toLowerCase()
                  const score = kws.filter((k: string) =>
                    colStr.includes(k) || url.toLowerCase().includes(k) || (info.text || '').toLowerCase().includes(k)
                  ).length
                  if (score >= 1) {
                    rules.list_url = url
                    debug.entity_matches[et] = url
                    console.log(`[scrape] ✓ Matched ${url} → ${et} (score: ${score})`)
                    missing.splice(missing.indexOf(et), 1)
                    break
                  }
                }
              }
              await delay(1500)
            } catch (e: any) {
              console.warn(`[scrape] Probe fail ${url}: ${e.message}`)
            }
          }
        }

        // ── Step H: Fallback — probe common legacy IP system URLs ──
        if (missing.length > 0 && !timedOut()) {
          console.log(`[scrape] Probing common IP portal URL patterns...`)
          const commonPatterns: Record<string, string[]> = {
            matters: [
              '/app/Marcas.aspx', '/app/marcas.aspx', '/app/Expedientes.aspx',
              '/app/expedientes.aspx', '/app/Portfolio.aspx', '/app/Listado.aspx',
              '/app/BuscarMarcas.aspx', '/app/Trademarks.aspx', '/app/Cases.aspx',
              '/Marcas.aspx', '/Expedientes.aspx', '/Portfolio.aspx',
              '/marcas/listado.aspx', '/marcas/index.aspx',
            ],
            contacts: [
              '/app/Clientes.aspx', '/app/clientes.aspx', '/app/Contactos.aspx',
              '/app/Titulares.aspx', '/app/Contacts.aspx', '/app/Clients.aspx',
              '/Clientes.aspx', '/Contactos.aspx', '/Titulares.aspx',
            ],
            deadlines: [
              '/app/Plazos.aspx', '/app/plazos.aspx', '/app/Vencimientos.aspx',
              '/app/Agenda.aspx', '/app/Deadlines.aspx', '/app/Renewals.aspx',
              '/Plazos.aspx', '/Vencimientos.aspx', '/Agenda.aspx',
            ],
          }

          for (const et of [...missing]) {
            const rules = scraperConfig.extraction_rules?.[et]
            if (!rules || rules.list_url) continue
            const patterns = commonPatterns[et] || []

            for (const pattern of patterns) {
              const url = `${scraperConfig.base_url}${pattern}`
              try {
                context.browser.clearNetworkRequests()
                await navigateTo(context.browser, url)
                await delay(2000)

                // Check if page has content (not error/redirect to login)
                const pageCheck = await context.browser.evaluate(`
                  (function() {
                    var title = document.title || '';
                    var body = document.body ? document.body.innerText.length : 0;
                    var hasTable = document.querySelector('table, .x-grid, .x-panel') !== null;
                    var isLogin = document.querySelector('input[type="password"]') !== null;
                    var isError = title.toLowerCase().includes('error') || title.includes('404');
                    return JSON.stringify({ title: title, bodyLength: body, hasTable: hasTable, isLogin: isLogin, isError: isError });
                  })()
                `)

                if (pageCheck) {
                  const check = JSON.parse(pageCheck)
                  if (check.hasTable && !check.isLogin && !check.isError && check.bodyLength > 500) {
                    rules.list_url = url
                    debug.entity_matches[et] = url + ' (probed)'
                    console.log(`[scrape] ✓ Probed ${url} → ${et} (has table, ${check.bodyLength} chars)`)
                    missing.splice(missing.indexOf(et), 1)
                    break
                  }
                }
              } catch {
                // URL doesn't exist or failed
              }
            }
          }
        }

        // Save debug data
        await updateSession(serviceClient, sessionId, {
          extracted_data: { _debug_v19: debug }
        })

      } catch (e: any) {
        debug.errors.push(`Discovery: ${e.message}`)
        console.warn(`[scrape] Discovery failed: ${e.message}`)
        await updateSession(serviceClient, sessionId, {
          extracted_data: { _debug_v19: debug }
        })
      }
    }

    // ═══════════════════════════════════════════════════════
    // 4. EXTRACT DATA (v26 — Network Response Interception for Ext.NET)
    //    Per entity: navigate 3s + inspect 1s + click+wait ~12s + extract 1s = ~17s
    // ═══════════════════════════════════════════════════════
    const extractedData: Record<string, any[]> = {}
    let totalItems = 0
    let totalRequests = 0
    const errors: any[] = []

    // Helper: poll grid store for data (checks ALL grids, not just first)
    async function pollGrid(browser: any, maxPolls: number, intervalMs: number): Promise<number> {
      for (let i = 0; i < maxPolls; i++) {
        if (timedOut()) return 0
        await delay(intervalMs)
        try {
          const count = await browser.evaluate(`
            (function() {
              if (typeof Ext === 'undefined') return 0;
              var grids = Ext.ComponentQuery.query('gridpanel, grid');
              for (var g = 0; g < grids.length; g++) {
                var s = grids[g].getStore();
                if (s && s.getCount() > 0) return s.getCount();
              }
              return 0;
            })()
          `)
          if (count > 0) return count
        } catch { return 0 }
      }
      return 0
    }

    // Helper: parse Ext.NET DirectEvent response body for data
    function parseDirectEventResponse(body: string): any[] | null {
      if (!body || body.length < 10) return null
      try {
        // Pattern 0: Ext.NET non-JSON response format
        // Response is JS object literal, NOT JSON: {script:"...",result:[]}
        // Keys aren't quoted! Must handle with regex, not JSON.parse.
        // When search returns data, script contains: App.GridXxx.getStore().loadData([{...}])
        const extNetScriptMatch = body.match(/\bscript\s*:\s*"((?:[^"\\]|\\.)*)"/m)
        if (extNetScriptMatch && extNetScriptMatch[1].length > 5) {
          const scriptContent = extNetScriptMatch[1]
            .replace(/\\"/g, '"').replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '')
          console.log(`[scrape]   Pattern 0: Ext.NET script found (${scriptContent.length}ch): ${scriptContent.substring(0, 200)}`)
          const ldMatch = scriptContent.match(/\.loadData\s*\(\s*(\[[\s\S]+\])\s*\)/)
          if (ldMatch) {
            try {
              const data = JSON.parse(ldMatch[1])
              if (Array.isArray(data) && data.length > 0) {
                console.log(`[scrape]   Pattern 0: loadData → ${data.length} records`)
                return data
              }
            } catch {
              // Try truncating at last ']'
              const raw = ldMatch[1]
              const lastB = raw.lastIndexOf(']')
              if (lastB > 0) {
                try {
                  const data = JSON.parse(raw.substring(0, lastB + 1))
                  if (Array.isArray(data) && data.length > 0) return data
                } catch {}
              }
            }
          }
          // Also try loadRecords in the script
          const lrMatch = scriptContent.match(/\.loadRecords\s*\(\s*(\{[\s\S]*?\})\s*\)/)
          if (lrMatch) {
            try {
              const obj = JSON.parse(lrMatch[1])
              if (obj.data && Array.isArray(obj.data)) return obj.data
            } catch {}
          }
        }

        // Pattern 1: Ext.NET response with script containing loadData (JSON format)
        // e.g. {"script":"App.Store1.loadData([{...},{...}])"}
        // Use greedy matching for the array to capture nested objects
        const loadDataMatch = body.match(/\.loadData\s*\(\s*(\[[\s\S]+\])\s*\)/m)
        if (loadDataMatch) {
          try {
            const data = JSON.parse(loadDataMatch[1])
            if (Array.isArray(data) && data.length > 0) return data
          } catch {
            // Try truncating at last ']' in case of trailing content
            const rawArr = loadDataMatch[1]
            const lastBracket = rawArr.lastIndexOf(']')
            if (lastBracket > 0) {
              try {
                const data = JSON.parse(rawArr.substring(0, lastBracket + 1))
                if (Array.isArray(data) && data.length > 0) return data
              } catch {}
            }
          }
        }

        // Pattern 2: loadData with object {data: [...], total: N}
        const loadDataObjMatch = body.match(/\.loadData\s*\(\s*(\{[\s\S]*?"data"\s*:\s*\[[\s\S]*?\]\s*[,}][\s\S]*?\})\s*\)/m)
        if (loadDataObjMatch) {
          try {
            const obj = JSON.parse(loadDataObjMatch[1])
            if (obj.data && Array.isArray(obj.data)) return obj.data
          } catch {}
        }

        // Pattern 3: Direct JSON array in response
        if (body.trimStart().startsWith('[')) {
          try {
            const arr = JSON.parse(body)
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') return arr
          } catch {}
        }

        // Pattern 4: JSON response with data/result/d/rows property
        if (body.trimStart().startsWith('{')) {
          try {
            const obj = JSON.parse(body)
            if (obj.data && Array.isArray(obj.data)) return obj.data
            if (obj.result && Array.isArray(obj.result)) return obj.result
            if (obj.d && Array.isArray(obj.d)) return obj.d // ASP.NET WebMethods
            if (obj.rows && Array.isArray(obj.rows)) return obj.rows
            if (obj.items && Array.isArray(obj.items)) return obj.items
            if (obj.records && Array.isArray(obj.records)) return obj.records
          } catch {}
        }

        // Pattern 5: Ext.NET serviceResponse format (script embedded in JSON string)
        // e.g. {"serviceResponse":{"...":"..."},"script":"...loadData(...)..."}
        const scriptMatch = body.match(/"script"\s*:\s*"((?:[^"\\]|\\.)*)"/m)
        if (scriptMatch) {
          const scriptContent = scriptMatch[1]
            .replace(/\\"/g, '"').replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '')
          const innerLoadData = scriptContent.match(/\.loadData\s*\(\s*(\[[\s\S]+\])\s*\)/)
          if (innerLoadData) {
            try {
              const data = JSON.parse(innerLoadData[1])
              if (Array.isArray(data) && data.length > 0) return data
            } catch {
              // Try truncating
              const raw = innerLoadData[1]
              const last = raw.lastIndexOf(']')
              if (last > 0) {
                try {
                  const data = JSON.parse(raw.substring(0, last + 1))
                  if (Array.isArray(data) && data.length > 0) return data
                } catch {}
              }
            }
          }
          // Also check for loadRecords or add pattern
          const loadRecordsMatch = scriptContent.match(/\.loadRecords\s*\(\s*(\{[\s\S]*?\})\s*\)/)
          if (loadRecordsMatch) {
            try {
              const obj = JSON.parse(loadRecordsMatch[1])
              if (obj.data && Array.isArray(obj.data)) return obj.data
              if (obj.records && Array.isArray(obj.records)) return obj.records
            } catch {}
          }
        }

        // Pattern 6: Ext.NET "result" string containing escaped JSON
        const svcMatch = body.match(/"result"\s*:\s*"((?:[^"\\]|\\.)*)"/m)
        if (svcMatch) {
          const inner = svcMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
          const innerLoadData = inner.match(/\.loadData\s*\(\s*(\[[\s\S]*?\])\s*\)/)
          if (innerLoadData) {
            try {
              const data = JSON.parse(innerLoadData[1])
              if (Array.isArray(data) && data.length > 0) return data
            } catch {}
          }
        }

        // Pattern 7: Look for ANY JSON array with multiple objects (fallback)
        const arrMatch = body.match(/\[(\s*\{[^{}]*\}\s*(?:,\s*\{[^{}]*\}\s*)+)\]/m)
        if (arrMatch) {
          try {
            const data = JSON.parse(`[${arrMatch[1]}]`)
            if (Array.isArray(data) && data.length >= 2) return data
          } catch {}
        }

        // Pattern 8: Ext.NET with nested objects (more complex JSON)
        // Use a more permissive regex for deeply nested data
        const deepArrayMatch = body.match(/loadData\s*\(\s*(\[[\s\S]{10,}?\]\s*)\)/m)
        if (deepArrayMatch) {
          // Try progressive parsing — find matching bracket
          const raw = deepArrayMatch[1]
          let depth = 0; let end = -1
          for (let i = 0; i < raw.length; i++) {
            if (raw[i] === '[') depth++
            else if (raw[i] === ']') { depth--; if (depth === 0) { end = i; break } }
          }
          if (end > 0) {
            try {
              const data = JSON.parse(raw.substring(0, end + 1))
              if (Array.isArray(data) && data.length > 0) return data
            } catch {}
          }
        }
      } catch {}
      return null
    }

    for (const entityType of (entity_types || [])) {
      if (timedOut()) {
        console.warn(`[scrape] ⏱ Global timeout — skipping remaining entities`)
        errors.push({ page: entityType, error: 'Skipped due to timeout', timestamp: ts(), recoverable: true })
        continue
      }

      const rules: ExtractionRule | undefined = scraperConfig.extraction_rules?.[entityType]
      if (!rules) {
        errors.push({ page: entityType, error: `No extraction rules for: ${entityType}`, timestamp: ts(), recoverable: false })
        continue
      }
      if (!rules.list_url) {
        errors.push({ page: entityType, error: `No URL for "${entityType}" — see _debug_v19.`, timestamp: ts(), recoverable: false })
        continue
      }

      await updateSession(serviceClient, sessionId, { status: 'scraping', current_entity: entityType, current_page: `Navegando a ${rules.list_url?.split('/').pop() || rules.list_url}` })

      try {
        // ── Navigate to entity page ──
        console.log(`[scrape] Navigating to ${entityType}: ${rules.list_url} (${Math.round(timeLeft()/1000)}s left)`)
        context.browser.clearNetworkRequests()
        await navigateTo(context.browser, rules.list_url)
        totalRequests++
        await delay(3000) // Wait for Ext.NET framework init

        // ── Step 4a: Deep inspection ──
        let items: any[] = []
        let gridFound = false
        let searchMethod = 'none'

        const combined = await context.browser.evaluate(`
          (function() {
            var r = {
              url: location.href, title: document.title,
              hasExt: typeof Ext !== 'undefined',
              isLogin: !!document.querySelector('input[type="password"]'),
              grids: [], buttons: [], directEventInfo: null
            };
            if (!r.hasExt) return JSON.stringify(r);

            // Inspect ALL grids (not just first)
            var grids = Ext.ComponentQuery.query('gridpanel, grid');
            for (var i = 0; i < grids.length; i++) {
              var g = grids[i]; var s = g.getStore();
              var px = ''; var pt = ''; var directFn = false;
              if (s && s.proxy) {
                pt = s.proxy.type || s.proxy.$className || '';
                px = s.proxy.url || (s.proxy.api ? s.proxy.api.read || '' : '');
                if (s.proxy.directFn) { px = 'DirectFn'; directFn = true; }
              }
              var cols = [];
              if (g.columns) for (var c = 0; c < g.columns.length; c++) {
                var col = g.columns[c];
                if (col.dataIndex) cols.push({dataIndex: col.dataIndex, text: col.text || col.header || ''});
              }
              r.grids.push({
                id: g.id, count: s ? s.getCount() : -1,
                total: s && s.getTotalCount ? s.getTotalCount() : -1,
                proxyType: pt, proxyUrl: px, directFn: directFn,
                columns: cols, hidden: g.hidden || false
              });
            }

            // Inspect ALL buttons (up to 50) with FULL detail + event listeners
            var buttons = Ext.ComponentQuery.query('button');
            for (var b = 0; b < Math.min(buttons.length, 50); b++) {
              var btn = buttons[b];
              var directInfo = null;
              if (btn.directEvents) {
                directInfo = {};
                for (var ev in btn.directEvents) {
                  if (btn.directEvents.hasOwnProperty(ev)) {
                    var de = btn.directEvents[ev];
                    directInfo[ev] = {
                      url: de.url || '',
                      cleanRequest: !!de.cleanRequest,
                      extraParams: de.extraParams ? Object.keys(de.extraParams) : []
                    };
                  }
                }
              }
              var handler = '';
              try { if (btn.handler) handler = btn.handler.toString().substring(0, 200); } catch(e) {}
              // NEW: Check actual event listeners (Ext.NET registers via init scripts)
              var listenerCount = 0;
              var hasClickListener = false;
              var listenerPreview = '';
              try {
                if (btn.events && btn.events.click && btn.events.click.listeners) {
                  var listeners = btn.events.click.listeners;
                  listenerCount = listeners.length || 0;
                  hasClickListener = listenerCount > 0;
                  if (listeners.length > 0 && listeners[0].fn) {
                    listenerPreview = listeners[0].fn.toString().substring(0, 200);
                  }
                }
              } catch(e) {}
              // Also check ownerCt to detect toolbar vs window buttons
              var ownerType = '';
              try {
                if (btn.ownerCt) ownerType = btn.ownerCt.xtype || btn.ownerCt.$className || '';
              } catch(e) {}
              r.buttons.push({
                id: btn.id, text: btn.text || '',
                iconCls: btn.iconCls || '',
                hasDirect: !!(btn.directEvents && (btn.directEvents.click || btn.directEvents.Click)),
                directInfo: directInfo,
                handler: handler,
                hidden: btn.hidden || false,
                disabled: btn.disabled || false,
                xtype: btn.xtype || '',
                hasClickListener: hasClickListener,
                listenerCount: listenerCount,
                listenerPreview: listenerPreview,
                ownerType: ownerType
              });
            }

            // Check for Ext.net.DirectEvent existence
            try {
              r.directEventInfo = {
                hasDirectEvent: typeof Ext.net !== 'undefined' && typeof Ext.net.DirectEvent !== 'undefined',
                hasDirectMethod: typeof Ext.net !== 'undefined' && typeof Ext.net.DirectMethod !== 'undefined',
              };
            } catch(e) { r.directEventInfo = { error: e.message }; }

            return JSON.stringify(r);
          })()
        `)

        let inspection: any = null
        if (combined) {
          inspection = JSON.parse(combined)
          console.log(`[scrape] "${entityType}": ExtJS=${inspection.hasExt}, grids=${inspection.grids.length}, buttons=${inspection.buttons.length}, login=${inspection.isLogin}, directEvent=${JSON.stringify(inspection.directEventInfo)}`)
          for (const g of inspection.grids) {
            console.log(`[scrape]   Grid "${g.id}": ${g.count} rows, total=${g.total}, proxy=${g.proxyType}|${g.proxyUrl}, directFn=${g.directFn}, cols=[${(g.columns||[]).map((c: any) => c.dataIndex).join(',')}]`)
          }
          for (const btn of inspection.buttons) {
            console.log(`[scrape]   Btn "${btn.text}" id=${btn.id} direct=${btn.hasDirect} hidden=${btn.hidden} disabled=${btn.disabled} handler=${btn.handler ? 'yes' : 'no'} listeners=${btn.listenerCount || 0} hasClickLn=${btn.hasClickListener} owner=${btn.ownerType} directInfo=${JSON.stringify(btn.directInfo||null)}`)
          }
        }

        // Check if any grid already has data
        const gridWithData = inspection?.grids?.find((g: any) => g.count > 0)
        if (gridWithData) {
          gridFound = true
          searchMethod = 'already_loaded'
          console.log(`[scrape] Grid "${gridWithData.id}" already has ${gridWithData.count} records`)
        } else if (inspection?.grids?.length > 0) {
          gridFound = true

          // ── Strategy 1: store.load() (quick check — works for standard proxies) ──
          console.log(`[scrape] Strategy 1: store.load()...`)
          await context.browser.evaluate(`
            (function() {
              var grids = Ext.ComponentQuery.query('gridpanel, grid');
              for (var i = 0; i < grids.length; i++) {
                var s = grids[i].getStore();
                if (s) try { s.load(); } catch(e) {}
              }
            })()
          `)
          const count1 = await pollGrid(context.browser, 3, 1500) // 4.5s
          if (count1 > 0) {
            searchMethod = 'store_load'
            console.log(`[scrape] ✓ store.load() → ${count1} records`)
          }

          // ── Strategy 2: Search dialog flow ──
          // v32 PROVED: click works, server responds, but {result:[]} because "*" is invalid wildcard.
          // v33 FIX: Click Buscar with EMPTY fields first. Retry with "%" if needed.
          // Also check for pre-rendered Buscar buttons (eventos.aspx has them without opening dialog).
          if (searchMethod === 'none' && !timedOut()) {
            console.log(`[scrape] Strategy 2: Search dialog flow...`)

            // Step 2a: Check for PRE-RENDERED Buscar buttons (some pages have them already)
            const preRenderedBuscar = (inspection.buttons || []).find((b: any) => {
              if (b.hidden || b.disabled) return false
              const textLower = (b.text || '').toLowerCase()
              const idLower = (b.id || '').toLowerCase()
              return (textLower === 'buscar' || textLower === 'search') ||
                     (idLower.includes('buscar') && idLower.includes('button'))
            })

            let buscarBtnId: string | null = null
            let dialogOpened = false

            if (preRenderedBuscar) {
              buscarBtnId = preRenderedBuscar.id
              console.log(`[scrape]   Found pre-rendered Buscar: "${preRenderedBuscar.text}" id=${buscarBtnId}`)
            } else {
              // Step 2b: Open search dialog first
              const searchOpenerTexts = ['búsqueda', 'busqueda']
              const searchBtn = (inspection.buttons || []).find((b: any) => {
                if (b.hidden || b.disabled) return false
                const textLower = (b.text || '').toLowerCase()
                return searchOpenerTexts.some((st: string) => textLower === st || textLower.includes(st))
              })

              if (searchBtn) {
                console.log(`[scrape]   Opening search dialog via "${searchBtn.text}" id=${searchBtn.id}`)
                await updateSession(serviceClient, sessionId, { current_page: 'Abriendo dialogo de busqueda...' })
                await context.browser.evaluate(`
                  (function() {
                    var btn = Ext.getCmp('${escapeJS(searchBtn.id)}');
                    if (!btn) return;
                    try { btn.fireEvent('click', btn, {}); } catch(e) {}
                    try { if (btn.el && btn.el.dom) btn.el.dom.click(); } catch(e) {}
                  })()
                `)
                await delay(3000) // Wait for dialog to render
                dialogOpened = true

                // Step 2c: Re-scan for Buscar buttons after dialog opened
                const dialogScan = await context.browser.evaluate(`
                  (function() {
                    var result = { newButtons: [], windows: [], fields: [] };
                    var buttons = Ext.ComponentQuery.query('button');
                    for (var b = 0; b < buttons.length; b++) {
                      var btn = buttons[b];
                      var textLower = (btn.text || '').toLowerCase();
                      var idLower = (btn.id || '').toLowerCase();
                      if (textLower === 'buscar' || textLower === 'search' ||
                          (idLower.indexOf('buscar') >= 0 && idLower.indexOf('button') >= 0) ||
                          idLower.indexOf('busqueda_button_buscar') >= 0) {
                        var lnCount = 0; var lnPrev = '';
                        try {
                          if (btn.events && btn.events.click && btn.events.click.listeners) {
                            lnCount = btn.events.click.listeners.length;
                            if (lnCount > 0) lnPrev = btn.events.click.listeners[0].fn.toString().substring(0, 200);
                          }
                        } catch(e) {}
                        result.newButtons.push({
                          id: btn.id, text: btn.text, hidden: btn.hidden,
                          disabled: btn.disabled, listenerCount: lnCount, listenerPreview: lnPrev
                        });
                      }
                    }
                    var windows = Ext.ComponentQuery.query('window');
                    for (var w = 0; w < windows.length; w++) {
                      var win = windows[w];
                      try { if (win.isVisible()) {
                        result.windows.push({ id: win.id, title: win.title || '' });
                        var fields = win.query('textfield, triggerfield, combobox');
                        for (var f = 0; f < fields.length; f++) {
                          if (!fields[f].hidden && !fields[f].disabled && fields[f].inputType !== 'password') {
                            result.fields.push({ id: fields[f].id, label: fields[f].fieldLabel || '', xtype: fields[f].xtype });
                          }
                        }
                      }} catch(e) {}
                    }
                    return JSON.stringify(result);
                  })()
                `)

                let scanResult: any = { newButtons: [], windows: [], fields: [] }
                if (dialogScan) {
                  scanResult = JSON.parse(dialogScan)
                  console.log(`[scrape]   Dialog scan: ${scanResult.newButtons.length} Buscar btns, ${scanResult.windows.length} windows, ${scanResult.fields.length} fields`)
                  for (const b of scanResult.newButtons) console.log(`[scrape]     Btn: "${b.text}" id=${b.id} listeners=${b.listenerCount}`)
                  for (const w of scanResult.windows) console.log(`[scrape]     Win: "${w.title}" id=${w.id}`)
                }

                const foundBtn = scanResult.newButtons.find((b: any) => !b.hidden && !b.disabled)
                if (foundBtn) {
                  buscarBtnId = foundBtn.id
                  console.log(`[scrape]   Found dialog Buscar: "${foundBtn.text}" id=${buscarBtnId}`)
                } else {
                  console.log(`[scrape]   No Buscar button found after opening dialog`)
                  if (!extractedData._response_dumps) extractedData._response_dumps = {}
                  ;(extractedData._response_dumps as any)[`${entityType}_dialog_scan`] = scanResult
                }
              }
            }

            // Step 2d: Click Buscar with batched search strategy
            // v33 proved: empty search → "supera el límite (14496)" — need to search by letter
            if (buscarBtnId && !timedOut()) {
              // Helper: click Buscar and collect results/errors
              // v36: wrapped in try-catch — NEVER throws, returns error in result object
              async function clickBuscarAndCollect(
                browser: any, btnId: string, fieldValue: string | null, fieldIds: string[]
              ): Promise<{ items: any[], error: string | null, limitExceeded: boolean, responsePreview: string }> {
               try {
                browser.clearNetworkRequests()

                // Set field values: clear all, then set search text field
                // v34 bug: fieldIds[0] was NumberField — putting "a" in number field fails!
                // Fix: find TextField with "Denominacion" or "Nombre" or first TextField (not NumberField)
                if (fieldIds.length > 0) {
                  await browser.evaluate(`
                    (function() {
                      var ids = ${JSON.stringify(fieldIds)};
                      // Clear all fields
                      for (var i = 0; i < ids.length; i++) {
                        var f = Ext.getCmp(ids[i]);
                        if (f) try {
                          if (f.xtype === 'numberfield') f.setValue(null);
                          else f.setValue('');
                        } catch(e) {}
                      }
                      ${fieldValue !== null ? `
                      // Find best text field for search (Denominacion > Nombre > Contacto > first TextField)
                      var searchField = null;
                      var priorities = ['denominacion', 'nombre', 'contacto', 'refcliente', 'refinterna'];
                      for (var p = 0; p < priorities.length; p++) {
                        for (var i = 0; i < ids.length; i++) {
                          if (ids[i].toLowerCase().indexOf(priorities[p]) >= 0 && ids[i].toLowerCase().indexOf('number') < 0) {
                            searchField = Ext.getCmp(ids[i]);
                            break;
                          }
                        }
                        if (searchField) break;
                      }
                      // Fallback: first non-number field
                      if (!searchField) {
                        for (var i = 0; i < ids.length; i++) {
                          var f = Ext.getCmp(ids[i]);
                          if (f && f.xtype !== 'numberfield') { searchField = f; break; }
                        }
                      }
                      if (searchField) try { searchField.setValue('${fieldValue}'); } catch(e) {}
                      ` : ''}
                    })()
                  `)
                }

                // Click Buscar — ONLY use listeners + fireEvent (no DOM click, no CDP mouse)
                // v33 bug: multiple click methods caused double-trigger → 500 error
                await browser.evaluate(`
                  (function() {
                    var btn = Ext.getCmp('${escapeJS(btnId)}');
                    if (!btn) return;
                    // Method 1: Call actual listeners (proven to work in v32/v33)
                    try {
                      if (btn.events && btn.events.click && btn.events.click.listeners) {
                        var ln = btn.events.click.listeners[0];
                        if (ln && ln.fn) ln.fn.call(ln.scope || btn, btn, {});
                      }
                    } catch(e) {}
                  })()
                `)

                await delay(6000) // Wait for legacy server

                // Check grid first
                const gridCount = await pollGrid(browser, 4, 1500)
                if (gridCount > 0) {
                  // Extract data from grid store
                  // v36: wrapped in try-catch so CDP timeout falls through to network response check
                  try {
                    const storeData = await browser.evaluate(`
                      (function() {
                        var grids = Ext.ComponentQuery.query('gridpanel');
                        for (var g = 0; g < grids.length; g++) {
                          var s = grids[g].getStore();
                          if (s && s.getCount() > 0) {
                            var records = [];
                            s.each(function(rec) { records.push(rec.data); });
                            return JSON.stringify(records);
                          }
                        }
                        return '[]';
                      })()
                    `)
                    const parsed = JSON.parse(storeData || '[]')
                    if (parsed.length > 0) return { items: parsed, error: null, limitExceeded: false, responsePreview: `grid:${parsed.length}` }
                  } catch (gridExtErr: any) {
                    console.warn(`[scrape]   Grid extraction CDP error: ${gridExtErr.message} — falling back to network`)
                  }
                }

                // Check network responses
                const resps = browser.getNetworkResponses()
                const aspx = resps.filter((r: any) =>
                  (r.url.includes('.aspx') || r.url.includes('.ashx')) &&
                  !r.url.includes('ext.axd') && !r.url.includes('ScriptResource')
                )

                for (const resp of aspx.slice(0, 5)) {
                  try {
                    const body = await browser.getResponseBody(resp.requestId)
                    // Check for "supera el límite" error
                    if (body.includes('supera el') || body.includes('límite') || body.includes('limite')) {
                      const limitMatch = body.match(/\((\d+)\)/)
                      console.log(`[scrape]   Limit exceeded: ${limitMatch ? limitMatch[1] : 'unknown'} records`)
                      return { items: [], error: body.substring(0, 200), limitExceeded: true, responsePreview: body.substring(0, 200) }
                    }
                    // Check for data
                    const parsed = parseDirectEventResponse(body)
                    if (parsed && parsed.length > 0) {
                      return { items: parsed, error: null, limitExceeded: false, responsePreview: `net:${parsed.length}` }
                    }
                  } catch {}
                }

                return { items: [], error: null, limitExceeded: false, responsePreview: 'no_data' }
               } catch (cbcErr: any) {
                // v36: Never throw from clickBuscarAndCollect — return error in result
                console.warn(`[scrape]   clickBuscarAndCollect fatal error: ${cbcErr.message}`)
                return { items: [], error: cbcErr.message, limitExceeded: false, responsePreview: `error:${cbcErr.message.substring(0, 100)}` }
               }
              }

              // Get dialog field IDs for filling search criteria
              const dialogFieldIds = await context.browser.evaluate(`
                (function() {
                  var ids = [];
                  var windows = Ext.ComponentQuery.query('window');
                  for (var w = 0; w < windows.length; w++) {
                    var win = windows[w];
                    try { if (!win.isVisible()) continue; } catch(e) { continue; }
                    var fields = win.query('textfield, triggerfield');
                    for (var f = 0; f < fields.length; f++) {
                      var fld = fields[f];
                      if (fld.hidden || fld.disabled || fld.inputType === 'password') continue;
                      if (fld.xtype === 'datefield' || fld.xtype === 'combobox' || fld.xtype === 'combo') continue;
                      ids.push(fld.id);
                    }
                  }
                  return JSON.stringify(ids);
                })()
              `)
              const fieldIds: string[] = JSON.parse(dialogFieldIds || '[]')
              console.log(`[scrape]   Dialog text fields: ${fieldIds.length} [${fieldIds.join(', ')}]`)

              // First attempt: empty fields (return all)
              console.log(`[scrape]   Attempt 1: empty fields (return all)...`)
              const emptyResult = await clickBuscarAndCollect(context.browser, buscarBtnId!, null, fieldIds)
              console.log(`[scrape]   Empty result: ${emptyResult.items.length} items, limitExceeded=${emptyResult.limitExceeded}, preview=${emptyResult.responsePreview.substring(0, 100)}`)

              if (emptyResult.items.length > 0) {
                items = emptyResult.items
                searchMethod = `dialog_buscar_empty:${buscarBtnId}`
                console.log(`[scrape] ✓ Empty search → ${items.length} records!`)
              } else if (emptyResult.limitExceeded && fieldIds.length > 0) {
                // Server has data but refuses to return all at once
                // → Batch search by letter in first text field
                console.log(`[scrape]   Limit exceeded → switching to alphabetical batch search`)
                const letters = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
                const allItems: any[] = []
                const seenIds = new Set<string>()
                let consecutiveFailures = 0 // v36: track CDP failures to break early

                for (const letter of letters) {
                  if (timedOut()) {
                    console.log(`[scrape]   ⏱ Timeout during batch search at letter "${letter}", collected ${allItems.length} so far`)
                    break
                  }
                  // v36: Stop if CDP connection appears dead (3+ consecutive failures)
                  if (consecutiveFailures >= 3) {
                    console.warn(`[scrape]   ⛔ ${consecutiveFailures} consecutive CDP failures — stopping batch (collected ${allItems.length} items)`)
                    errors.push({ page: `batch_stopped`, error: `Stopped after ${consecutiveFailures} consecutive CDP failures`, timestamp: ts(), recoverable: true })
                    break
                  }

                  await updateSession(serviceClient, sessionId, {
                    current_page: `Buscando letra "${letter}" — ${allItems.length} registros encontrados`,
                  })

                  const result = await clickBuscarAndCollect(context.browser, buscarBtnId!, letter, fieldIds)

                  // v36: Check for errors returned by clickBuscarAndCollect (never throws now)
                  if (result.error) {
                    consecutiveFailures++
                    console.warn(`[scrape]   Letter "${letter}" error (${consecutiveFailures}/3): ${result.error}`)
                    errors.push({ page: `batch_letter_${letter}`, error: result.error, timestamp: ts(), recoverable: true })
                    // Save progress so far on error
                    if (allItems.length > 0) {
                      try {
                        await serviceClient
                          .from('scraping_sessions')
                          .update({
                            items_scraped: allItems.length,
                            extracted_data: { ...extractedData, [entityType]: allItems },
                            last_activity_at: new Date().toISOString(),
                          })
                          .eq('id', sessionId)
                        console.log(`[scrape] 💾 Error-save: ${allItems.length} records preserved`)
                      } catch {}
                    }
                    await delay(2000) // Extra delay before retry
                    continue
                  }
                  consecutiveFailures = 0 // Reset on success

                  if (result.items.length > 0) {
                    // Deduplicate by first field value (Codigo or Id)
                    let added = 0
                    for (const item of result.items) {
                      const key = item.Codigo || item.Id || item.id || JSON.stringify(item)
                      if (!seenIds.has(String(key))) {
                        seenIds.add(String(key))
                        allItems.push(item)
                        added++
                      }
                    }
                    console.log(`[scrape]   Letter "${letter}": ${result.items.length} records (${added} new, ${allItems.length} total)`)

                    // ── Incremental save after each letter that returns results ──
                    if (added > 0) {
                      try {
                        await serviceClient
                          .from('scraping_sessions')
                          .update({
                            items_scraped: allItems.length,
                            current_page: `Buscando letra "${letter}" — ${allItems.length} registros encontrados`,
                            current_entity: entityType,
                            status: 'scraping',
                            last_activity_at: new Date().toISOString(),
                            extracted_data: {
                              ...extractedData,
                              [entityType]: allItems,
                            },
                          })
                          .eq('id', sessionId)
                        console.log(`[scrape] 💾 Saved progress: ${allItems.length} records after letter "${letter}"`)
                      } catch (saveErr: any) {
                        console.warn(`[scrape] Progress save failed: ${saveErr.message}`)
                      }
                    }
                  } else if (result.limitExceeded) {
                    console.log(`[scrape]   Letter "${letter}": limit exceeded even for single letter`)
                  } else {
                    console.log(`[scrape]   Letter "${letter}": 0 records`)
                  }

                  await delay(1000) // Rate limit between searches
                }

                if (allItems.length > 0) {
                  items = allItems
                  searchMethod = `dialog_buscar_batch:${buscarBtnId}`
                  console.log(`[scrape] ✓ Batch search → ${items.length} total records from ${letters.length} searches!`)
                }
              }

              // Save diagnostics
              if (items.length === 0) {
                if (!extractedData._response_dumps) extractedData._response_dumps = {}
                ;(extractedData._response_dumps as any)[`${entityType}_buscar_v34`] = {
                  emptyResult: { preview: emptyResult.responsePreview, limitExceeded: emptyResult.limitExceeded, error: emptyResult.error },
                  fieldIds,
                  buscarBtnId,
                  dialogOpened,
                }
              }
            }
          }

          // ── Strategy 3: Direct button click on toolbar (fallback) ──
          if (searchMethod === 'none' && !timedOut()) {
            console.log(`[scrape] Strategy 3: Direct toolbar button click...`)

            const searchTexts = ['búsqueda', 'busqueda', 'buscar', 'search', 'consultar', 'filtrar', 'listar', 'mostrar', 'ver', 'load', 'actualizar', 'refresh']
            const dialogTexts = ['ok', 'yes', 'no', 'cancel', 'cancelar', 'guardar', 'save', 'close', 'cerrar', 'cargar archivo', 'upload', 'eliminar', 'delete', 'aceptar', 'si', 'agregar', 'modificar', 'reportes', 'correspondencia', 'tareas']

            const sortedBtns = (inspection.buttons || [])
              .filter((b: any) => {
                if (b.hidden || b.disabled) return false
                const textLower = (b.text || '').toLowerCase().trim()
                if (dialogTexts.includes(textLower)) return false
                if (/^button-\d+$/.test(b.id)) return false
                if (b.id && b.id.startsWith('Window')) return false
                const ownerLower = (b.ownerType || '').toLowerCase()
                if (ownerLower.includes('window') || ownerLower.includes('messagebox')) return false
                return true
              })
              .sort((a: any, b: any) => {
                const aText = (a.text || '').toLowerCase()
                const bText = (b.text || '').toLowerCase()
                const aSearch = searchTexts.some((st: string) => aText.includes(st)) ? 0 : 1
                const bSearch = searchTexts.some((st: string) => bText.includes(st)) ? 0 : 1
                if (aSearch !== bSearch) return aSearch - bSearch
                const aListener = a.hasClickListener ? 0 : 1
                const bListener = b.hasClickListener ? 0 : 1
                if (aListener !== bListener) return aListener - bListener
                const aCtl = a.id && /^ctl\d+$/.test(a.id) ? 0 : 1
                const bCtl = b.id && /^ctl\d+$/.test(b.id) ? 0 : 1
                return aCtl - bCtl
              })

            for (const btn of sortedBtns.slice(0, 3)) {
              if (timedOut() || searchMethod !== 'none') break
              console.log(`[scrape]   Clicking "${btn.text || btn.id}" (listeners=${btn.listenerCount})...`)
              context.browser.clearNetworkRequests()

              try {
                const listenerResult = await context.browser.evaluate(`
                  (function() {
                    var btn = Ext.getCmp('${escapeJS(btn.id)}');
                    if (!btn) return 'not_found';
                    var results = [];
                    if (btn.events && btn.events.click && btn.events.click.listeners) {
                      for (var i = 0; i < btn.events.click.listeners.length; i++) {
                        var ln = btn.events.click.listeners[i];
                        if (ln && ln.fn) { try { ln.fn.call(ln.scope || btn, btn, {}); results.push('ln_ok'); } catch(e) { results.push('ln_err'); } }
                      }
                    }
                    try { btn.fireEvent('click', btn, {}); results.push('fire'); } catch(e) {}
                    try { if (btn.el && btn.el.dom) btn.el.dom.click(); results.push('dom'); } catch(e) {}
                    return results.join(',');
                  })()
                `)
                console.log(`[scrape]   Result: ${listenerResult}`)

                // Wait for server response
                await delay(5000)

                // Check grid
                const count3 = await pollGrid(context.browser, 4, 1500)
                if (count3 > 0) {
                  searchMethod = `toolbar_btn:${btn.text || btn.id}`
                  console.log(`[scrape] ✓ Button "${btn.text}" → ${count3} records in grid`)
                  break
                }

                // Check network
                const responses = context.browser.getNetworkResponses()
                const aspxResponses = responses.filter((r: any) =>
                  (r.url.includes('.aspx') || r.url.includes('.ashx')) &&
                  !r.url.includes('ext.axd') && !r.url.includes('ScriptResource') && r.status === 200
                )
                console.log(`[scrape]   Network: ${responses.length} total, ${aspxResponses.length} aspx`)
                for (const resp of aspxResponses.slice(0, 5)) {
                  try {
                    const body = await context.browser.getResponseBody(resp.requestId)
                    console.log(`[scrape]   RESP: ${body.length}ch | ${body.substring(0, 200).replace(/\n/g, ' ')}`)
                    if (body.length > 50) {
                      const parsed = parseDirectEventResponse(body)
                      if (parsed && parsed.length > 0) {
                        // Validate it looks like entity data (not correspondence templates)
                        const keys = Object.keys(parsed[0])
                        const hasEntityFields = keys.length > 3 // Real data has many fields
                        if (hasEntityFields) {
                          items = parsed
                          searchMethod = `toolbar_net:${btn.text || btn.id}`
                          console.log(`[scrape] ✓ ${parsed.length} records from network (keys: ${keys.join(',')})`)
                          break
                        } else {
                          console.log(`[scrape]   Skipping response — only ${keys.length} keys (${keys.join(',')}) — likely not entity data`)
                        }
                      }
                    }
                  } catch {}
                }
                if (items.length > 0) break
              } catch (e: any) {
                console.warn(`[scrape]   Click error: ${e.message}`)
              }
            }
          }

          // ── Strategy 4: Try __doPostBack for ASP.NET WebForms ──
          if (searchMethod === 'none' && items.length === 0 && !timedOut()) {
            console.log(`[scrape] Strategy 4: __doPostBack...`)
            context.browser.clearNetworkRequests()
            try {
              await context.browser.evaluate(`
                (function() {
                  // Try __doPostBack with various targets
                  if (typeof __doPostBack === 'function') {
                    // Find form inputs that might be search/filter buttons
                    var targets = document.querySelectorAll('input[type="submit"], input[type="button"], a[href*="__doPostBack"]');
                    for (var i = 0; i < Math.min(targets.length, 3); i++) {
                      var name = targets[i].name || targets[i].id || '';
                      if (name) { __doPostBack(name, ''); break; }
                    }
                  }
                })()
              `)
              await delay(3000)
              const count3 = await pollGrid(context.browser, 3, 1500)
              if (count3 > 0) {
                searchMethod = 'postback'
                console.log(`[scrape] ✓ __doPostBack → ${count3} records`)
              } else {
                // Check network responses
                const responses = context.browser.getNetworkResponses()
                for (const resp of responses.filter((r: any) => r.url.includes('.aspx') && r.status === 200).slice(0, 2)) {
                  try {
                    const body = await context.browser.getResponseBody(resp.requestId)
                    const parsed = parseDirectEventResponse(body)
                    if (parsed && parsed.length > 0) {
                      items = parsed
                      searchMethod = 'postback_network'
                      console.log(`[scrape] ✓ __doPostBack response: ${parsed.length} records`)
                      break
                    }
                  } catch {}
                }
              }
            } catch (e: any) {
              console.warn(`[scrape] __doPostBack error: ${e.message}`)
            }
          }

          // ── Strategy 5: Check initial page load responses (data may have loaded during navigation) ──
          if (searchMethod === 'none' && items.length === 0 && !timedOut()) {
            console.log(`[scrape] Strategy 5: Check all captured network responses...`)
            const allResponses = context.browser.getNetworkResponses()
            console.log(`[scrape]   Total responses captured: ${allResponses.length}`)
            for (const resp of allResponses.filter((r: any) =>
              (r.url.includes('.aspx') || r.url.includes('.ashx') || r.url.includes('.asmx')) &&
              !r.url.includes('ext.axd') && !r.url.includes('ScriptResource') && r.status === 200
            ).slice(0, 5)) {
              try {
                const body = await context.browser.getResponseBody(resp.requestId)
                if (body.length > 100) {
                  console.log(`[scrape]   Checking ${resp.url.substring(resp.url.lastIndexOf('/'))}: ${body.length} chars`)
                  const parsed = parseDirectEventResponse(body)
                  if (parsed && parsed.length > 0) {
                    items = parsed
                    searchMethod = 'initial_load_response'
                    console.log(`[scrape] ✓ Found ${parsed.length} records in initial page response`)
                    break
                  }
                }
              } catch {}
            }
          }

          if (searchMethod === 'none' && items.length === 0) {
            console.warn(`[scrape] ⚠ All strategies failed for "${entityType}"`)
            // Comprehensive diagnostics — dump ALL response bodies for analysis
            const netReqs = context.browser.getNetworkRequests()
            const netResps = context.browser.getNetworkResponses()
            console.log(`[scrape] DIAGNOSTIC: ${netReqs.length} requests, ${netResps.length} responses total`)
            for (const nr of netReqs.filter((r: any) => r.url.includes('.aspx')).slice(0, 8)) {
              console.log(`[scrape]   REQ: ${nr.method} ${nr.url.substring(0, 150)} type=${nr.type}`)
            }
            // Dump response bodies (up to 500 chars each) for ALL .aspx responses
            const aspxResps = netResps.filter((r: any) =>
              (r.url.includes('.aspx') || r.url.includes('.ashx')) &&
              !r.url.includes('ext.axd') && !r.url.includes('ScriptResource')
            )
            console.log(`[scrape]   .aspx responses to inspect: ${aspxResps.length}`)
            const bodyDumps: any[] = []
            for (const nr of aspxResps.slice(0, 8)) {
              try {
                const body = await context.browser.getResponseBody(nr.requestId)
                const preview = body.substring(0, 800).replace(/\n/g, ' ').replace(/\s+/g, ' ')
                console.log(`[scrape]   BODY ${nr.url.substring(nr.url.lastIndexOf('/'))} [${nr.status}] ${body.length}ch: ${preview}`)
                bodyDumps.push({
                  url: nr.url.substring(nr.url.lastIndexOf('/')),
                  status: nr.status,
                  length: body.length,
                  preview: body.substring(0, 1500),
                  hasLoadData: body.includes('loadData'),
                  hasArray: body.includes('[{'),
                })
              } catch {}
            }
            // Also save body dumps to diagnostics for DB analysis
            if (!extractedData._response_dumps) extractedData._response_dumps = {}
            ;(extractedData._response_dumps as any)[entityType] = bodyDumps
          }
        } else {
          console.warn(`[scrape] No ExtJS grids on "${entityType}" page (hasExt=${inspection?.hasExt}, isLogin=${inspection?.isLogin})`)
        }

        // ── Step 4b: Extract from grid store (if not already from network) ──
        if (items.length === 0 && gridFound && searchMethod !== 'none' && !timedOut()) {
          try {
            const gridDataJson = await context.browser.evaluate(`
              (function() {
                if (typeof Ext === 'undefined') return '{"records":[],"total":0}';
                var grids = Ext.ComponentQuery.query('gridpanel, grid');
                var allRecords = []; var bestTotal = 0;
                // Check ALL grids, not just first — find the one with data
                for (var gi = 0; gi < grids.length; gi++) {
                  var g = grids[gi]; var s = g.getStore();
                  if (!s || s.getCount() === 0) continue;
                  var total = s.getTotalCount ? s.getTotalCount() : s.getCount();
                  if (s.getCount() > allRecords.length) {
                    allRecords = [];
                    bestTotal = total;
                    s.each(function(rec) {
                      var d = {};
                      for (var k in rec.data) {
                        if (rec.data.hasOwnProperty(k) && rec.data[k] !== null && rec.data[k] !== undefined && rec.data[k] !== '') d[k] = rec.data[k];
                      }
                      if (Object.keys(d).length > 0) allRecords.push(d);
                    });
                  }
                }
                return JSON.stringify({records: allRecords, total: bestTotal, count: allRecords.length});
              })()
            `)
            if (gridDataJson) {
              const gr = JSON.parse(gridDataJson)
              if ((gr.records || []).length > items.length) {
                items = gr.records || []
              }
              console.log(`[scrape] Grid store "${entityType}": ${items.length} records, total=${gr.total}, method=${searchMethod}`)
            }
          } catch (e: any) {
            console.warn(`[scrape] Grid extraction fail: ${e.message}`)
            errors.push({ page: rules.list_url, error: `Grid extraction: ${e.message}`, timestamp: ts(), recoverable: true })
          }
        }

        // Save diagnostic (with FULL button details for debugging)
        if (!extractedData._grid_diagnostics) extractedData._grid_diagnostics = []
        ;(extractedData._grid_diagnostics as any[]).push({
          entity: entityType,
          recordsExtracted: items.length,
          searchMethod,
          inspection: {
            url: inspection?.url,
            grids: inspection?.grids || [],
            buttons: (inspection?.buttons || []).map((b: any) => ({
              id: b.id, text: b.text, hasDirect: b.hasDirect,
              hidden: b.hidden, disabled: b.disabled,
              directInfo: b.directInfo, handler: b.handler ? 'yes' : 'no',
              hasClickListener: b.hasClickListener, listenerCount: b.listenerCount,
              ownerType: b.ownerType, listenerPreview: b.listenerPreview
            })),
            directEventInfo: inspection?.directEventInfo,
          },
          networkActivity: {
            requests: context.browser.getNetworkRequests().filter((r: any) => r.url.includes('.aspx')).length,
            responses: context.browser.getNetworkResponses().filter((r: any) => r.url.includes('.aspx')).length,
          },
          timestamp: ts(),
        })

        // Format records
        const allItems: any[] = []
        for (const record of items) {
          const item: any = { _extracted_at: ts() }
          for (const [key, value] of Object.entries(record)) {
            if (value !== null && value !== undefined && value !== '' && !key.startsWith('_')) {
              item[key] = value
            }
          }
          if (Object.keys(item).filter(k => !k.startsWith('_')).length > 0) {
            allItems.push(item)
          }
        }

        // ── Pagination (only if we have data and time left) ──
        if (allItems.length > 0 && gridFound && !timedOut()) {
          let currentPage = 1
          const maxPagesForEntity = Math.min(maxPages, 5)
          while (currentPage < maxPagesForEntity && totalItems + allItems.length < maxItems && !timedOut()) {
            try {
              const hasNext = await context.browser.evaluate(`
                (function() {
                  var grids = Ext.ComponentQuery.query('gridpanel, grid');
                  for (var gi = 0; gi < grids.length; gi++) {
                    var s = grids[gi].getStore();
                    if (!s || s.getCount() === 0) continue;
                    var total = s.getTotalCount ? s.getTotalCount() : 0;
                    if (total > s.getCount()) {
                      if (s.nextPage) { s.nextPage(); return true; }
                    }
                  }
                  return false;
                })()
              `)
              if (!hasNext) break
              await delay(Math.min(delayMs, 2000))
              totalRequests++
              currentPage++
              const nc = await pollGrid(context.browser, 3, 1000)
              if (nc === 0) break
              const nextJson = await context.browser.evaluate(`
                (function() {
                  var grids = Ext.ComponentQuery.query('gridpanel, grid');
                  for (var gi = 0; gi < grids.length; gi++) {
                    var s = grids[gi].getStore();
                    if (!s || s.getCount() === 0) continue;
                    var r = []; s.each(function(rec) {
                      var d = {}; for (var k in rec.data) { if (rec.data.hasOwnProperty(k) && rec.data[k] != null && rec.data[k] !== '') d[k] = rec.data[k]; }
                      if (Object.keys(d).length > 0) r.push(d);
                    }); return JSON.stringify(r);
                  }
                  return '[]';
                })()
              `)
              if (nextJson) {
                const ni = JSON.parse(nextJson)
                if (ni.length === 0) break
                for (const rec of ni) {
                  const item: any = { _extracted_at: ts() }
                  for (const [k, v] of Object.entries(rec)) {
                    if (v != null && v !== '' && !k.startsWith('_')) item[k] = v
                  }
                  if (Object.keys(item).filter(k => !k.startsWith('_')).length > 0) allItems.push(item)
                }
                console.log(`[scrape] Page ${currentPage}: +${ni.length} (total: ${allItems.length})`)
              }
            } catch { break }
          }
        }

        totalItems += allItems.length
        extractedData[entityType] = allItems
        console.log(`[scrape] ── ${entityType}: ${allItems.length} records (method: ${searchMethod}) ──`)
        await updateSession(serviceClient, sessionId, { items_scraped: totalItems, pages_processed: Object.keys(extractedData).filter(k => !k.startsWith('_')).length, requests_made: totalRequests })
      } catch (error: any) {
        console.error(`[scrape] Entity "${entityType}" error: ${error.message}`)
        errors.push({ page: rules.list_url, error: error.message, timestamp: ts(), recoverable: true })
      }
    }

    // ═══════════════════════════════════════════════════════
    // 5. SAVE RESULTS (v36: MERGE with DB to preserve incremental saves)
    // ═══════════════════════════════════════════════════════
    const { data: csData } = await serviceClient
      .from('scraping_sessions')
      .select('extracted_data, items_scraped')
      .eq('id', sessionId)
      .single()
    const dbData = csData?.extracted_data || {}
    const savedDebug = dbData._debug_v19 || debug

    // v36: Merge local extractedData with DB data (from incremental saves)
    // This prevents overwriting incrementally-saved data when a CDP timeout
    // causes the entity extraction to error before setting local variables.
    const mergedData: Record<string, any> = {}
    // Start with DB data as base
    for (const [key, value] of Object.entries(dbData)) {
      mergedData[key] = value
    }
    // Overlay local data — prefer local ONLY when it has real entity data
    for (const [key, value] of Object.entries(extractedData)) {
      if (key.startsWith('_')) {
        mergedData[key] = value // metadata keys: always take local version
      } else if (Array.isArray(value) && value.length > 0) {
        mergedData[key] = value // local has entity data, use it
      }
      // else: keep DB version (from incremental save) — don't overwrite with empty
    }
    mergedData._debug_v19 = savedDebug

    // v36: items_scraped — take the MAX of local count and DB count
    // This prevents resetting to 0 when local totalItems wasn't updated due to error
    const dbItemCount = csData?.items_scraped || 0
    const finalItemCount = Math.max(totalItems, dbItemCount)

    // Count actual items in merged data for accuracy
    let mergedItemTotal = 0
    for (const [key, value] of Object.entries(mergedData)) {
      if (!key.startsWith('_') && Array.isArray(value)) {
        mergedItemTotal += value.length
      }
    }
    const bestItemCount = Math.max(finalItemCount, mergedItemTotal)

    console.log(`[scrape] Final save: local=${totalItems}, db=${dbItemCount}, merged=${mergedItemTotal}, final=${bestItemCount}`)

    await updateSession(serviceClient, sessionId, {
      status: 'completed',
      extracted_data: mergedData,
      error_log: errors,
      items_scraped: bestItemCount,
      requests_made: totalRequests,
      completed_at: ts(),
    })

    // ═══════════════════════════════════════════════════════
    // 6. AUTO-CREATE IMPORT JOB
    // ═══════════════════════════════════════════════════════
    let importJobId: string | null = null
    if (bestItemCount > 0) {
      try {
        // v36: Use mergedData for column detection
        const mattersData = mergedData.matters || extractedData.matters || []
        const { data: importJob, error: importError } = await serviceClient
          .from('import_jobs')
          .insert({
            organization_id,
            created_by: user_id,
            source_type: 'web_scraping',
            status: 'mapping',
            records_total: bestItemCount,
            entity_type: 'matters',
            metadata: {
              source: 'web_scraping',
              session_id: sessionId,
              entity_type: 'matters',
              detected_columns: Object.keys(mattersData[0] || {}).filter(k => !k.startsWith('_')),
              total_rows_estimate: bestItemCount,
            },
          })
          .select('id')
          .single()

        if (importError) {
          console.error('Failed to create import job:', importError.message)
        } else if (importJob) {
          importJobId = importJob.id
          await serviceClient
            .from('scraping_sessions')
            .update({ import_job_id: importJobId })
            .eq('id', sessionId)
        }
      } catch (ijErr: any) {
        console.error('Error creating import job:', ijErr.message)
      }
    }

    await context.browser.close()

    return {
      success: true,
      session_id: sessionId,
      import_job_id: importJobId,
      extracted_data: mergedData,
      stats: {
        total_items: bestItemCount,
        items_by_entity: Object.fromEntries(
          Object.entries(mergedData)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
        ),
        total_requests: totalRequests,
        errors_count: errors.length,
      },
      debug: savedDebug,
      message: `Extracted ${bestItemCount} items.`,
    }
  } catch (error: any) {
    if (context?.browser) { try { await context.browser.close() } catch {} }
    const { data: cs } = await serviceClient
      .from('scraping_sessions')
      .select('error_log')
      .eq('id', sessionId)
      .single()
    await updateSession(serviceClient, sessionId, {
      status: 'error',
      error_log: [
        ...(Array.isArray(cs?.error_log) ? cs.error_log : []),
        { page: 'global', error: error.message, timestamp: ts(), recoverable: false },
      ],
      completed_at: ts(),
    })
    throw error
  }
}

// ── Helpers ─────────────────────────────────────────────

async function updateSession(c: any, id: string, u: Record<string, any>) {
  await c.from('scraping_sessions').update({ ...u, last_activity_at: ts() }).eq('id', id)
}

function ts() { return new Date().toISOString() }

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function escapeJS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
}
