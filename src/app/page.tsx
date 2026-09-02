import { products } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

export default function HomePage() {
  return (
    <section className="container-page py-8 sm:py-12">
      <div className="mb-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-clay">NEVADA</p>
          <h1 className="text-3xl font-bold tracking-normal text-ink sm:text-4xl">
            الأكثر مبيعاً
          </h1>
          <p className="mt-2 text-sm leading-7 text-stone-500">
            افحص أولاً، وادفع وأنت مطمئن
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
