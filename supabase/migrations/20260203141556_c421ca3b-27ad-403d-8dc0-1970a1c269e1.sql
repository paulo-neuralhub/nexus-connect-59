-- ============================================================
-- SEED DATA: 18 Estilos Visuales con colores completos
-- ============================================================

-- Primero limpiamos y reinsertamos con todos los campos
TRUNCATE TABLE document_styles CASCADE;

INSERT INTO document_styles (id, code, name, description, pack, head_font, body_font, header_layout, colors, is_dark, sort_order, is_active, css_variables) VALUES
-- Pack 1: Classic
(gen_random_uuid(), 'clasico', 'Clásico', 'Serif · B/N', 'Classic', 'Libre Baskerville, serif', 'Libre Baskerville, serif', 'standard',
  '{"primary":"#1a1a1a","accent":"#1a1a1a","background":"#ffffff","backgroundAlt":"#f9f9f9","headerBg":"#1a1a1a","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#dddddd","tableHeadBg":"#1a1a1a","tableHeadText":"#ffffff","totalBg":"#1a1a1a","totalText":"#ffffff"}'::jsonb,
  false, 1, true, '{"primary":"#1a1a1a","accent":"#1a1a1a","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'elegante', 'Elegante', 'Dark · Gold', 'Classic', 'Cormorant Garamond, serif', 'DM Sans, sans-serif', 'standard',
  '{"primary":"#f0e6d3","accent":"#c5a679","background":"#0f0a14","backgroundAlt":"rgba(255,255,255,0.03)","headerBg":"rgba(26,21,32,0.8)","headerText":"#f0e6d3","text":"#d4c5b0","textMuted":"#8a7960","border":"rgba(197,166,121,0.15)","tableHeadBg":"rgba(197,166,121,0.12)","tableHeadText":"#c5a679","totalBg":"#c5a679","totalText":"#0f0a14"}'::jsonb,
  true, 2, true, '{"primary":"#f0e6d3","accent":"#c5a679","background":"#0f0a14"}'::jsonb),

(gen_random_uuid(), 'moderno', 'Moderno', 'Azul · Bold', 'Classic', 'Outfit, sans-serif', 'Plus Jakarta Sans, sans-serif', 'standard',
  '{"primary":"#1e293b","accent":"#2563eb","background":"#ffffff","backgroundAlt":"#f8fafc","headerBg":"#2563eb","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#e2e8f0","tableHeadBg":"#2563eb","tableHeadText":"#ffffff","totalBg":"#2563eb","totalText":"#ffffff"}'::jsonb,
  false, 3, true, '{"primary":"#1e293b","accent":"#2563eb","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'sofisticado', 'Sofisticado', 'Sidebar · Índigo', 'Classic', 'Sora, sans-serif', 'Source Sans 3, sans-serif', 'sidebar',
  '{"primary":"#1a202c","accent":"#667eea","background":"#ffffff","backgroundAlt":"#f7fafc","headerBg":"#1a202c","headerText":"#cbd5e0","text":"#555555","textMuted":"#a0aec0","border":"#edf2f7","tableHeadBg":"#667eea","tableHeadText":"#ffffff","totalBg":"#1a202c","totalText":"#ffffff"}'::jsonb,
  false, 4, true, '{"primary":"#1a202c","accent":"#667eea","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'corporativo', 'Corporativo', 'Navy · Split', 'Classic', 'DM Sans, sans-serif', 'Plus Jakarta Sans, sans-serif', 'split',
  '{"primary":"#1f2937","accent":"#0f4c81","background":"#ffffff","backgroundAlt":"#f9fafb","headerBg":"#0f4c81","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#e5e7eb","tableHeadBg":"#0f4c81","tableHeadText":"#ffffff","totalBg":"#0f4c81","totalText":"#ffffff"}'::jsonb,
  false, 5, true, '{"primary":"#1f2937","accent":"#0f4c81","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'creativo', 'Creativo', 'Rainbow · Fun', 'Classic', 'Sora, sans-serif', 'Plus Jakarta Sans, sans-serif', 'topbar',
  '{"primary":"#1a1a2e","accent":"#f43f5e","background":"#ffffff","backgroundAlt":"#fafafa","headerBg":"#ffffff","headerText":"#1a1a2e","text":"#333333","textMuted":"#999999","border":"#f0f0f0","tableHeadBg":"#f43f5e","tableHeadText":"#ffffff","totalBg":"#f43f5e","totalText":"#ffffff"}'::jsonb,
  false, 6, true, '{"primary":"#1a1a2e","accent":"#f43f5e","background":"#ffffff"}'::jsonb),

