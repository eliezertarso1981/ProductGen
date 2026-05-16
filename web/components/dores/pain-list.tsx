"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { statusConfig, type Pain } from "@/lib/dores-data";
import { Avatar } from "@/components/shared/avatar";
import { SeverityDots } from "./severity-dots";
import { PersonaStack } from "./persona-chip";

export function PainList({ pains }: { pains: Pain[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr
            className="text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fg-faint)", backgroundColor: "var(--bg-muted)" }}
          >
            <th className="px-4 py-3 font-semibold">ID</th>
            <th className="px-4 py-3 font-semibold">Dor</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Severidade</th>
            <th className="px-4 py-3 font-semibold">Personas</th>
            <th className="px-4 py-3 font-semibold">Reach</th>
            <th className="px-4 py-3 font-semibold">Ev · Hp</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {pains.map((p) => {
            const cfg = statusConfig[p.status];
            const muted = p.status === "descartada";
            const Icon = p.status === "validada" ? CheckCircle2 : AlertCircle;
            return (
              <tr
                key={p.id}
                className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--bg-muted-2)", opacity: muted ? 0.7 : 1 }}
              >
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--fg-subtle)" }}>
                  <Link href={`/dores/${p.id}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Icon size={13} color={p.status === "validada" ? "var(--success)" : undefined} />
                    {p.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dores/${p.id}`} className="block hover:underline">
                    <div className="font-semibold" style={{ color: muted ? "var(--fg-faint)" : "var(--fg)" }}>
                      {p.title}
                    </div>
                  </Link>
                  <div className="mt-0.5 line-clamp-1 text-[13px]" style={{ color: "var(--fg-faint)" }}>
                    {p.description}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-2 text-[13px]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <SeverityDots level={p.severity} />
                </td>
                <td className="px-4 py-3">
                  <PersonaStack personas={p.personas} />
                </td>
                <td className="px-4 py-3 font-mono text-[13px]" style={{ color: "var(--fg-muted)" }}>
                  {p.reach}
                </td>
                <td className="px-4 py-3 font-mono text-[13px]" style={{ color: "var(--fg-muted)" }}>
                  {p.evidences} · {p.hypotheses}
                </td>
                <td className="px-4 py-3">
                  <Avatar initials={p.owner.initials} color={p.owner.color} size={24} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
