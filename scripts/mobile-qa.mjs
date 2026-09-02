import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

import { chromium } from "playwright-core";

const widths = [360, 375, 390, 414, 430];
const height = 900;
const baseUrl = "http://127.0.0.1:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cartItem = {
  productId: "model-1",
  slug: "pink-ferrari-jacket",
  name: "جاكيت فراري وردي",
  image: "/products/model-1/ferrari-pink-main.webp",
  size: "M",
  quantity: 1,
  priceIQD: 25000
};

const pages = [
  { path: "/", name: "home" },
  {
    path: "/products/pink-ferrari-jacket",
    name: "product-pink-ferrari-jacket",
    product: true
  },
  {
    path: "/products/black-ferrari-jacket",
    name: "product-black-ferrari-jacket",
    product: true
  },
  {
    path: "/products/masked-ninja-jacket",
    name: "product-masked-ninja-jacket",
    product: true
  },
  {
    path: "/products/barca-spider-shirt",
    name: "product-barca-spider-shirt",
    product: true
  },
  { path: "/cart", name: "cart", withCart: true },
  { path: "/checkout", name: "checkout", withCart: true },
  { path: "/success?total=30000", name: "success" },
  { path: "/missing-page-for-mobile-qa", name: "not-found" },
  { path: "/admin", name: "admin-index-auth-redirect" },
  { path: "/admin/login", name: "admin-login" },
  { path: "/admin/orders", name: "admin-orders-auth-redirect" },
  { path: "/admin/exports", name: "admin-exports-auth-redirect" }
];

async function serverReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await serverReady()) {
    return null;
  }

  const child = spawn("npm.cmd", ["run", "dev"], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: false,
    windowsHide: true
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await serverReady()) {
      return child;
    }

    await wait(500);
  }

  child.kill();
  throw new Error("Local development server did not become ready.");
}

function assertNoSmallTouchTargets(targets, pageName, width) {
  const smallTargets = targets.filter((target) => target.width < 44 || target.height < 44);
  if (smallTargets.length > 0) {
    throw new Error(
      `${pageName} at ${width}px has touch targets below 44px: ${smallTargets
        .map((target) => `${target.label || target.tag}:${target.width}x${target.height}`)
        .join(", ")}`
    );
  }
}

const devServer = await ensureServer();
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true
});

try {
  const context = await browser.newContext({
    locale: "ar-IQ",
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const failures = [];

  for (const width of widths) {
    await page.setViewportSize({ width, height });

    for (const target of pages) {
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
      if (target.withCart) {
        await page.evaluate((item) => {
          localStorage.setItem("nevada-cart-v1", JSON.stringify([item]));
        }, cartItem);
        await page.reload({ waitUntil: "networkidle" });
      } else {
        await page.evaluate(() => localStorage.removeItem("nevada-cart-v1"));
      }

      const result = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const interactive = [
          ...document.querySelectorAll("button, input:not([type='hidden']):not([type='checkbox']):not([type='radio']), select, textarea")
        ];
        const productLinks = [...document.querySelectorAll('a[href^="/products/"]')];

        return {
          scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
          clientWidth: doc.clientWidth,
          colorSelectorVisible: Boolean(
            [...document.querySelectorAll("legend, span, label, button")].find(
              (node) => node.textContent?.trim() === "اللون"
            )
          ),
          homeButtonsVisible: [...document.querySelectorAll("button, a")].some((node) => {
            const text = node.textContent?.trim() ?? "";
            return text.includes("إضافة إلى السلة") || text.includes("اطلب الآن");
          }),
          inputsTooSmall: [...document.querySelectorAll("input:not([type='hidden']), select, textarea")]
            .map((node) => ({
              tag: node.tagName.toLowerCase(),
              size: Number.parseFloat(getComputedStyle(node).fontSize)
            }))
            .filter((item) => item.size < 16),
          productLinks: productLinks.map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              href: node.getAttribute("href"),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          }),
          touchTargets: interactive
            .map((node) => {
              const rect = node.getBoundingClientRect();
              return {
                tag: node.tagName.toLowerCase(),
                label:
                  node.getAttribute("aria-label") ||
                  node.textContent?.trim().slice(0, 32) ||
                  node.getAttribute("name") ||
                  "",
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              };
            })
            .filter((target) => target.width > 0 && target.height > 0)
        };
      });

      if (result.scrollWidth > result.clientWidth) {
        failures.push(
          `${target.name} at ${width}px scrolls horizontally (${result.scrollWidth} > ${result.clientWidth})`
        );
      }

      if (target.product && result.colorSelectorVisible) {
        failures.push(`product page at ${width}px still shows a color selector label`);
      }

      if (target.name === "home" && result.homeButtonsVisible) {
        failures.push(`home page at ${width}px still shows product action buttons`);
      }

      if (result.inputsTooSmall.length > 0) {
        failures.push(
          `${target.name} at ${width}px has inputs under 16px: ${JSON.stringify(
            result.inputsTooSmall
          )}`
        );
      }

      try {
        assertNoSmallTouchTargets(result.touchTargets, target.name, width);
      } catch (error) {
        failures.push(error.message);
      }

      if (target.name === "home") {
        const compactProductLink = result.productLinks.find(
          (link) => link.width < 44 || link.height < 44
        );
        if (compactProductLink) {
          failures.push(
            `home page at ${width}px has a product card link below 44px: ${JSON.stringify(
              compactProductLink
            )}`
          );
        }
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }

  console.log(
    `Mobile QA passed for ${pages.length} routes at widths ${widths.join(", ")}.`
  );
} finally {
  await browser.close();
  if (devServer) {
    devServer.kill();
  }
}
