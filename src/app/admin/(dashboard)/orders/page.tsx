import type { Metadata } from "next";

import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { listOrders } from "@/lib/admin/data";
import { requireAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "طلبات الإدارة"
};

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams
}: AdminOrdersPageProps) {
  await requireAdminSession();
  const [orders, params] = await Promise.all([listOrders(), searchParams]);

  return (
    <AdminOrdersClient
      orders={orders}
      notice={
        params.message
          ? { type: "message", text: params.message }
          : params.error
            ? { type: "error", text: params.error }
            : null
      }
    />
  );
}
