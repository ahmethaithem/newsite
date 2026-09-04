import { getGovernorateByName } from "@/data/governorates";
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

function hasExportableStatus(order: OrderWithItems) {
  return (
    exportEligibleStatuses.includes(order.status) &&
    !order.exported &&
    order.export_batch_id === null
  );
}

export function isOrderExportEligible(order: OrderWithItems) {
  return (
    hasExportableStatus(order) &&
    getOrderExportDataIssues(order).length === 0
  );
}

export function getOrderExportDataIssues(order: OrderWithItems) {
  const issues: string[] = [];
  const totalQuantity = order.order_items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  if (!order.customer_name.trim()) {
    issues.push("اسم المستلم مفقود");
  }

  if (!getGovernorateByName(order.governorate_name)) {
    issues.push("المحافظة غير صحيحة أو مفقودة");
  }

  if (!order.district?.trim()) {
    issues.push("المنطقة مطلوبة قبل إنشاء ملف التوصيل");
  }

  if (!/^07\d{9}$/.test(order.primary_phone)) {
    issues.push("هاتف المستلم الأول غير صحيح");
  }

  if (order.secondary_phone && !/^07\d{9}$/.test(order.secondary_phone)) {
    issues.push("هاتف المستلم الثاني غير صحيح");
  }

  if (!order.address.trim()) {
    issues.push("تفاصيل العنوان مطلوبة");
  }

  if (!Number.isInteger(order.cod_amount_iqd) || order.cod_amount_iqd <= 0) {
    issues.push("مبلغ الوصل د.ع غير صحيح");
  }

  if (order.order_items.length === 0) {
    issues.push("لا توجد منتجات داخل الطلب");
  }

  if (totalQuantity <= 0) {
    issues.push("عدد القطع يجب أن يكون أكبر من صفر");
  }

  return issues;
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

    if (!hasExportableStatus(order)) {
      issues.push(`${orderLabel} غير مؤهل للتصدير`);
    }

    issues.push(
      ...getOrderExportDataIssues(order).map((issue) => `${issue} في ${orderLabel}`)
    );
  }

  if (issues.length > 0) {
    throw new ExportValidationError(issues);
  }
}
