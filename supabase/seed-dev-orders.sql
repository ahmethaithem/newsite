-- Optional local development seed. Run after the initial migration.
insert into public.orders (
  idempotency_key,
  order_number,
  customer_name,
  primary_phone,
  secondary_phone,
  governorate_name,
  governorate_code,
  district,
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
  'NEVADA-K1M02',
  'طلب تجريبي بغداد',
  '07812345678',
  null,
  'بغداد',
  'BGD',
  'المنصور',
  'المنصور، شارع 14 رمضان، قرب الصيدلية',
  'اتصال قبل الوصول',
  30000,
  5000,
  35000,
  1,
  'confirmed'
),
(
  '00000000-0000-4000-8000-000000000002',
  'NEVADA-A20B3',
  'طلب تجريبي البصرة',
  '07712345678',
  '07887654321',
  'البصرة',
  'BAS',
  'العشار',
  'العشار، قرب الكورنيش',
  'العنوان يحتوي فاصلة، واختبار "اقتباس"',
  60000,
  5000,
  65000,
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
select id, 'model-1', 'جاكيت فراري وردي', 'وردي', 'L', 1, 30000, 30000
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
select id, 'model-2', 'جاكيت فراري اسود', 'أسود', 'M', 2, 30000, 60000
from public.orders
where idempotency_key = '00000000-0000-4000-8000-000000000002'
on conflict do nothing;
