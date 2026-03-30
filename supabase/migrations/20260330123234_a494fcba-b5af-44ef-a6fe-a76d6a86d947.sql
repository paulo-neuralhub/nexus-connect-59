-- Update the description for the 'market' module in module_catalog
UPDATE public.module_catalog
SET description_es = 'Conecta con agentes IP verificados en todo el mundo. Gestiona encargos, recibe presupuestos y colabora en expedientes internacionales desde una sola plataforma. '
WHERE module_code = 'market';