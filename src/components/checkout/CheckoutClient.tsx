"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";

import { governorates } from "@/data/governorates";
import { shippingConfig } from "@/config/shipping";
import { useCart } from "@/context/cart-context";
import { formatIQD } from "@/lib/utils";

type FormState = {
  fullName: string;
  primaryPhone: string;
  secondaryPhone: string;
  governorateName: string;
  address: string;
  customerNotes: string;
  website: string;
};

const initialFormState: FormState = {
  fullName: "",
  primaryPhone: "",
  secondaryPhone: "",
  governorateName: "",
  address: "",
  customerNotes: "",
  website: ""
};

export function CheckoutClient() {
  const router = useRouter();
  const { items, subtotalIQD, clearCart } = useCart();
  const [form, setForm] = useState(initialFormState);
  const idempotencyKeyRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const codAmountIQD = useMemo(
    () => subtotalIQD + shippingConfig.shippingFeeIQD,
    [subtotalIQD]
  );

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    if (items.length === 0) {
      setErrors(["السلة فارغة. أضف منتجاً قبل تثبيت الطلب."]);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyRef.current,
          fullName: form.fullName,
          primaryPhone: form.primaryPhone,
          secondaryPhone: form.secondaryPhone,
          governorateName: form.governorateName,
          address: form.address,
          customerNotes: form.customerNotes,
          honeypot: form.website,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity
          }))
        })
      });

      const payload = (await response.json()) as {
        codAmountIQD?: number;
        message?: string;
        errors?: string[];
      };

      if (!response.ok) {
        setErrors(payload.errors ?? [payload.message ?? "تعذر تثبيت الطلب."]);
        return;
      }

      clearCart();
      const successParams = new URLSearchParams({
        total: String(payload.codAmountIQD ?? codAmountIQD)
      });
      router.push(`/success?${successParams.toString()}`);
    } catch {
      setErrors(["تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="container-page flex min-h-[58vh] flex-col items-center justify-center py-16 pb-[calc(4rem+env(safe-area-inset-bottom))] text-center">
        <h1 className="mb-3 text-3xl font-bold text-ink">لا توجد منتجات في السلة</h1>
        <p className="mb-8 text-stone-600">أضف منتجاً أولاً ثم أكمل التثبيت.</p>
        <Link
          href="/"
          className="focus-ring rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          العودة للتسوق
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:py-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">تثبيت الطلب</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-7"
        >
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">الاسم الكامل</span>
              <input
                required
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                رقم الهاتف الأساسي
              </span>
              <input
                required
                value={form.primaryPhone}
                onChange={(event) => updateField("primaryPhone", event.target.value)}
                className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-left text-base"
                inputMode="tel"
                dir="ltr"
                placeholder="07812345678"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                رقم الهاتف الثاني
              </span>
              <input
                value={form.secondaryPhone}
                onChange={(event) => updateField("secondaryPhone", event.target.value)}
                className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-left text-base"
                inputMode="tel"
                dir="ltr"
                placeholder="اختياري"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">المحافظة</span>
              <select
                required
                value={form.governorateName}
                onChange={(event) => updateField("governorateName", event.target.value)}
                className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base"
              >
                <option value="">اختر المحافظة</option>
                {governorates.map((governorate) => (
                  <option key={governorate.code} value={governorate.name}>
                    {governorate.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-ink">تفاصيل العنوان</span>
            <textarea
              required
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              className="focus-ring min-h-28 w-full rounded-md border border-stone-300 bg-white p-3 text-base"
              placeholder="اكتب المنطقة، الشارع، وأقرب نقطة دالة"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-ink">ملاحظات العميل</span>
            <textarea
              value={form.customerNotes}
              onChange={(event) => updateField("customerNotes", event.target.value)}
              className="focus-ring min-h-24 w-full rounded-md border border-stone-300 bg-white p-3 text-base"
              placeholder="اختياري"
            />
          </label>

          {errors.length > 0 ? (
            <div
              className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              role="alert"
            >
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring mt-6 min-h-12 w-full rounded-md bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSubmitting ? "جارٍ تثبيت الطلب..." : "تثبيت الطلب"}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-bold text-ink">ملخص الطلب</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="grid grid-cols-[64px_1fr] gap-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-dune">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-ink">{item.name}</p>
                  <p className="text-stone-600">
                    القياس {item.size} × {item.quantity}
                  </p>
                  <p className="font-bold text-clay">
                    {formatIQD(item.priceIQD * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-lg font-black text-ink">
              <span>المجموع النهائي</span>
              <span>{formatIQD(codAmountIQD)}</span>
            </div>
            <p className="text-xs font-semibold leading-6 text-stone-500">
              المجموع يشمل أجرة التوصيل الثابتة.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
