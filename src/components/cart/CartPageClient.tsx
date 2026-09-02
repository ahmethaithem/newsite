"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { shippingConfig } from "@/config/shipping";
import { useCart } from "@/context/cart-context";
import { formatIQD } from "@/lib/utils";

export function CartPageClient() {
  const { items, subtotalIQD, updateQuantity, removeItem } = useCart();
  const totalIQD = subtotalIQD + shippingConfig.shippingFeeIQD;

  if (items.length === 0) {
    return (
      <section className="container-page flex min-h-[58vh] flex-col items-center justify-center py-16 pb-[calc(4rem+env(safe-area-inset-bottom))] text-center">
        <h1 className="mb-3 text-3xl font-bold text-ink">السلة فارغة</h1>
        <p className="mb-8 text-stone-600">اختر قطعة من الأكثر مبيعاً وأكمل طلبك بسهولة.</p>
        <Link
          href="/"
          className="focus-ring rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          تصفح المنتجات
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:py-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">سلة التسوق</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={`${item.productId}-${item.size}`}
              className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-soft sm:grid-cols-[120px_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-dune sm:h-[120px] sm:w-[120px]">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="120px" />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="focus-ring rounded-md text-lg font-bold text-ink"
                >
                  {item.name}
                </Link>
                <dl className="mt-2 grid gap-1 text-sm text-stone-600">
                  <div>القياس: {item.size}</div>
                  <div>سعر القطعة: {formatIQD(item.priceIQD)}</div>
                  <div className="font-bold text-ink">
                    مجموع هذا المنتج: {formatIQD(item.priceIQD * item.quantity)}
                  </div>
                </dl>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                <div className="inline-flex h-11 overflow-hidden rounded-md border border-stone-300">
                  <button
                    type="button"
                    className="focus-ring grid h-11 w-11 place-items-center"
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="grid h-11 w-12 place-items-center border-x border-stone-200 font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="focus-ring grid h-11 w-11 place-items-center"
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 active:scale-[0.99]"
                  aria-label="حذف المنتج"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-bold text-ink">ملخص الطلب</h2>
          <div className="flex items-center justify-between border-b border-stone-200 pb-4 text-stone-600">
            <span>المجموع النهائي</span>
            <span className="font-bold text-ink">{formatIQD(totalIQD)}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-stone-500">
            الدفع نقداً عند الاستلام. المجموع يشمل أجرة التوصيل الثابتة.
          </p>
          <Link
            href="/checkout"
            className="focus-ring mt-5 block min-h-12 rounded-md bg-ink px-5 py-3 text-center text-base font-bold text-white transition hover:bg-stone-800"
          >
            إتمام الطلب
          </Link>
        </aside>
      </div>
    </section>
  );
}
