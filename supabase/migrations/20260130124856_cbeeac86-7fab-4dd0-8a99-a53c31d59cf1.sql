-- Add backend URL and connected phone fields to whatsapp_tenant_config
ALTER TABLE whatsapp_tenant_config 
ADD COLUMN IF NOT EXISTS whatsapp_backend_url TEXT,
ADD COLUMN IF NOT EXISTS connected_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_tenant_config.whatsapp_backend_url IS 'URL del servidor backend externo para conexión QR (whatsapp-web.js)';
COMMENT ON COLUMN whatsapp_tenant_config.connected_phone IS 'Número de teléfono conectado vía QR';