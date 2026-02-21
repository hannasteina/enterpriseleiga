-- Setja notanda sem super_admin
-- Keyra í Supabase SQL Editor EFTIR að profiles taflan er búin til

-- Fyrst: Búa til profile fyrir notanda sem er þegar til (ef trigger var ekki til)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'hannasteina@hotmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
