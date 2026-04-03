/**
 * HTML Parser using deno-dom
 *
 * Parses HTML returned by the browser service and applies
 * ExtractionRule definitions to produce structured data.
 */

import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts'

// ── Types (mirror from universal-import.ts) ─────────────────

export interface ExtractionRule {
  list_url: string
  list_selector: string
  pagination?: {
    type: 'click' | 'url_param' | 'infinite_scroll'
    selector?: string
    param_name?: string
    max_pages?: number
  }
  detail_url_pattern?: string
  fields: Record<string, FieldExtractionRule>
}

export interface FieldExtractionRule {
  selector: string
  attribute?: string
  transform?: 'trim' | 'lowercase' | 'uppercase' | 'number' | 'date'
  map?: Record<string, string>
  regex?: string
}

export interface ExtractedItem {
  [key: string]: any
  _source_url?: string
  _extracted_at?: string
}

// ── HTML Parsing ────────────────────────────────────────────

/**
 * Parse an HTML string into a DOM document.
 */
export function parseHTML(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) throw new Error('Failed to parse HTML')
  return doc
}

/**
 * Extract a list of items from HTML using an ExtractionRule.
 * Returns structured objects with field values.
 */
export function extractList(
  html: string,
  rule: ExtractionRule
): ExtractedItem[] {
  const doc = parseHTML(html)
  const items: ExtractedItem[] = []

  // Find all list items matching the selector
  const listElements = doc.querySelectorAll(rule.list_selector)

  for (const element of listElements) {
    const item: ExtractedItem = {
      _extracted_at: new Date().toISOString(),
    }

    // Extract each field
    for (const [fieldName, fieldRule] of Object.entries(rule.fields)) {
      const value = extractField(element as Element, fieldRule)
      if (value !== null && value !== undefined && value !== '') {
        item[fieldName] = value
      }
    }

    // Only add items that have at least one meaningful field
    const meaningfulFields = Object.keys(item).filter(k => !k.startsWith('_'))
    if (meaningfulFields.length > 0) {
      items.push(item)
    }
  }

  return items
}

/**
 * Extract a single field value from an element using a FieldExtractionRule.
 */
export function extractField(
  parentElement: Element,
  rule: FieldExtractionRule
): string | number | null {
  const element = parentElement.querySelector(rule.selector)
  if (!element) return null

  // Get raw value
  let value: string

  if (rule.attribute) {
    value = element.getAttribute(rule.attribute) || ''
  } else {
    value = (element as Element).textContent || ''
  }

  // Apply regex extraction if specified (with ReDoS protection)
  if (rule.regex && value) {
    try {
      // Reject dangerous patterns: nested quantifiers, group+quantifier combos
      const REDOS_PATTERNS = [
        /(\+|\*|\{)\s*(\+|\*|\{)/,       // Adjacent quantifiers: ++, *+, {2}+
        /\([^)]*[+*]\)[+*]/,              // Group with quantifier followed by quantifier: (a+)+
        /\([^)]*\|[^)]*\)[+*]/,           // Alternation in group with quantifier: (a|b)+
      ]
      const isUnsafe = rule.regex.length > 200 || REDOS_PATTERNS.some(p => p.test(rule.regex!))

      if (!isUnsafe) {
        const match = value.match(new RegExp(rule.regex))
        value = match ? (match[1] || match[0]) : value
      }
    } catch {
      // Invalid regex — skip silently
    }
  }

  // Apply transform
  if (rule.transform && value) {
    switch (rule.transform) {
      case 'trim':
        value = value.trim()
        break
      case 'lowercase':
        value = value.toLowerCase().trim()
        break
      case 'uppercase':
        value = value.toUpperCase().trim()
        break
      case 'number': {
        const num = parseFloat(value.replace(/[^\d.-]/g, ''))
        return isNaN(num) ? null : num
      }
      case 'date': {
        // Try to normalize Spanish/European date formats
        value = normalizeDate(value.trim())
        break
      }
    }
  }

  // Apply value mapping
  if (rule.map && value) {
    const normalizedValue = value.toLowerCase().trim()
    value = rule.map[normalizedValue] || rule.map[value] || value
  }

  return value ? value.trim() : null
}

