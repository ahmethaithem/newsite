import "server-only";

import { getGovernorateByName } from "@/data/governorates";
import { calculateOrderTotals, OrderCalculationError } from "@/lib/orders/pricing";
import { checkoutInputSchema } from "@/lib/orders/validation";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export class PublicOrderError extends Error {
  constructor(public readonly messages: string[], public readonly status = 400) {
    super(messages.join("، "));
    this.name = "PublicOrderError";
  }
}

function isLegacyOrderNumberRequiredError(error: unknown) {
  const supabaseError = error as {
    code?: string;
    details?: string;
    message?: string;
  };
  const text = `${supabaseError.message ?? ""} ${supabaseError.details ?? ""}`;

  return supabaseError.code === "23502" && text.includes("order_number");
}

export async function createOrderFromCheckout(payload: unknown) {
  const parsed = checkoutInputSchema.safeParse(payload);

  if (!parsed.success) {
    throw new PublicOrderError(
      parsed.error.issues.map((issue) => issue.message)
    );
  }

  if (parsed.data.honeypot) {
    throw new PublicOrderError(["تعذر إرسال الطلب"], 422);
  }

  const governorate = getGovernorateByName(parsed.data.governorateName);
  if (!governorate) {
    throw new PublicOrderError(["اختر محافظة صحيحة من القائمة"]);
  }

  let calculated;
  try {
    calculated = calculateOrderTotals(parsed.data.items);
  } catch (error) {
    if (error instanceof OrderCalculationError) {
      throw new PublicOrderError(error.issues);
    }

    throw error;
  }

  const supabase = getSupabaseAdmin();

  const { data: existingOrder, error: existingError } = await supabase
    .from("orders")
    .select("cod_amount_iqd")
    .eq("idempotency_key", parsed.data.idempotencyKey)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingOrder) {
    return {
      codAmountIQD: existingOrder.cod_amount_iqd as number
    };
  }

  const orderValues = {
    idempotency_key: parsed.data.idempotencyKey,
    customer_name: parsed.data.fullName,
    primary_phone: parsed.data.primaryPhone,
    secondary_phone: parsed.data.secondaryPhone,
    governorate_name: governorate.name,
    governorate_code: governorate.code,
    address: parsed.data.address,
    customer_notes: parsed.data.customerNotes,
    subtotal_iqd: calculated.subtotalIQD,
    shipping_fee_iqd: calculated.shippingFeeIQD,
    cod_amount_iqd: calculated.codAmountIQD,
    total_items: calculated.totalItems,
    status: "pending"
  };
  let { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderValues)
    .select("id")
    .single();

  if (orderError && isLegacyOrderNumberRequiredError(orderError)) {
    const legacyRetry = await supabase
      .from("orders")
      .insert({
        ...orderValues,
        order_number: parsed.data.idempotencyKey
      })
      .select("id")
      .single();

    order = legacyRetry.data;
    orderError = legacyRetry.error;
  }

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    throw new Error("Order insert did not return an id.");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    calculated.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price_iqd: item.unitPriceIQD,
      line_total_iqd: item.lineTotalIQD
    }))
  );

  if (itemsError) {
    throw itemsError;
  }

  return {
    codAmountIQD: calculated.codAmountIQD
  };
}
