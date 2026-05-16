"use client";

import { useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useProducts } from "@/lib/products-context";

export function ProductSwitcher() {
  const { products, currentProduct, setCurrentProductId, addProduct } = useProducts();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: currentProduct.color }}
        >
          {currentProduct.initials}
        </span>
        <span className="font-semibold">{currentProduct.name}</span>
        <ChevronDown size={14} color="var(--fg-faint)" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-20 mt-1 w-64 rounded-md border bg-white py-1 shadow-lg"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Produto
            </div>
            {products.filter((p) => p.status === "active").map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentProductId(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-2 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.initials}
                  </span>
                  <span className="text-[var(--fg)]">{p.name}</span>
                </span>
                {p.id === currentProduct.id && <Check size={14} color="var(--primary)" />}
              </button>
            ))}
            <div className="my-1 h-px" style={{ backgroundColor: "var(--bg-muted-2)" }} />
            <button
              onClick={() => {
                const name = prompt("Nome do novo produto?");
                if (name?.trim()) {
                  addProduct({ name: name.trim() });
                  setOpen(false);
                }
              }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-[13px] text-[var(--primary)] hover:bg-[var(--primary-soft-2)]"
            >
              <Plus size={14} /> Novo produto
            </button>
          </div>
        </>
      )}
    </div>
  );
}
