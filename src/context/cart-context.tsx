"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { getProductById } from "@/data/products";

const cartKey = "nevada-cart-v1";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color?: string;
  quantity: number;
  priceIQD: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  subtotalIQD: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (item: CartItem, quantity: number) => void;
  removeItem: (item: CartItem) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartIdentity(item: Pick<CartItem, "productId" | "size">) {
  return `${item.productId}::${item.size}`;
}

function readStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(cartKey);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item.productId && item.size && item.quantity > 0)
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) {
          return item;
        }

        return {
          ...item,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          priceIQD: product.priceIQD,
          color: product.colors[0] ?? ""
        };
      });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setItems(readStoredCart());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [hydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const identity = cartIdentity(item);
      const existing = current.find((cartItem) => cartIdentity(cartItem) === identity);

      if (!existing) {
        return [...current, { ...item, quantity: Math.min(item.quantity, 10) }];
      }

      return current.map((cartItem) =>
        cartIdentity(cartItem) === identity
          ? {
              ...cartItem,
              quantity: Math.min(cartItem.quantity + item.quantity, 10)
            }
          : cartItem
      );
    });
  }, []);

  const updateQuantity = useCallback((item: CartItem, quantity: number) => {
    setItems((current) =>
      current
        .map((cartItem) =>
          cartIdentity(cartItem) === cartIdentity(item)
            ? { ...cartItem, quantity: Math.max(1, Math.min(quantity, 10)) }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((item: CartItem) => {
    setItems((current) =>
      current.filter((cartItem) => cartIdentity(cartItem) !== cartIdentity(item))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalIQD = items.reduce(
      (total, item) => total + item.priceIQD * item.quantity,
      0
    );

    return {
      items,
      totalQuantity,
      subtotalIQD,
      addItem,
      updateQuantity,
      removeItem,
      clearCart
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }

  return value;
}
