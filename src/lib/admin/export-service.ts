import "server-only";

import { createPrimeXlsxFileName, generatePrimeXlsx } from "@/lib/xlsx/prime";
import {
  ExportValidationError,
  exportEligibleStatuses,
  validateOrdersForExport
} from "@/lib/csv/export-validation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/lib/orders/types";

function formatBatchNumber(value: number) {
  return `BATCH-${String(value).padStart(4, "0")}`;
}

async function nextBatchNumber() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("export_batches")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return formatBatchNumber((count ?? 0) + 1);
}

export async function createExportBatchDownload(input: {
  orderIds: string[];
  allEligible: boolean;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("orders").select("*, order_items(*)");

  if (input.allEligible) {
    query = query
      .in("status", exportEligibleStatuses)
      .eq("exported", false)
      .is("export_batch_id", null);
  } else {
    query = query.in("id", input.orderIds);
  }

  const { data, error } = await query.order("created_at", {
    ascending: true
  });

  if (error) {
    throw error;
  }

  const orders = (data ?? []) as OrderWithItems[];
  validateOrdersForExport(orders);

  const batchNumber = await nextBatchNumber();
  const workbookBytes = await generatePrimeXlsx(orders);
  const fileName = createPrimeXlsxFileName(new Date(), batchNumber);

  const { data: batch, error: batchError } = await supabase
    .from("export_batches")
    .insert({
      batch_number: batchNumber,
      file_name: fileName,
      orders_count: orders.length,
      csv_content: workbookBytes.toString("base64")
    })
    .select("*")
    .single();

  if (batchError) {
    throw batchError;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      exported: true,
      status: "exported",
      export_batch_id: batch.id
    })
    .in(
      "id",
      orders.map((order) => order.id)
    );

  if (updateError) {
    throw updateError;
  }

  return {
    workbookBytes,
    fileName
  };
}

export function getExportErrorMessage(error: unknown) {
  if (error instanceof ExportValidationError) {
    return error.issues.join("، ");
  }

  return "تعذر إنشاء ملف Excel. يرجى المحاولة مرة أخرى.";
}
