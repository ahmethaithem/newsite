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

export const products: Product[] = [
  {
    id: "model-1",
    slug: "pink-ferrari-jacket",
    name: "جاكيت فراري وردي",
    description:
      "جاكيت فراري نفخ مبطن المنشأ تركي الاصلي رجالي ونسائي مناسب للاوزان من 40 الى 80",
    priceIQD: 25000,
    images: [
      "/products/model-1/ferrari-pink-main.webp",
      "/products/model-1/ferrari-pink-open.webp",
      "/products/model-1/ferrari-pink-back.webp"
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
    priceIQD: 25000,
    images: [
      "/products/model-2/ferrari-black-main.webp",
      "/products/model-2/ferrari-black-back.webp",
      "/products/model-2/ferrari-black-model-front.webp",
      "/products/model-2/ferrari-black-model-back.webp"
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
  }
];

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
