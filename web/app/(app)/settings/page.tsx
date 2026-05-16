"use client";

import { useState } from "react";
import { Box, Users, Settings as SettingsIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductsManager } from "@/components/settings/products-manager";
import { TeamsManager } from "@/components/settings/teams-manager";

type Tab = "products" | "teams" | "general";

const tabs: Array<{ id: Tab; label: string; icon: typeof Box }> = [
  { id: "products", label: "Produtos", icon: Box },
  { id: "teams", label: "Times & Pessoas", icon: Users },
  { id: "general", label: "Geral", icon: SettingsIcon },
];

export default function Page() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="px-6 py-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--fg)" }}>
            Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-subtle)" }}>
            Gerencie produtos, times e configurações do workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
              style={{
                color: active ? "var(--primary)" : "var(--fg-muted)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={14} />
              {t.label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 animate-fade-in">
        {tab === "products" && <ProductsManager />}
        {tab === "teams" && <TeamsManager />}
        {tab === "general" && (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)", color: "var(--fg-subtle)" }}
          >
            Configurações gerais em breve.
          </div>
        )}
      </div>
    </div>
  );
}
