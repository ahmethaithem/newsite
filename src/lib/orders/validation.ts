import { z } from "zod";

import { governorates } from "@/data/governorates";

export function normalizePhone(phone: string) {
  return phone.replace(/[\s-]+/g, "");
}

export const iraqiPhoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((phone) => /^07\d{9}$/.test(phone), {
    message: "يرجى إدخال رقم عراقي صحيح مكون من 11 رقماً ويبدأ بـ 07"
  });

const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((phone) => normalizePhone(phone))
  .refine((phone) => phone === "" || /^07\d{9}$/.test(phone), {
    message: "رقم الهاتف الثاني غير صحيح"
  })
  .transform((phone) => (phone === "" ? null : phone));

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "المنتج غير معروف"),
  size: z.string().min(1, "اختر القياس"),
  color: z.string().optional().default(""),
  quantity: z.coerce
    .number()
    .int("الكمية يجب أن تكون رقماً صحيحاً")
    .min(1, "أقل كمية هي 1")
    .max(10, "أقصى كمية لكل قطعة هي 10")
});

export const checkoutInputSchema = z.object({
  idempotencyKey: z.string().uuid("رمز الطلب غير صالح"),
  fullName: z.string().trim().min(2, "اسم المستلم مطلوب"),
  primaryPhone: iraqiPhoneSchema,
  secondaryPhone: optionalPhoneSchema,
  governorateName: z
    .string()
    .trim()
    .refine(
      (name) => governorates.some((governorate) => governorate.name === name),
      "اختر محافظة صحيحة من القائمة"
    ),
  district: z.string().trim().min(1, "المنطقة مطلوبة"),
  address: z.string().trim().min(1, "تفاصيل العنوان مطلوبة"),
  customerNotes: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => (value === "" ? null : value)),
  accuracyConfirmed: z.boolean().optional().default(true),
  honeypot: z.string().max(0, "تعذر إرسال الطلب").optional().default(""),
  items: z.array(checkoutItemSchema).min(1, "السلة فارغة")
});

export type CheckoutItemInput = z.input<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