-- Pack 2: Modern
(gen_random_uuid(), 'bold-orange', 'Bold Orange', 'Negro+Naranja', 'Modern', 'Outfit, sans-serif', 'Plus Jakarta Sans, sans-serif', 'split',
  '{"primary":"#1a1a1a","accent":"#f97316","background":"#ffffff","backgroundAlt":"#fef7f0","headerBg":"#1a1a1a","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#f0f0f0","tableHeadBg":"#1a1a1a","tableHeadText":"#ffffff","totalBg":"#f97316","totalText":"#ffffff"}'::jsonb,
  false, 7, true, '{"primary":"#1a1a1a","accent":"#f97316","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'tech-dark', 'Tech Dark', 'Dark · Violeta', 'Modern', 'Sora, sans-serif', 'Plus Jakarta Sans, sans-serif', 'flat',
  '{"primary":"#ffffff","accent":"#6366f1","background":"#0c0c14","backgroundAlt":"rgba(255,255,255,0.025)","headerBg":"#0c0c14","headerText":"#ffffff","text":"#aaaaaa","textMuted":"#555555","border":"rgba(99,102,241,0.1)","tableHeadBg":"transparent","tableHeadText":"#6366f1","totalBg":"#6366f1","totalText":"#ffffff"}'::jsonb,
  true, 8, true, '{"primary":"#ffffff","accent":"#6366f1","background":"#0c0c14"}'::jsonb),

(gen_random_uuid(), 'wave-blue', 'Wave Blue', 'Ondas · Azul', 'Modern', 'Manrope, sans-serif', 'Plus Jakarta Sans, sans-serif', 'wave',
  '{"primary":"#1e293b","accent":"#0369a1","background":"#ffffff","backgroundAlt":"#f8fafc","headerBg":"#0369a1","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#f1f5f9","tableHeadBg":"#0369a1","tableHeadText":"#ffffff","totalBg":"#0369a1","totalText":"#ffffff"}'::jsonb,
  false, 9, true, '{"primary":"#1e293b","accent":"#0369a1","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'red-accent', 'Red Accent', 'Rojo · Stripe', 'Modern', 'Urbanist, sans-serif', 'Plus Jakarta Sans, sans-serif', 'topbar',
  '{"primary":"#1f2937","accent":"#dc2626","background":"#ffffff","backgroundAlt":"#fef2f2","headerBg":"#ffffff","headerText":"#1f2937","text":"#333333","textMuted":"#999999","border":"#f3f4f6","tableHeadBg":"#ffffff","tableHeadText":"#6b7280","totalBg":"#dc2626","totalText":"#ffffff"}'::jsonb,
  false, 10, true, '{"primary":"#1f2937","accent":"#dc2626","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'geometric', 'Geometric', 'Angular', 'Modern', 'Poppins, sans-serif', 'Plus Jakarta Sans, sans-serif', 'flat',
  '{"primary":"#0f172a","accent":"#3b82f6","background":"#ffffff","backgroundAlt":"#f8fafc","headerBg":"#ffffff","headerText":"#0f172a","text":"#333333","textMuted":"#94a3b8","border":"#e2e8f0","tableHeadBg":"transparent","tableHeadText":"#94a3b8","totalBg":"#3b82f6","totalText":"#ffffff"}'::jsonb,
  false, 11, true, '{"primary":"#0f172a","accent":"#3b82f6","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'split-green', 'Split Green', 'Sidebar · Verde', 'Modern', 'Plus Jakarta Sans, sans-serif', 'Plus Jakarta Sans, sans-serif', 'sidebar',
  '{"primary":"#111111","accent":"#16a34a","background":"#ffffff","backgroundAlt":"#f0fdf4","headerBg":"#16a34a","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#e5e7eb","tableHeadBg":"#16a34a","tableHeadText":"#ffffff","totalBg":"#16a34a","totalText":"#ffffff"}'::jsonb,
  false, 12, true, '{"primary":"#111111","accent":"#16a34a","background":"#ffffff"}'::jsonb),

-- Pack 3: Executive
(gen_random_uuid(), 'swiss', 'Swiss Precision', 'Bauhaus · Grid', 'Executive', 'Inter Tight, sans-serif', 'Plus Jakarta Sans, sans-serif', 'grid',
  '{"primary":"#0a0a0a","accent":"#0a0a0a","background":"#ffffff","backgroundAlt":"#fafafa","headerBg":"#0a0a0a","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#e5e5e5","tableHeadBg":"#fafafa","tableHeadText":"#999999","totalBg":"#0a0a0a","totalText":"#ffffff"}'::jsonb,
  false, 13, true, '{"primary":"#0a0a0a","accent":"#0a0a0a","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'navy-gold', 'Navy & Gold', 'Navy · Prestige', 'Executive', 'Playfair Display, serif', 'Plus Jakarta Sans, sans-serif', 'standard',
  '{"primary":"#1b2541","accent":"#c6a367","background":"#ffffff","backgroundAlt":"#faf8f5","headerBg":"#1b2541","headerText":"#ffffff","text":"#333333","textMuted":"#b8a88a","border":"#e8e0d4","tableHeadBg":"transparent","tableHeadText":"#c6a367","totalBg":"#1b2541","totalText":"#c6a367"}'::jsonb,
  false, 14, true, '{"primary":"#1b2541","accent":"#c6a367","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'teal-exec', 'Teal Executive', 'Teal · Sobrio', 'Executive', 'IBM Plex Sans, sans-serif', 'Plus Jakarta Sans, sans-serif', 'topbar',
  '{"primary":"#0f172a","accent":"#0d9488","background":"#ffffff","backgroundAlt":"#f8fffe","headerBg":"#ffffff","headerText":"#0f172a","text":"#333333","textMuted":"#999999","border":"#e2e8f0","tableHeadBg":"transparent","tableHeadText":"#0d9488","totalBg":"#0d9488","totalText":"#ffffff"}'::jsonb,
  false, 15, true, '{"primary":"#0f172a","accent":"#0d9488","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'editorial', 'Editorial', 'Serif · Crema', 'Executive', 'Fraunces, serif', 'Plus Jakarta Sans, sans-serif', 'flat',
  '{"primary":"#1a1a1a","accent":"#1a1a1a","background":"#faf9f6","backgroundAlt":"#f5f3ee","headerBg":"#faf9f6","headerText":"#1a1a1a","text":"#333333","textMuted":"#a09880","border":"#e0ddd6","tableHeadBg":"transparent","tableHeadText":"#a09880","totalBg":"#1a1a1a","totalText":"#ffffff"}'::jsonb,
  false, 16, true, '{"primary":"#1a1a1a","accent":"#1a1a1a","background":"#faf9f6"}'::jsonb),

