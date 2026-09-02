import type { Metadata } from "next";

import { loginAction } from "@/lib/admin/actions";

export const metadata: Metadata = {
  title: "دخول الإدارة"
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const message =
    error === "missing-config"
      ? "لم يتم ضبط كلمة مرور الإدارة في ملف البيئة."
      : error
        ? "كلمة المرور غير صحيحة."
        : "";

  return (
    <section className="container-page flex min-h-[62vh] items-center justify-center py-12 pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <form
        action={loginAction}
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-soft"
      >
        <p className="mb-2 text-sm font-bold text-clay">NEVADA</p>
        <h1 className="mb-6 text-2xl font-black text-ink">دخول لوحة الإدارة</h1>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">كلمة المرور</span>
          <input
            name="password"
            type="password"
            required
            className="focus-ring h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base"
            autoComplete="current-password"
          />
        </label>
        {message ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          className="focus-ring mt-6 min-h-12 w-full rounded-md bg-ink px-4 py-3 text-base font-bold text-white transition hover:bg-stone-800 active:scale-[0.99]"
        >
          دخول
        </button>
      </form>
    </section>
  );
}
