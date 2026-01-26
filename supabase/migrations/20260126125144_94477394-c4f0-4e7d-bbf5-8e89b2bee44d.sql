
-- =============================================
-- SEEDS: Organizaciones demo + Módulos
-- =============================================

-- Insertar organizaciones demo (usando planes válidos: starter, professional, business, enterprise)
INSERT INTO organizations (id, name, slug, plan, status, settings, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', '🏢 Enterprise Total - Todos los Módulos', 'demo-enterprise-total', 'enterprise', 'active', '{"demo": true}', NOW()),
('a2000000-0000-0000-0000-000000000002', '⭐ Pro Completo - Docket + CRM + Spider + Genius', 'demo-pro-completo', 'professional', 'active', '{"demo": true}', NOW()),
('a3000000-0000-0000-0000-000000000003', '📁 Pro Docket - Solo Gestión + Legal Ops', 'demo-pro-docket', 'professional', 'active', '{"demo": true}', NOW()),
('a4000000-0000-0000-0000-000000000004', '🚀 Starter Docket - Solo Expedientes', 'demo-starter-docket', 'starter', 'active', '{"demo": true}', NOW()),
('a5000000-0000-0000-0000-000000000005', '👥 Starter CRM - Solo Clientes', 'demo-starter-crm', 'starter', 'active', '{"demo": true}', NOW()),
('a6000000-0000-0000-0000-000000000006', '🕷️ Starter Spider - Solo Vigilancia', 'demo-starter-spider', 'starter', 'active', '{"demo": true}', NOW()),
('a7000000-0000-0000-0000-000000000007', '🆓 Free Básico - Plan Gratuito', 'demo-free-basico', 'starter', 'active', '{"demo": true, "is_free_tier": true}', NOW()),
('a8000000-0000-0000-0000-000000000008', '⏱️ Pro con Trials - Probando módulos', 'demo-pro-trials', 'professional', 'active', '{"demo": true}', NOW()),
('a9000000-0000-0000-0000-000000000009', '🔒 Starter Límite - Sin espacio para más', 'demo-starter-limite', 'starter', 'active', '{"demo": true}', NOW()),
('aa000000-0000-0000-0000-000000000010', '🧠 Pro Inteligencia - Spider + Genius + Analytics', 'demo-pro-inteligencia', 'professional', 'active', '{"demo": true}', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, plan = EXCLUDED.plan, settings = EXCLUDED.settings;

-- Limpiar módulos demo existentes
DELETE FROM tenant_modules WHERE tenant_id IN (
  'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
  'a3000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004',
  'a5000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000006',
  'a7000000-0000-0000-0000-000000000007', 'a8000000-0000-0000-0000-000000000008',
  'a9000000-0000-0000-0000-000000000009', 'aa000000-0000-0000-0000-000000000010'
);

-- 1. ENTERPRISE TOTAL: Todos los módulos
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'docket', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'crm', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'spider', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'genius', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'analytics', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'legalops', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'communications', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'portal-cliente', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'data-hub', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'filing', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'workflow', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'finance', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'timetracking', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'equipos', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'alertas-ia', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'informes', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'marketing', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'market', 'included', 'active'),
('a1000000-0000-0000-0000-000000000001', 'ip-chain', 'included', 'active');

-- 2. PRO COMPLETO: Docket + CRM + Spider + Genius
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a2000000-0000-0000-0000-000000000002', 'docket', 'selected', 'active'),
('a2000000-0000-0000-0000-000000000002', 'crm', 'selected', 'active'),
('a2000000-0000-0000-0000-000000000002', 'spider', 'addon', 'active'),
('a2000000-0000-0000-0000-000000000002', 'genius', 'addon', 'active');

-- 3. PRO DOCKET: Docket + CRM + Legal Ops + Workflow
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a3000000-0000-0000-0000-000000000003', 'docket', 'selected', 'active'),
('a3000000-0000-0000-0000-000000000003', 'crm', 'selected', 'active'),
('a3000000-0000-0000-0000-000000000003', 'legalops', 'addon', 'active'),
('a3000000-0000-0000-0000-000000000003', 'workflow', 'addon', 'active');

-- 4. STARTER DOCKET: Solo Docket
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a4000000-0000-0000-0000-000000000004', 'docket', 'selected', 'active');

-- 5. STARTER CRM: Solo CRM
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a5000000-0000-0000-0000-000000000005', 'crm', 'selected', 'active');

-- 6. STARTER SPIDER: Solo Spider
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a6000000-0000-0000-0000-000000000006', 'spider', 'selected', 'active');

-- 7. FREE BÁSICO: Docket limitado
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a7000000-0000-0000-0000-000000000007', 'docket', 'selected', 'active');

-- 8. PRO CON TRIALS: Varios módulos en prueba
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status, trial_ends_at) VALUES
('a8000000-0000-0000-0000-000000000008', 'docket', 'selected', 'active', NULL),
('a8000000-0000-0000-0000-000000000008', 'crm', 'selected', 'active', NULL),
('a8000000-0000-0000-0000-000000000008', 'spider', 'trial', 'trialing', NOW() + INTERVAL '12 days'),
('a8000000-0000-0000-0000-000000000008', 'genius', 'trial', 'trialing', NOW() + INTERVAL '5 days'),
('a8000000-0000-0000-0000-000000000008', 'analytics', 'trial', 'trialing', NOW() + INTERVAL '3 days');

-- 9. STARTER LÍMITE: Máximo addons (2/2)
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('a9000000-0000-0000-0000-000000000009', 'docket', 'selected', 'active'),
('a9000000-0000-0000-0000-000000000009', 'spider', 'addon', 'active'),
('a9000000-0000-0000-0000-000000000009', 'genius', 'addon', 'active');

-- 10. PRO INTELIGENCIA: Spider + Genius + Analytics + Alertas
INSERT INTO tenant_modules (tenant_id, module_code, access_type, status) VALUES
('aa000000-0000-0000-0000-000000000010', 'spider', 'selected', 'active'),
('aa000000-0000-0000-0000-000000000010', 'genius', 'selected', 'active'),
('aa000000-0000-0000-0000-000000000010', 'analytics', 'addon', 'active'),
('aa000000-0000-0000-0000-000000000010', 'alertas-ia', 'addon', 'active');
