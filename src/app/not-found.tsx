import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 pb-[calc(4rem+env(safe-area-inset-bottom))] text-center">
      <p className="mb-3 text-sm font-semibold text-clay">404</p>
      <h1 className="mb-3 text-3xl font-bold text-ink">الصفحة غير موجودة</h1>
      <p className="mb-8 max-w-md leading-8 text-stone-600">
        الرابط الذي تحاول فتحه غير متاح حالياً. يمكنك العودة إلى المتجر ومتابعة
        التسوق.
      </p>
      <Link
        href="/"
        className="focus-ring rounded-md bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </section>
  );
}