/**
 * Extract detail page data from a full detail page HTML.
 */
export function extractDetailPage(
  html: string,
  fields: Record<string, FieldExtractionRule>
): ExtractedItem {
  const doc = parseHTML(html)
  const item: ExtractedItem = {
    _extracted_at: new Date().toISOString(),
  }

  const bodyElement = doc.querySelector('body')
  if (!bodyElement) return item

  for (const [fieldName, fieldRule] of Object.entries(fields)) {
    const value = extractField(bodyElement as Element, fieldRule)
    if (value !== null && value !== undefined && value !== '') {
      item[fieldName] = value
    }
  }

  return item
}

/**
 * Discover the structure of a page: links, tables, forms, etc.
 * Used by the "discover" action to map unknown portals.
 */
export function discoverPageStructure(html: string): PageStructure {
  const doc = parseHTML(html)

  const structure: PageStructure = {
    title: doc.querySelector('title')?.textContent || '',
    links: [],
    tables: [],
    forms: [],
    navigation: [],
  }

  // Discover navigation links
  const navLinks = doc.querySelectorAll('nav a, .nav a, .menu a, .sidebar a, #menu a')
  for (const link of navLinks) {
    const el = link as Element
    const href = el.getAttribute('href')
    const text = el.textContent?.trim()
    if (href && text) {
      structure.navigation.push({ text, href })
    }
  }

  // Discover all meaningful links
  const allLinks = doc.querySelectorAll('a[href]')
  for (const link of allLinks) {
    const el = link as Element
    const href = el.getAttribute('href')
    const text = el.textContent?.trim()
    if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
      structure.links.push({ text, href })
    }
  }

  // Discover tables
  const tables = doc.querySelectorAll('table')
  for (const table of tables) {
    const el = table as Element
    const headers: string[] = []
    const ths = el.querySelectorAll('th')
    for (const th of ths) {
      headers.push((th as Element).textContent?.trim() || '')
    }
    const rowCount = el.querySelectorAll('tr').length
    structure.tables.push({ headers, rowCount })
  }

  // Discover forms
  const forms = doc.querySelectorAll('form')
  for (const form of forms) {
    const el = form as Element
    const inputs: string[] = []
    const formInputs = el.querySelectorAll('input, select, textarea')
    for (const input of formInputs) {
      const inp = input as Element
      const name = inp.getAttribute('name') || inp.getAttribute('id') || ''
      const type = inp.getAttribute('type') || inp.tagName.toLowerCase()
      if (name) inputs.push(`${name} (${type})`)
    }
    structure.forms.push({
      action: el.getAttribute('action') || '',
      method: el.getAttribute('method') || 'get',
      inputs,
    })
  }

  return structure
}

export interface PageStructure {
  title: string
  links: { text: string; href: string }[]
  tables: { headers: string[]; rowCount: number }[]
  forms: { action: string; method: string; inputs: string[] }[]
  navigation: { text: string; href: string }[]
}

// ── Date Normalization ──────────────────────────────────────

/**
 * Normalize date strings from various Spanish/European formats to ISO.
 * Handles: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, Spanish month names
 */
function normalizeDate(dateStr: string): string {
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const euMatch = dateStr.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (euMatch) {
    const [_, day, month, year] = euMatch
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // yyyy-mm-dd (already ISO-ish)
  const isoMatch = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // Spanish month names
  const spanishMonths: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
  }

  for (const [monthName, monthNum] of Object.entries(spanishMonths)) {
    if (dateStr.toLowerCase().includes(monthName)) {
      const dayMatch = dateStr.match(/(\d{1,2})/)
      const yearMatch = dateStr.match(/(\d{4})/)
      if (dayMatch && yearMatch) {
        const date = new Date(`${yearMatch[1]}-${monthNum}-${dayMatch[1].padStart(2, '0')}`)
        if (!isNaN(date.getTime())) return date.toISOString()
      }
    }
  }

  // Fallback: try native parsing
  const fallback = new Date(dateStr)
  if (!isNaN(fallback.getTime())) return fallback.toISOString()

  return dateStr // Return original if we can't parse
}
