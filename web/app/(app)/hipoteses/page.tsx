"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import { useProducts } from "@/lib/products-context";
import { hypothesisStatusConfig } from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDate } from "@/components/shared/crud-ui";
import { Avatar } from "@/components/shared/avatar";

export default function HipotesesPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { hypotheses, createHypothesis, experimentsByHypothesis } = useDiscovery();
  const { getPain } = useDores();
  const items = useMemo(
    () => hypotheses.filter((h) => h.productId === currentProduct.id),
    [hypotheses, currentProduct.id],
  );

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Hipóteses" }}
        title="Hipóteses"
        count={`${items.length} hipóteses`}
        onCreate={() => {
          const h = createHypothesis(currentProduct.id);
          router.push(`/hipoteses/${h.id}?new=1`);
        }}
        createLabel="Nova hipótese"
      />

      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhuma hipótese ainda"
            hint="Hipóteses nascem a partir de uma dor. Comece criando uma."
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
                  <th className="px-4 py-3 font-semibold">Hipótese</th>
                  <th className="px-4 py-3 font-semibold">Dor de origem</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Experimentos</th>
                  <th className="px-4 py-3 font-semibold">Atualizada</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => {
                  const cfg = hypothesisStatusConfig[h.status];
                  const pain = h.painId ? getPain(h.painId) : undefined;
                  const expCount = experimentsByHypothesis(h.id).length;
                  return (
                    <tr
                      key={h.id}
                      className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--bg-muted-2)" }}
                      onClick={() => router.push(`/hipoteses/${h.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">{h.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--fg)]">{h.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                          {h.statement}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {pain ? (
                          <Link
                            href={`/dores/${pain.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[12px] text-[var(--primary)] hover:underline"
                          >
                            {pain.id}
                          </Link>
                        ) : (
                          <span className="text-[var(--border-strong)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className="inline-flex items-center gap-2 text-[var(--fg-muted)]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[var(--fg-muted)]">{expCount}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                        {formatDate(h.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Avatar initials={h.owner.initials} color={h.owner.color} size={24} />
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
