import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/data/products";
import { formatIQD } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="focus-ring group block h-full rounded-lg"
      aria-label={`فتح تفاصيل ${product.name}`}
    >
      <article className="h-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft transition duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_22px_70px_rgba(23,21,20,0.11)] active:translate-y-0 active:scale-[0.99]">
        <div className="relative aspect-square overflow-hidden bg-dune">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            loading="eager"
          />
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-ink transition group-hover:text-clay">
            {product.name}
          </h2>
          <p className="mt-1 text-sm font-semibold text-clay">
            {formatIQD(product.priceIQD)}
          </p>
        </div>
      </article>
    </Link>
  );
}
