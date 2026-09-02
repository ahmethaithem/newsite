import type { Metadata } from "next";
import Link from "next/link";

import { formatIQD } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تم استلام الطلب"
};

type SuccessPageProps = {
  searchParams: Promise<{
    total?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { total } = await searchParams;
  const totalIQD = total ? Number.parseInt(total, 10) : null;
  const hasTotal = typeof totalIQD === "number" && Number.isFinite(totalIQD);

  return (
    <section className="container-page flex min-h-[62vh] flex-col items-center justify-center py-16 pb-[calc(4rem+env(safe-area-inset-bottom))] text-center">
      <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-soft">
        <p className="mb-3 text-sm font-bold text-olive">تم استلام طلبك بنجاح</p>
        <h1 className="mb-3 text-3xl font-black text-ink">
          تم استلام طلبك بنجاح، سنتواصل معك لإكمال التوصيل.
        </h1>
        {hasTotal ? (
          <p className="mt-3 rounded-md border border-stone-200 px-4 py-3 text-lg font-black text-ink">
            المجموع النهائي: {formatIQD(totalIQD)}
          </p>
        ) : null}
        <Link
          href="/"
          className="focus-ring mt-8 inline-flex rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          العودة إلى NEVADA
        </Link>
      </div>
    </section>
  );
}
