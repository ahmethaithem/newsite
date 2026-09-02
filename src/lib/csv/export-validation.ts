import { isGovernorateCode } from "@/data/governorates";
import type { OrderStatus, OrderWithItems } from "@/lib/orders/types";

export const exportEligibleStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "ready_for_shipping"
];

export class ExportValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join("، "));
    this.name = "ExportValidationError";
  }
}

export function isOrderExportEligible(order: OrderWithItems) {
  return (
    exportEligibleStatuses.includes(order.status) &&
    !order.exported &&
    order.export_batch_id === null
  );
}

export function validateOrdersForExport(orders: OrderWithItems[]) {
  const issues: string[] = [];

  if (orders.length === 0) {
    issues.push("لا توجد طلبات مؤهلة للتصدير");
  }

  for (const order of orders) {
    const orderLabel = order.customer_name.trim()
      ? `طلب ${order.customer_name.trim()}`
      : "طلب بدون رقم";

    if (!isOrderExportEligible(order)) {
      issues.push(`${orderLabel} غير مؤهل للتصدير`);
    }

    if (!order.customer_name.trim()) {
      issues.push(`اسم المستلم مفقود في ${orderLabel}`);
    }

    if (!/^07\d{9}$/.test(order.primary_phone)) {
      issues.push(`رقم الهاتف غير صحيح في ${orderLabel}`);
    }

    if (order.secondary_phone && !/^07\d{9}$/.test(order.secondary_phone)) {
      issues.push(`رقم الهاتف الثاني غير صحيح في ${orderLabel}`);
    }

    if (!order.address.trim()) {
      issues.push(`تفاصيل العنوان غير مكتملة في ${orderLabel}`);
    }

    if (!isGovernorateCode(order.governorate_code)) {
      issues.push(`شفرة المحافظة غير صحيحة في ${orderLabel}`);
    }

    if (!Number.isInteger(order.cod_amount_iqd) || order.cod_amount_iqd < 0) {
      issues.push(`مبلغ التحصيل غير صحيح في ${orderLabel}`);
    }
  }

  if (issues.length > 0) {
    throw new ExportValidationError(issues);
  }
}
