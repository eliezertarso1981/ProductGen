"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type ApiProduct,
  createProductInApi,
  deleteProductInApi,
  isProductgenApiConfigured,
  listProductsFromApi,
  updateProductInApi,
} from "./productgen-api";

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
  isRemoteBacked: boolean;
  syncError?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringFromMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

function statusFromMetadata(metadata: Record<string, unknown>): ProductStatus {
  return metadata.status === "archived" ? "archived" : "active";
}

function productMetadata(product: Product): Record<string, unknown> {
  return {
    initials: product.initials,
    color: product.color,
    description: product.description ?? "",
    status: product.status,
    ownerId: product.ownerId,
  };
}

function fromApiProduct(product: ApiProduct, index: number): Product {
  const metadata = isRecord(product.metadata) ? product.metadata : {};
  const description = stringFromMetadata(metadata, "description") ?? product.vision ?? "";

  return {
    id: product.id,
    name: product.name,
    initials: stringFromMetadata(metadata, "initials") ?? makeInitials(product.name),
    color: stringFromMetadata(metadata, "color") ?? colors[index % colors.length],
    description,
    status: statusFromMetadata(metadata),
    ownerId: stringFromMetadata(metadata, "ownerId"),
    createdAt: product.created_at,
  };
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
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();

  useEffect(() => {
    let cancelled = false;

    function loadLocalProducts() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setProducts(migrate(JSON.parse(raw)));
        const sel = localStorage.getItem(SELECTED_KEY);
        if (sel) setSelectedId(sel);
      } catch {
        // ignore
      }
    }

    async function loadProducts() {
      if (!isRemoteBacked) {
        loadLocalProducts();
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const remoteProducts = await listProductsFromApi();
        if (cancelled) return;
        setProducts(remoteProducts.map(fromApiProduct));
        const sel = localStorage.getItem(SELECTED_KEY);
        if (sel) setSelectedId(sel);
        setSyncError(undefined);
      } catch (error) {
        if (cancelled) return;
        setSyncError(error instanceof Error ? error.message : "Falha ao carregar produtos da API.");
        loadLocalProducts();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [isRemoteBacked]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products, ready, isRemoteBacked]);

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
      isRemoteBacked,
      syncError,
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
        if (isRemoteBacked) {
          void createProductInApi({
            name: product.name,
            ...(product.description ? { vision: product.description } : {}),
            metadata: productMetadata(product),
          })
            .then((remoteProduct) => {
              const mapped = fromApiProduct(remoteProduct, products.length);
              setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
              setSelectedId(mapped.id);
              setSyncError(undefined);
            })
            .catch((error) => {
              setProducts((prev) => prev.filter((p) => p.id !== id));
              setSyncError(error instanceof Error ? error.message : "Falha ao criar produto na API.");
            });
        }
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
        if (isRemoteBacked) {
          const current = products.find((p) => p.id === id);
          if (!current) return;
          const next: Product = {
            ...current,
            ...patch,
            initials: patch.name ? makeInitials(patch.name) : current.initials,
          };
          void updateProductInApi(id, {
            name: next.name,
            vision: next.description ?? null,
            metadata: productMetadata(next),
          })
            .then((remoteProduct) => {
              setProducts((prev) =>
                prev.map((p, index) => (p.id === id ? fromApiProduct(remoteProduct, index) : p)),
              );
              setSyncError(undefined);
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao atualizar produto na API.");
            });
        }
      },
      archiveProduct: (id) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p)));
        if (isRemoteBacked) {
          const current = products.find((p) => p.id === id);
          if (!current) return;
          const next = { ...current, status: "archived" as const };
          void updateProductInApi(id, {
            name: next.name,
            vision: next.description ?? null,
            metadata: productMetadata(next),
          }).catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao arquivar produto na API.");
          });
        }
      },
      restoreProduct: (id) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "active" } : p)));
        if (isRemoteBacked) {
          const current = products.find((p) => p.id === id);
          if (!current) return;
          const next = { ...current, status: "active" as const };
          void updateProductInApi(id, {
            name: next.name,
            vision: next.description ?? null,
            metadata: productMetadata(next),
          }).catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao restaurar produto na API.");
          });
        }
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedId((cur) => (cur === id ? products.find((p) => p.id !== id)?.id ?? "" : cur));
        if (isRemoteBacked) {
          void deleteProductInApi(id).catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao excluir produto na API.");
          });
        }
      },
    };
  }, [products, selectedId, ready, isRemoteBacked, syncError]);

  return <ProductsCtx.Provider value={value}>{children}</ProductsCtx.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsCtx);
  if (!ctx) throw new Error("useProducts precisa estar dentro de <ProductsProvider>");
  return ctx;
}
