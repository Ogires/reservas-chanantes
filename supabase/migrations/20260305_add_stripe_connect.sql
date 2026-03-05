-- Add Stripe Connect fields to tenants
ALTER TABLE public.tenants
  ADD COLUMN stripe_account_id text,
  ADD COLUMN stripe_account_enabled boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX tenants_stripe_account_idx
  ON public.tenants(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
