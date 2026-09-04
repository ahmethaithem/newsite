import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import SuccessPage from "@/app/success/page";

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return collectText(props.children);
  }

  return "";
}

describe("success page", () => {
  it("shows the updated confirmation copy while preserving order details", async () => {
    const rendered = await SuccessPage({
      searchParams: Promise.resolve({
        orderNumber: "NEVADA-TEST1",
        total: "30000"
      })
    });
    const text = collectText(rendered);

    expect(text).toContain("تم استلام طلبكم بنجاح، شكراً لثقتكم بـ NEVADA");
    expect(text).toContain("راح نجهز طلبكم بكل حب ويوصلكم مثل ما تحبون");
    expect(text).toContain("NEVADA-TEST1");
    expect(text).toContain("30,000 د.ع");
    expect(text).not.toContain("تم استلام طلبك بنجاح، سنتواصل معك لإكمال التوصيل.");
  });
});
