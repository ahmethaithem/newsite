import { getProductById } from "@/data/products";
import { shippingConfig } from "@/config/shipping";

export type CalculatedOrderItem = {
  productId: string;
  productName: string;
  size: string;
  color: string | null;
  quantity: number;
  unitPriceIQD: number;
  lineTotalIQD: number;
};

export type OrderCalculationInputItem = {
  productId: string;
  size: string;
  color?: string;
  quantity: number;
};

export type CalculatedOrder = {
  items: CalculatedOrderItem[];
  subtotalIQD: number;
  shippingFeeIQD: number;
  codAmountIQD: number;
  totalItems: number;
};

export class OrderCalculationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join("، "));
    this.name = "OrderCalculationError";
  }
}

export function calculateOrderTotals(
  items: OrderCalculationInputItem[]
): CalculatedOrder {
  const issues: string[] = [];
  const calculatedItems: CalculatedOrderItem[] = [];

  for (const item of items) {
    const product = getProductById(item.productId);

    if (!product || !product.available) {
      issues.push("أحد المنتجات غير متوفر");
      continue;
    }

    if (!product.sizes.includes(item.size)) {
      issues.push(`القياس المختار غير متوفر للمنتج ${product.name}`);
      continue;
    }

    const quantity = item.quantity;
    const lineTotalIQD = product.priceIQD * quantity;

    calculatedItems.push({
      productId: product.id,
      productName: product.name,
      size: item.size,
      color: product.colors[0] ?? null,
      quantity,
      unitPriceIQD: product.priceIQD,
      lineTotalIQD
    });
  }

  if (issues.length > 0) {
    throw new OrderCalculationError(issues);
  }

  const subtotalIQD = calculatedItems.reduce(
    (total, item) => total + item.lineTotalIQD,
    0
  );
  const totalItems = calculatedItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const shippingFeeIQD = shippingConfig.shippingFeeIQD;

  return {
    items: calculatedItems,
    subtotalIQD,
    shippingFeeIQD,
    codAmountIQD: subtotalIQD + shippingFeeIQD,
    totalItems
  };
}
