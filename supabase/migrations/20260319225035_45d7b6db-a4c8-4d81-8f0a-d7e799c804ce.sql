INSERT INTO public.user_roles (user_id, role)
VALUES ('6ffb4fd0-b6bd-4844-8d69-c97cba524455', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;