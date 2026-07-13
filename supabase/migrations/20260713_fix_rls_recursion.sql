-- Corrige la recursión infinita introducida por 20260710_tighten_rls_pii.
--
-- PROBLEMA: las políticas SELECT de `customers` y `bookings` se subconsultan
-- mutuamente:
--   · customers."Owner reads booking customers"  ->  subconsulta bookings
--   · bookings."Customer read own bookings"       ->  subconsulta customers
-- Además bookings."Customer update own bookings" (20260227) también subconsulta
-- customers. Cualquier lectura/escritura bajo RLS (panel del dueño, portal del
-- cliente) dispara "infinite recursion detected in policy" y revienta la página.
-- Los flujos públicos no se veían afectados porque usan el service-role (bypass).
--
-- SOLUCIÓN: una función SECURITY DEFINER resuelve el id de cliente del usuario
-- autenticado SIN pasar por la RLS de customers. Las políticas de bookings dejan
-- de subconsultar customers -> se rompe el ciclo, conservando la misma semántica.

create or replace function public.current_customer_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.customers where auth_user_id = auth.uid() limit 1
$$;

revoke all on function public.current_customer_id() from public;
grant execute on function public.current_customer_id() to anon, authenticated;

-- bookings: el cliente lee sus reservas sin subconsultar customers bajo RLS.
drop policy if exists "Customer read own bookings" on public.bookings;
create policy "Customer read own bookings" on public.bookings for select
  using ( customer_id = public.current_customer_id() );

-- bookings: el cliente cancela/actualiza sus reservas sin subconsultar customers
-- bajo RLS (misma condición, vía la función SECURITY DEFINER).
drop policy if exists "Customer update own bookings" on public.bookings;
create policy "Customer update own bookings" on public.bookings for update
  using ( customer_id = public.current_customer_id() )
  with check ( customer_id = public.current_customer_id() );
