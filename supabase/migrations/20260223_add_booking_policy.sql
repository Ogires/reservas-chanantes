ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Madrid',
  ADD COLUMN IF NOT EXISTS min_advance_minutes integer NOT NULL DEFAULT 120 CHECK (min_advance_minutes >= 0),
  ADD COLUMN IF NOT EXISTS max_advance_days integer NOT NULL DEFAULT 30 CHECK (max_advance_days >= 1);
