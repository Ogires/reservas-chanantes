UPDATE public.customers SET phone = '' WHERE phone IS NULL;

ALTER TABLE public.customers
  ALTER COLUMN phone SET DEFAULT '',
  ALTER COLUMN phone SET NOT NULL;
