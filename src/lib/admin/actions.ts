"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getGovernorateByName, governorates } from "@/data/governorates";
import {
  clearAdminSessionCookie,
  requireAdminSession,
  setAdminSessionCookie
} from "@/lib/admin/session";
import {
  updateOrderDelivery,
  updateOrderStatus
} from "@/lib/admin/data";
import { iraqiPhoneSchema } from "@/lib/orders/validation";

function adminRedirect(
  message: string,
  type: "message" | "error" = "message"
): never {
  redirect(`/admin/orders?${type}=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    redirect("/admin/login?error=missing-config");
  }

  if (password !== configuredPassword) {
    redirect("/admin/login?error=invalid");
  }

  await setAdminSessionCookie();
  redirect("/admin/orders");
}

export async function logoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]+/g, ""))
  .refine((value) => value === "" || /^07\d{9}$/.test(value), {
    message: "رقم الهاتف الثاني غير صحيح"
  })
  .transform((value) => (value === "" ? null : value));

const deliverySchema = z.object({
  orderId: z.string().uuid(),
  customerName: z.string().trim().min(2),
  primaryPhone: iraqiPhoneSchema,
  secondaryPhone: optionalPhoneSchema,
  governorateName: z
    .string()
    .refine(
      (value) => governorates.some((governorate) => governorate.name === value),
      "المحافظة غير صحيحة"
    ),
  address: z.string().trim().min(1, "يرجى إدخال تفاصيل العنوان"),
  customerNotes: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value)),
  codAmountIQD: z.coerce.number().int().min(0)
});

export async function updateDeliveryAction(formData: FormData) {
  await requireAdminSession();

  const parsed = deliverySchema.safeParse({
    orderId: formData.get("orderId"),
    customerName: formData.get("customerName"),
    primaryPhone: formData.get("primaryPhone"),
    secondaryPhone: formData.get("secondaryPhone"),
    governorateName: formData.get("governorateName"),
    address: formData.get("address"),
    customerNotes: formData.get("customerNotes"),
    codAmountIQD: formData.get("codAmountIQD")
  });

  if (!parsed.success) {
    adminRedirect("تعذر حفظ التعديلات. يرجى مراجعة الحقول.", "error");
  }

  const governorate = getGovernorateByName(parsed.data.governorateName);
  if (!governorate) {
    adminRedirect("المحافظة غير صحيحة.", "error");
  }

  await updateOrderDelivery({
    orderId: parsed.data.orderId,
    customerName: parsed.data.customerName,
    primaryPhone: parsed.data.primaryPhone,
    secondaryPhone: parsed.data.secondaryPhone,
    governorateName: governorate.name,
    governorateCode: governorate.code,
    address: parsed.data.address,
    customerNotes: parsed.data.customerNotes,
    codAmountIQD: parsed.data.codAmountIQD
  });
  revalidatePath("/admin/orders");
  adminRedirect("تم حفظ معلومات التوصيل.");
}

async function updateStatusFromForm(formData: FormData, status: Parameters<typeof updateOrderStatus>[1]) {
  await requireAdminSession();
  const orderId = String(formData.get("orderId") ?? "");
  if (!z.string().uuid().safeParse(orderId).success) {
    adminRedirect("الطلب غير صالح.", "error");
  }

  await updateOrderStatus(orderId, status);
  revalidatePath("/admin/orders");
}

export async function confirmOrderAction(formData: FormData) {
  await updateStatusFromForm(formData, "confirmed");
  adminRedirect("تم تأكيد الطلب.");
}

export async function readyForShippingAction(formData: FormData) {
  await updateStatusFromForm(formData, "ready_for_shipping");
  adminRedirect("تم تجهيز الطلب للشحن.");
}

export async function cancelOrderAction(formData: FormData) {
  await updateStatusFromForm(formData, "cancelled");
  adminRedirect("تم إلغاء الطلب.");
}
