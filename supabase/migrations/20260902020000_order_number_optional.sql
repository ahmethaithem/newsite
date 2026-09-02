alter table public.orders
  alter column order_number drop not null;

alter table public.orders
  drop constraint if exists orders_order_number_key;

drop index if exists public.orders_order_number_idx;
