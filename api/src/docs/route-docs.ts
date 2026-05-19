const bearer = [{ bearerAuth: [] }];

const errorResponse = { $ref: 'ErrorResponse#' };
const validationErrors = { 400: errorResponse, 500: errorResponse };
const authErrors = { 401: errorResponse, 500: errorResponse };
const readErrors = { 401: errorResponse, 404: errorResponse, 500: errorResponse };
const writeErrors = {
  400: errorResponse,
  401: errorResponse,
  404: errorResponse,
  422: errorResponse,
  500: errorResponse,
};

export const healthRouteSchemas = {
  check: {
    tags: ['Health'],
    summary: 'Verifica se a API está online',
    response: {
      200: { $ref: 'HealthResponse#' },
      500: errorResponse,
    },
  },
};

export const authRouteSchemas = {
  login: {
    tags: ['Auth'],
    summary: 'Faz login do usuário',
    description:
      'Valida email e senha. Retorna um access token para compatibilidade e grava cookies HTTP-only de access/refresh.',
    body: { $ref: 'LoginRequest#' },
    response: {
      200: { $ref: 'LoginResponse#' },
      401: errorResponse,
      ...validationErrors,
    },
  },
};

export const personaRouteSchemas = {
  list: {
    tags: ['Personas'],
    summary: 'Lista personas do workspace',
    description: 'Retorna personas não removidas com códigos humanos PS-XX por workspace.',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Persona#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Personas'],
    summary: 'Cria uma persona',
    description: 'Cria uma persona workspace-scoped e gera code PS-XX.',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    body: { $ref: 'CreatePersonaRequest#' },
    response: {
      201: { $ref: 'Persona#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Personas'],
    summary: 'Busca uma persona por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'Persona#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Personas'],
    summary: 'Atualiza campos de uma persona',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdatePersonaRequest#' },
    response: {
      200: { $ref: 'Persona#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Personas'],
    summary: 'Remove uma persona com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  listPainPersonas: {
    tags: ['Personas'],
    summary: 'Lista personas vinculadas a uma dor',
    security: bearer,
    params: { $ref: 'PainIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Persona#' } },
      ...readErrors,
    },
  },
  linkPainPersona: {
    tags: ['Personas'],
    summary: 'Vincula dor ↔ persona',
    security: bearer,
    params: { $ref: 'PainPersonaLinkParams#' },
    response: {
      201: { $ref: 'PainPersonaLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkPainPersona: {
    tags: ['Personas'],
    summary: 'Remove vínculo dor ↔ persona',
    security: bearer,
    params: { $ref: 'PainPersonaLinkParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const painRouteSchemas = {
  list: {
    tags: ['Pains'],
    summary: 'Lista dores de um produto',
    description: 'Retorna apenas dores não removidas do workspace do token.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Pain#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Pains'],
    summary: 'Cria uma dor',
    description: 'Cria uma dor em status inicial identified.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreatePainRequest#' },
    response: {
      201: { $ref: 'Pain#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Pains'],
    summary: 'Busca uma dor por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'Pain#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Pains'],
    summary: 'Atualiza campos de uma dor',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdatePainRequest#' },
    response: {
      200: { $ref: 'Pain#' },
      ...writeErrors,
    },
  },
  transitionStatus: {
    tags: ['Pains'],
    summary: 'Transiciona o status de uma dor',
    description:
      'O banco valida a state machine. Ao descartar, discard_reason é obrigatório.',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdatePainStatusRequest#' },
    response: {
      200: { $ref: 'Pain#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Pains'],
    summary: 'Remove uma dor com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  updateScoring: {
    tags: ['Pains'],
    summary: 'Atualiza scoring RICE/ICE da dor',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateScoringRequest#' },
    response: { 200: { $ref: 'Pain#' }, ...writeErrors },
  },
  merge: {
    tags: ['Pains'],
    summary: 'Consolida dores de origem na dor alvo',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'MergePainsRequest#' },
    response: { 200: { $ref: 'Pain#' }, ...writeErrors },
  },
  split: {
    tags: ['Pains'],
    summary: 'Divide uma dor em múltiplas dores filhas',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'SplitPainRequest#' },
    response: {
      201: { type: 'array', items: { $ref: 'Pain#' } },
      ...writeErrors,
    },
  },
  listRelationships: {
    tags: ['Pains'],
    summary: 'Lista relações (merge/split) da dor',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'PainRelationship#' } },
      ...readErrors,
    },
  },
};

