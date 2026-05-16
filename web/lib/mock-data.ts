import type { EntityType } from "./entity-config";

export const currentUser = {
  name: "Eliezer Silva",
  email: "eliezer@acme.com",
  initials: "ES",
};

export const workspace = {
  name: "Acme Product Team",
  initials: "AC",
  members: 12,
};

export const kpis = [
  {
    label: "EVIDÊNCIAS · 30D",
    value: "47",
    delta: "+12%",
    deltaTone: "up" as const,
    deltaLabel: "vs. mês anterior",
  },
  {
    label: "DORES EM INVESTIGAÇÃO",
    value: "8",
    delta: "—",
    deltaTone: "flat" as const,
    deltaLabel: "sem mudança esta semana",
  },
  {
    label: "HIPÓTESES VALIDADAS",
    value: "12",
    delta: "+3",
    deltaTone: "up" as const,
    deltaLabel: "vs. trimestre",
  },
  {
    label: "OUTCOMES EM MEDIÇÃO",
    value: "5",
    delta: "",
    deltaTone: "warn" as const,
    deltaLabel: "2 vencem esta semana",
  },
];

export const funnel = [
  { label: "Evidências capturadas", value: 47, rate: null },
  { label: "Triadas", value: 38, rate: "81%" },
  { label: "Dores formuladas", value: 23, rate: "61%" },
  { label: "Priorizadas", value: 14, rate: "61%" },
  { label: "Hipóteses", value: 12, rate: "86%" },
  { label: "Validadas", value: 8, rate: "67%" },
  { label: "Entregues", value: 5, rate: "63%" },
  { label: "Outcomes confirmados", value: 3, rate: "60%" },
];

export const recentActivity: Array<{
  id: string;
  type: EntityType;
  who: string;
  initials: string;
  avatarColor: string;
  text: string;
  meta: string;
  when: string;
}> = [
  {
    id: "1",
    type: "hypothesis",
    who: "Carlos Mendes",
    initials: "CM",
    avatarColor: "var(--purple)",
    text: 'validou a hipótese "Tour interativo guiado"',
    meta: "Hipótese",
    when: "2h atrás",
  },
  {
    id: "2",
    type: "experiment",
    who: "Julia Costa",
    initials: "JC",
    avatarColor: "var(--warn-strong)",
    text: 'concluiu o experimento "A/B test: tour guiado"',
    meta: "Experimento",
    when: "4h atrás",
  },
  {
    id: "3",
    type: "pain",
    who: "Ana Silva",
    initials: "AS",
    avatarColor: "var(--primary)",
    text: 'moveu a dor "Performance ruim no mobile" para investigating',
    meta: "Dor",
    when: "6h atrás",
  },
  {
    id: "4",
    type: "evidence",
    who: "Carlos Mendes",
    initials: "CM",
    avatarColor: "var(--purple)",
    text: "adicionou 3 evidências da pesquisa NPS Q4",
    meta: "Evidências",
    when: "ontem",
  },
  {
    id: "5",
    type: "roadmap",
    who: "Ana Silva",
    initials: "AS",
    avatarColor: "var(--primary)",
    text: 'criou a iniciativa "Engajamento: reduzir time-to-value"',
    meta: "Roadmap",
    when: "ontem",
  },
];

export const upcomingMeasurements = [
  {
    id: "1",
    title: "Hub Unificador de Feedback",
    measuring: "NPS enterprise +5pp",
    status: "em 4 dias",
    tone: "warn" as const,
  },
  {
    id: "2",
    title: "Tour Interativo Guiado",
    measuring: "MAU D30 de 42% → 55%",
    status: "em 11 dias",
    tone: "warn" as const,
  },
  {
    id: "3",
    title: "Dashboard executivo automático",
    measuring: "redução de horas/mês com reports manuais",
    status: "em 18 dias",
    tone: "warn" as const,
  },
  {
    id: "4",
    title: "App mobile native",
    measuring: "retenção D7 mobile +30%",
    status: "vencido há 3 dias",
    tone: "danger" as const,
  },
];

export const healthSignals = {
  invalidationRate: {
    value: 33,
    healthyMin: 10,
    healthyMax: 60,
    note: "Saudável — entre 10% e 60% indica que vocês estão testando, não confirmando.",
  },
  avgPainAge: {
    value: 23,
    unit: "dias",
    delta: "+6 dias vs. mês anterior",
    note: "Acima da média esperada (14d). Possível gargalo no triage.",
  },
  strategicCoverage: {
    value: 87,
    note: "87% das iniciativas no roadmap têm hipótese validada e ligada a um pilar estratégico.",
  },
};

export const bottleneck = {
  stage: "Triadas → Dores",
  rate: "61%",
  expected: ">70%",
};
