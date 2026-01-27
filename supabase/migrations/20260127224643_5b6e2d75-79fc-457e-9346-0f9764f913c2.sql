-- =============================================
-- FIX: Cambiar FK de matter_timeline para que apunte a matters (legacy)
-- Esto permite compatibilidad con datos demo existentes
-- =============================================

-- 1. Eliminar FK actual que apunta a matters_v2
ALTER TABLE matter_timeline DROP CONSTRAINT IF EXISTS matter_timeline_matter_id_fkey;

-- 2. Crear nueva FK que apunta a matters
ALTER TABLE matter_timeline 
ADD CONSTRAINT matter_timeline_matter_id_fkey 
FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;

-- 3. Hacer lo mismo para matter_filings
ALTER TABLE matter_filings DROP CONSTRAINT IF EXISTS matter_filings_matter_id_fkey;
ALTER TABLE matter_filings 
ADD CONSTRAINT matter_filings_matter_id_fkey 
FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;

-- 4. Hacer lo mismo para matter_parties
ALTER TABLE matter_parties DROP CONSTRAINT IF EXISTS matter_parties_matter_id_fkey;
ALTER TABLE matter_parties 
ADD CONSTRAINT matter_parties_matter_id_fkey 
FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;

-- 5. Hacer lo mismo para matter_documents
ALTER TABLE matter_documents DROP CONSTRAINT IF EXISTS matter_documents_matter_id_fkey;
ALTER TABLE matter_documents 
ADD CONSTRAINT matter_documents_matter_id_fkey 
FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;

-- 6. Hacer lo mismo para matter_tasks
ALTER TABLE matter_tasks DROP CONSTRAINT IF EXISTS matter_tasks_matter_id_fkey;
ALTER TABLE matter_tasks 
ADD CONSTRAINT matter_tasks_matter_id_fkey 
FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;