"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search, X } from "lucide-react";

import { cancelOrderAction, updateDeliveryAction } from "@/lib/admin/actions";
import { governorates } from "@/data/governorates";
import {
  getOrderExportDataIssues,
  isOrderExportEligible
} from "@/lib/csv/export-validation";
import {
  formatOrderItemSummary,
  formatOrderItemsForShippingNotes
} from "@/lib/orders/item-summary";
import type { OrderStatus, OrderWithItems } from "@/lib/orders/types";
import { cn, formatDateTime, formatIQD } from "@/lib/utils";

const statusLabels: Record<OrderStatus, string> = {
  pending: "جاهز للرفع",
  confirmed: "جاهز للرفع",
  ready_for_shipping: "جاهز للرفع",
  exported: "مرفوع",
  cancelled: "ملغي"
};

const statusFilters: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "كل الطلبات" },
  { value: "pending", label: "غير مرفوعة" },
  { value: "confirmed", label: "مؤكدة سابقاً" },
  { value: "ready_for_shipping", label: "جاهزة سابقاً" },
  { value: "exported", label: statusLabels.exported },
  { value: "cancelled", label: statusLabels.cancelled }
];

function orderTitle(order: OrderWithItems) {
  return order.customer_name.trim() || "طلب بدون اسم";
}

function orderNumberText(order: OrderWithItems) {
  return order.order_number?.trim() || "غير متوفر";
}

function orderSubtitle(order: OrderWithItems) {
  const district = order.district?.trim();
  const location = district
    ? `${order.governorate_name} - ${district}`
    : order.governorate_name;

  return `${location} - ${formatDateTime(order.created_at)}`;
}

