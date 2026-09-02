"use client";

import Image from "next/image";
import { ShoppingBag, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Product } from "@/data/products";
import { useCart, type CartItem } from "@/context/cart-context";
import { cn, formatIQD } from "@/lib/utils";

export function ProductDetailsClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [addedItem, setAddedItem] = useState<CartItem | null>(null);

  function selectedItem(): CartItem | null {
    if (!size) {
      setMessage("يرجى اختيار القياس قبل المتابعة");
      return null;
    }

    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      size,
      color: product.colors[0] ?? "",
      quantity,
      priceIQD: product.priceIQD
    };
  }

  function handleAdd() {
    const item = selectedItem();
    if (!item) {
      return;
    }

    addItem(item);
    setMessage("");
    setAddedItem(item);
  }

  function handleBuyNow() {
    const item = selectedItem();
    if (!item) {
      return;
    }

    addItem(item);
    router.push("/checkout");
  }

  return (
    <>
      <section className="container-page grid gap-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-8">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-dune shadow-soft">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 52vw, 100vw"
              loading="eager"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {product.images.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={cn(
                  "focus-ring relative aspect-square overflow-hidden rounded-md border bg-white transition",
                  activeImage === image ? "border-ink" : "border-stone-200"
                )}
                aria-label={`عرض صورة ${product.name}`}
              >
                <Image src={image} alt="" fill className="object-cover" sizes="30vw" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
          <p className="mb-2 text-sm font-semibold text-clay">{product.category}</p>
          <h1 className="text-3xl font-bold text-ink">{product.name}</h1>
          <p className="mt-3 leading-8 text-stone-600">{product.description}</p>
          <p className="mt-5 text-2xl font-black text-ink">
            {formatIQD(product.priceIQD)}
          </p>

          <div className="mt-7 space-y-5">
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-ink">القياس</legend>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((productSize) => (
                  <button
                    key={productSize}
                    type="button"
                    onClick={() => {
                      setSize(productSize);
                      setMessage("");
                    }}
                    className={cn(
                      "focus-ring h-12 min-w-14 rounded-md border px-4 text-base font-bold transition",
                      size === productSize
                        ? "border-ink bg-ink text-white"
                        : "border-stone-300 bg-white text-ink hover:border-ink"
                    )}
                  >
                    {productSize}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="mb-3 block text-sm font-bold text-ink" htmlFor="qty">
                الكمية
              </label>
              <div className="inline-flex h-12 items-center overflow-hidden rounded-md border border-stone-300 bg-white">
                <button
                  type="button"
                  className="focus-ring h-12 w-12 text-xl font-bold"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="تقليل الكمية"
                >
                  -
                </button>
                <input
                  id="qty"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, 10)))
                  }
                  className="h-12 w-16 border-x border-stone-200 text-center text-base font-bold outline-none"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="focus-ring h-12 w-12 text-xl font-bold"
                  onClick={() => setQuantity((value) => Math.min(10, value + 1))}
                  aria-label="زيادة الكمية"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAdd}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-base font-bold text-ink transition hover:border-ink active:scale-[0.99]"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                إضافة إلى السلة
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-base font-bold text-white transition hover:bg-stone-800 active:scale-[0.99]"
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                اطلب الآن
              </button>
            </div>
            <p aria-live="polite" className="min-h-6 text-sm font-bold text-clay">
              {message}
            </p>
          </div>
        </div>
      </section>

      {addedItem ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-success-title"
          onClick={() => setAddedItem(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 text-right shadow-soft sm:max-w-md sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAddedItem(null)}
              className="focus-ring absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-md border border-stone-200 text-ink transition hover:border-ink active:scale-[0.99]"
              aria-label="إغلاق النافذة"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h2 id="cart-success-title" className="pr-2 text-2xl font-black text-ink">
              تمت الإضافة إلى السلة
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr] sm:items-center">
              <div className="relative mx-auto aspect-square w-36 overflow-hidden rounded-lg bg-dune sm:w-full">
                <Image
                  src={addedItem.image}
                  alt={addedItem.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 132px, 144px"
                />
              </div>
              <div className="space-y-2 text-base leading-7">
                <p className="text-xl font-black text-ink">{addedItem.name}</p>
                <p className="font-semibold text-stone-700">القياس: {addedItem.size}</p>
                <p className="font-semibold text-stone-700">
                  الكمية: {addedItem.quantity}
                </p>
                <p className="font-black text-clay">
                  السعر: {formatIQD(addedItem.priceIQD)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="focus-ring min-h-12 rounded-md bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-stone-800 active:scale-[0.99]"
              >
                الذهاب إلى السلة
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="focus-ring min-h-12 rounded-md border border-stone-300 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-ink active:scale-[0.99]"
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
