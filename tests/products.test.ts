import { describe, expect, it } from "vitest";

import {
  getProductGenderLabel,
  JACKET_GENDER_LABEL,
  orderedProducts,
  products
} from "../src/data/products";

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

  it("keeps product names clean and exposes the unisex label separately", () => {
    for (const product of products) {
      expect(product.name).not.toContain("(نسائي ورجالي)");
      expect(product.name).not.toContain(JACKET_GENDER_LABEL);
      expect(getProductGenderLabel(product)).toBe(
        product.category === "جاكيتات" ? JACKET_GENDER_LABEL : null
      );
    }

    expect(products.find((product) => product.slug === "barca-spider-shirt")?.name).toBe(
      "برشا سبايدر"
    );
  });

  it("inserts the new BMW photo second without changing the main image", () => {
    const bmw = products.find((product) => product.slug === "bmw-jacket");

    expect(bmw?.images).toEqual([
      "/products/model-5/bmw-jacket-primary-20261011.jpg",
      "/products/model-5/bmw-jacket-woman-front-20261013.jpg",
      "/products/model-5/bmw-jacket-model-front-20261011.jpg",
      "/products/model-5/bmw-jacket-model-angle-20261011.jpg",
      "/products/model-5/bmw-jacket-model-back-20261011.jpg",
      "/products/model-5/bmw-jacket-back-20261011.jpg",
      "/products/model-5/bmw-jacket-open-20261011.jpg"
    ]);
  });

  it("inserts the new Black Ferrari photos second and last", () => {
    const blackFerrari = products.find(
      (product) => product.slug === "black-ferrari-jacket"
    );

    expect(blackFerrari?.images).toEqual([
      "/products/model-2/ferrari-black-primary-20261011.jpg",
      "/products/model-2/ferrari-black-woman-studio-20261013.jpg",
      "/products/model-2/ferrari-black-model-front-20261011.jpg",
      "/products/model-2/ferrari-black-model-back-20261011.jpg",
      "/products/model-2/ferrari-black-back-20261011.jpg",
      "/products/model-2/ferrari-black-open-20261011.jpg",
      "/products/model-2/ferrari-black-woman-sofa-20261013.png"
    ]);
  });
});
