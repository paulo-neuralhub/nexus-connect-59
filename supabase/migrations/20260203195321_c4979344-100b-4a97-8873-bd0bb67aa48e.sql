-- Limpiar membresías: mantener solo Meridian IP y empresaIP
DELETE FROM memberships 
WHERE user_id = '0090b656-5c9a-445c-91be-34228afb2b0f'
  AND organization_id NOT IN (
    'd0000001-0000-0000-0000-000000000001',  -- Meridian IP Consulting S.L.
    'c8a6c1e7-ffba-48f3-9b09-ea8cc122c683'   -- empresaIP
  );