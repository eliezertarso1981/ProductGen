"use client";

import Link from "next/link";
import { AlertCircle, Users, Lightbulb, FlaskConical, GripVertical } from "lucide-react";
import { getPainDisplayId, type Pain } from "@/lib/dores-data";
import { Avatar } from "@/components/shared/avatar";
import { SeverityDots } from "./severity-dots";
import { PersonaStack } from "./persona-chip";

interface Props {
  pain: Pain;
  selected?: boolean;
  onSelect?: () => void;
}

export function PainCard({ pain, selected, onSelect }: Props) {
  const baseBorder = selected ? "var(--primary)" : "var(--border)";
  const baseBg = selected ? "var(--primary-soft-2)" : "var(--bg-elevated)";
  const displayId = getPainDisplayId(pain);
  const affectedPersonas = pain.personas.length;

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-grab rounded-lg border p-3 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:scale-[1.02] active:shadow-lg"
      style={{ backgroundColor: baseBg, borderColor: baseBorder }}
    >
      <span
        className="absolute left-1 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--fg-faint)" }}
        aria-hidden
      >
        <GripVertical size={12} />
      </span>

      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[12px]"
          style={{ color: "var(--fg-subtle)" }}
        >
          <AlertCircle size={13} />
          {displayId ?? "Dor"}
        </div>
        <SeverityDots level={pain.severity} />
      </div>

      <h3 className="mt-2 text-[14px] font-semibold leading-snug" style={{ color: "var(--fg)" }}>
        {pain.title}
      </h3>

      <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "var(--fg-subtle)" }}>
        {pain.description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
          Afeta:
        </span>
        <PersonaStack personas={pain.personas} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono text-[12px]" style={{ color: "var(--fg-subtle)" }}>
          <Link
            href={`/dores/${pain.id}#personas`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-[#f7f8fa] hover:text-[#2b364a]"
            title="Ver personas vinculadas"
          >
            <Users size={12} /> {affectedPersonas}
          </Link>
          <Link
            href="/evidencias"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-[#f7f8fa] hover:text-[#2b364a]"
            title="Ver evidências relacionadas"
          >
            <Lightbulb size={12} /> {pain.evidences}
          </Link>
          <Link
            href={`/dores/${pain.id}#hipoteses`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#f7f8fa] hover:text-[#2b364a]"
            title="Ver hipóteses geradas"
          >
            <FlaskConical size={12} />
            <span>{pain.hypotheses}</span>
            <span className="hidden font-sans text-[11px] font-medium sm:inline">
              {pain.hypotheses === 1 ? "hipótese" : "hipóteses"}
            </span>
          </Link>
        </div>
        <Avatar initials={pain.owner.initials} color={pain.owner.color} size={22} />
      </div>
    </div>
  );
}
