import {
  FlaskConical,
  Lightbulb,
  AlertCircle,
  Beaker,
  Map,
  Target,
  type LucideIcon,
} from "lucide-react";

export type EntityType = "evidence" | "pain" | "hypothesis" | "experiment" | "roadmap" | "outcome";

export const entityConfig: Record<
  EntityType,
  { icon: LucideIcon; label: string; color: string; bg: string }
> = {
  evidence: { icon: Lightbulb, label: "Evidências", color: "var(--cyan)", bg: "#ecfeff" },
  pain: { icon: AlertCircle, label: "Dor", color: "var(--warn-strong)", bg: "var(--warn-soft)" },
  hypothesis: { icon: FlaskConical, label: "Hipótese", color: "var(--purple)", bg: "#f5f3ff" },
  experiment: { icon: Beaker, label: "Experimento", color: "#0ea5e9", bg: "#f0f9ff" },
  roadmap: { icon: Map, label: "Roadmap", color: "var(--success)", bg: "var(--success-soft)" },
  outcome: { icon: Target, label: "Outcome", color: "var(--primary)", bg: "var(--primary-soft)" },
};
