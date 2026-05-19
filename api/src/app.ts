import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config/env';
import { AppError } from './shared/errors';
import './shared/types';
import { authRoutes } from './modules/auth/auth.routes';
import { painsRoutes } from './modules/pains/pains.routes';
import { hypothesesRoutes } from './modules/hypotheses/hypotheses.routes';
import { roadmapRoutes } from './modules/roadmap/roadmap.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { evidencesRoutes } from './modules/evidences/evidences.routes';
import { workspaceMembersRoutes } from './modules/workspace-members/workspace-members.routes';
import { workspaceTeamsRoutes } from './modules/workspace-teams/workspace-teams.routes';
import { personasRoutes } from './modules/personas/personas.routes';
import { productsRoutes } from './modules/products/products.routes';
import { experimentsRoutes } from './modules/experiments/experiments.routes';
import { insightsRoutes } from './modules/insights/insights.routes';
import { linksRoutes } from './modules/links/links.routes';
import { strategicPillarsRoutes } from './modules/strategic-pillars/strategic-pillars.routes';
import { objectivesRoutes } from './modules/objectives/objectives.routes';
import { keyResultsRoutes } from './modules/key-results/key-results.routes';
import { outcomesRoutes } from './modules/outcomes/outcomes.routes';
import { prdsRoutes } from './modules/prds/prds.routes';
import { releasesRoutes } from './modules/releases/releases.routes';
import { engineeringHandoffsRoutes } from './modules/engineering-handoffs/engineering-handoffs.routes';
import { platformRoutes } from './modules/platform/platform.routes';
import { registerSwagger } from './docs/swagger';
import { healthRouteSchemas } from './docs/route-docs';
import { registerOpenApiSchemas } from './docs/openapi-schemas';

export function buildApp() {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  registerOpenApiSchemas(app);
  app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.register(cookie, {
    secret: config.COOKIE_SECRET,
  });
  app.register(sensible);
  registerSwagger(app);

  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        error: {
          code: err.code,
          message: err.message,
          ...(hasErrorDetails(err) ? { details: err.details } : {}),
        },
      });
    }
    if (isFastifyValidationError(err)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
    app.log.error(err);
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    });
  });

  app.register(authRoutes);
  app.register(painsRoutes);
  app.register(hypothesesRoutes);
  app.register(roadmapRoutes);
  app.register(analyticsRoutes);
  app.register(evidencesRoutes);
  app.register(workspaceMembersRoutes);
  app.register(workspaceTeamsRoutes);
  app.register(personasRoutes);
  app.register(productsRoutes);
  app.register(experimentsRoutes);
  app.register(insightsRoutes);
  app.register(linksRoutes);
  app.register(strategicPillarsRoutes);
  app.register(objectivesRoutes);
  app.register(keyResultsRoutes);
  app.register(outcomesRoutes);
  app.register(prdsRoutes);
  app.register(releasesRoutes);
  app.register(engineeringHandoffsRoutes);
  app.register(platformRoutes);

  app.get('/health', { schema: healthRouteSchemas.check }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  app.get('/welcome', async (request, reply) => {
    request.log.info({ method: request.method, url: request.url }, 'Request received');
    return reply.send({ message: 'Welcome to the Flask API Service!' });
  });

  return app;
}

function hasErrorDetails(err: AppError): err is AppError & { details: unknown } {
  return 'details' in err;
}

function isFastifyValidationError(err: unknown): err is { message: string; validation: unknown } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'validation' in err &&
    'message' in err &&
    typeof err.message === 'string'
  );
}
