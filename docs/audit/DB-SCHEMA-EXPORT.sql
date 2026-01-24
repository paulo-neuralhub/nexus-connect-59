-- IP-NEXUS — DB schema export helpers (public)
-- Objetivo: exportar inventario exhaustivo (tablas/columnas/relaciones/RLS) para documentarlo.

-- 1) Conteo total tablas/vistas/mviews
select count(*)::int as total_relations
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','v','m');

-- 2) Tablas y columnas (por tabla)
with cols as (
  select table_name,
         jsonb_agg(
           jsonb_build_object(
             'name', column_name,
             'type', data_type,
             'nullable', (is_nullable = 'YES'),
             'default', column_default
           ) order by ordinal_position
         ) as columns
  from information_schema.columns
  where table_schema='public'
  group by table_name
)
select * from cols order by table_name;

-- 3) Foreign keys (por tabla)
select tc.table_name,
       jsonb_agg(
         jsonb_build_object(
           'column', kcu.column_name,
           'references', ccu.table_name,
           'ref_column', ccu.column_name,
           'constraint', tc.constraint_name
         ) order by tc.constraint_name, kcu.ordinal_position
       ) as foreign_keys
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.table_schema='public' and tc.constraint_type='FOREIGN KEY'
group by tc.table_name
order by tc.table_name;

-- 4) RLS enabled por tabla
select n.nspname as schema,
       c.relname as table,
       c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relname;

-- 5) Policies por tabla
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
order by tablename, policyname;
