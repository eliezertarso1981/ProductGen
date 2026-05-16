"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, FlaskConical, Beaker, Map, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Pain } from "@/lib/dores-data";
import { statusConfig as painStatusConfig } from "@/lib/dores-data";
import { useDiscovery } from "@/lib/discovery-store";
import {
  hypothesisStatusConfig,
  experimentStatusConfig,
  roadmapStatusConfig,
} from "@/lib/discovery-data";
import { SeverityDots } from "./severity-dots";

interface Props {
  pains: Pain[];
}

export function PainFlow({ pains }: Props) {
  const { hypothesesByPain, experimentsByHypothesis, roadmapByPain } = useDiscovery();
  const [selectedId, setSelectedId] = useState<string | null>(pains[0]?.id ?? null);

  useEffect(() => {
    if (pains.length === 0) {
      setSelectedId(null);
    } else if (!pains.find((p) => p.id === selectedId)) {
      setSelectedId(pains[0].id);
    }
  }, [pains, selectedId]);

  if (pains.length === 0 || !selectedId) {
    return (
      <div
        className="rounded-xl border p-10 text-center text-[13px]"
        style={{ borderColor: "var(--border)", color: "var(--fg-faint)" }}
      >
        Nenhuma dor para exibir.
      </div>
    );
  }

  const pain = pains.find((p) => p.id === selectedId)!;
  const hyps = hypothesesByPain(pain.id);
  const roadmap = roadmapByPain(pain.id);

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium" style={{ color: "var(--fg-subtle)" }}>
          Visualizar dor:
        </span>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none rounded-md border bg-white py-1.5 pl-3 pr-8 text-[13px] font-medium outline-none focus:border-[var(--primary)]"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            {pains.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.title}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: "var(--fg-faint)" }}
          />
        </div>
      </div>

      {/* Tree */}
      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center">
          {/* Pain root */}
          <Node
            href={`/dores/${pain.id}`}
            icon={AlertCircle}
            iconColor="var(--danger)"
            id={pain.id}
            title={pain.title}
            statusLabel={painStatusConfig[pain.status].label}
            statusColor={painStatusConfig[pain.status].dot}
            kind="Dor"
            extra={<SeverityDots level={pain.severity} />}
            wide
          />

          {hyps.length === 0 ? (
            <>
              <Trunk />
              <Empty>Nenhuma hipótese vinculada</Empty>
            </>
          ) : (
            <>
              <Trunk />
              <Branches count={hyps.length}>
                {hyps.map((h) => {
                  const exps = experimentsByHypothesis(h.id);
                  return (
                    <div
                      key={h.id}
                      className="flex flex-col items-center"
                      style={{ minWidth: 240 }}
                    >
                      <Node
                        href={`/hipoteses/${h.id}`}
                        icon={FlaskConical}
                        iconColor="var(--purple)"
                        id={h.id}
                        title={h.title}
                        statusLabel={hypothesisStatusConfig[h.status].label}
                        statusColor={hypothesisStatusConfig[h.status].dot}
                        kind="Hipótese"
                      />
                      {exps.length === 0 ? (
                        <>
                          <Trunk small />
                          <Empty small>Sem experimentos</Empty>
                        </>
                      ) : (
                        <>
                          <Trunk small />
                          <Branches count={exps.length}>
                            {exps.map((e) => (
                              <div
                                key={e.id}
                                className="flex flex-col items-center"
                                style={{ minWidth: 220 }}
                              >
                                <Node
                                  href={`/experimentos/${e.id}`}
                                  icon={Beaker}
                                  iconColor="var(--cyan)"
                                  id={e.id}
                                  title={e.title}
                                  statusLabel={experimentStatusConfig[e.status].label}
                                  statusColor={experimentStatusConfig[e.status].dot}
                                  kind="Experimento"
                                  small
                                />
                              </div>
                            ))}
                          </Branches>
                        </>
                      )}
                    </div>
                  );
                })}
              </Branches>
            </>
          )}

          {/* Roadmap branch (parallel from pain) */}
          {roadmap.length > 0 && (
            <>
              <div
                className="my-6 w-full text-center text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--fg-faint)" }}
              >
                <div className="relative">
                  <div
                    className="absolute left-0 right-0 top-1/2 h-px"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  <span className="relative bg-white px-3">Itens de roadmap originados</span>
                </div>
              </div>
              <Branches count={roadmap.length}>
                {roadmap.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: 220 }}
                  >
                    <Node
                      href={`/roadmap/${r.id}`}
                      icon={Map}
                      iconColor="var(--primary)"
                      id={r.id}
                      title={r.title}
                      statusLabel={roadmapStatusConfig[r.status].label}
                      statusColor={roadmapStatusConfig[r.status].dot}
                      kind="Roadmap"
                    />
                  </div>
                ))}
              </Branches>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Node({
  href,
  icon: Icon,
  iconColor,
  id,
  title,
  statusLabel,
  statusColor,
  kind,
  extra,
  wide,
  small,
}: {
  href: string;
  icon: LucideIcon;
  iconColor: string;
  id: string;
  title: string;
  statusLabel: string;
  statusColor: string;
  kind: string;
  extra?: React.ReactNode;
  wide?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)] hover:shadow-md"
      style={{
        borderColor: "var(--border)",
        width: wide ? 320 : small ? 200 : 220,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon size={13} style={{ color: iconColor }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: iconColor }}
          >
            {kind}
          </span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--fg-faint)" }}>
          {id}
        </span>
      </div>
      <div
        className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug group-hover:text-[var(--primary)]"
        style={{ color: "var(--fg)" }}
      >
        {title}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
            {statusLabel}
          </span>
        </div>
        {extra}
      </div>
    </Link>
  );
}

function Trunk({ small }: { small?: boolean }) {
  return (
    <div
      style={{
        width: 2,
        height: small ? 20 : 28,
        backgroundColor: "var(--border)",
      }}
    />
  );
}

function Branches({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  if (count === 1) {
    return <div className="flex flex-col items-center">{children}</div>;
  }
  return (
    <div className="relative w-full">
      {/* Horizontal connector spanning the children */}
      <div className="relative mx-auto" style={{ maxWidth: "100%" }}>
        <div className="flex items-start justify-center gap-6">
          {Array.isArray(children)
            ? children.map((child, i) => (
                <div key={i} className="relative flex flex-col items-center">
                  {/* vertical drop into the child */}
                  <div
                    style={{
                      width: 2,
                      height: 20,
                      backgroundColor: "var(--border)",
                    }}
                  />
                  {child}
                </div>
              ))
            : children}
        </div>
        {/* horizontal line above the drops */}
        <HorizontalConnector />
      </div>
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0"
      style={{
        top: 0,
        height: 2,
        backgroundColor: "var(--border)",
        marginLeft: "12.5%",
        marginRight: "12.5%",
      }}
    />
  );
}

function Empty({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      className="rounded-lg border border-dashed text-center"
      style={{
        borderColor: "var(--border)",
        color: "var(--fg-faint)",
        padding: small ? "8px 12px" : "12px 16px",
        fontSize: small ? 11 : 12,
      }}
    >
      {children}
    </div>
  );
}
