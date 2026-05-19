import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { analyticsRouteSchemas } from '../../docs/route-docs';
import * as queries from './analytics.queries';

// Schemas de query params reutilizados entre rotas
const productFilterSchema = z.object({
  product_id: z.string().uuid('product_id inválido').optional(),
});

const dashboardFilterSchema = productFilterSchema.extend({
  period: z.enum(queries.DASHBOARD_PERIODS).optional(),
});

const uuidRequiredSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

const ENTITY_TYPES = [
  'pains',
  'hypotheses',
  'experiments',
  'evidences',
  'roadmap_items',
  'outcomes',
  'objectives',
] as const;

export async function analyticsRoutes(app: FastifyInstance) {
  // GET /analytics/dashboard?product_id=...
  // Dashboard agregado: KPIs e sinais de saúde usando entidades reais
  app.get(
    '/analytics/dashboard',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.dashboard },
    async (request, reply) => {
      const parsed = dashboardFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getDashboardAnalytics(
        workspace_id,
        user_id,
        parsed.data.product_id,
        parsed.data.period,
      );
      return reply.send(data);
    },
  );

  // GET /analytics/discovery-funnel?product_id=...
  // Funil: quantas evidencias viraram pains, pains viraram hipoteses, hipoteses viraram outcomes
  app.get(
    '/analytics/discovery-funnel',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.discoveryFunnel },
    async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getDiscoveryFunnel(workspace_id, user_id, parsed.data.product_id);
      return reply.send(data);
    },
  );

  // GET /analytics/lifecycle-health?product_id=...
  // Idade media/maxima por estado: revela onde o fluxo empaca
  app.get(
    '/analytics/lifecycle-health',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.lifecycleHealth },
    async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getLifecycleHealth(workspace_id, user_id, parsed.data.product_id);
      return reply.send(data);
    },
  );

  // GET /analytics/hypothesis-stats?product_id=...
  // Taxa de validacao vs. invalidacao de hipoteses
  app.get(
    '/analytics/hypothesis-stats',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.hypothesisStats },
    async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getHypothesisStats(workspace_id, user_id, parsed.data.product_id);
      return reply.send(data);
    },
  );

  // GET /analytics/roadmap-coverage?product_id=...
  // Roadmap com sinais estrategicos: pilar, OKR e hipotese vinculados
  app.get(
    '/analytics/roadmap-coverage',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.roadmapCoverage },
    async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getRoadmapCoverage(workspace_id, user_id, parsed.data.product_id);
      return reply.send(data);
    },
  );

  // GET /analytics/pain-traceability?id=<pain_id>
  // Drill-down de uma dor: evidencias, hipoteses, experimentos e outcomes ligados
  app.get(
    '/analytics/pain-traceability',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.painTraceability },
    async (request, reply) => {
      const parsed = uuidRequiredSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', 'id (UUID da dor) é obrigatório');

      const { workspace_id, user_id } = request.user;
      const data = await queries.getPainTraceability(workspace_id, user_id, parsed.data.id);
      return reply.send(data);
    },
  );

  // GET /analytics/status-transitions?entity_type=pains&entity_id=<uuid>
  // Historico de transicoes com tempo gasto em cada estado
  app.get(
    '/analytics/status-transitions',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.statusTransitions },
    async (request, reply) => {
      const schema = z.object({
        entity_type: z.enum(ENTITY_TYPES).optional(),
        entity_id: z.string().uuid('entity_id inválido').optional(),
      });
      const parsed = schema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getStatusTransitions(workspace_id, user_id, parsed.data);
      return reply.send(data);
    },
  );

  // GET /analytics/cycle-times?entity_type=pains
  // Tempo medio em cada estado por tipo de entidade
  app.get(
    '/analytics/cycle-times',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.cycleTimes },
    async (request, reply) => {
      const schema = z.object({
        entity_type: z.enum(ENTITY_TYPES).optional(),
      });
      const parsed = schema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getCycleTimes(workspace_id, user_id, parsed.data.entity_type);
      return reply.send(data);
    },
  );

  // GET /analytics/outcomes-dashboard?product_id=...
  // Fechamento do loop: entregas, outcomes medidos e impacto nos KRs
  app.get(
    '/analytics/outcomes-dashboard',
    { preHandler: requireAuth, schema: analyticsRouteSchemas.outcomesDashboard },
    async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);

      const { workspace_id, user_id } = request.user;
      const data = await queries.getOutcomesDashboard(workspace_id, user_id, parsed.data.product_id);
      return reply.send(data);
    },
  );
}