export const hypothesisRouteSchemas = {
  list: {
    tags: ['Hypotheses'],
    summary: 'Lista hipóteses de um produto',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Hypothesis#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Hypotheses'],
    summary: 'Cria uma hipótese',
    description: 'Cria uma hipótese em status inicial formulated.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateHypothesisRequest#' },
    response: {
      201: { $ref: 'Hypothesis#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Hypotheses'],
    summary: 'Busca uma hipótese por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'Hypothesis#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Hypotheses'],
    summary: 'Atualiza campos de uma hipótese',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateHypothesisRequest#' },
    response: {
      200: { $ref: 'Hypothesis#' },
      ...writeErrors,
    },
  },
  transitionStatus: {
    tags: ['Hypotheses'],
    summary: 'Transiciona o status de uma hipótese',
    description:
      'O banco valida a state machine. Validated exige experimento analyzed com result=validated.',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateHypothesisStatusRequest#' },
    response: {
      200: { $ref: 'Hypothesis#' },
      ...writeErrors,
    },
  },
  clone: {
    tags: ['Hypotheses'],
    summary: 'Clona uma hipótese preservando linhagem',
    description: 'Cria nova hipótese em formulated com cloned_from_id apontando para a original.',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      201: { $ref: 'Hypothesis#' },
      ...readErrors,
    },
  },
  delete: {
    tags: ['Hypotheses'],
    summary: 'Remove uma hipótese com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  updateScoring: {
    tags: ['Hypotheses'],
    summary: 'Atualiza scoring RICE/ICE da hipótese',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateScoringRequest#' },
    response: { 200: { $ref: 'Hypothesis#' }, ...writeErrors },
  },
};

