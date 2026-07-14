-- Endurece el trigger de 20260713_add_tenant_active: si `auth.role()` fuera NULL
-- (conexiones sin JWT: superusuario / SQL Editor / pooler como `postgres`), la
-- comparación `auth.role() <> 'service_role'` daba NULL y el `IF` la trataba como
-- falsa → el cambio de `active` se permitía. No es alcanzable por un dueño vía
-- PostgREST (siempre `authenticated`/`anon`), pero se cierra por defensa (fail-closed).
--
-- `create or replace function` sustituye la función en sitio; el trigger existente
-- sigue apuntando a ella (no hace falta recrear el trigger).

create or replace function public.enforce_active_service_role_only()
returns trigger language plpgsql as $$
begin
  if new.active is distinct from old.active
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only the platform operator can change tenant.active';
  end if;
  return new;
end;
$$;
