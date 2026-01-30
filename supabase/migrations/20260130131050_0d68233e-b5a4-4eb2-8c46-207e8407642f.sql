-- Añadir campos para soportar IP-Nexus como provider incluido
ALTER TABLE voip_settings 
ADD COLUMN IF NOT EXISTS ip_nexus_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ip_nexus_phone_number TEXT,
ADD COLUMN IF NOT EXISTS ip_nexus_extension TEXT,
ADD COLUMN IF NOT EXISTS ip_nexus_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vonage_api_key TEXT,
ADD COLUMN IF NOT EXISTS vonage_api_secret TEXT,
ADD COLUMN IF NOT EXISTS vonage_phone_number TEXT,
ADD COLUMN IF NOT EXISTS aircall_api_id TEXT,
ADD COLUMN IF NOT EXISTS aircall_api_token TEXT,
ADD COLUMN IF NOT EXISTS other_provider_name TEXT,
ADD COLUMN IF NOT EXISTS other_provider_config JSONB,
ADD COLUMN IF NOT EXISTS default_country_code TEXT DEFAULT '+34',
ADD COLUMN IF NOT EXISTS voicemail_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS voicemail_email TEXT,
ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Actualizar el enum de provider para incluir más opciones
-- Primero verificamos los valores actuales
COMMENT ON COLUMN voip_settings.provider IS 'Provider options: ip_nexus, twilio, vonage, aircall, other, none';