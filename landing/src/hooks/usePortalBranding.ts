import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface PortalBranding {
  portal_name: string | null
  portal_welcome_title: string | null
  portal_welcome_message: string | null
  portal_footer_text: string | null
  portal_show_ipnexus_branding: boolean
  portal_chatbot_name: string | null
  portal_chatbot_welcome: string | null
  logo_url: string | null
  portal_logo_dark_url: string | null
  portal_favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

function sanitizeColor(value: string | null, fallback: string): string {
  if (!value) return fallback
  return HEX_COLOR_RE.test(value) ? value : fallback
}

export function getSubdomain(): string | null {
  const hostname = window.location.hostname
  if (
    hostname === 'ip-nexus.app' ||
    hostname === 'www.ip-nexus.app' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return null
  }
  if (hostname.endsWith('.ip-nexus.app')) {
    const sub = hostname.split('.')[0]
    if (sub !== 'app' && sub !== 'www') return sub
  }
  return null
}

export function usePortalBranding(slug: string | null) {
  const [branding, setBranding] = useState<PortalBranding | null>(null)
  const [loading, setLoading] = useState(!!slug)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchBranding() {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_portal_branding', {
        p_subdomain: slug,
      })

      if (cancelled) return

      if (rpcError || !data) {
        setError('Portal no encontrado o desactivado.')
        setLoading(false)
        return
      }

      const row = Array.isArray(data) ? data[0] : data
      if (!row) {
        setError('Portal no encontrado o desactivado.')
        setLoading(false)
        return
      }

      setBranding(row as PortalBranding)

      // Inject CSS custom properties (sanitized)
      const root = document.documentElement
      root.style.setProperty(
        '--portal-primary',
        sanitizeColor(row.primary_color, '#1E40AF'),
      )
      root.style.setProperty(
        '--portal-secondary',
        sanitizeColor(row.secondary_color, '#3B82F6'),
      )

      // Dynamic favicon
      if (row.portal_favicon_url) {
        const link =
          document.querySelector<HTMLLinkElement>("link[rel~='icon']") ||
          document.createElement('link')
        link.rel = 'icon'
        link.href = row.portal_favicon_url
        document.head.appendChild(link)
      }

      // Dynamic title
      if (row.portal_name) {
        document.title = `${row.portal_name} — Portal`
      }

      setLoading(false)
    }

    fetchBranding()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { branding, loading, error }
}
