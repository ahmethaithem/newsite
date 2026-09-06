import { describe, expect, it } from "vitest";

import { validateOrdersForExport } from "@/lib/csv/export-validation";
import { makeTestOrder } from "@/lib/testing/dev-orders";

describe("export eligibility", () => {
  it("rejects cancelled orders", () => {
    expect(() =>
      validateOrdersForExport([makeTestOrder({ status: "cancelled" })])
    ).toThrow(/غير مؤهل/);
  });

  it("accepts pending orders for direct export", () => {
    expect(() =>
      validateOrdersForExport([makeTestOrder({ status: "pending" })])
    ).not.toThrow();
  });

  it("prevents exporting the same order twice", () => {
    expect(() =>
      validateOrdersForExport([
        makeTestOrder({
          status: "exported",
          exported: true,
          export_batch_id: "55555555-5555-4555-8555-555555555555"
        })
      ])
    ).toThrow(/غير مؤهل/);
  });

  it("rejects orders missing the shipping region", () => {
    expect(() =>
      validateOrdersForExport([makeTestOrder({ district: null })])
    ).toThrow(/المنطقة مطلوبة/);
  });

  it("requires an Arabic governorate name instead of the old code", () => {
    expect(() =>
      validateOrdersForExport([makeTestOrder({ governorate_name: "BGD" })])
    ).toThrow(/المحافظة غير صحيحة/);
  });

  it("rejects invalid COD amounts and empty order items", () => {
    expect(() =>
      validateOrdersForExport([
        makeTestOrder({ cod_amount_iqd: 0, total_items: 0, order_items: [] })
      ])
    ).toThrow(/مبلغ الوصل د.ع غير صحيح/);
  });

  it("requires total item quantity greater than zero", () => {
    expect(() =>
      validateOrdersForExport([
        makeTestOrder({
          order_items: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              order_id: "11111111-1111-4111-8111-111111111111",
              product_id: "model-1",
              product_name: "جاكيت فراري وردي",
              color: "وردي",
              size: "L",
              quantity: 0,
              unit_price_iqd: 30000,
              line_total_iqd: 0
            }
          ]
        })
      ])
    ).toThrow(/عدد القطع/);
  });
});
