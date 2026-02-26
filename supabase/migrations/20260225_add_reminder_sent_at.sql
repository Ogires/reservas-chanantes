ALTER TABLE public.bookings
  ADD COLUMN reminder_sent_at timestamptz;

CREATE INDEX bookings_reminder_pending_idx
  ON public.bookings(date, status)
  WHERE status = 'CONFIRMED' AND reminder_sent_at IS NULL;
