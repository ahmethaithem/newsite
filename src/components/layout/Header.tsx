"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/context/cart-context";

export function Header() {
  const { totalQuantity } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-linen/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="focus-ring inline-flex min-h-11 items-center rounded-md text-2xl font-black tracking-[0.18em] text-ink"
          aria-label="NEVADA"
        >
          NEVADA
        </Link>
        <Link
          href="/cart"
          className="focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 bg-white text-ink shadow-sm transition hover:border-ink"
          aria-label={`السلة تحتوي على ${totalQuantity} قطعة`}
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -left-2 -top-2 grid min-h-6 min-w-6 place-items-center rounded-full bg-clay px-1 text-xs font-bold text-white">
            {totalQuantity}
          </span>
        </Link>
      </div>
    </header>
  );
}
