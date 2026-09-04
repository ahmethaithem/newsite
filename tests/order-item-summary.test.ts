import { describe, expect, it } from "vitest";

import {
  formatOrderItemSummary,
  formatOrderItemsForShippingNotes
} from "@/lib/orders/item-summary";
import type { OrderItemRecord } from "@/lib/orders/types";

function item(
  overrides: Partial<OrderItemRecord> & Pick<OrderItemRecord, "product_name" | "color" | "size">
): OrderItemRecord {
  return {
    id: crypto.randomUUID(),
    order_id: "11111111-1111-4111-8111-111111111111",
    product_id: "model-1",
    quantity: 1,
    unit_price_iqd: 25000,
    line_total_iqd: 25000,
    ...overrides
  };
}

describe("order item summary", () => {
  it("groups ordered variants by product, color, size, and quantity", () => {
    expect(
      formatOrderItemSummary([
        item({ product_name: "جاكيت فراري اسود", color: "أسود", size: "XL" }),
        item({ product_name: "جاكيت فراري وردي", color: "وردي", size: "L" }),
        item({ product_name: "جاكيت فراري وردي", color: "وردي", size: "XL" })
      ])
    ).toBe("جاكيت فراري\nأسود: XL × 1\nوردي: L × 1، XL × 1");
  });

  it("formats product notes for the shipping Excel notes cell", () => {
    expect(
      formatOrderItemsForShippingNotes([
        item({ product_name: "جاكيت فراري اسود", color: "أسود", size: "XL" }),
        item({ product_name: "جاكيت فراري وردي", color: "وردي", size: "L" }),
        item({ product_name: "جاكيت فراري وردي", color: "وردي", size: "XL" }),
        item({ product_name: "برشا سبايدر", color: "خمري وكحلي", size: "M" }),
        item({
          product_name: "جاكيت فراري وردي",
          color: "وردي",
          size: "L",
          quantity: 2
        })
      ])
    ).toBe(
      "جاكيت فراري اسود XL | جاكيت فراري وردي L × 3 | جاكيت فراري وردي XL | برشا سبايدر M"
    );
  });
});
