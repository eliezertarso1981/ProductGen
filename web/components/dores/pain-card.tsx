"use client";

import { AlertCircle, Users, Lightbulb, FlaskConical, GripVertical } from "lucide-react";
import type { Pain } from "@/lib/dores-data";
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
          {pain.id}
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
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {pain.reach}
          </span>
          <span className="inline-flex items-center gap-1">
            <Lightbulb size={12} /> {pain.evidences}
          </span>
          <span className="inline-flex items-center gap-1">
            <FlaskConical size={12} /> {pain.hypotheses}
          </span>
        </div>
        <Avatar initials={pain.owner.initials} color={pain.owner.color} size={22} />
      </div>
    </div>
  );
}
