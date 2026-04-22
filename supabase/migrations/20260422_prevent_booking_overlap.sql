-- Prevent concurrent bookings from occupying overlapping time ranges
-- for the same tenant+date. Cancelled bookings are excluded so a freed
-- slot can be re-booked.

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tenant_id with =,
    date with =,
    int4range(start_minutes, end_minutes, '[)') with &&
  )
  where (status <> 'CANCELLED');
