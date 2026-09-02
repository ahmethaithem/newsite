import { describe, expect, it } from "vitest";

import {
  getGovernorateByCode,
  getGovernorateByName,
  isGovernorateCode
} from "@/data/governorates";

describe("governorate mapping", () => {
  it("maps Baghdad and Basra to the shipping-company codes", () => {
    expect(getGovernorateByName("بغداد")?.code).toBe("BGD");
    expect(getGovernorateByName("البصرة")?.code).toBe("BAS");
  });

  it("rejects invalid governorate codes", () => {
    expect(isGovernorateCode("XYZ")).toBe(false);
    expect(getGovernorateByCode("XYZ")).toBeUndefined();
  });
});
