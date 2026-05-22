export type PlanCode = 'free' | 'starter' | 'professional' | 'enterprise';

/** Textos e metadados exibidos na tela de escolha de plano (onboarding). */
export interface PlanDisplayInfo {
  description: string;
  highlights?: string[];
}

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  max_products: number | null;
  max_auto_prds_per_month: number | null;
  max_storage_bytes: number | null;
  max_users: number | null;
  api_access: boolean;
  support: string;
  display: PlanDisplayInfo;
}

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    code: 'starter',
    name: 'Starter',
    max_products: 1,
    max_auto_prds_per_month: 10,
    max_storage_bytes: 1_073_741_824,
    max_users: 3,
    api_access: false,
    support: 'E-mail',
    display: {
      description:
        'Para times pequenos ou PMs solo que querem organizar discovery e estratégia em um único produto.',
      highlights: ['Ideal para começar sem complexidade', 'Suporte por e-mail'],
    },
  },
  {
    code: 'professional',
    name: 'Professional',
    max_products: 50,
    max_auto_prds_per_month: 1000,
    max_storage_bytes: 53_687_091_200,
    max_users: 25,
    api_access: true,
    support: 'E-mail + Chat',
    display: {
      description:
        'Para times de produto em crescimento que precisam de vários produtos, API e mais capacidade de geração com IA.',
      highlights: ['API para integrações', 'Suporte por e-mail e chat'],
    },
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    max_products: null,
    max_auto_prds_per_month: null,
    max_storage_bytes: 536_870_912_000,
    max_users: null,
    api_access: true,
    support: 'Dedicado',
    display: {
      description:
        'Para empresas com múltiplos produtos, requisitos de segurança e acompanhamento comercial dedicado.',
      highlights: ['Limites sob medida', 'Suporte dedicado', 'Avaliação com o time comercial'],
    },
  },
  {
    code: 'free',
    name: 'Free',
    max_products: 1,
    max_auto_prds_per_month: 5,
    max_storage_bytes: 536_870_912,
    max_users: 2,
    api_access: false,
    support: 'Comunidade',
    display: {
      description: 'Experimente o ProductGen com recursos essenciais para um produto.',
      highlights: ['Comunidade e documentação'],
    },
  },
];

export function getPlanDefinition(planCode: string): PlanDefinition | undefined {
  return PLAN_CATALOG.find((plan) => plan.code === planCode);
}

export function assertProductLimit(planCode: string, currentCount: number): void {
  const plan = getPlanDefinition(planCode) ?? getPlanDefinition('free');
  if (!plan || plan.max_products === null) return;
  if (currentCount >= plan.max_products) {
    const err = new Error('PLAN_LIMIT_EXCEEDED');
    (err as Error & { planCode: string; max: number }).planCode = plan.code;
    (err as Error & { max: number }).max = plan.max_products;
    throw err;
  }
}
