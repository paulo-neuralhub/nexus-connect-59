-- L109C: Seed de productos Nice para todas las clases WIPO

-- CLASE 1: Productos químicos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(1, 'Productos químicos industriales', 'Industrial chemicals', true),
(1, 'Fertilizantes', 'Fertilizers', true),
(1, 'Adhesivos industriales', 'Industrial adhesives', true),
(1, 'Productos químicos para fotografía', 'Photographic chemicals', false),
(1, 'Resinas artificiales', 'Artificial resins', false),
(1, 'Plásticos en bruto', 'Unprocessed plastics', false)
ON CONFLICT DO NOTHING;

-- CLASE 2: Pinturas y barnices
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(2, 'Pinturas', 'Paints', true),
(2, 'Esmaltes', 'Enamels', true),
(2, 'Lacas', 'Lacquers', true),
(2, 'Barnices', 'Varnishes', true),
(2, 'Colorantes', 'Colorants', false),
(2, 'Tintas de imprenta', 'Printing inks', false)
ON CONFLICT DO NOTHING;

-- CLASE 3: Cosméticos y limpieza
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(3, 'Jabones', 'Soaps', true),
(3, 'Detergentes', 'Detergents', true),
(3, 'Perfumes', 'Perfumes', true),
(3, 'Cosméticos', 'Cosmetics', true),
(3, 'Champús', 'Shampoos', true),
(3, 'Pastas dentífricas', 'Toothpastes', true),
(3, 'Aceites esenciales', 'Essential oils', false),
(3, 'Productos de maquillaje', 'Makeup products', true)
ON CONFLICT DO NOTHING;

-- CLASE 4: Combustibles y lubricantes
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(4, 'Aceites industriales', 'Industrial oils', true),
(4, 'Grasas industriales', 'Industrial greases', true),
(4, 'Combustibles', 'Fuels', true),
(4, 'Velas', 'Candles', true),
(4, 'Lubricantes', 'Lubricants', true)
ON CONFLICT DO NOTHING;

-- CLASE 5: Farmacéuticos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(5, 'Medicamentos', 'Medicines', true),
(5, 'Productos veterinarios', 'Veterinary products', true),
(5, 'Suplementos dietéticos', 'Dietary supplements', true),
(5, 'Desinfectantes', 'Disinfectants', true),
(5, 'Apósitos', 'Dressings', false),
(5, 'Productos sanitarios', 'Sanitary products', true),
(5, 'Productos farmacéuticos', 'Pharmaceutical products', true)
ON CONFLICT DO NOTHING;

-- CLASE 6: Metales comunes
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(6, 'Metales en bruto', 'Raw metals', true),
(6, 'Tuberías metálicas', 'Metal pipes', true),
(6, 'Cerraduras', 'Locks', true),
(6, 'Cajas fuertes', 'Safes', false),
(6, 'Estructuras metálicas', 'Metal structures', true)
ON CONFLICT DO NOTHING;

-- CLASE 7: Máquinas
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(7, 'Motores', 'Motors', true),
(7, 'Máquinas industriales', 'Industrial machines', true),
(7, 'Robots industriales', 'Industrial robots', true),
(7, 'Impresoras 3D industriales', '3D printers (industrial)', false),
(7, 'Máquinas agrícolas', 'Agricultural machines', false),
(7, 'Máquinas de construcción', 'Construction machines', false)
ON CONFLICT DO NOTHING;

-- CLASE 8: Herramientas manuales
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(8, 'Cuchillos', 'Knives', true),
(8, 'Tijeras', 'Scissors', true),
(8, 'Herramientas de mano', 'Hand tools', true),
(8, 'Navajas', 'Razors', false),
(8, 'Cubiertos', 'Cutlery', true)
ON CONFLICT DO NOTHING;

-- CLASE 10: Aparatos médicos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(10, 'Instrumentos quirúrgicos', 'Surgical instruments', true),
(10, 'Prótesis', 'Prostheses', true),
(10, 'Implantes', 'Implants', true),
(10, 'Aparatos terapéuticos', 'Therapeutic apparatus', true),
(10, 'Equipos de diagnóstico', 'Diagnostic equipment', true)
ON CONFLICT DO NOTHING;

-- CLASE 11: Iluminación
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(11, 'Lámparas', 'Lamps', true),
(11, 'Sistemas de calefacción', 'Heating systems', true),
(11, 'Aire acondicionado', 'Air conditioning', true),
(11, 'Sanitarios', 'Sanitary fixtures', true),
(11, 'Refrigeradores', 'Refrigerators', true)
ON CONFLICT DO NOTHING;

-- CLASE 12: Vehículos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(12, 'Coches', 'Cars', true),
(12, 'Motocicletas', 'Motorcycles', true),
(12, 'Bicicletas', 'Bicycles', true),
(12, 'Drones', 'Drones', true),
(12, 'Barcos', 'Boats', false),
(12, 'Patinetes eléctricos', 'Electric scooters', true)
ON CONFLICT DO NOTHING;

-- CLASE 14: Joyería
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(14, 'Joyas', 'Jewelry', true),
(14, 'Relojes', 'Watches', true),
(14, 'Metales preciosos', 'Precious metals', true),
(14, 'Piedras preciosas', 'Precious stones', true),
(14, 'Bisutería', 'Costume jewelry', true)
ON CONFLICT DO NOTHING;

-- CLASE 16: Papel y oficina
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(16, 'Libros', 'Books', true),
(16, 'Revistas', 'Magazines', true),
(16, 'Material de papelería', 'Stationery', true),
(16, 'Material didáctico impreso', 'Printed teaching materials', false),
(16, 'Papel', 'Paper', true)
ON CONFLICT DO NOTHING;

