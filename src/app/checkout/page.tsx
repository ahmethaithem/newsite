import type { Metadata } from "next";

import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "تثبيت الطلب"
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
