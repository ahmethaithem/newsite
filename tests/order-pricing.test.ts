import { describe, expect, it } from "vitest";

import { calculateOrderTotals } from "@/lib/orders/pricing";
import { checkoutInputSchema, normalizePhone } from "@/lib/orders/validation";

describe("order validation and pricing", () => {
  it("preserves the leading zero in Iraqi phone numbers", () => {
    expect(normalizePhone("0781-234 5678")).toBe("07812345678");

    const parsed = checkoutInputSchema.parse({
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      fullName: "احمد خالد",
      primaryPhone: "0781-234 5678",
      secondaryPhone: "",
      governorateName: "بغداد",
      district: "المنصور",
      address: "المنصور، شارع 14 رمضان، قرب الصيدلية",
      accuracyConfirmed: true,
      honeypot: "",
      items: [
        {
          productId: "model-1",
          size: "L",
          color: "وردي",
          quantity: 1
        }
      ]
    });

    expect(parsed.primaryPhone).toBe("07812345678");
  });

  it("recalculates order totals on the server-side product list", () => {
    const calculated = calculateOrderTotals([
      { productId: "model-1", size: "M", quantity: 2 },
      { productId: "model-2", size: "L", quantity: 1 }
    ]);

    expect(calculated.subtotalIQD).toBe(75000);
    expect(calculated.shippingFeeIQD).toBe(5000);
    expect(calculated.codAmountIQD).toBe(80000);
    expect(calculated.totalItems).toBe(3);
    expect(calculated.items[0].color).toBe("وردي");
  });

  it("accepts checkout items without a selected color", () => {
    const parsed = checkoutInputSchema.parse({
      idempotencyKey: "00000000-0000-4000-8000-000000000003",
      fullName: "علي حسين",
      primaryPhone: "07812345678",
      secondaryPhone: "",
      governorateName: "البصرة",
      district: "العشار",
      address: "العشار، شارع الوطن، قرب السوق",
      honeypot: "",
      items: [
        {
          productId: "model-2",
          size: "M",
          quantity: 1
        }
      ]
    });

    expect(parsed.items[0].color).toBe("");
    expect(parsed.district).toBe("العشار");
    expect(parsed.address).toBe("العشار، شارع الوطن، قرب السوق");
    expect(parsed.accuracyConfirmed).toBe(true);
  });

  it("requires address details in Arabic", () => {
    const parsed = checkoutInputSchema.safeParse({
      idempotencyKey: "00000000-0000-4000-8000-000000000004",
      fullName: "علي حسين",
      primaryPhone: "07812345678",
      secondaryPhone: "",
      governorateName: "البصرة",
      district: "العشار",
      address: "",
      honeypot: "",
      items: [
        {
          productId: "model-2",
          size: "M",
          quantity: 1
        }
      ]
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("تفاصيل العنوان مطلوبة");
    }
  });

  it("requires a customer-entered region", () => {
    const parsed = checkoutInputSchema.safeParse({
      idempotencyKey: "00000000-0000-4000-8000-000000000005",
      fullName: "علي حسين",
      primaryPhone: "07812345678",
      secondaryPhone: "",
      governorateName: "البصرة",
      district: "",
      address: "العشار، شارع الوطن، قرب السوق",
      honeypot: "",
      items: [
        {
          productId: "model-2",
          size: "M",
          quantity: 1
        }
      ]
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("المنطقة مطلوبة");
    }
  });
});