-- CLASE 18: Cuero
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(18, 'Bolsos', 'Bags', true),
(18, 'Carteras', 'Wallets', true),
(18, 'Maletas', 'Suitcases', true),
(18, 'Mochilas', 'Backpacks', true),
(18, 'Paraguas', 'Umbrellas', true)
ON CONFLICT DO NOTHING;

-- CLASE 20: Muebles
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(20, 'Muebles', 'Furniture', true),
(20, 'Espejos', 'Mirrors', true),
(20, 'Marcos', 'Frames', false),
(20, 'Productos de madera', 'Wood products', false),
(20, 'Colchones', 'Mattresses', true)
ON CONFLICT DO NOTHING;

-- CLASE 21: Utensilios domésticos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(21, 'Vajillas', 'Tableware', true),
(21, 'Recipientes', 'Containers', true),
(21, 'Cepillos', 'Brushes', false),
(21, 'Utensilios de cocina', 'Kitchen utensils', true)
ON CONFLICT DO NOTHING;

-- CLASE 28: Juguetes y deportes
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(28, 'Juguetes', 'Toys', true),
(28, 'Juegos de mesa', 'Board games', true),
(28, 'Videojuegos (aparatos)', 'Video game consoles', true),
(28, 'Material deportivo', 'Sports equipment', true),
(28, 'Balones', 'Balls', true)
ON CONFLICT DO NOTHING;

-- CLASE 29: Alimentos origen animal
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(29, 'Carne', 'Meat', true),
(29, 'Pescado', 'Fish', true),
(29, 'Conservas', 'Preserves', true),
(29, 'Productos lácteos', 'Dairy products', true),
(29, 'Huevos', 'Eggs', true),
(29, 'Aceites comestibles', 'Edible oils', true)
ON CONFLICT DO NOTHING;

-- CLASE 30: Alimentos origen vegetal
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(30, 'Café', 'Coffee', true),
(30, 'Té', 'Tea', true),
(30, 'Harina', 'Flour', true),
(30, 'Pan', 'Bread', true),
(30, 'Dulces', 'Sweets', true),
(30, 'Chocolate', 'Chocolate', true),
(30, 'Especias', 'Spices', true),
(30, 'Arroz', 'Rice', true),
(30, 'Pasta', 'Pasta', true)
ON CONFLICT DO NOTHING;

-- CLASE 31: Productos agrícolas
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(31, 'Frutas', 'Fruits', true),
(31, 'Verduras', 'Vegetables', true),
(31, 'Semillas', 'Seeds', true),
(31, 'Plantas', 'Plants', true),
(31, 'Flores', 'Flowers', true)
ON CONFLICT DO NOTHING;

-- CLASE 32: Bebidas sin alcohol
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(32, 'Aguas', 'Waters', true),
(32, 'Refrescos', 'Soft drinks', true),
(32, 'Zumos', 'Juices', true),
(32, 'Bebidas energéticas', 'Energy drinks', true),
(32, 'Cervezas sin alcohol', 'Non-alcoholic beers', false)
ON CONFLICT DO NOTHING;

-- CLASE 33: Bebidas alcohólicas
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(33, 'Vinos', 'Wines', true),
(33, 'Licores', 'Liquors', true),
(33, 'Bebidas espirituosas', 'Spirits', true),
(33, 'Cervezas', 'Beers', true),
(33, 'Cócteles', 'Cocktails', false)
ON CONFLICT DO NOTHING;

-- CLASE 36: Servicios financieros
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(36, 'Servicios bancarios', 'Banking services', true),
(36, 'Seguros', 'Insurance', true),
(36, 'Inversiones', 'Investments', true),
(36, 'Gestión inmobiliaria', 'Real estate management', true),
(36, 'Servicios financieros', 'Financial services', true)
ON CONFLICT DO NOTHING;

-- CLASE 37: Construcción
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(37, 'Construcción de edificios', 'Building construction', true),
(37, 'Reparaciones', 'Repairs', true),
(37, 'Instalaciones', 'Installations', true),
(37, 'Mantenimiento', 'Maintenance', true)
ON CONFLICT DO NOTHING;

-- CLASE 38: Telecomunicaciones
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(38, 'Telefonía', 'Telephony', true),
(38, 'Servicios de internet', 'Internet services', true),
(38, 'Transmisión de datos', 'Data transmission', true),
(38, 'Mensajería', 'Messaging', true),
(38, 'Streaming', 'Streaming', true)
ON CONFLICT DO NOTHING;

-- CLASE 39: Transporte
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(39, 'Transporte de mercancías', 'Freight transport', true),
(39, 'Transporte de pasajeros', 'Passenger transport', true),
(39, 'Almacenamiento', 'Storage', true),
(39, 'Logística', 'Logistics', true)
ON CONFLICT DO NOTHING;

-- CLASE 40: Tratamiento de materiales
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(40, 'Tratamiento de materiales', 'Material treatment', true),
(40, 'Reciclaje', 'Recycling', true),
(40, 'Impresión', 'Printing', true)
ON CONFLICT DO NOTHING;

-- CLASE 44: Servicios médicos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(44, 'Servicios médicos', 'Medical services', true),
(44, 'Servicios veterinarios', 'Veterinary services', true),
(44, 'Clínicas', 'Clinics', true),
(44, 'Terapias', 'Therapies', true),
(44, 'Servicios de estética', 'Beauty services', true)
ON CONFLICT DO NOTHING;

-- CLASE 45: Servicios jurídicos
INSERT INTO nice_products (class_number, name_es, name_en, is_common) VALUES
(45, 'Servicios legales', 'Legal services', true),
(45, 'Servicios de seguridad', 'Security services', true),
(45, 'Investigación privada', 'Private investigation', false),
(45, 'Gestión de licencias', 'License management', false)
ON CONFLICT DO NOTHING;