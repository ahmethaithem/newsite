import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  ExportBatchRecord,
  OrderStatus,
  OrderWithItems
} from "@/lib/orders/types";

export async function listOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OrderWithItems[];
}

export async function updateOrderDelivery(input: {
  orderId: string;
  customerName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  governorateName: string;
  governorateCode: string;
  address: string;
  customerNotes: string | null;
  codAmountIQD: number;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: input.customerName,
      primary_phone: input.primaryPhone,
      secondary_phone: input.secondaryPhone,
      governorate_name: input.governorateName,
      governorate_code: input.governorateCode,
      address: input.address,
      customer_notes: input.customerNotes,
      cod_amount_iqd: input.codAmountIQD
    })
    .eq("id", input.orderId);

  if (error) {
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      exported: status === "cancelled" ? false : undefined,
      export_batch_id: status === "cancelled" ? null : undefined
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }
}

export async function listExportBatches() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("export_batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ExportBatchRecord[];
}

export async function getExportBatch(batchId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("export_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ExportBatchRecord | null;
}
