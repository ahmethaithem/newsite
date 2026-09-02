import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { listExportBatches } from "@/lib/admin/data";
import { requireAdminSession } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "دفعات التصدير"
};

export const dynamic = "force-dynamic";

export default async function AdminExportsPage() {
  await requireAdminSession();
  const batches = await listExportBatches();

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-xl font-black text-ink">دفعات التصدير السابقة</h2>
        <p className="mt-1 text-sm text-stone-600">
          يمكن إعادة تنزيل نفس الدفعة بدون إنشاء شحنات مكررة.
        </p>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {batches.map((batch) => (
          <article
            key={batch.id}
            className="rounded-lg border border-stone-200 bg-linen p-4"
          >
            <p className="text-xs font-bold text-clay">رقم الدفعة</p>
            <h3 className="text-lg font-black text-ink" dir="ltr">
              {batch.batch_number}
            </h3>
            <dl className="mt-3 grid gap-2 text-sm text-stone-700">
              <div className="flex justify-between gap-3">
                <dt>تاريخ الإنشاء</dt>
                <dd>{formatDateTime(batch.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>عدد الطلبات</dt>
                <dd className="font-bold">{batch.orders_count}</dd>
              </div>
              <div className="grid gap-1">
                <dt>اسم الملف</dt>
                <dd className="break-all font-semibold" dir="ltr">
                  {batch.file_name}
                </dd>
              </div>
            </dl>
            <Link
              href={`/admin/exports/${batch.id}/download`}
              className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800 active:scale-[0.99]"
            >
              <Download className="h-4 w-4" />
              تنزيل
            </Link>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-dune text-stone-700">
            <tr>
              <th className="p-3">رقم الدفعة</th>
              <th className="p-3">تاريخ الإنشاء</th>
              <th className="p-3">عدد الطلبات</th>
              <th className="p-3">اسم الملف</th>
              <th className="p-3">إعادة التنزيل</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t border-stone-100">
                <td className="p-3 font-black" dir="ltr">{batch.batch_number}</td>
                <td className="p-3">{formatDateTime(batch.created_at)}</td>
                <td className="p-3">{batch.orders_count}</td>
                <td className="p-3" dir="ltr">{batch.file_name}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/exports/${batch.id}/download`}
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
                  >
                    <Download className="h-4 w-4" />
                    تنزيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {batches.length === 0 ? (
        <p className="p-6 text-center text-stone-500">لا توجد دفعات تصدير حتى الآن.</p>
      ) : null}
    </div>
  );
}
