import { severityColor } from "@/lib/dores-data";

interface Props {
  level: 1 | 2 | 3 | 4 | 5;
}

export function SeverityDots({ level }: Props) {
  const color = severityColor(level);
  return (
    <div className="flex items-center gap-1" aria-label={`Severidade ${level} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: i <= level ? color : "var(--border)" }}
        />
      ))}
    </div>
  );
}
