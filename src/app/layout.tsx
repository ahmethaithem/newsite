import type { Metadata } from "next";

import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/app/providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEVADA | متجر ملابس عربي",
    template: "%s | NEVADA"
  },
  description:
    "متجر NEVADA لقطع ملابس مختارة مع طلب سريع ودفع عند الاستلام داخل العراق.",
  openGraph: {
    title: "NEVADA",
    description: "أربع قطع ملابس مختارة، طلب سريع، ودفع عند الاستلام.",
    siteName: "NEVADA",
    locale: "ar_IQ",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NEVADA",
    description: "متجر ملابس بسيط وسريع بالدفع عند الاستلام."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
