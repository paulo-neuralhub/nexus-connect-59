-- L107: Tabla de productos por clase Nice
CREATE TABLE IF NOT EXISTS nice_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number >= 1 AND class_number <= 45),
  name_es TEXT NOT NULL,
  name_en TEXT,
  is_common BOOLEAN DEFAULT FALSE,
  search_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por clase
CREATE INDEX IF NOT EXISTS idx_nice_products_class ON nice_products(class_number);
CREATE INDEX IF NOT EXISTS idx_nice_products_common ON nice_products(class_number, is_common) WHERE is_common = TRUE;

-- Índice GIN para búsqueda por keywords
CREATE INDEX IF NOT EXISTS idx_nice_products_keywords ON nice_products USING GIN(search_keywords);

-- RLS para acceso público (catálogo)
ALTER TABLE nice_products ENABLE ROW LEVEL SECURITY;

-- Política de solo lectura para todos (catálogo público)
CREATE POLICY "Nice products are readable by all" 
ON nice_products FOR SELECT 
USING (true);

-- Tabla para guardar selecciones detalladas en matters (opcional, para productos específicos)
-- Usamos JSONB en vez de tabla separada para simplificar
ALTER TABLE matters ADD COLUMN IF NOT EXISTS nice_classes_detail JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN matters.nice_classes_detail IS 'Detalle de productos seleccionados por clase Nice [{class: 9, products: ["software", "apps"], custom: ["mi producto"]}]';

-- Seed data: 50+ productos frecuentes en clases populares
INSERT INTO nice_products (class_number, name_es, name_en, is_common, search_keywords) VALUES
-- Clase 9 (Tecnología) - 10 productos
(9, 'Software', 'Software', true, ARRAY['programa', 'aplicación', 'app']),
(9, 'Aplicaciones móviles', 'Mobile applications', true, ARRAY['app', 'móvil', 'android', 'ios']),
(9, 'Hardware informático', 'Computer hardware', true, ARRAY['ordenador', 'computadora']),
(9, 'Smartphones', 'Smartphones', true, ARRAY['teléfono', 'móvil', 'celular']),
(9, 'Tablets', 'Tablets', true, ARRAY['tableta', 'ipad']),
(9, 'Auriculares', 'Headphones', false, ARRAY['cascos', 'audio']),
(9, 'Gafas inteligentes', 'Smart glasses', false, ARRAY['wearable', 'realidad']),
(9, 'Dispositivos IoT', 'IoT devices', false, ARRAY['internet', 'cosas', 'conectado']),
(9, 'Equipos de realidad virtual', 'VR equipment', false, ARRAY['vr', 'realidad', 'virtual']),
(9, 'Baterías', 'Batteries', false, ARRAY['energía', 'carga']),

-- Clase 25 (Ropa) - 10 productos
(25, 'Camisetas', 'T-shirts', true, ARRAY['camisas', 'tops']),
(25, 'Pantalones', 'Trousers', true, ARRAY['vaqueros', 'jeans']),
(25, 'Zapatos', 'Shoes', true, ARRAY['calzado', 'zapatillas']),
(25, 'Vestidos', 'Dresses', true, ARRAY['falda', 'ropa']),
(25, 'Chaquetas', 'Jackets', false, ARRAY['abrigo', 'cazadora']),
(25, 'Ropa deportiva', 'Sportswear', false, ARRAY['deporte', 'fitness']),
(25, 'Ropa interior', 'Underwear', false, ARRAY['lencería', 'calcetines']),
(25, 'Gorras', 'Caps', false, ARRAY['sombreros', 'accesorios']),
(25, 'Bufandas', 'Scarves', false, ARRAY['pañuelos', 'accesorios']),
(25, 'Cinturones', 'Belts', false, ARRAY['accesorios']),

