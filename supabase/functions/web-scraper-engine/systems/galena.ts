/**
 * PuntoIP Galena — System Configuration
 *
 * Galena (https://mkgalena.puntoip.info/) is a legacy Spanish IP management
 * SaaS from PuntoIP Inc. (2011). It has NO API — only web portal access
 * with username/password authentication.
 *
 * This file contains the navigation and extraction configuration
 * for scraping data from Galena portals.
 *
 * NOTE: The selectors below are initial estimates based on the login page
 * structure. They MUST be verified and updated after the first successful
 * login via the "discover" action.
 */

export interface SystemScraperConfig {
  login_url: string
  base_url: string
  navigation_config: NavigationStep[]
  extraction_rules: Record<string, any>
  rate_limit: {
    requests_per_minute: number
    delay_between_pages_ms: number
    max_concurrent: number
  }
}

interface NavigationStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'scroll' | 'screenshot' | 'extract'
  url?: string
  selector?: string
  value?: string
  timeout?: number
}

// ── Galena Configuration ────────────────────────────────────

const GALENA_CONFIG: SystemScraperConfig = {
  login_url: 'https://mkgalena.puntoip.info/',
  base_url: 'https://mkgalena.puntoip.info',

  navigation_config: [
    // Step 1: Navigate to login page
    {
      action: 'goto',
      url: 'https://mkgalena.puntoip.info/',
    },
    // Step 2: Wait for login form to load (generic — first input on page)
    {
      action: 'wait',
      selector: 'input[type="text"], input[type="email"], input[name="username"], input[name="login"], input[name="user"], input[name="usuario"]',
      timeout: 15000,
    },
    // Step 3: Take screenshot of login page (for debugging)
    {
      action: 'screenshot',
    },
    // Step 4: Fill username (try multiple selectors)
    {
      action: 'fill',
      selector: 'input[type="text"], input[type="email"], input[name="username"], input[name="login"], input[name="user"], input[name="usuario"]',
      value: '{{username}}',
    },
    // Step 5: Fill password
    {
      action: 'fill',
      selector: 'input[type="password"], input[name="password"], input[name="clave"], input[name="pass"]',
      value: '{{password}}',
    },
    // Step 6: Click login button
    {
      action: 'click',
      selector: 'input[type="submit"], button[type="submit"], button.btn, .btn-login, button.login, #login-button, form button, form input[type="button"]',
      timeout: 5000,
    },
    // Step 7: Wait for page change after login (very generic — just wait for body to update)
    {
      action: 'wait',
      selector: 'body',
      timeout: 10000,
    },
    // Step 8: Take screenshot of result (dashboard or error)
    {
      action: 'screenshot',
    },
  ],

  // Extraction rules — to be populated after discover action
  // These are initial guesses for a typical Spanish IP management system
  extraction_rules: {
    matters: {
      list_url: '', // To be discovered
      list_selector: 'table tbody tr, .list-item, .expediente-row',
      pagination: {
        type: 'click' as const,
        selector: '.pagination .next, .pager .next, a[rel="next"], .siguiente',
        max_pages: 50,
      },
      fields: {
        // Fields will be mapped after discover
        // Typical Galena/Spanish IP system fields:
        mark_name: {
          selector: 'td:nth-child(2), .marca-nombre',
          transform: 'trim',
        },
        reference: {
          selector: 'td:nth-child(1), .expediente-num',
          transform: 'trim',
        },
        status: {
          selector: 'td:nth-child(3), .estado',
          transform: 'trim',
          map: {
            'registrada': 'registered',
            'pendiente': 'pending',
            'en tramite': 'examining',
            'en trámite': 'examining',
            'publicada': 'published',
            'concedida': 'registered',
            'denegada': 'refused',
            'caducada': 'expired',
            'renunciada': 'withdrawn',
            'activa': 'registered',
          },
        },
        nice_classes: {
          selector: 'td:nth-child(4), .clase',
          transform: 'trim',
        },
        applicant_name: {
          selector: 'td:nth-child(5), .titular',
          transform: 'trim',
        },
        filing_date: {
          selector: 'td:nth-child(6), .fecha-solicitud',
          transform: 'date',
        },
        registration_date: {
          selector: 'td:nth-child(7), .fecha-registro',
          transform: 'date',
        },
        expiry_date: {
          selector: 'td:nth-child(8), .fecha-vencimiento',
          transform: 'date',
        },
        jurisdiction: {
          selector: 'td:nth-child(9), .pais',
          transform: 'uppercase',
        },
      },
    },

    contacts: {
      list_url: '', // To be discovered
      list_selector: 'table tbody tr, .list-item, .cliente-row',
      pagination: {
        type: 'click' as const,
        selector: '.pagination .next',
        max_pages: 20,
      },
      fields: {
        name: {
          selector: 'td:nth-child(1), .nombre',
          transform: 'trim',
        },
        email: {
          selector: 'td:nth-child(2), .email',
          transform: 'trim',
        },
        phone: {
          selector: 'td:nth-child(3), .telefono',
          transform: 'trim',
        },
        company: {
          selector: 'td:nth-child(4), .empresa',
          transform: 'trim',
        },
      },
    },

    deadlines: {
      list_url: '', // To be discovered
      list_selector: 'table tbody tr, .list-item, .plazo-row',
      pagination: {
        type: 'click' as const,
        selector: '.pagination .next',
        max_pages: 20,
      },
      fields: {
        matter_reference: {
          selector: 'td:nth-child(1), .expediente',
          transform: 'trim',
        },
        due_date: {
          selector: 'td:nth-child(2), .fecha-vencimiento',
          transform: 'date',
        },
        deadline_type: {
          selector: 'td:nth-child(3), .tipo-plazo',
          transform: 'trim',
        },
        status: {
          selector: 'td:nth-child(4), .estado',
          transform: 'trim',
        },
      },
    },
  },

  rate_limit: {
    requests_per_minute: 10,       // Conservative for legacy server
    delay_between_pages_ms: 3000,  // 3 seconds between requests
    max_concurrent: 1,             // Sequential only
  },
}

// ── System Config Resolver ──────────────────────────────────

/**
 * Get the scraper configuration for a known system.
 * Currently supports: galena, puntoip
 */
export function getSystemConfig(systemId: string | null): SystemScraperConfig | null {
  if (!systemId) return null

  const configs: Record<string, SystemScraperConfig> = {
    'galena': GALENA_CONFIG,
    'puntoip_galena': GALENA_CONFIG,
    'puntoip': GALENA_CONFIG,
    'web_portal': GALENA_CONFIG, // Default for web_portal type — Galena is our first client
  }

  return configs[systemId.toLowerCase()] || null
}

/**
 * Try to detect the system from connection metadata.
 * Falls back to Galena config for web_portal types with puntoip URLs.
 */
export function detectSystemConfig(
  systemType: string | null,
  connectionName: string | null,
  baseUrl: string | null
): SystemScraperConfig | null {
  // Direct match
  const directMatch = getSystemConfig(systemType)
  if (directMatch) return directMatch

  // Detect by name
  const nameLower = (connectionName || '').toLowerCase()
  if (nameLower.includes('galena') || nameLower.includes('puntoip')) {
    return GALENA_CONFIG
  }

  // Detect by URL
  const urlLower = (baseUrl || '').toLowerCase()
  if (urlLower.includes('puntoip') || urlLower.includes('galena')) {
    return GALENA_CONFIG
  }

  return null
}

/**
 * Get all supported scraping system IDs.
 */
export function getSupportedScrapingSystems(): string[] {
  return ['galena', 'puntoip_galena']
}