export const roadmapRouteSchemas = {
  list: {
    tags: ['Roadmap'],
    summary: 'Lista itens de roadmap de um produto',
    description: 'Retorna os itens ordenados por path ltree, mantendo pai antes de filho.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'RoadmapItem#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Roadmap'],
    summary: 'Cria um item de roadmap',
    description: 'Cria initiative, epic ou feature; path ltree é calculado automaticamente.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateRoadmapItemRequest#' },
    response: {
      201: { $ref: 'RoadmapItem#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Roadmap'],
    summary: 'Busca um item de roadmap por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'RoadmapItem#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Roadmap'],
    summary: 'Atualiza campos de um item de roadmap',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateRoadmapItemRequest#' },
    response: {
      200: { $ref: 'RoadmapItem#' },
      ...writeErrors,
    },
  },
  transitionStatus: {
    tags: ['Roadmap'],
    summary: 'Transiciona o status de um item de roadmap',
    description:
      'O banco valida a state machine. Initiative/epic só podem ir para planned com hipótese validada vinculada.',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateRoadmapStatusRequest#' },
    response: {
      200: { $ref: 'RoadmapItem#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Roadmap'],
    summary: 'Remove um item de roadmap com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  updateScoring: {
    tags: ['Roadmap'],
    summary: 'Atualiza scoring RICE/ICE do item de roadmap',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateScoringRequest#' },
    response: { 200: { $ref: 'RoadmapItem#' }, ...writeErrors },
  },
};

export const evidenceRouteSchemas = {
  list: {
    tags: ['Evidences'],
    summary: 'Lista evidências de um produto',
    description: 'Retorna apenas evidências não removidas do workspace do token.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Evidence#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Evidences'],
    summary: 'Cria uma evidência',
    description: 'Cria uma evidência em status inicial new.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateEvidenceRequest#' },
    response: {
      201: { $ref: 'Evidence#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Evidences'],
    summary: 'Busca uma evidência por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'Evidence#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Evidences'],
    summary: 'Atualiza campos de uma evidência',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateEvidenceRequest#' },
    response: {
      200: { $ref: 'Evidence#' },
      ...writeErrors,
    },
  },
  transitionStatus: {
    tags: ['Evidences'],
    summary: 'Transiciona o status de uma evidência',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateEvidenceStatusRequest#' },
    response: {
      200: { $ref: 'Evidence#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Evidences'],
    summary: 'Remove uma evidência com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const analyticsRouteSchemas = {
  dashboard: {
    tags: ['Analytics'],
    summary: 'Consulta o dashboard agregado de produto/workspace',
    description:
      'Retorna KPIs agregados, funil de discovery, sinais de saúde, medições futuras e atividade recente com dados reais.',
    security: bearer,
    querystring: { $ref: 'DashboardFilterQuery#' },
    response: { 200: { $ref: 'DashboardAnalytics#' }, ...authErrors },
  },
  discoveryFunnel: {
    tags: ['Analytics'],
    summary: 'Consulta o funil de discovery',
    security: bearer,
    querystring: { $ref: 'ProductFilterQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  lifecycleHealth: {
    tags: ['Analytics'],
    summary: 'Consulta idade média e máxima por estado',
    security: bearer,
    querystring: { $ref: 'ProductFilterQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  hypothesisStats: {
    tags: ['Analytics'],
    summary: 'Consulta estatísticas de validação de hipóteses',
    security: bearer,
    querystring: { $ref: 'ProductFilterQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  roadmapCoverage: {
    tags: ['Analytics'],
    summary: 'Consulta cobertura estratégica do roadmap',
    security: bearer,
    querystring: { $ref: 'ProductFilterQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  painTraceability: {
    tags: ['Analytics'],
    summary: 'Consulta rastreabilidade completa de uma dor',
    security: bearer,
    querystring: { $ref: 'PainTraceabilityQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  statusTransitions: {
    tags: ['Analytics'],
    summary: 'Consulta histórico de transições de status',
    security: bearer,
    querystring: { $ref: 'StatusTransitionsQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  cycleTimes: {
    tags: ['Analytics'],
    summary: 'Consulta cycle time por tipo de entidade',
    security: bearer,
    querystring: { $ref: 'CycleTimesQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
  outcomesDashboard: {
    tags: ['Analytics'],
    summary: 'Consulta dashboard de outcomes',
    security: bearer,
    querystring: { $ref: 'ProductFilterQuery#' },
    response: { 200: { $ref: 'AnalyticsRows#' }, ...authErrors },
  },
};

export const productRouteSchemas = {
  list: {
    tags: ['Products'],
    summary: 'Lista produtos de um workspace',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Product#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Products'],
    summary: 'Cria um produto',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    body: { $ref: 'CreateProductRequest#' },
    response: {
      201: { $ref: 'Product#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Products'],
    summary: 'Busca um produto por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'Product#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Products'],
    summary: 'Atualiza campos de um produto',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateProductRequest#' },
    response: {
      200: { $ref: 'Product#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Products'],
    summary: 'Remove um produto com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const workspaceMemberRouteSchemas = {
  list: {
    tags: ['Workspace Members'],
    summary: 'Lista membros de um workspace',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'WorkspaceMember#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Workspace Members'],
    summary: 'Adiciona um membro ao workspace',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    body: { $ref: 'CreateWorkspaceMemberRequest#' },
    response: {
      201: { $ref: 'WorkspaceMember#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Workspace Members'],
    summary: 'Busca um membro do workspace por user_id',
    security: bearer,
    params: { $ref: 'WorkspaceMemberParams#' },
    response: {
      200: { $ref: 'WorkspaceMember#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Workspace Members'],
    summary: 'Atualiza role de um membro',
    security: bearer,
    params: { $ref: 'WorkspaceMemberParams#' },
    body: { $ref: 'UpdateWorkspaceMemberRequest#' },
    response: {
      200: { $ref: 'WorkspaceMember#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Workspace Members'],
    summary: 'Remove (soft delete) um membro do workspace',
    security: bearer,
    params: { $ref: 'WorkspaceMemberParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const experimentRouteSchemas = {
  list: {
    tags: ['Experiments'],
    summary: 'Lista experimentos de uma hipótese',
    security: bearer,
    params: { $ref: 'HypothesisIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Experiment#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Experiments'],
    summary: 'Cria um experimento',
    security: bearer,
    params: { $ref: 'HypothesisIdParams#' },
    body: { $ref: 'CreateExperimentRequest#' },
    response: {
      201: { $ref: 'Experiment#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Experiments'],
    summary: 'Busca um experimento por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Experiment#' }, ...readErrors },
  },
  update: {
    tags: ['Experiments'],
    summary: 'Atualiza campos de um experimento',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateExperimentRequest#' },
    response: { 200: { $ref: 'Experiment#' }, ...writeErrors },
  },
  transitionStatus: {
    tags: ['Experiments'],
    summary: 'Transiciona status (e resultado quando analyzed)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateExperimentStatusRequest#' },
    response: { 200: { $ref: 'Experiment#' }, ...writeErrors },
  },
  delete: {
    tags: ['Experiments'],
    summary: 'Remove um experimento (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const insightRouteSchemas = {
  list: {
    tags: ['Insights'],
    summary: 'Lista insights de um produto',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Insight#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Insights'],
    summary: 'Cria um insight',
    description:
      'Cria um insight associado ao produto. Evidências são vínculos opcionais adicionados depois via evidence_insight_links.',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateInsightRequest#' },
    response: {
      201: { $ref: 'Insight#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Insights'],
    summary: 'Busca um insight por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Insight#' }, ...readErrors },
  },
  update: {
    tags: ['Insights'],
    summary: 'Atualiza campos de um insight',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateInsightRequest#' },
    response: { 200: { $ref: 'Insight#' }, ...writeErrors },
  },
  delete: {
    tags: ['Insights'],
    summary: 'Remove um insight (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  listEvidences: {
    tags: ['Insights'],
    summary: 'Lista evidências vinculadas ao insight',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'LinkedEvidence#' } },
      ...readErrors,
    },
  },
  linkEvidence: {
    tags: ['Insights'],
    summary: 'Vincula uma evidência ao insight',
    security: bearer,
    params: { $ref: 'InsightEvidenceParams#' },
    response: {
      201: { $ref: 'InsightEvidenceLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkEvidence: {
    tags: ['Insights'],
    summary: 'Remove vínculo evidência ↔ insight',
    security: bearer,
    params: { $ref: 'InsightEvidenceParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const linkRouteSchemas = {
  listPainHypotheses: {
    tags: ['Links'],
    summary: 'Lista hipóteses vinculadas a uma dor',
    security: bearer,
    params: { $ref: 'PainIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'LinkedHypothesis#' } },
      ...readErrors,
    },
  },
  linkPainHypothesis: {
    tags: ['Links'],
    summary: 'Vincula dor ↔ hipótese',
    security: bearer,
    params: { $ref: 'PainHypothesisLinkParams#' },
    response: {
      201: { $ref: 'PainHypothesisLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkPainHypothesis: {
    tags: ['Links'],
    summary: 'Remove vínculo dor ↔ hipótese',
    security: bearer,
    params: { $ref: 'PainHypothesisLinkParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  listPainStrategicPillars: {
    tags: ['Links'],
    summary: 'Lista pilares estratégicos vinculados a uma dor',
    security: bearer,
    params: { $ref: 'PainIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'LinkedStrategicPillar#' } },
      ...readErrors,
    },
  },
  linkPainStrategicPillar: {
    tags: ['Links'],
    summary: 'Vincula dor ↔ pilar estratégico',
    security: bearer,
    params: { $ref: 'PainStrategicPillarLinkParams#' },
    response: {
      201: { $ref: 'PainStrategicPillarLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkPainStrategicPillar: {
    tags: ['Links'],
    summary: 'Remove vínculo dor ↔ pilar estratégico',
    security: bearer,
    params: { $ref: 'PainStrategicPillarLinkParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  listPainObjectives: {
    tags: ['Links'],
    summary: 'Lista objetivos/OKRs vinculados a uma dor',
    security: bearer,
    params: { $ref: 'PainIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'LinkedObjective#' } },
      ...readErrors,
    },
  },
  linkPainObjective: {
    tags: ['Links'],
    summary: 'Vincula dor ↔ objetivo/OKR',
    security: bearer,
    params: { $ref: 'PainObjectiveLinkParams#' },
    response: {
      201: { $ref: 'PainObjectiveLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkPainObjective: {
    tags: ['Links'],
    summary: 'Remove vínculo dor ↔ objetivo/OKR',
    security: bearer,
    params: { $ref: 'PainObjectiveLinkParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  listHypothesisRoadmap: {
    tags: ['Links'],
    summary: 'Lista itens de roadmap vinculados à hipótese',
    security: bearer,
    params: { $ref: 'HypothesisIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'LinkedRoadmapItem#' } },
      ...readErrors,
    },
  },
  linkHypothesisRoadmap: {
    tags: ['Links'],
    summary: 'Vincula hipótese ↔ roadmap item',
    security: bearer,
    params: { $ref: 'HypothesisRoadmapLinkParams#' },
    response: {
      201: { $ref: 'HypothesisRoadmapLink#' },
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  unlinkHypothesisRoadmap: {
    tags: ['Links'],
    summary: 'Remove vínculo hipótese ↔ roadmap item',
    security: bearer,
    params: { $ref: 'HypothesisRoadmapLinkParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const workspaceTeamRouteSchemas = {
  list: {
    tags: ['Workspace Teams'],
    summary: 'Lista grupos/times de um workspace',
    description: 'Retorna times do workspace com códigos humanos TM-XX e vínculos ativos.',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'WorkspaceTeam#' } },
      ...authErrors,
    },
  },
  create: {
    tags: ['Workspace Teams'],
    summary: 'Cria um grupo/time no workspace',
    description: 'Gera code TM-XX por workspace e aceita vínculos iniciais com membros/produtos.',
    security: bearer,
    params: { $ref: 'WorkspaceIdParams#' },
    body: { $ref: 'CreateWorkspaceTeamRequest#' },
    response: {
      201: { $ref: 'WorkspaceTeam#' },
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Workspace Teams'],
    summary: 'Busca um grupo/time por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      200: { $ref: 'WorkspaceTeam#' },
      ...readErrors,
    },
  },
  update: {
    tags: ['Workspace Teams'],
    summary: 'Atualiza campos de um grupo/time',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateWorkspaceTeamRequest#' },
    response: {
      200: { $ref: 'WorkspaceTeam#' },
      ...writeErrors,
    },
  },
  delete: {
    tags: ['Workspace Teams'],
    summary: 'Remove um grupo/time com soft delete',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
  addMember: {
    tags: ['Workspace Teams'],
    summary: 'Associa um membro do workspace ao grupo/time',
    security: bearer,
    params: { $ref: 'TeamMemberParams#' },
    response: {
      201: { $ref: 'WorkspaceTeam#' },
      ...writeErrors,
    },
  },
  removeMember: {
    tags: ['Workspace Teams'],
    summary: 'Remove um membro do grupo/time',
    security: bearer,
    params: { $ref: 'TeamMemberParams#' },
    response: {
      200: { $ref: 'WorkspaceTeam#' },
      ...writeErrors,
    },
  },
  addProduct: {
    tags: ['Workspace Teams'],
    summary: 'Associa um produto ao grupo/time',
    security: bearer,
    params: { $ref: 'TeamProductParams#' },
    response: {
      201: { $ref: 'WorkspaceTeam#' },
      ...writeErrors,
    },
  },
  removeProduct: {
    tags: ['Workspace Teams'],
    summary: 'Remove um produto do grupo/time',
    security: bearer,
    params: { $ref: 'TeamProductParams#' },
    response: {
      200: { $ref: 'WorkspaceTeam#' },
      ...writeErrors,
    },
  },
};

export const strategicPillarRouteSchemas = {
  list: {
    tags: ['Strategic Pillars'],
    summary: 'Lista pilares estratégicos de um produto',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'StrategicPillar#' } },
      ...readErrors,
    },
  },
  create: {
    tags: ['Strategic Pillars'],
    summary: 'Cria um pilar estratégico',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateStrategicPillarRequest#' },
    response: {
      201: { $ref: 'StrategicPillar#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Strategic Pillars'],
    summary: 'Busca um pilar estratégico por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'StrategicPillar#' }, ...readErrors },
  },
  update: {
    tags: ['Strategic Pillars'],
    summary: 'Atualiza um pilar estratégico',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateStrategicPillarRequest#' },
    response: { 200: { $ref: 'StrategicPillar#' }, ...writeErrors },
  },
  delete: {
    tags: ['Strategic Pillars'],
    summary: 'Remove um pilar estratégico (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const objectiveRouteSchemas = {
  list: {
    tags: ['Objectives'],
    summary: 'Lista objetivos (OKRs) de um produto',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Objective#' } },
      ...readErrors,
    },
  },
  create: {
    tags: ['Objectives'],
    summary: 'Cria um objetivo',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateObjectiveRequest#' },
    response: {
      201: { $ref: 'Objective#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Objectives'],
    summary: 'Busca um objetivo por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Objective#' }, ...readErrors },
  },
  update: {
    tags: ['Objectives'],
    summary: 'Atualiza campos de um objetivo',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateObjectiveRequest#' },
    response: { 200: { $ref: 'Objective#' }, ...writeErrors },
  },
  transitionStatus: {
    tags: ['Objectives'],
    summary: 'Transiciona status do objetivo (lifecycle)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateObjectiveStatusRequest#' },
    response: {
      200: { $ref: 'Objective#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  delete: {
    tags: ['Objectives'],
    summary: 'Remove um objetivo (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const keyResultRouteSchemas = {
  list: {
    tags: ['Key Results'],
    summary: 'Lista key results de um objetivo',
    security: bearer,
    params: { $ref: 'ObjectiveIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'KeyResult#' } },
      ...readErrors,
    },
  },
  create: {
    tags: ['Key Results'],
    summary: 'Cria um key result',
    security: bearer,
    params: { $ref: 'ObjectiveIdParams#' },
    body: { $ref: 'CreateKeyResultRequest#' },
    response: {
      201: { $ref: 'KeyResult#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Key Results'],
    summary: 'Busca um key result por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'KeyResult#' }, ...readErrors },
  },
  update: {
    tags: ['Key Results'],
    summary: 'Atualiza um key result',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateKeyResultRequest#' },
    response: { 200: { $ref: 'KeyResult#' }, ...writeErrors },
  },
  delete: {
    tags: ['Key Results'],
    summary: 'Remove um key result (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const outcomeRouteSchemas = {
  list: {
    tags: ['Outcomes'],
    summary: 'Lista outcomes de um item de roadmap',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'Outcome#' } },
      ...readErrors,
    },
  },
  create: {
    tags: ['Outcomes'],
    summary: 'Cria um outcome para um item de roadmap',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    body: { $ref: 'CreateOutcomeRequest#' },
    response: {
      201: { $ref: 'Outcome#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Outcomes'],
    summary: 'Busca um outcome por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Outcome#' }, ...readErrors },
  },
  update: {
    tags: ['Outcomes'],
    summary: 'Atualiza campos de um outcome',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateOutcomeRequest#' },
    response: { 200: { $ref: 'Outcome#' }, ...writeErrors },
  },
  transitionStatus: {
    tags: ['Outcomes'],
    summary: 'Transiciona status do outcome (lifecycle)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateOutcomeStatusRequest#' },
    response: {
      200: { $ref: 'Outcome#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  delete: {
    tags: ['Outcomes'],
    summary: 'Remove um outcome (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const prdRouteSchemas = {
  list: {
    tags: ['PRDs'],
    summary: 'Lista versões de PRD de um item de roadmap',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    response: { 200: { type: 'array', items: { $ref: 'Prd#' } }, ...readErrors },
  },
  create: {
    tags: ['PRDs'],
    summary: 'Cria nova versão de PRD',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    body: { $ref: 'CreatePrdRequest#' },
    response: {
      201: { $ref: 'Prd#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['PRDs'],
    summary: 'Busca PRD por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Prd#' }, ...readErrors },
  },
  update: {
    tags: ['PRDs'],
    summary: 'Atualiza PRD em draft',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdatePrdRequest#' },
    response: { 200: { $ref: 'Prd#' }, ...writeErrors },
  },
  transitionStatus: {
    tags: ['PRDs'],
    summary: 'Transiciona status do PRD',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdatePrdStatusRequest#' },
    response: { 200: { $ref: 'Prd#' }, ...writeErrors },
  },
  delete: {
    tags: ['PRDs'],
    summary: 'Remove PRD (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: {
      204: { type: 'null' },
      401: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
  },
};

export const releaseRouteSchemas = {
  list: {
    tags: ['Releases'],
    summary: 'Lista releases de um produto',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    response: { 200: { type: 'array', items: { $ref: 'Release#' } }, ...readErrors },
  },
  create: {
    tags: ['Releases'],
    summary: 'Cria uma release',
    security: bearer,
    params: { $ref: 'ProductIdParams#' },
    body: { $ref: 'CreateReleaseRequest#' },
    response: {
      201: { $ref: 'Release#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Releases'],
    summary: 'Busca release por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'Release#' }, ...readErrors },
  },
  update: {
    tags: ['Releases'],
    summary: 'Atualiza metadados da release',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateReleaseRequest#' },
    response: { 200: { $ref: 'Release#' }, ...writeErrors },
  },
};

export const handoffRouteSchemas = {
  list: {
    tags: ['Engineering Handoffs'],
    summary: 'Lista handoffs de um item de roadmap',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    response: {
      200: { type: 'array', items: { $ref: 'EngineeringHandoff#' } },
      ...readErrors,
    },
  },
  create: {
    tags: ['Engineering Handoffs'],
    summary: 'Registra handoff para engenharia',
    security: bearer,
    params: { $ref: 'RoadmapItemIdParams#' },
    body: { $ref: 'CreateHandoffRequest#' },
    response: {
      201: { $ref: 'EngineeringHandoff#' },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      422: errorResponse,
      500: errorResponse,
    },
  },
  get: {
    tags: ['Engineering Handoffs'],
    summary: 'Busca handoff por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'EngineeringHandoff#' }, ...readErrors },
  },
  update: {
    tags: ['Engineering Handoffs'],
    summary: 'Atualiza handoff',
    security: bearer,
    params: { $ref: 'IdParams#' },
    body: { $ref: 'UpdateHandoffRequest#' },
    response: { 200: { $ref: 'EngineeringHandoff#' }, ...writeErrors },
  },
};

export const platformRouteSchemas = {
  listComments: {
    tags: ['Platform'],
    summary: 'Lista comentários de uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    response: { 200: { type: 'array', items: { $ref: 'Comment#' } }, ...readErrors },
  },
  createComment: {
    tags: ['Platform'],
    summary: 'Comenta em uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    body: { $ref: 'CreateCommentRequest#' },
    response: { 201: { $ref: 'Comment#' }, ...writeErrors },
  },
  deleteComment: {
    tags: ['Platform'],
    summary: 'Remove comentário (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 204: { type: 'null' }, ...readErrors },
  },
  listAssignments: {
    tags: ['Platform'],
    summary: 'Lista atribuições ativas de uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    response: { 200: { type: 'array', items: { $ref: 'EntityAssignment#' } }, ...readErrors },
  },
  createAssignment: {
    tags: ['Platform'],
    summary: 'Cria atribuição de owner/responsável',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    body: { $ref: 'CreateAssignmentRequest#' },
    response: { 201: { $ref: 'EntityAssignment#' }, ...writeErrors },
  },
  closeAssignment: {
    tags: ['Platform'],
    summary: 'Encerra uma atribuição',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 204: { type: 'null' }, ...readErrors },
  },
  listDecisionLogs: {
    tags: ['Platform'],
    summary: 'Lista decisões registradas em uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    response: { 200: { type: 'array', items: { $ref: 'DecisionLog#' } }, ...readErrors },
  },
  createDecisionLog: {
    tags: ['Platform'],
    summary: 'Registra uma decisão em uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    body: { $ref: 'CreateDecisionLogRequest#' },
    response: { 201: { $ref: 'DecisionLog#' }, ...writeErrors },
  },
  deleteDecisionLog: {
    tags: ['Platform'],
    summary: 'Remove decisão (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 204: { type: 'null' }, ...readErrors },
  },
  listEvents: {
    tags: ['Platform'],
    summary: 'Lista eventos técnicos de uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    response: { 200: { type: 'array', items: { $ref: 'EntityEvent#' } }, ...readErrors },
  },
  listMediaAssets: {
    tags: ['Platform'],
    summary: 'Lista assets do workspace',
    security: bearer,
    response: { 200: { type: 'array', items: { $ref: 'MediaAsset#' } }, ...authErrors },
  },
  createMediaAsset: {
    tags: ['Platform'],
    summary: 'Registra um asset de mídia',
    security: bearer,
    body: { $ref: 'CreateMediaAssetRequest#' },
    response: { 201: { $ref: 'MediaAsset#' }, ...writeErrors },
  },
  getMediaAsset: {
    tags: ['Platform'],
    summary: 'Busca asset por ID',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 200: { $ref: 'MediaAsset#' }, ...readErrors },
  },
  deleteMediaAsset: {
    tags: ['Platform'],
    summary: 'Remove asset (soft delete)',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 204: { type: 'null' }, ...readErrors },
  },
  listEntityAssets: {
    tags: ['Platform'],
    summary: 'Lista assets anexados a uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    response: { 200: { type: 'array', items: { $ref: 'AssetAttachment#' } }, ...readErrors },
  },
  attachAsset: {
    tags: ['Platform'],
    summary: 'Anexa asset a uma entidade',
    security: bearer,
    params: { $ref: 'EntityParams#' },
    body: { $ref: 'AttachAssetRequest#' },
    response: { 201: { $ref: 'AssetAttachment#' }, ...writeErrors },
  },
  detachAsset: {
    tags: ['Platform'],
    summary: 'Remove vínculo de asset com entidade',
    security: bearer,
    params: { $ref: 'IdParams#' },
    response: { 204: { type: 'null' }, ...readErrors },
  },
};
