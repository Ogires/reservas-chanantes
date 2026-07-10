-- Cierra la fuga de PII (A01/A02): customers y bookings dejan de ser de lectura
-- pública. Los flujos anónimos/públicos legítimos (disponibilidad, creación de
-- reserva, página de éxito de pago) y el enlace de cliente por email pasan a
-- usar el service-role en la capa de servidor (bypass de RLS controlado, solo
-- en código de servidor de confianza que emite queries parametrizadas concretas).
--
-- ⚠️ ORDEN DE DESPLIEGUE: primero desplegar el CÓDIGO (enrutado a service-role),
-- DESPUÉS aplicar esta migración. Así nunca coincide una RLS restringida con
-- código antiguo que aún leyera con la clave anónima.

-- customers ----------------------------------------------------------------
drop policy if exists "Public read" on public.customers;
drop policy if exists "Public insert" on public.customers;

-- El cliente lee su propio registro (portal /my).
create policy "Customer read own" on public.customers for select
  using (auth_user_id = auth.uid());

-- El dueño del negocio lee los clientes que tienen alguna reserva con él
-- (panel admin de reservas).
create policy "Owner reads booking customers" on public.customers for select
  using (
    id in (
      select customer_id from public.bookings
      where tenant_id in (
        select id from public.tenants where owner_id = auth.uid()
      )
    )
  );
-- Se mantiene "Customer update own" (migración del portal, 20260227).

-- bookings -----------------------------------------------------------------
drop policy if exists "Public read" on public.bookings;
drop policy if exists "Public insert" on public.bookings;

-- El cliente lee sus propias reservas (portal /my).
create policy "Customer read own bookings" on public.bookings for select
  using (
    customer_id in (
      select id from public.customers where auth_user_id = auth.uid()
    )
  );
-- Se mantienen "Owner full access" (dueño del negocio) y
-- "Customer update own bookings" (migración del portal, 20260227).
