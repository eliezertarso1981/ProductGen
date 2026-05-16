"use client";

import { type Period, type PeriodType, type Quarter } from "@/lib/strategy-data";

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export function PeriodPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value.type}
        onChange={(e) => {
          const t = e.target.value as PeriodType;
          onChange({
            type: t,
            year: value.year,
            quarter: t === "quarterly" ? (value.quarter ?? 1) : undefined,
          });
        }}
        className="rounded-md border bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[var(--primary)]"
        style={{ borderColor: "var(--border)" }}
      >
        <option value="annual">Anual</option>
        <option value="quarterly">Trimestral</option>
      </select>

      {value.type === "quarterly" && (
        <select
          value={value.quarter ?? 1}
          onChange={(e) =>
            onChange({ ...value, quarter: Number(e.target.value) as Quarter })
          }
          className="rounded-md border bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[var(--primary)]"
          style={{ borderColor: "var(--border)" }}
        >
          {[1, 2, 3, 4].map((q) => (
            <option key={q} value={q}>
              Q{q}
            </option>
          ))}
        </select>
      )}

      <select
        value={value.year}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        className="rounded-md border bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[var(--primary)]"
        style={{ borderColor: "var(--border)" }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
