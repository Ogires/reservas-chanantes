alter table public.tenants add column active boolean not null default true;

create or replace function public.enforce_active_service_role_only()
returns trigger language plpgsql as $$
begin
  if new.active is distinct from old.active and auth.role() <> 'service_role' then
    raise exception 'Only the platform operator can change tenant.active';
  end if;
  return new;
end;
$$;

create trigger tenants_active_service_role_only
  before update on public.tenants
  for each row execute function public.enforce_active_service_role_only();