export function AdminOrdersClient({
  orders,
  notice
}: {
  orders: OrderWithItems[];
  notice: { type: "message" | "error"; text: string } | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id ?? "");

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery =
        !needle ||
        order.customer_name.toLowerCase().includes(needle) ||
        order.primary_phone.includes(needle) ||
        order.district?.toLowerCase().includes(needle) ||
        order.address.toLowerCase().includes(needle);

      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  const eligibleFilteredIds = filteredOrders
    .filter(isOrderExportEligible)
    .map((order) => order.id);
  const activeOrder =
    filteredOrders.find((order) => order.id === activeOrderId) ??
    filteredOrders[0] ??
    null;
  const activeOrderSummary = activeOrder
    ? formatOrderItemSummary(activeOrder.order_items)
    : "";
  const activeShippingNotes = activeOrder
    ? formatOrderItemsForShippingNotes(activeOrder.order_items)
    : "";
  const allEligibleSelected =
    eligibleFilteredIds.length > 0 &&
    eligibleFilteredIds.every((id) => selectedIds.includes(id));

  function toggleSelected(order: OrderWithItems) {
    if (!isOrderExportEligible(order)) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(order.id)
        ? current.filter((id) => id !== order.id)
        : [...current, order.id]
    );
  }

  function selectAllEligible() {
    setSelectedIds(eligibleFilteredIds);
  }

  function toggleAllEligible() {
    if (allEligibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !eligibleFilteredIds.includes(id))
      );
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...eligibleFilteredIds])]);
  }

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
          ارفع ملف Excel مباشرة إلى نظام شركة التوصيل ولا تغيّر تنسيقه.
        </div>

        {notice ? (
          <div
            className={cn(
              "rounded-md border p-3 text-sm font-bold",
              notice.type === "message"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white pr-10 pl-3 text-base"
              placeholder="ابحث بالاسم أو الهاتف أو العنوان"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)}
            className="focus-ring h-12 rounded-md border border-stone-300 bg-white px-3 text-base"
            aria-label="تصفية حسب الحالة"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
            <label className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink">
              <input
                type="checkbox"
                checked={allEligibleSelected}
                disabled={eligibleFilteredIds.length === 0}
                onChange={toggleAllEligible}
                className="h-5 w-5 accent-clay disabled:opacity-40"
              />
              تحديد الكل
            </label>
            <button
              type="button"
              onClick={selectAllEligible}
              className="focus-ring min-h-11 rounded-md border border-stone-300 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink active:scale-[0.99]"
            >
              تحديد غير المرفوعة
            </button>
            <form action="/admin/orders/export" method="post">
              <input
                type="hidden"
                name="orderIds"
                value={JSON.stringify(selectedIds)}
                readOnly
              />
              <button
                type="submit"
                disabled={selectedIds.length === 0}
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                <Download className="h-4 w-4" />
                تحميل ملف Excel لشركة التوصيل
              </button>
            </form>
            <form action="/admin/orders/export" method="post">
              <input type="hidden" name="allEligible" value="1" readOnly />
              <button
                type="submit"
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-bold text-white transition hover:bg-clay/90 active:scale-[0.99]"
              >
                <Download className="h-4 w-4" />
                تحميل Excel لكل غير المرفوعة
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const eligible = isOrderExportEligible(order);
              const exportIssues = getOrderExportDataIssues(order);
              const summary = formatOrderItemSummary(order.order_items);

              return (
                <article
                  key={order.id}
                  className={cn(
                    "rounded-lg border bg-white p-4 shadow-soft transition",
                    activeOrder?.id === order.id ? "border-clay" : "border-stone-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveOrderId(order.id)}
                      className="focus-ring min-h-11 flex-1 rounded-md text-right"
                    >
                      <span className="block text-xs font-bold text-clay">
                        {statusLabels[order.status]}
                      </span>
                      <span className="block text-lg font-black text-ink">
                        {orderTitle(order)}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-stone-600" dir="ltr">
                        NEVADA: {orderNumberText(order)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-stone-500">
                        {orderSubtitle(order)}
                      </span>
                    </button>
                    <label className="flex min-h-11 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        disabled={!eligible}
                        onChange={() => toggleSelected(order)}
                        className="h-5 w-5 accent-clay disabled:opacity-40"
                      />
                      تحديد
                    </label>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
                    <p dir="ltr" className="text-right font-semibold">
                      {order.primary_phone}
                    </p>
                    <p>
                      <span className="font-bold text-ink">المحافظة: </span>
                      {order.governorate_name}
                    </p>
                    <p>
                      <span className="font-bold text-ink">المنطقة: </span>
                      {order.district?.trim() || "غير محددة"}
                    </p>
                    <p>
                      <span className="font-bold text-ink">تفاصيل العنوان: </span>
                      {order.address}
                    </p>
                    <pre className="whitespace-pre-wrap rounded-md bg-dune p-3 font-sans leading-7 text-ink">
                      {summary}
                    </pre>
                    {exportIssues.length > 0 && !order.exported ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                        {exportIssues.map((issue) => (
                          <p key={issue}>{issue}</p>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                      <span>{order.exported ? "تم الرفع" : "لم يتم الرفع"}</span>
                      <span className="text-lg font-black text-ink">
                        {formatIQD(order.cod_amount_iqd)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredOrders.length === 0 ? (
              <p className="rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-soft">
                لا توجد طلبات مطابقة.
              </p>
            ) : null}
          </div>

          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
            {activeOrder ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-clay">تفاصيل الطلب</p>
                    <h2 className="text-xl font-black text-ink">
                      {orderTitle(activeOrder)}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-stone-700" dir="ltr">
                      NEVADA: {orderNumberText(activeOrder)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-500">
                      {orderSubtitle(activeOrder)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-ink transition hover:border-ink active:scale-[0.99]"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة
                  </button>
                </div>

                <section className="rounded-md bg-dune p-4">
                  <p className="text-sm font-bold text-ink">محتويات الطلب</p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-7 text-stone-700">
                    {activeOrderSummary}
                  </pre>
                </section>

                <section className="rounded-md border border-stone-200 p-4">
                  <p className="text-sm font-bold text-ink">ملاحظات ملف Excel</p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {activeShippingNotes}
                  </p>
                </section>

                <form action={updateDeliveryAction} className="grid gap-3">
                  <input type="hidden" name="orderId" value={activeOrder.id} readOnly />
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">اسم المستلم</span>
                    <input
                      name="customerName"
                      defaultValue={activeOrder.customer_name}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-base"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">هاتف المستلم الأول</span>
                    <input
                      name="primaryPhone"
                      defaultValue={activeOrder.primary_phone}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-left text-base"
                      dir="ltr"
                      inputMode="tel"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">هاتف المستلم الثاني</span>
                    <input
                      name="secondaryPhone"
                      defaultValue={activeOrder.secondary_phone ?? ""}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-left text-base"
                      dir="ltr"
                      inputMode="tel"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">المحافظة</span>
                    <select
                      name="governorateName"
                      defaultValue={activeOrder.governorate_name}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-base"
                    >
                      {governorates.map((governorate) => (
                        <option key={governorate.code} value={governorate.name}>
                          {governorate.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">المنطقة</span>
                    <input
                      name="district"
                      defaultValue={activeOrder.district ?? ""}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-base"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">تفاصيل العنوان</span>
                    <textarea
                      name="address"
                      defaultValue={activeOrder.address}
                      className="focus-ring min-h-24 w-full rounded-md border border-stone-300 p-3 text-base"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">مبلغ الوصل د.ع</span>
                    <input
                      name="codAmountIQD"
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={activeOrder.cod_amount_iqd}
                      className="focus-ring h-12 w-full rounded-md border border-stone-300 px-3 text-base"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="focus-ring min-h-12 rounded-md bg-ink px-4 py-3 text-base font-bold text-white transition hover:bg-stone-800 active:scale-[0.99]"
                  >
                    حفظ معلومات التوصيل
                  </button>
                </form>

                <form action={cancelOrderAction}>
                  <input type="hidden" name="orderId" value={activeOrder.id} readOnly />
                  <button
                    type="submit"
                    className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 active:scale-[0.99]"
                  >
                    <X className="h-4 w-4" />
                    إلغاء الطلب
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-center text-stone-500">اختر طلباً لعرض التفاصيل.</p>
            )}
          </aside>
        </div>
      </div>

      {activeOrder ? (
        <section className="print-receipt" dir="rtl">
          <header>
            <p className="print-brand">NEVADA</p>
            <h1>وصل الطلب</h1>
            <p>{formatDateTime(activeOrder.created_at)}</p>
          </header>

          <div className="print-grid">
            <section>
              <h2>معلومات العميل</h2>
              <p dir="ltr">رقم NEVADA: {orderNumberText(activeOrder)}</p>
              <p>الاسم: {activeOrder.customer_name}</p>
              <p dir="ltr">الهاتف: {activeOrder.primary_phone}</p>
              {activeOrder.secondary_phone ? (
                <p dir="ltr">الهاتف الثاني: {activeOrder.secondary_phone}</p>
              ) : null}
              <p>المحافظة: {activeOrder.governorate_name}</p>
              <p>المنطقة: {activeOrder.district?.trim() || "غير محددة"}</p>
              <p>العنوان: {activeOrder.address}</p>
            </section>

            <section>
              <h2>محتويات الطلب</h2>
              <pre>{activeOrderSummary}</pre>
            </section>

            <section>
              <h2>ملاحظات ملف Excel</h2>
              <p>{activeShippingNotes}</p>
            </section>

            <section>
              <h2>المجموع</h2>
              <p>
                عدد القطع:{" "}
                {activeOrder.order_items.reduce(
                  (total, item) => total + item.quantity,
                  0
                )}
              </p>
              <p>المبلغ النهائي: {formatIQD(activeOrder.cod_amount_iqd)}</p>
            </section>
          </div>
        </section>
      ) : null}
    </>
  );
}
