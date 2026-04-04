/**
 * Action: discover
 *
 * Logs into the target portal and maps its structure:
 * - Navigation menus and their URLs
 * - Data tables and their headers
 * - Forms and their fields
 * - Entity types that can be extracted
 *
 * This is used to build ExtractionRules for unknown portals.
 */

import { loadConnectionAndCredentials } from '../_shared/connection-loader.ts'
import { executeLoginSequence, navigateTo, getCurrentPageHTML } from '../browser/navigator.ts'
import { discoverPageStructure, type PageStructure } from '../browser/parser.ts'

interface DiscoverParams {
  source_id: string
  organization_id: string
  user_id: string
  options: {
    max_pages?: number
    explore_links?: boolean
  }
}

interface DetectedEntity {
  name: string
  probable_url: string
  table_headers: string[]
  estimated_count: number
  confidence: number
}

export async function discover(params: DiscoverParams) {
  const { source_id, organization_id, options } = params
  const maxPages = Math.min(options.max_pages || 5, 10)
  const exploreLinks = options.explore_links !== false

  // 1. Load connection + credentials
  const { credentials, scraperConfig } = await loadConnectionAndCredentials(
    source_id,
    organization_id
  )

  if (!scraperConfig?.navigation_config) {
    throw new Error('No navigation config found')
  }

  // 2. Login
  const context = await executeLoginSequence(
    scraperConfig.navigation_config,
    credentials,
    { takeScreenshots: true }
  )

  try {
    // 3. Discover main page structure
    const mainHTML = await getCurrentPageHTML(context.browser)
    const mainStructure = discoverPageStructure(mainHTML)

    // 4. Explore sub-pages from navigation links
    const subPages: { url: string; structure: PageStructure }[] = []
    const visited = new Set<string>()
    visited.add(context.currentUrl)

    if (exploreLinks && mainStructure.navigation.length > 0) {
      const entityKeywords = [
        'marca', 'expediente', 'caso', 'plazo', 'vencimiento',
        'cliente', 'titular', 'contacto', 'documento', 'clase',
        'trademark', 'mark', 'case', 'matter', 'deadline',
        'client', 'contact', 'document', 'portfolio', 'search',
        'buscar', 'listado', 'consulta',
      ]

      const sortedLinks = mainStructure.navigation
        .filter(link => link.href && !link.href.startsWith('#'))
        .sort((a, b) => {
          const aScore = entityKeywords.some(k =>
            a.text.toLowerCase().includes(k) || a.href.toLowerCase().includes(k)
          ) ? 1 : 0
          const bScore = entityKeywords.some(k =>
            b.text.toLowerCase().includes(k) || b.href.toLowerCase().includes(k)
          ) ? 1 : 0
          return bScore - aScore
        })

      for (const link of sortedLinks.slice(0, maxPages)) {
        const url = resolveUrl(link.href, scraperConfig.base_url)
        if (visited.has(url)) continue
        visited.add(url)

        try {
          const html = await navigateTo(context.browser, url)
          const structure = discoverPageStructure(html)
          subPages.push({ url, structure })
          await delay(1500)
        } catch {
          // Non-critical
        }
      }
    }

    // 5. Detect entities
    const detectedEntities = detectEntities(mainStructure, subPages)

    // 6. Close session
    await context.browser.close()

    return {
      success: true,
      pages_explored: 1 + subPages.length,
      structure: {
        main_page: mainStructure,
        sub_pages: subPages,
      },
      detected_entities: detectedEntities,
      suggested_extraction_rules: buildSuggestedRules(detectedEntities, scraperConfig.base_url),
      message: `Discovered ${detectedEntities.length} potential entities across ${1 + subPages.length} pages.`,
    }
  } catch (error) {
    await context.browser.close()
    throw error
  }
}

// ── Entity Detection Heuristics ─────────────────────────────

function detectEntities(
  mainPage: PageStructure,
  subPages: { url: string; structure: PageStructure }[]
): DetectedEntity[] {
  const entities: DetectedEntity[] = []

  for (const table of mainPage.tables) {
    const entity = classifyTable(table.headers, '', table.rowCount)
    if (entity) entities.push(entity)
  }

  for (const page of subPages) {
    for (const table of page.structure.tables) {
      const entity = classifyTable(table.headers, page.url, table.rowCount)
      if (entity) entities.push(entity)
    }
  }

  const unique = new Map<string, DetectedEntity>()
  for (const entity of entities) {
    const existing = unique.get(entity.name)
    if (!existing || entity.confidence > existing.confidence) {
      unique.set(entity.name, entity)
    }
  }

  return Array.from(unique.values())
}

