/**
 * Connection Loader
 *
 * Centralizes loading migration_connections + credentials from DB.
 * All scraper actions use this to get connection config and credentials.
 *
 * Credentials are stored in connection_config._temp_credentials (from frontend)
 * or in connection_config.credentials (from encrypt-credentials action).
 */

import { getServiceClient } from '../index.ts'
import { getSystemConfig, detectSystemConfig, type SystemScraperConfig } from '../systems/galena.ts'

export interface ConnectionData {
  connection: any
  credentials: { username: string; password: string; [key: string]: string }
  scraperConfig: SystemScraperConfig | null
}

/**
 * Load a migration connection and extract its credentials.
 * Tries multiple credential locations for backward compatibility.
 */
export async function loadConnectionAndCredentials(
  connectionId: string,
  organizationId: string
): Promise<ConnectionData> {
  const serviceClient = getServiceClient()

  // Load from migration_connections
  const { data: connection, error } = await serviceClient
    .from('migration_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !connection) {
    throw new Error('Connection not found or access denied')
  }

  const config = connection.connection_config || {}

  // Extract credentials from multiple possible locations
  const credentials = extractCredentials(config)

  if (!credentials.username || !credentials.password) {
    throw new Error(
      'No se encontraron credenciales completas. ' +
      `URL: ${credentials.url || 'falta'}, ` +
      `Usuario: ${credentials.username ? 'OK' : 'falta'}. ` +
      "Usa 'Editar Credenciales' en el menu de la conexion para configurarlas."
    )
  }

  // Get scraper configuration
  // Priority: connection_config.scraper_config > known system > auto-detect
  const scraperConfig = config.scraper_config
    || getSystemConfig(connection.system_type)
    || detectSystemConfig(connection.system_type, connection.name, credentials.url)

  // Override login URL if credentials have a custom URL
  if (scraperConfig && credentials.url) {
    // Update the goto step URL and base_url
    scraperConfig.login_url = credentials.url
    scraperConfig.base_url = credentials.url.replace(/\/$/, '')
    for (const step of scraperConfig.navigation_config || []) {
      if (step.action === 'goto' && step.url) {
        step.url = credentials.url
      }
    }
  }

  return { connection, credentials, scraperConfig }
}

/**
 * Extract credentials from connection_config, checking multiple locations.
 */
function extractCredentials(config: any): { username: string; password: string; url: string; [key: string]: string } {
  // Location 1: _temp_credentials (set by frontend useCreateConnection)
  if (config._temp_credentials?.username) {
    return {
      username: config._temp_credentials.username,
      password: config._temp_credentials.password || '',
      url: config._temp_credentials.url || config.base_url || '',
    }
  }

  // Location 2: Direct on config (set by Edit Credentials dialog)
  if (config.username) {
    return {
      username: config.username,
      password: config.password || '',
      url: config.url || config.base_url || '',
    }
  }

  // Location 3: credentials object
  if (config.credentials?.username) {
    return {
      username: config.credentials.username,
      password: config.credentials.password || '',
      url: config.credentials.url || config.base_url || '',
    }
  }

  // No credentials found
  return { username: '', password: '', url: config.base_url || '' }
}
