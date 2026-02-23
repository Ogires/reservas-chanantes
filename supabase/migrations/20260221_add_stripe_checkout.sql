ALTER TABLE public.bookings
  ADD COLUMN stripe_checkout_session_id text;

CREATE INDEX bookings_stripe_session_idx
  ON public.bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
