-- Pago presencial en el centro (no excluyente con el pago online de Stripe).
-- 1) Interruptor por negocio: si admite reservas con pago en persona.
ALTER TABLE public.tenants
  ADD COLUMN allow_onsite_payment boolean NOT NULL DEFAULT false;

-- 2) Método de pago de cada reserva. Las reservas previas quedan como 'ONLINE'.
ALTER TABLE public.bookings
  ADD COLUMN payment_method text NOT NULL DEFAULT 'ONLINE'
  CHECK (payment_method IN ('ONLINE', 'ON_SITE'));
