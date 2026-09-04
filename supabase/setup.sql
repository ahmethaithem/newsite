create extension if not exists pgcrypto;

create table if not exists public.export_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  file_name text not null,
  orders_count integer not null check (orders_count > 0),
  csv_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text,
  idempotency_key text unique,
  customer_name text not null,
  primary_phone text not null check (primary_phone ~ '^07[0-9]{9}$'),
  secondary_phone text check (
    secondary_phone is null
    or secondary_phone ~ '^07[0-9]{9}$'
  ),
  governorate_name text not null,
  governorate_code text not null,
  district text not null check (btrim(district) <> ''),
  address text not null check (btrim(address) <> ''),
  landmark text,
  customer_notes text,
  subtotal_iqd integer not null check (subtotal_iqd >= 0),
  shipping_fee_iqd integer not null default 5000 check (shipping_fee_iqd >= 0),
  cod_amount_iqd integer not null check (cod_amount_iqd >= 0),
  total_items integer not null check (total_items > 0),
  status text not null default 'pending' check (
    status in (
      'pending',
      'confirmed',
      'ready_for_shipping',
      'exported',
      'cancelled'
    )
  ),
  exported boolean not null default false,
  export_batch_id uuid references public.export_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exported_batch_consistency check (
    (exported = false and export_batch_id is null)
    or (exported = true and export_batch_id is not null)
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  color text,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price_iqd integer not null check (unit_price_iqd >= 0),
  line_total_iqd integer not null check (line_total_iqd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_exported_idx
  on public.orders(status, exported, export_batch_id);

create index if not exists orders_customer_search_idx
  on public.orders(customer_name, primary_phone);

create index if not exists orders_created_at_idx
  on public.orders(created_at desc);

create index if not exists export_batches_created_at_idx
  on public.export_batches(created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists export_batches_set_updated_at on public.export_batches;
create trigger export_batches_set_updated_at
before update on public.export_batches
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists order_items_set_updated_at on public.order_items;
create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

create or replace function public.require_orders_district_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.district = btrim(new.district);
  return new;
end;
$$;

drop trigger if exists orders_require_district_on_insert on public.orders;
create trigger orders_require_district_on_insert
before insert on public.orders
for each row execute function public.require_orders_district_on_insert();

alter table public.export_batches enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
