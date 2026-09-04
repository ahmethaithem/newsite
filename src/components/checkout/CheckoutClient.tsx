"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { governorates } from "@/data/governorates";
import { shippingConfig } from "@/config/shipping";
import { useCart } from "@/context/cart-context";
import { formatIQD } from "@/lib/utils";

type FormState = {
  fullName: string;
  primaryPhone: string;
  secondaryPhone: string;
  governorateName: string;
  district: string;
  address: string;
  website: string;
};

type FieldErrors = Partial<Record<keyof Omit<FormState, "website">, string>>;

const initialFormState: FormState = {
  fullName: "",
  primaryPhone: "",
  secondaryPhone: "",
  governorateName: "",
  district: "",
  address: "",
  website: ""
};

export function CheckoutClient() {
  const router = useRouter();
  const { items, subtotalIQD, clearCart } = useCart();
  const [form, setForm] = useState(initialFormState);
  const idempotencyKeyRef = useRef("");
  const isConfirmingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [reviewError, setReviewError] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const codAmountIQD = useMemo(
    () => subtotalIQD + shippingConfig.shippingFeeIQD,
    [subtotalIQD]
  );

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "website") {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validateForm() {
    const issues: FieldErrors = {};
    const primaryPhone = form.primaryPhone.replace(/[\s-]+/g, "");
    const secondaryPhone = form.secondaryPhone.replace(/[\s-]+/g, "");

    if (form.fullName.trim().length < 2) {
      issues.fullName = "اسم المستلم مطلوب.";
    }

    if (!form.governorateName) {
      issues.governorateName = "اختر المحافظة من القائمة.";
    }

    if (!form.district.trim()) {
      issues.district = "المنطقة مطلوبة.";
    }

    if (!/^07\d{9}$/.test(primaryPhone)) {
      issues.primaryPhone = "هاتف المستلم الأول يجب أن يتكون من 11 رقماً ويبدأ بـ 07.";
    }

    if (secondaryPhone && !/^07\d{9}$/.test(secondaryPhone)) {
      issues.secondaryPhone = "هاتف المستلم الثاني غير صحيح.";
    }

    if (!form.address.trim()) {
      issues.address = "تفاصيل العنوان مطلوبة.";
    }

    return issues;
  }

  useEffect(() => {
    if (!isReviewOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isReviewOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewError("");

    if (items.length === 0) {
      setFieldErrors({});
      setReviewError("السلة فارغة. أضف منتجاً قبل تثبيت الطلب.");
      return;
    }

    const formErrors = validateForm();
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsReviewOpen(true);
  }

  async function confirmOrder() {
    if (isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;
    setReviewError("");
    setIsSubmitting(true);
    let orderAccepted = false;

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
          district: form.district,
          address: form.address,
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
        orderNumber?: string;
        message?: string;
        errors?: string[];
      };

      if (!response.ok) {
        setReviewError(
          (payload.errors ?? [payload.message ?? "تعذر تأكيد الطلب."]).join("، ")
        );
        return;
      }

      clearCart();
      orderAccepted = true;
      const successParams = new URLSearchParams({
        total: String(payload.codAmountIQD ?? codAmountIQD)
      });
      if (payload.orderNumber) {
        successParams.set("orderNumber", payload.orderNumber);
      }
      router.push(`/success?${successParams.toString()}`);
    } catch {
      setReviewError(
        "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى بدون إعادة إدخال المعلومات."
      );
    } finally {
      if (!orderAccepted) {
        isConfirmingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  function errorClass(field: keyof FieldErrors) {
    return fieldErrors[field] ? "border-red-300 bg-red-50" : "border-stone-300 bg-white";
  }

  function fieldError(field: keyof FieldErrors) {
    return fieldErrors[field] ? (
      <p className="mt-1 text-sm font-bold text-red-700">{fieldErrors[field]}</p>
    ) : null;
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
          noValidate
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
              <span className="mb-2 block text-sm font-bold text-ink">اسم المستلم</span>
              <input
                required
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className={`focus-ring h-12 w-full rounded-md border px-3 text-base ${errorClass("fullName")}`}
                autoComplete="name"
              />
              {fieldError("fullName")}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                هاتف المستلم الأول
              </span>
              <input
                required
                value={form.primaryPhone}
                onChange={(event) => updateField("primaryPhone", event.target.value)}
                className={`focus-ring h-12 w-full rounded-md border px-3 text-left text-base ${errorClass("primaryPhone")}`}
                inputMode="tel"
                dir="ltr"
                placeholder="07812345678"
                autoComplete="tel"
              />
              {fieldError("primaryPhone")}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                هاتف المستلم الثاني
              </span>
              <input
                value={form.secondaryPhone}
                onChange={(event) => updateField("secondaryPhone", event.target.value)}
                className={`focus-ring h-12 w-full rounded-md border px-3 text-left text-base ${errorClass("secondaryPhone")}`}
                inputMode="tel"
                dir="ltr"
                placeholder="اختياري"
              />
              {fieldError("secondaryPhone")}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">المحافظة</span>
              <select
                required
                value={form.governorateName}
                onChange={(event) => updateField("governorateName", event.target.value)}
                className={`focus-ring h-12 w-full rounded-md border px-3 text-base ${errorClass("governorateName")}`}
              >
                <option value="">اختر المحافظة</option>
                {governorates.map((governorate) => (
                  <option key={governorate.code} value={governorate.name}>
                    {governorate.name}
                  </option>
                ))}
              </select>
              {fieldError("governorateName")}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">المنطقة</span>
              <input
                required
                value={form.district}
                onChange={(event) => updateField("district", event.target.value)}
                className={`focus-ring h-12 w-full rounded-md border px-3 text-base ${errorClass("district")}`}
                placeholder="مثال: العامرية"
                autoComplete="address-level3"
              />
              {fieldError("district")}
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-ink">تفاصيل العنوان</span>
            <textarea
              required
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              className={`focus-ring min-h-28 w-full rounded-md border p-3 text-base ${errorClass("address")}`}
              placeholder="اكتب الشارع، أقرب نقطة دالة، ورقم الدار إن وجد"
            />
            {fieldError("address")}
          </label>

          {reviewError && !isReviewOpen ? (
            <div
              className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              role="alert"
            >
              {reviewError}
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
              <span>المجموع النهائي:</span>
              <span>{formatIQD(codAmountIQD)}</span>
            </div>
            <p className="text-xs font-semibold leading-6 text-stone-500">
              المجموع يشمل أجرة التوصيل الثابتة.
            </p>
          </div>
        </aside>
      </div>

      {isReviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-review-title"
        >
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-t-lg border border-stone-200 bg-white shadow-soft sm:max-h-[92vh] sm:rounded-lg">
            <div className="border-b border-stone-200 px-4 py-4">
              <h2 id="order-review-title" className="text-2xl font-black text-ink">
                راجع طلبك
              </h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {items.map((item) => (
                <article
                  key={`${item.productId}-${item.size}`}
                  className="grid grid-cols-[104px_1fr] gap-3 rounded-md border border-stone-200 p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-dune">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="104px"
                    />
                  </div>
                  <div className="min-w-0 break-words text-sm leading-6 text-stone-700">
                    <h3 className="text-base font-black text-ink">{item.name}</h3>
                    <p>القياس: {item.size}</p>
                    <p>الكمية: {item.quantity}</p>
                    <p>سعر القطعة: {formatIQD(item.priceIQD)}</p>
                    <p className="font-black text-clay">
                      المجموع: {formatIQD(item.priceIQD * item.quantity)}
                    </p>
                  </div>
                </article>
              ))}

              <div className="rounded-md border border-stone-200 bg-linen p-4 text-sm leading-7 text-stone-700">
                <div className="flex justify-between gap-3">
                  <span>مجموع المنتجات</span>
                  <span className="font-bold text-ink">{formatIQD(subtotalIQD)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>أجرة التوصيل</span>
                  <span className="font-bold text-ink">
                    {formatIQD(shippingConfig.shippingFeeIQD)}
                  </span>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-stone-200 pt-3 text-lg font-black text-ink">
                  <span>المجموع النهائي:</span>
                  <span>{formatIQD(codAmountIQD)}</span>
                </div>
              </div>

              {reviewError ? (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700"
                  role="alert"
                >
                  {reviewError} اضغط تأكيد الطلب للمحاولة مرة أخرى.
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-stone-200 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                disabled={isSubmitting}
                className="focus-ring min-h-12 rounded-md border border-stone-300 px-4 py-3 text-base font-bold text-ink transition hover:border-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                تعديل الطلب
              </button>
              <button
                type="button"
                onClick={confirmOrder}
                disabled={isSubmitting}
                className="focus-ring min-h-12 rounded-md bg-ink px-4 py-3 text-base font-bold text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isSubmitting ? "جاري تأكيد طلبك..." : "تأكيد الطلب"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