-- Clase 35 (Servicios empresariales) - 10 productos
(35, 'Publicidad', 'Advertising', true, ARRAY['marketing', 'promoción']),
(35, 'Marketing digital', 'Digital marketing', true, ARRAY['online', 'redes', 'sociales']),
(35, 'Comercio electrónico', 'E-commerce', true, ARRAY['tienda', 'online', 'venta']),
(35, 'Consultoría empresarial', 'Business consulting', true, ARRAY['asesoría', 'gestión']),
(35, 'Gestión de negocios', 'Business management', false, ARRAY['administración', 'empresa']),
(35, 'Organización de eventos', 'Event organization', false, ARRAY['ferias', 'congresos']),
(35, 'Servicios de franquicia', 'Franchise services', false, ARRAY['licencia', 'negocio']),
(35, 'Outsourcing', 'Outsourcing', false, ARRAY['externalización', 'servicios']),
(35, 'Estudios de mercado', 'Market research', false, ARRAY['análisis', 'investigación']),
(35, 'Venta al por menor', 'Retail services', false, ARRAY['tienda', 'comercio']),

-- Clase 41 (Educación/Entretenimiento) - 10 productos
(41, 'Formación online', 'Online training', true, ARRAY['cursos', 'e-learning', 'educación']),
(41, 'Cursos presenciales', 'In-person courses', true, ARRAY['clases', 'formación']),
(41, 'Eventos deportivos', 'Sports events', true, ARRAY['competición', 'deporte']),
(41, 'Entretenimiento', 'Entertainment', true, ARRAY['ocio', 'diversión']),
(41, 'Publicación electrónica', 'Electronic publishing', false, ARRAY['ebooks', 'digital']),
(41, 'Producción de video', 'Video production', false, ARRAY['cine', 'audiovisual']),
(41, 'Organización de conciertos', 'Concert organization', false, ARRAY['música', 'espectáculos']),
(41, 'Servicios de gimnasio', 'Gym services', false, ARRAY['fitness', 'deporte']),
(41, 'Gaming', 'Gaming', false, ARRAY['juegos', 'videojuegos']),
(41, 'Academias', 'Academies', false, ARRAY['escuela', 'instituto']),

-- Clase 42 (Tecnología/Servicios) - 10 productos
(42, 'Desarrollo de software', 'Software development', true, ARRAY['programación', 'código']),
(42, 'SaaS', 'SaaS', true, ARRAY['software', 'servicio', 'cloud']),
(42, 'Cloud computing', 'Cloud computing', true, ARRAY['nube', 'almacenamiento']),
(42, 'Inteligencia artificial', 'Artificial intelligence', true, ARRAY['ia', 'ai', 'machine learning']),
(42, 'Diseño web', 'Web design', false, ARRAY['páginas', 'sitio']),
(42, 'Consultoría IT', 'IT consulting', false, ARRAY['tecnología', 'asesoría']),
(42, 'Ciberseguridad', 'Cybersecurity', false, ARRAY['seguridad', 'protección']),
(42, 'Hosting', 'Hosting', false, ARRAY['alojamiento', 'servidor']),
(42, 'Análisis de datos', 'Data analysis', false, ARRAY['big data', 'analytics']),
(42, 'Blockchain', 'Blockchain', false, ARRAY['crypto', 'descentralizado']),

-- Clase 43 (Hostelería) - 8 productos
(43, 'Restaurantes', 'Restaurants', true, ARRAY['comida', 'gastronomía']),
(43, 'Hoteles', 'Hotels', true, ARRAY['alojamiento', 'hospedaje']),
(43, 'Catering', 'Catering', true, ARRAY['eventos', 'comida']),
(43, 'Cafeterías', 'Cafeterias', true, ARRAY['café', 'bar']),
(43, 'Alojamiento turístico', 'Tourist accommodation', false, ARRAY['apartamento', 'hostal']),
(43, 'Servicios de bar', 'Bar services', false, ARRAY['bebidas', 'copas']),
(43, 'Comida a domicilio', 'Food delivery', false, ARRAY['delivery', 'reparto']),
(43, 'Residencias temporales', 'Temporary residences', false, ARRAY['alquiler', 'vivienda'])

ON CONFLICT DO NOTHING;