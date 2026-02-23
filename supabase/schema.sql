-- Tenants (linked to auth.users)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  default_locale text not null default 'es-ES' check (default_locale in ('es-ES', 'en-US')),
  timezone text not null default 'Europe/Madrid',
  min_advance_minutes integer not null default 120 check (min_advance_minutes >= 0),
  max_advance_days integer not null default 30 check (max_advance_days >= 1),
  created_at timestamptz not null default now()
);
create unique index tenants_slug_idx on public.tenants(slug);
create unique index tenants_owner_idx on public.tenants(owner_id);

-- Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  active boolean not null default true
);
create index services_tenant_idx on public.services(tenant_id);

-- Schedules (one row per day per tenant, time_ranges as JSONB [{start, end}])
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time_ranges jsonb not null default '[]',
  unique(tenant_id, day_of_week)
);
create index schedules_tenant_idx on public.schedules(tenant_id);

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text
);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  date date not null,
  start_minutes integer not null check (start_minutes >= 0 and start_minutes < 1440),
  end_minutes integer not null check (end_minutes > 0 and end_minutes <= 1440),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  check (start_minutes < end_minutes)
);
create index bookings_tenant_date_idx on public.bookings(tenant_id, date);

-- RLS
alter table public.tenants enable row level security;
alter table public.services enable row level security;
alter table public.schedules enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;

-- Tenants: owner full access, public read
create policy "Owner full access" on public.tenants for all using (auth.uid() = owner_id);
create policy "Public read" on public.tenants for select using (true);

-- Services: owner full access, public read active
create policy "Owner full access" on public.services for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public read active" on public.services for select using (active = true);

-- Schedules: owner full access, public read
create policy "Owner full access" on public.schedules for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public read" on public.schedules for select using (true);

-- Customers: anyone can insert + read
create policy "Public insert" on public.customers for insert with check (true);
create policy "Public read" on public.customers for select using (true);

-- Bookings: owner full access, public insert + read
create policy "Owner full access" on public.bookings for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public insert" on public.bookings for insert with check (true);
create policy "Public read" on public.bookings for select using (true);
