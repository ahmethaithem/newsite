import type { OrderWithItems } from "@/lib/orders/types";

export function makeTestOrder(
  overrides: Partial<OrderWithItems> = {}
): OrderWithItems {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    order_number: "NEVADA-K1M02",
    idempotency_key: "00000000-0000-4000-8000-000000000001",
    customer_name: "طلب تجريبي بغداد",
    primary_phone: "07812345678",
    secondary_phone: null,
    governorate_name: "بغداد",
    governorate_code: "BGD",
    district: "المنصور",
    address: "المنصور، شارع 14 رمضان، قرب الصيدلية",
    landmark: null,
    customer_notes: "اتصال قبل الوصول",
    subtotal_iqd: 30000,
    shipping_fee_iqd: 5000,
    cod_amount_iqd: 35000,
    total_items: 1,
    status: "confirmed",
    exported: false,
    export_batch_id: null,
    created_at: "2026-09-02T00:00:00.000Z",
    updated_at: "2026-09-02T00:00:00.000Z",
    order_items: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        order_id: "11111111-1111-4111-8111-111111111111",
        product_id: "model-1",
        product_name: "جاكيت فراري وردي",
        color: "وردي",
        size: "L",
        quantity: 1,
        unit_price_iqd: 30000,
        line_total_iqd: 30000
      }
    ],
    ...overrides
  };
}

export const baghdadDevelopmentOrder = makeTestOrder();

export const basraDevelopmentOrder = makeTestOrder({
  id: "33333333-3333-4333-8333-333333333333",
  order_number: "NEVADA-A20B3",
  idempotency_key: "00000000-0000-4000-8000-000000000002",
  customer_name: "طلب تجريبي البصرة",
  primary_phone: "07712345678",
  secondary_phone: "07887654321",
  governorate_name: "البصرة",
  governorate_code: "BAS",
  district: "العشار",
  address: "العشار، قرب الكورنيش",
  landmark: null,
  customer_notes: 'العنوان يحتوي فاصلة، واختبار "اقتباس"',
  subtotal_iqd: 60000,
  shipping_fee_iqd: 5000,
  cod_amount_iqd: 65000,
  total_items: 2,
  status: "ready_for_shipping",
  order_items: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      order_id: "33333333-3333-4333-8333-333333333333",
      product_id: "model-2",
      product_name: "جاكيت فراري اسود",
      color: "أسود",
      size: "M",
      quantity: 2,
      unit_price_iqd: 30000,
      line_total_iqd: 60000
    }
  ]
});
