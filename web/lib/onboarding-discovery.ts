import type { LucideIcon } from "lucide-react";
import {
  Package,
  AlertCircle,
  Lightbulb,
  FlaskConical,
  FileSearch,
} from "lucide-react";

export type DiscoveryStageId =
  | "product"
  | "pain"
  | "hypothesis"
  | "experiment"
  | "evidence";

export type DiscoveryStage = {
  id: DiscoveryStageId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  detail: string;
};

export const DISCOVERY_STAGES: DiscoveryStage[] = [
  {
    id: "product",
    label: "Produto",
    shortLabel: "Produto",
    icon: Package,
    description: "Defina o que você está construindo e para quem.",
    detail:
      "Centralize visão, contexto e escopo do produto antes de investigar problemas.",
  },
  {
    id: "pain",
    label: "Dor",
    shortLabel: "Dor",
    icon: AlertCircle,
    description: "Capture problemas reais dos usuários com evidência.",
    detail:
      "Organize dores por impacto e status — da identificação até o endereçamento.",
  },
  {
    id: "hypothesis",
    label: "Hipótese",
    shortLabel: "Hipótese",
    icon: Lightbulb,
    description: "Transforme incertezas em apostas testáveis.",
    detail:
      "Vincule hipóteses a dores e priorize o que vale validar primeiro.",
  },
  {
    id: "experiment",
    label: "Experimento",
    shortLabel: "Experimento",
    icon: FlaskConical,
    description: "Planeje e execute testes com critérios claros.",
    detail:
      "Acompanhe o ciclo planejado → em execução → concluído → analisado.",
  },
  {
    id: "evidence",
    label: "Evidências",
    shortLabel: "Evidências",
    icon: FileSearch,
    description: "Registre aprendizados e decisões com rastreabilidade.",
    detail:
      "Triagem, arquivo e conexão com hipóteses para fechar o loop de discovery.",
  },
];

export type IntroCarouselSlide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  kind: "welcome" | "pipeline" | "setup";
};

export const INTRO_CAROUSEL_SLIDES: IntroCarouselSlide[] = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Boas-vindas ao ProductDiscovery",
    subtitle:
      "Onde discovery e delivery ficam no mesmo lugar — do problema à evidência, com clareza.",
  },
  {
    id: "pipeline",
    kind: "pipeline",
    title: "Seu fluxo de discovery",
    subtitle:
      "Cinco etapas conectadas: produto, dor, hipótese, experimento e evidências.",
  },
  {
    id: "setup",
    kind: "setup",
    title: "Vamos configurar seu espaço",
    subtitle:
      "Em poucos passos você cadastra produto, pilares e OKRs para começar a explorar.",
    ctaLabel: "Começar configuração",
  },
];
