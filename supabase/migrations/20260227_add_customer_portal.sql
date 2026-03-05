-- Nuevos campos en customers
ALTER TABLE public.customers
  ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN preferred_locale text CHECK (preferred_locale IN ('es-ES', 'en-US'));

CREATE UNIQUE INDEX customers_auth_user_idx ON public.customers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Índice para consultas por customer_id en bookings
CREATE INDEX bookings_customer_idx ON public.bookings(customer_id);

-- RLS: customer puede actualizar su propio registro
CREATE POLICY "Customer update own" ON public.customers
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- RLS: customer puede actualizar status de sus propias reservas
CREATE POLICY "Customer update own bookings" ON public.bookings
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );
