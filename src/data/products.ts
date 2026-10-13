export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceIQD: number;
  images: string[];
  sizes: string[];
  colors: string[];
  available: boolean;
  category: string;
};

export const JACKET_GENDER_LABEL = "(رجالي ونسائي)";

export function getProductGenderLabel(product: Product) {
  return product.category === "جاكيتات" ? JACKET_GENDER_LABEL : null;
}

const baseProducts: Product[] = [
  {
    id: "model-1",
    slug: "pink-ferrari-jacket",
    name: "جاكيت فراري وردي",
    description:
      "جاكيت فراري نفخ مبطن المنشأ تركي الاصلي رجالي ونسائي مناسب للاوزان من 40 الى 80",
    priceIQD: 30000,
    images: [
      "/products/model-1/ferrari-pink-primary-20261011.jpg",
      "/products/model-1/ferrari-pink-model-front-20261011.jpg",
      "/products/model-1/ferrari-pink-model-back-20261011.jpg",
      "/products/model-1/ferrari-pink-open-20261011.jpg"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["وردي"],
    available: true,
    category: "جاكيتات"
  },
  {
    id: "model-2",
    slug: "black-ferrari-jacket",
    name: "جاكيت فراري اسود",
    description:
      "جاكيت فراري نفخ مبطن المنشأ تركي الاصلي رجالي ونسائي مناسب للاوزان من 40 الى 80",
    priceIQD: 30000,
    images: [
      "/products/model-2/ferrari-black-primary-20261011.jpg",
      "/products/model-2/ferrari-black-woman-studio-20261013.jpg",
      "/products/model-2/ferrari-black-model-front-20261011.jpg",
      "/products/model-2/ferrari-black-model-back-20261011.jpg",
      "/products/model-2/ferrari-black-back-20261011.jpg",
      "/products/model-2/ferrari-black-open-20261011.jpg",
      "/products/model-2/ferrari-black-woman-sofa-20261013.png"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["أسود"],
    available: true,
    category: "جاكيتات"
  },
  {
    id: "model-3",
    slug: "masked-ninja-jacket",
    name: "جاكيت النينجا المقنع",
    description:
      "جاكيت قماش قطني مبطن 3 خيط  الاصلي رجالي ونسائي مناسب للاوزان من 40 الى 130 كيلو",
    priceIQD: 25000,
    images: [
      "/products/model-3/ninja-jacket-main.webp",
      "/products/model-3/ninja-jacket-detail.webp",
      "/products/model-3/ninja-jacket-gallery.webp"
    ],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["أسود"],
    available: true,
    category: "جاكيتات"
  },
  {
    id: "model-4",
    slug: "barca-spider-shirt",
    name: "برشا سبايدر",
    description: "تيشيرت قطني كوالتي عالي",
    priceIQD: 22000,
    images: [
      "/products/model-4/barca-spider-main.jpg",
      "/products/model-4/barca-spider-gallery.jpg"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["خمري وكحلي"],
    available: true,
    category: "تيشيرتات"
  },
  {
    id: "model-5",
    slug: "bmw-jacket",
    name: "جاكيت BMW",
    description:
      "جاكيت BMW بتصميم رياضي عصري وتفاصيل أنيقة، مناسب للإطلالات اليومية والستايل الشبابي.",
    priceIQD: 30000,
    images: [
      "/products/model-5/bmw-jacket-primary-20261011.jpg",
      "/products/model-5/bmw-jacket-woman-front-20261013.jpg",
      "/products/model-5/bmw-jacket-model-front-20261011.jpg",
      "/products/model-5/bmw-jacket-model-angle-20261011.jpg",
      "/products/model-5/bmw-jacket-model-back-20261011.jpg",
      "/products/model-5/bmw-jacket-back-20261011.jpg",
      "/products/model-5/bmw-jacket-open-20261011.jpg"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["كحلي"],
    available: true,
    category: "جاكيتات"
  }
];

export const products: Product[] = baseProducts;

const productDisplayOrder = [
  "black-ferrari-jacket",
  "bmw-jacket",
  "pink-ferrari-jacket",
  "masked-ninja-jacket",
  "barca-spider-shirt"
] as const;

const productDisplayRank = new Map<string, number>(
  productDisplayOrder.map((slug, index) => [slug, index])
);

export const orderedProducts = [...products].sort(
  (first, second) =>
    (productDisplayRank.get(first.slug) ?? Number.MAX_SAFE_INTEGER) -
    (productDisplayRank.get(second.slug) ?? Number.MAX_SAFE_INTEGER)
);

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
