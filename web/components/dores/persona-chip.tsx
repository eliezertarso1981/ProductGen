import type { PersonaTag } from "@/lib/dores-data";

export function PersonaChip({ persona, size = 20 }: { persona: PersonaTag; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: persona.color,
        fontSize: Math.round(size * 0.55),
      }}
    >
      {persona.initial}
    </span>
  );
}

export function PersonaStack({ personas }: { personas: PersonaTag[] }) {
  return (
    <div className="flex -space-x-1.5">
      {personas.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center justify-center rounded-full font-semibold text-white ring-2"
          style={{
            width: 20,
            height: 20,
            backgroundColor: p.color,
            fontSize: 11,
            // ring color is set via boxShadow for token independence
            boxShadow: "0 0 0 2px var(--bg-elevated)",
          }}
        >
          {p.initial}
        </span>
      ))}
    </div>
  );
}
