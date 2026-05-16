"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiscovery } from "@/lib/discovery-store";
import { useProducts } from "@/lib/products-context";
import { evidenceTypeConfig } from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDate } from "@/components/shared/crud-ui";

export default function EvidenciasPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { evidences, createEvidence, getExperiment } = useDiscovery();
  const items = useMemo(
    () => evidences.filter((e) => e.productId === currentProduct.id),
    [evidences, currentProduct.id],
  );

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Evidências" }}
        title="Evidências"
        count={`${items.length} evidências`}
        onCreate={() => {
          const ev = createEvidence(currentProduct.id);
          router.push(`/evidencias/${ev.id}?new=1`);
        }}
        createLabel="Nova evidência"
      />

      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhuma evidência ainda"
            hint="Evidências nascem dos experimentos."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--fg-faint)", backgroundColor: "var(--bg-muted)" }}
                >
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Evidência</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Experimento</th>
                  <th className="px-4 py-3 font-semibold">Atualizada</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ev) => {
                  const t = evidenceTypeConfig[ev.type];
                  const exp = ev.experimentId ? getExperiment(ev.experimentId) : undefined;
                  return (
                    <tr
                      key={ev.id}
                      className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--bg-muted-2)" }}
                      onClick={() => router.push(`/evidencias/${ev.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">{ev.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--fg)]">{ev.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                          {ev.notes}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: `${t.color}15`, color: t.color }}
                        >
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">{ev.source || "—"}</td>
                      <td className="px-4 py-3 text-[13px]">
                        {exp ? (
                          <Link
                            href={`/experimentos/${exp.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[12px] text-[var(--primary)] hover:underline"
                          >
                            {exp.id}
                          </Link>
                        ) : (
                          <span className="text-[var(--border-strong)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                        {formatDate(ev.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