(gen_random_uuid(), 'monochrome', 'Monochrome', 'B/N · Gradiente', 'Executive', 'Space Grotesk, sans-serif', 'Plus Jakarta Sans, sans-serif', 'standard',
  '{"primary":"#111111","accent":"#333333","background":"#ffffff","backgroundAlt":"#fafafa","headerBg":"#333333","headerText":"#ffffff","text":"#333333","textMuted":"#999999","border":"#eeeeee","tableHeadBg":"#333333","tableHeadText":"#ffffff","totalBg":"#333333","totalText":"#ffffff"}'::jsonb,
  false, 17, true, '{"primary":"#111111","accent":"#333333","background":"#ffffff"}'::jsonb),

(gen_random_uuid(), 'dual-indigo', 'Dual Indigo', 'Índigo · Tech', 'Executive', 'Manrope, sans-serif', 'Plus Jakarta Sans, sans-serif', 'sidebar',
  '{"primary":"#1e1b4b","accent":"#6366f1","background":"#ffffff","backgroundAlt":"#f5f3ff","headerBg":"#312e81","headerText":"#ffffff","text":"#333333","textMuted":"#a5b4fc","border":"#e0e7ff","tableHeadBg":"transparent","tableHeadText":"#6366f1","totalBg":"#6366f1","totalText":"#ffffff"}'::jsonb,
  false, 18, true, '{"primary":"#1e1b4b","accent":"#6366f1","background":"#ffffff"}'::jsonb);

-- ============================================================
-- SEED DATA: 15 Tipos de Documento
-- ============================================================

INSERT INTO document_types (id, name, name_en, icon, category, description, sort_order) VALUES
-- Financiero
('factura', 'Factura', 'Invoice', '📄', 'financiero', 'Factura de servicios profesionales', 1),
('presupuesto', 'Presupuesto', 'Quote', '💰', 'financiero', 'Presupuesto / cotización de servicios', 2),
('nota-credito', 'Nota de Crédito', 'Credit Note', '↩️', 'financiero', 'Nota de crédito / ajuste', 3),
('recibo', 'Recibo de Pago', 'Payment Receipt', '🧾', 'financiero', 'Recibo de pago recibido', 4),
-- Comunicación
('carta', 'Carta Oficial', 'Official Letter', '✉️', 'comunicacion', 'Carta oficial / formal', 5),
('cease', 'Cease & Desist', 'Cease & Desist', '⚖️', 'comunicacion', 'Carta de cese y desistimiento', 6),
('acta', 'Acta de Reunión', 'Meeting Minutes', '📝', 'comunicacion', 'Acta / minuta de reunión', 7),
-- Informe
('informe', 'Informe Portfolio', 'Portfolio Report', '📊', 'informe', 'Informe de portfolio de PI', 8),
('vigilancia', 'Informe Vigilancia', 'Watch Report', '🔍', 'informe', 'Informe de vigilancia de marcas', 9),
-- Legal
('contrato', 'Contrato', 'Service Contract', '📋', 'legal', 'Contrato de servicios profesionales', 10),
('nda', 'NDA', 'NDA', '🔒', 'legal', 'Acuerdo de confidencialidad', 11),
('licencia', 'Licencia', 'License Agreement', '🤝', 'legal', 'Acuerdo de licencia de marca', 12),
('poder', 'Poder Notarial', 'Power of Attorney', '🏛️', 'legal', 'Poder de representación ante oficinas', 13),
-- IP
('certificado', 'Certificado', 'Certificate', '🏆', 'ip', 'Certificado de registro completado', 14),
('renovacion', 'Aviso Renovación', 'Renewal Notice', '🔄', 'ip', 'Aviso de renovación de marca/patente', 15)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;