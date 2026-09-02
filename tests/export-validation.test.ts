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
});
