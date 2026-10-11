import { describe, expect, it } from "vitest";

import { orderedProducts, products } from "../src/data/products";

describe("product catalog presentation", () => {
  it("uses the explicit RTL homepage order", () => {
    expect(orderedProducts.map((product) => product.slug)).toEqual([
      "black-ferrari-jacket",
      "bmw-jacket",
      "pink-ferrari-jacket",
      "masked-ninja-jacket",
      "barca-spider-shirt"
    ]);
  });

  it("adds the unisex label once to jackets only", () => {
    const suffix = "(نسائي ورجالي)";

    for (const product of products) {
      const occurrences = product.name.split(suffix).length - 1;
      expect(occurrences).toBe(product.category === "جاكيتات" ? 1 : 0);
    }

    expect(products.find((product) => product.slug === "barca-spider-shirt")?.name).toBe(
      "برشا سبايدر"
    );
  });
});
