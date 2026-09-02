import Link from "next/link";

import { logoutAction } from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return (
    <section className="container-page py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:py-8">
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-clay">NEVADA ADMIN</p>
          <h1 className="text-2xl font-black text-ink">إدارة الطلبات والشحن</h1>
        </div>
        <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link
            href="/admin/orders"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
          >
            الطلبات
          </Link>
          <Link
            href="/admin/exports"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
          >
            دفعات التصدير
          </Link>
          <form action={logoutAction} className="col-span-2 sm:col-span-1">
            <button
              type="submit"
              className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              خروج
            </button>
          </form>
        </nav>
      </div>
      {children}
    </section>
  );
}
