"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ProductStatus = "active" | "archived";

export interface Product {
  id: string;
  name: string;
  initials: string;
  color: string;
  description?: string;
  status: ProductStatus;
  ownerId?: string;
  createdAt: string;
}

export const initialProducts: Product[] = [
  {
    id: "prod-core",
    name: "PM Core",
    initials: "PC",
    color: "var(--primary)",
    description: "Plataforma central de gestão de produto.",
    status: "active",
    ownerId: "AS",
    createdAt: "2025-01-10T00:00:00Z",
  },
  {
    id: "prod-insights",
    name: "Insights Hub",
    initials: "IH",
    color: "var(--purple)",
    description: "Hub de pesquisa e insights de discovery.",
    status: "active",
    ownerId: "CM",
    createdAt: "2025-03-22T00:00:00Z",
  },
  {
    id: "prod-mobile",
    name: "Mobile Companion",
    initials: "MC",
    color: "var(--warn-strong)",
    description: "App mobile companion para PMs em campo.",
    status: "active",
    ownerId: "JC",
    createdAt: "2025-06-01T00:00:00Z",
  },
];

const STORAGE_KEY = "products-store-v2";
const SELECTED_KEY = "products-selected-v1";

interface Ctx {
  products: Product[];
  activeProducts: Product[];
  currentProduct: Product;
  setCurrentProductId: (id: string) => void;
  addProduct: (input: { name: string; description?: string; ownerId?: string }) => Product;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) => void;
  archiveProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  ready: boolean;
}

const ProductsCtx = createContext<Ctx | null>(null);

const colors = [
  "var(--primary)",
  "var(--purple)",
  "var(--warn-strong)",
  "var(--cyan)",
  "var(--success)",
  "var(--danger)",
];

function makeInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PR"
  );
}

function migrate(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return initialProducts;
  return (raw as Partial<Product>[]).map((p, i) => ({
    id: p.id ?? `prod-${i}`,
    name: p.name ?? "Sem nome",
    initials: p.initials ?? makeInitials(p.name ?? "PR"),
    color: p.color ?? colors[i % colors.length],
    description: p.description ?? "",
    status: (p.status as ProductStatus) ?? "active",
    ownerId: p.ownerId,
    createdAt: p.createdAt ?? new Date().toISOString(),
  }));
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedId, setSelectedId] = useState<string>(initialProducts[0].id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProducts(migrate(JSON.parse(raw)));
      const sel = localStorage.getItem(SELECTED_KEY);
      if (sel) setSelectedId(sel);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId, ready]);

  const value = useMemo<Ctx>(() => {
    const activeProducts = products.filter((p) => p.status === "active");
    const currentProduct =
      products.find((p) => p.id === selectedId) ?? activeProducts[0] ?? products[0] ?? initialProducts[0];

    return {
      products,
      activeProducts,
      currentProduct,
      setCurrentProductId: setSelectedId,
      ready,
      addProduct: ({ name, description, ownerId }) => {
        const id = `prod-${Date.now()}`;
        const product: Product = {
          id,
          name: name.trim() || "Novo produto",
          initials: makeInitials(name),
          color: colors[products.length % colors.length],
          description: description?.trim(),
          status: "active",
          ownerId,
          createdAt: new Date().toISOString(),
        };
        setProducts((prev) => [...prev, product]);
        setSelectedId(id);
        return product;
      },
      updateProduct: (id, patch) => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  initials: patch.name ? makeInitials(patch.name) : p.initials,
                }
              : p,
          ),
        );
      },
      archiveProduct: (id) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p)));
      },
      restoreProduct: (id) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "active" } : p)));
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedId((cur) => (cur === id ? products.find((p) => p.id !== id)?.id ?? "" : cur));
      },
    };
  }, [products, selectedId, ready]);

  return <ProductsCtx.Provider value={value}>{children}</ProductsCtx.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsCtx);
  if (!ctx) throw new Error("useProducts precisa estar dentro de <ProductsProvider>");
  return ctx;
}