function classifyTable(
  headers: string[],
  url: string,
  rowCount: number
): DetectedEntity | null {
  const headerStr = headers.join(' ').toLowerCase()

  const matterKeywords = ['marca', 'expediente', 'número', 'numero', 'referencia', 'estado',
    'clase', 'titular', 'trademark', 'mark', 'case', 'reference', 'status']
  const matterScore = matterKeywords.filter(k => headerStr.includes(k)).length

  if (matterScore >= 2) {
    return {
      name: 'matters',
      probable_url: url,
      table_headers: headers,
      estimated_count: Math.max(rowCount - 1, 0),
      confidence: Math.min(matterScore / 4, 1.0),
    }
  }

  const deadlineKeywords = ['plazo', 'vencimiento', 'fecha', 'deadline', 'due', 'renewal', 'renovación']
  const deadlineScore = deadlineKeywords.filter(k => headerStr.includes(k)).length

  if (deadlineScore >= 2) {
    return {
      name: 'deadlines',
      probable_url: url,
      table_headers: headers,
      estimated_count: Math.max(rowCount - 1, 0),
      confidence: Math.min(deadlineScore / 3, 1.0),
    }
  }

  const contactKeywords = ['nombre', 'email', 'teléfono', 'telefono', 'cliente', 'contacto',
    'name', 'email', 'phone', 'client', 'contact']
  const contactScore = contactKeywords.filter(k => headerStr.includes(k)).length

  if (contactScore >= 2) {
    return {
      name: 'contacts',
      probable_url: url,
      table_headers: headers,
      estimated_count: Math.max(rowCount - 1, 0),
      confidence: Math.min(contactScore / 3, 1.0),
    }
  }

  return null
}

function buildSuggestedRules(
  entities: DetectedEntity[],
  baseUrl: string
): Record<string, any> {
  const rules: Record<string, any> = {}

  for (const entity of entities) {
    rules[entity.name] = {
      list_url: entity.probable_url || baseUrl,
      list_selector: 'table tbody tr',
      fields: buildFieldSuggestions(entity.table_headers, entity.name),
      pagination: {
        type: 'click',
        selector: '.pagination .next, .pager .next, a[rel="next"]',
        max_pages: 20,
      },
    }
  }

  return rules
}

function buildFieldSuggestions(
  headers: string[],
  entityType: string
): Record<string, any> {
  const fields: Record<string, any> = {}

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase()
    const selector = `td:nth-child(${i + 1})`
    let fieldName = `column_${i}`

    if (entityType === 'matters') {
      if (header.match(/marca|trademark|mark|nombre/)) fieldName = 'mark_name'
      else if (header.match(/expediente|referencia|número|numero|case|ref/)) fieldName = 'reference'
      else if (header.match(/estado|status/)) fieldName = 'status'
      else if (header.match(/clase|class/)) fieldName = 'nice_classes'
      else if (header.match(/titular|owner|applicant/)) fieldName = 'applicant_name'
      else if (header.match(/país|pais|country|jurisd/)) fieldName = 'jurisdiction'
      else if (header.match(/solicitud|filing|presenta/)) fieldName = 'filing_date'
      else if (header.match(/registro|registration|grant/)) fieldName = 'registration_date'
      else if (header.match(/vencimiento|expir|renewal|renov/)) fieldName = 'expiry_date'
    } else if (entityType === 'contacts') {
      if (header.match(/nombre|name/)) fieldName = 'name'
      else if (header.match(/email|correo/)) fieldName = 'email'
      else if (header.match(/tel|phone/)) fieldName = 'phone'
      else if (header.match(/empresa|company/)) fieldName = 'company'
    } else if (entityType === 'deadlines') {
      if (header.match(/marca|matter|caso/)) fieldName = 'matter_reference'
      else if (header.match(/fecha|date|plazo|deadline|vencimiento/)) fieldName = 'due_date'
      else if (header.match(/tipo|type/)) fieldName = 'deadline_type'
      else if (header.match(/estado|status/)) fieldName = 'status'
    }

    fields[fieldName] = {
      selector,
      transform: header.match(/fecha|date/) ? 'date' : 'trim',
    }
  }

  return fields
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('/')) return `${baseUrl}${href}`
  return `${baseUrl}/${href}`
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
