-- Optional local development seed. Run after the initial migration.
insert into public.orders (
  idempotency_key,
  customer_name,
  primary_phone,
  secondary_phone,
  governorate_name,
  governorate_code,
  address,
  customer_notes,
  subtotal_iqd,
  shipping_fee_iqd,
  cod_amount_iqd,
  total_items,
  status
) values
(
  '00000000-0000-4000-8000-000000000001',
  'طلب تجريبي بغداد',
  '07812345678',
  null,
  'بغداد',
  'BGD',
  'المنصور، شارع 14 رمضان، قرب الصيدلية',
  'اتصال قبل الوصول',
  25000,
  5000,
  30000,
  1,
  'confirmed'
),
(
  '00000000-0000-4000-8000-000000000002',
  'طلب تجريبي البصرة',
  '07712345678',
  '07887654321',
  'البصرة',
  'BAS',
  'العشار، قرب الكورنيش',
  'العنوان يحتوي فاصلة، واختبار "اقتباس"',
  50000,
  5000,
  55000,
  2,
  'ready_for_shipping'
);

insert into public.order_items (
  order_id,
  product_id,
  product_name,
  color,
  size,
  quantity,
  unit_price_iqd,
  line_total_iqd
)
select id, 'model-1', 'جاكيت فراري وردي', 'وردي', 'L', 1, 25000, 25000
from public.orders
where idempotency_key = '00000000-0000-4000-8000-000000000001'
on conflict do nothing;

insert into public.order_items (
  order_id,
  product_id,
  product_name,
  color,
  size,
  quantity,
  unit_price_iqd,
  line_total_iqd
)
select id, 'model-2', 'جاكيت فراري اسود', 'أسود', 'M', 2, 25000, 50000
from public.orders
where idempotency_key = '00000000-0000-4000-8000-000000000002'
on conflict do nothing;
