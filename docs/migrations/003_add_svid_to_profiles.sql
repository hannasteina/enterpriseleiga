-- Add svid (department access) and hlutverk (business role) to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS svid text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS hlutverk text DEFAULT 'notandi';

UPDATE public.profiles 
SET svid = ARRAY['flotaleiga', 'langtimaleiga'], hlutverk = 'stjornandi'
WHERE role = 'super_admin';

UPDATE public.profiles 
SET svid = ARRAY['flotaleiga', 'langtimaleiga'], hlutverk = 'yfirmadur'
WHERE role = 'admin' AND (svid IS NULL OR svid = ARRAY[]::text[]);
