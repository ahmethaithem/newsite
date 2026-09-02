export const orderStatuses = [
  "pending",
  "confirmed",
  "ready_for_shipping",
  "exported",
  "cancelled"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  color: string | null;
  size: string;
  quantity: number;
  unit_price_iqd: number;
  line_total_iqd: number;
};

export type OrderRecord = {
  id: string;
  order_number: string | null;
  idempotency_key: string | null;
  customer_name: string;
  primary_phone: string;
  secondary_phone: string | null;
  governorate_name: string;
  governorate_code: string;
  district: string | null;
  address: string;
  landmark: string | null;
  customer_notes: string | null;
  subtotal_iqd: number;
  shipping_fee_iqd: number;
  cod_amount_iqd: number;
  total_items: number;
  status: OrderStatus;
  exported: boolean;
  export_batch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderWithItems = OrderRecord & {
  order_items: OrderItemRecord[];
};

export type ExportBatchRecord = {
  id: string;
  batch_number: string;
  file_name: string;
  orders_count: number;
  csv_content: string;
  created_at: string;
};
