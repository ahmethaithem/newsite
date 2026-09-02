import type { OrderItemRecord } from "@/lib/orders/types";

const sizeRank = new Map(
  ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"].map(
    (size, index) => [size, index]
  )
);

function normalizeArabic(value: string) {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .trim()
    .toLowerCase();
}

function productNameWithoutColor(item: OrderItemRecord) {
  const productName = item.product_name.trim();
  const color = item.color?.trim();

  if (!color) {
    return productName;
  }

  const productParts = productName.split(/\s+/);
  const colorParts = color.split(/\s+/);
  if (productParts.length <= colorParts.length) {
    return productName;
  }

  const productTail = productParts.slice(-colorParts.length).join(" ");
  if (normalizeArabic(productTail) !== normalizeArabic(color)) {
    return productName;
  }

  return productParts.slice(0, -colorParts.length).join(" ");
}

function compareSizes(first: string, second: string) {
  const firstRank = sizeRank.get(first.toUpperCase());
  const secondRank = sizeRank.get(second.toUpperCase());

  if (firstRank !== undefined && secondRank !== undefined) {
    return firstRank - secondRank;
  }

  if (firstRank !== undefined) {
    return -1;
  }

  if (secondRank !== undefined) {
    return 1;
  }

  return first.localeCompare(second);
}

export function formatOrderItemSummary(items: OrderItemRecord[]) {
  const products = new Map<string, Map<string, Map<string, number>>>();

  for (const item of items) {
    const productName = productNameWithoutColor(item);
    const color = item.color?.trim() || "بدون لون";
    const productGroup = products.get(productName) ?? new Map<string, Map<string, number>>();
    const colorGroup = productGroup.get(color) ?? new Map<string, number>();

    colorGroup.set(item.size, (colorGroup.get(item.size) ?? 0) + item.quantity);
    productGroup.set(color, colorGroup);
    products.set(productName, productGroup);
  }

  return [...products.entries()]
    .map(([productName, colorGroups]) => {
      const colorLines = [...colorGroups.entries()].map(([color, sizes]) => {
        const sizeText = [...sizes.entries()]
          .sort(([first], [second]) => compareSizes(first, second))
          .map(([size, quantity]) => `${size} × ${quantity}`)
          .join("، ");

        return `${color}: ${sizeText}`;
      });

      return [productName, ...colorLines].join("\n");
    })
    .join("\n\n");
}

export function formatOrderItemsForShippingNotes(items: OrderItemRecord[]) {
  const products = new Map<string, Map<string, Map<string, number>>>();

  for (const item of items) {
    const productName = productNameWithoutColor(item);
    const color = item.color?.trim() || "";
    const productGroup = products.get(productName) ?? new Map<string, Map<string, number>>();
    const colorGroup = productGroup.get(color) ?? new Map<string, number>();

    colorGroup.set(item.size, (colorGroup.get(item.size) ?? 0) + item.quantity);
    productGroup.set(color, colorGroup);
    products.set(productName, productGroup);
  }

  return [...products.entries()]
    .map(([productName, colorGroups]) => {
      const variants = [...colorGroups.entries()]
        .flatMap(([color, sizes]) =>
          [...sizes.entries()]
            .sort(([first], [second]) => compareSizes(first, second))
            .map(([size, quantity]) => {
              const variantParts = [color, size].filter(Boolean).join(" ");

              return `${variantParts} × ${quantity}`;
            })
        )
        .join("، ");

      return variants ? `${productName} - ${variants}` : productName;
    })
    .join("؛ ");
}
