import swagger from '@fastify/swagger';
import { FastifyInstance } from 'fastify';

export function registerSwagger(app: FastifyInstance) {
  app.register(swagger, {
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, index) {
        return typeof json.$id === 'string' ? json.$id : `def-${index}`;
      },
    },
    openapi: {
      info: {
        title: 'ProductGen API',
        description:
          'API local da plataforma de Product Intelligence: strategy, discovery, delivery e outcomes.',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Ambiente local' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Status da API' },
        { name: 'Auth', description: 'Login e autenticação' },
        { name: 'Pains', description: 'Dores do discovery' },
        { name: 'Hypotheses', description: 'Hipóteses de produto' },
        { name: 'Roadmap', description: 'Itens de delivery' },
        { name: 'Analytics', description: 'Views consolidadas e dashboards' },
      ],
    },
  });

  app.get(
    '/openapi.json',
    {
      schema: {
        hide: true,
      },
    },
    async () => app.swagger(),
  );
}
