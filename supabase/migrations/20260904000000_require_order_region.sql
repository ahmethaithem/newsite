alter table public.orders
  add column if not exists district text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_district_not_blank'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_district_not_blank
      check (district is null or btrim(district) <> '') not valid;
  end if;
end $$;

comment on column public.orders.district is
  'Customer-entered Arabic region used for shipping-company Excel exports.';

create or replace function public.require_orders_district_on_insert()
returns trigger
language plpgsql
as $$
begin
  if new.district is not null then
    new.district = btrim(new.district);
  end if;

  if new.district is null or new.district = '' then
    raise exception 'orders.district is required for new orders';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_require_district_on_insert on public.orders;
create trigger orders_require_district_on_insert
before insert on public.orders
for each row execute function public.require_orders_district_on_insert();
