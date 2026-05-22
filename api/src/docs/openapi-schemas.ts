import { FastifyInstance } from 'fastify';
import { PAIN_STATUSES } from '../modules/pains/pains.schemas';
import { HYPOTHESIS_STATUSES } from '../modules/hypotheses/hypotheses.schemas';
import { EVIDENCE_SOURCES, EVIDENCE_STATUSES } from '../modules/evidences/evidences.schemas';
import { DELIVERY_STATUSES, DELIVERY_TYPES } from '../modules/roadmap/roadmap.schemas';
import {
  EXPERIMENT_METHODS,
  EXPERIMENT_RESULTS,
  EXPERIMENT_STATUSES,
} from '../modules/experiments/experiments.schemas';
import { OBJECTIVE_STATUSES } from '../modules/objectives/objectives.schemas';
import { OUTCOME_STATUSES } from '../modules/outcomes/outcomes.schemas';
import { PRD_STATUSES } from '../modules/prds/prds.schemas';
import { SCORING_METHODS } from '../shared/scoring';
import { ENTITY_TYPES } from '../shared/entity-types';
import {
  ASSET_ATTACHABLE_TYPES,
  VISIBILITY_LEVELS,
} from '../modules/platform/platform.schemas';

const uuid = { type: 'string', format: 'uuid' } as const;
const date = { type: 'string', format: 'date' } as const;
const dateTime = { type: 'string', format: 'date-time' } as const;
const nullableUuid = { ...uuid, nullable: true } as const;
const nullableString = { type: 'string', nullable: true } as const;
const nullableNumber = { type: 'number', nullable: true } as const;
const nullableInteger = { type: 'integer', nullable: true } as const;
const nullableDate = { ...date, nullable: true } as const;
const nullableDateTime = { ...dateTime, nullable: true } as const;

export function registerOpenApiSchemas(app: FastifyInstance) {
  app.addSchema({
    $id: 'ErrorResponse',
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  });

  app.addSchema({
    $id: 'HealthResponse',
    type: 'object',
    required: ['status', 'timestamp'],
    properties: {
      status: { type: 'string' },
      timestamp: dateTime,
    },
  });

  app.addSchema({
    $id: 'IdParams',
    type: 'object',
    required: ['id'],
    properties: { id: uuid },
  });

  app.addSchema({
    $id: 'ProductIdParams',
    type: 'object',
    required: ['product_id'],
    properties: { product_id: uuid },
  });

  app.addSchema({
    $id: 'ProductFilterQuery',
    type: 'object',
    properties: { product_id: uuid },
  });

  app.addSchema({
    $id: 'DashboardFilterQuery',
    type: 'object',
    properties: {
      product_id: uuid,
      period: { type: 'string', enum: ['today', 'week', 'month', 'quarter', 'year'] },
    },
  });

  app.addSchema({
    $id: 'LoginRequest',
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 12, maxLength: 128 },
    },
  });

  app.addSchema({
    $id: 'LoginResponse',
    type: 'object',
    required: ['token', 'user', 'workspace'],
    properties: {
      token: { type: 'string', description: 'JWT usado no botão Authorize da API Reference' },
      user: {
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
          id: uuid,
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      workspace: {
        type: 'object',
        required: ['id', 'slug', 'name', 'role'],
        properties: {
          id: uuid,
          slug: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer', 'guest'] },
        },
      },
      workspaces: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'slug', 'name', 'role'],
          properties: {
            id: uuid,
            slug: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer', 'guest'] },
          },
        },
      },
    },
  });

  app.addSchema({
    $id: 'Pain',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'code',
      'title',
      'description',
      'status',
      'severity',
      'reach_estimate',
      'discard_reason',
      'owner_id',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^PN-[0-9]+$' },
      parent_pain_id: nullableUuid,
      root_pain_id: nullableUuid,
      title: { type: 'string' },
      description: nullableString,
      status: { type: 'string', enum: PAIN_STATUSES },
      severity: nullableInteger,
      reach_estimate: nullableInteger,
      priority_score: nullableNumber,
      scoring_method: nullableString,
      scoring_payload: { type: 'object', additionalProperties: true },
      discard_reason: nullableString,
      owner_id: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreatePainRequest',
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string' },
      severity: { type: 'integer', minimum: 1, maximum: 5 },
      reach_estimate: { type: 'integer', minimum: 0 },
      owner_id: uuid,
    },
  });

  app.addSchema({
    $id: 'UpdatePainRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      product_id: uuid,
      description: nullableString,
      severity: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
      reach_estimate: { type: 'integer', minimum: 0, nullable: true },
      owner_id: nullableUuid,
    },
  });

  app.addSchema({
    $id: 'UpdatePainStatusRequest',
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: PAIN_STATUSES },
      discard_reason: { type: 'string', description: 'Obrigatório quando status = discarded' },
    },
  });

  app.addSchema({
    $id: 'Hypothesis',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'code',
      'title',
      'if_clause',
      'then_clause',
      'because_clause',
      'assumptions',
      'status',
      'confidence',
      'outcome_summary',
      'cloned_from_id',
      'owner_id',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^HP-[0-9]+$' },
      title: { type: 'string' },
      if_clause: { type: 'string' },
      then_clause: { type: 'string' },
      because_clause: { type: 'string' },
      assumptions: { type: 'array', items: {} },
      status: { type: 'string', enum: HYPOTHESIS_STATUSES },
      confidence: nullableInteger,
      outcome_summary: nullableString,
      cloned_from_id: nullableUuid,
      owner_id: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateHypothesisRequest',
    type: 'object',
    required: ['title', 'if_clause', 'then_clause', 'because_clause'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      if_clause: { type: 'string', minLength: 1 },
      then_clause: { type: 'string', minLength: 1 },
      because_clause: { type: 'string', minLength: 1 },
      assumptions: { type: 'array', items: {} },
      confidence: { type: 'integer', minimum: 1, maximum: 5 },
      owner_id: uuid,
      cloned_from_id: uuid,
    },
  });

  app.addSchema({
    $id: 'UpdateHypothesisRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      if_clause: { type: 'string', minLength: 1 },
      then_clause: { type: 'string', minLength: 1 },
      because_clause: { type: 'string', minLength: 1 },
      assumptions: { type: 'array', items: {} },
      confidence: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
      outcome_summary: nullableString,
      owner_id: nullableUuid,
    },
  });

  app.addSchema({
    $id: 'UpdateHypothesisStatusRequest',
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: HYPOTHESIS_STATUSES },
      outcome_summary: {
        type: 'string',
        description: 'Obrigatório quando status = invalidated ou discarded',
      },
    },
  });

  app.addSchema({
    $id: 'Evidence',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'code',
      'title',
      'content',
      'source',
      'source_url',
      'customer_identifier',
      'status',
      'collected_at',
      'created_by',
      'metadata',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^EV-[0-9]+$' },
      title: { type: 'string' },
      content: { type: 'string' },
      source: { type: 'string', enum: EVIDENCE_SOURCES },
      source_url: nullableString,
      customer_identifier: nullableString,
      status: { type: 'string', enum: EVIDENCE_STATUSES },
      collected_at: dateTime,
      created_by: nullableUuid,
      metadata: { type: 'object', additionalProperties: true },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateEvidenceRequest',
    type: 'object',
    required: ['title', 'content', 'source', 'collected_at'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string' },
      source: { type: 'string', enum: EVIDENCE_SOURCES },
      source_url: { type: 'string', format: 'uri', nullable: true },
      customer_identifier: { type: 'string', nullable: true },
      collected_at: { type: 'string', format: 'date-time' },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'UpdateEvidenceRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string' },
      source: { type: 'string', enum: EVIDENCE_SOURCES },
      source_url: { type: 'string', format: 'uri', nullable: true },
      customer_identifier: { type: 'string', nullable: true },
      collected_at: { type: 'string', format: 'date-time', nullable: true },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'UpdateEvidenceStatusRequest',
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: EVIDENCE_STATUSES },
    },
  });

  app.addSchema({
    $id: 'RoadmapItem',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'code',
      'parent_id',
      'path',
      'type',
      'title',
      'description',
      'status',
      'planned_start',
      'planned_end',
      'actual_start',
      'actual_end',
      'effort_estimate',
      'priority_score',
      'priority_breakdown',
      'external_system',
      'external_id',
      'external_url',
      'external_status',
      'external_synced_at',
      'pillar_id',
      'cancel_reason',
      'rollback_reason',
      'owner_id',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^RM-[0-9]+$' },
      parent_id: nullableUuid,
      path: nullableString,
      type: { type: 'string', enum: DELIVERY_TYPES },
      title: { type: 'string' },
      description: nullableString,
      status: { type: 'string', enum: DELIVERY_STATUSES },
      planned_start: nullableDate,
      planned_end: nullableDate,
      actual_start: nullableDate,
      actual_end: nullableDate,
      effort_estimate: nullableString,
      priority_score: nullableNumber,
      priority_breakdown: { type: 'object', nullable: true, additionalProperties: true },
      external_system: nullableString,
      external_id: nullableString,
      external_url: nullableString,
      external_status: nullableString,
      external_synced_at: nullableDateTime,
      pillar_id: nullableUuid,
      cancel_reason: nullableString,
      rollback_reason: nullableString,
      owner_id: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateRoadmapItemRequest',
    type: 'object',
    required: ['type', 'title'],
    properties: {
      parent_id: uuid,
      type: { type: 'string', enum: DELIVERY_TYPES },
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string' },
      planned_start: date,
      planned_end: date,
      effort_estimate: { type: 'string' },
      priority_score: { type: 'number' },
      pillar_id: uuid,
      owner_id: uuid,
      external_system: { type: 'string' },
      external_id: { type: 'string' },
      external_url: { type: 'string', format: 'uri' },
    },
  });

  app.addSchema({
    $id: 'UpdateRoadmapItemRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: nullableString,
      planned_start: nullableDate,
      planned_end: nullableDate,
      actual_start: nullableDate,
      actual_end: nullableDate,
      effort_estimate: nullableString,
      priority_score: nullableNumber,
      pillar_id: nullableUuid,
      owner_id: nullableUuid,
      external_system: nullableString,
      external_id: nullableString,
      external_url: { type: 'string', format: 'uri', nullable: true },
      external_status: nullableString,
    },
  });

  app.addSchema({
    $id: 'UpdateRoadmapStatusRequest',
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: DELIVERY_STATUSES },
      cancel_reason: { type: 'string', description: 'Obrigatório quando status = cancelled' },
      rollback_reason: { type: 'string', description: 'Obrigatório quando status = rolled_back' },
    },
  });

  app.addSchema({
    $id: 'AnalyticsRow',
    type: 'object',
    additionalProperties: true,
  });

  app.addSchema({
    $id: 'AnalyticsRows',
    type: 'array',
    items: { $ref: 'AnalyticsRow#' },
  });

  app.addSchema({
    $id: 'AnalyticsStatusCount',
    type: 'object',
    required: ['status', 'count'],
    properties: {
      status: { type: 'string' },
      count: { type: 'integer' },
    },
  });

  app.addSchema({
    $id: 'DashboardAnalytics',
    type: 'object',
    required: [
      'product_id',
      'generated_at',
      'totals',
      'evidences_by_status',
      'pains_by_status',
      'hypotheses_by_status',
      'experiments_by_status',
      'experiment_results',
      'roadmap_by_status',
      'outcomes_by_status',
      'objectives_by_status',
      'discovery_funnel',
      'health',
      'upcoming_measurements',
      'recent_activity',
    ],
    properties: {
      product_id: nullableUuid,
      generated_at: dateTime,
      totals: {
        type: 'object',
        required: [
          'evidences',
          'pains',
          'hypotheses',
          'experiments',
          'roadmap_items',
          'insights',
          'outcomes',
          'objectives',
          'key_results',
        ],
        properties: {
          evidences: { type: 'integer' },
          pains: { type: 'integer' },
          hypotheses: { type: 'integer' },
          experiments: { type: 'integer' },
          roadmap_items: { type: 'integer' },
          insights: { type: 'integer' },
          outcomes: { type: 'integer' },
          objectives: { type: 'integer' },
          key_results: { type: 'integer' },
        },
      },
      evidences_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      pains_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      hypotheses_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      experiments_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      experiment_results: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      roadmap_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      outcomes_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      objectives_by_status: { type: 'array', items: { $ref: 'AnalyticsStatusCount#' } },
      discovery_funnel: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'label', 'count', 'conversion_rate'],
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            count: { type: 'integer' },
            conversion_rate: nullableInteger,
          },
        },
      },
      health: {
        type: 'object',
        required: [
          'hypothesis_invalidation_rate',
          'avg_investigating_pain_age_days',
          'roadmap_strategic_coverage_rate',
        ],
        properties: {
          hypothesis_invalidation_rate: nullableInteger,
          avg_investigating_pain_age_days: nullableInteger,
          roadmap_strategic_coverage_rate: nullableInteger,
        },
      },
      upcoming_measurements: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'outcome_code',
            'roadmap_code',
            'roadmap_title',
            'hypothesized_impact',
            'status',
            'due_at',
          ],
          properties: {
            outcome_code: { type: 'string' },
            roadmap_code: { type: 'string' },
            roadmap_title: { type: 'string' },
            hypothesized_impact: { type: 'string' },
            status: { type: 'string' },
            due_at: dateTime,
          },
        },
      },
      recent_activity: {
        type: 'array',
        items: {
          type: 'object',
          required: ['entity_type', 'event_type', 'code', 'title', 'actor_name', 'to_status', 'occurred_at'],
          properties: {
            entity_type: { type: 'string' },
            event_type: { type: 'string' },
            code: nullableString,
            title: nullableString,
            actor_name: nullableString,
            to_status: nullableString,
            occurred_at: dateTime,
          },
        },
      },
    },
  });

  app.addSchema({
    $id: 'PainTraceabilityQuery',
    type: 'object',
    required: ['id'],
    properties: { id: uuid },
  });

  app.addSchema({
    $id: 'StatusTransitionsQuery',
    type: 'object',
    properties: {
      entity_type: {
        type: 'string',
        enum: ['pains', 'hypotheses', 'experiments', 'evidences', 'roadmap_items', 'outcomes', 'objectives'],
      },
      entity_id: uuid,
    },
  });

  app.addSchema({
    $id: 'WorkspaceMember',
    type: 'object',
    required: ['workspace_id', 'user_id', 'name', 'email', 'role', 'joined_at', 'removed_at', 'updated_at'],
    properties: {
      workspace_id: uuid,
      user_id: uuid,
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer', 'guest'] },
      job_function: {
        type: 'string',
        enum: ['CEO', 'CPO', 'GPM', 'PM', 'PD', 'UX', 'PO'],
        nullable: true,
      },
      joined_at: dateTime,
      last_accessed_at: nullableDateTime,
      onboarded_at: nullableDateTime,
      removed_at: nullableDateTime,
      updated_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'CreateWorkspaceMemberRequest',
    type: 'object',
    required: ['user_id'],
    properties: {
      user_id: uuid,
      role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer', 'guest'], nullable: true },
      job_function: {
        type: 'string',
        enum: ['CEO', 'CPO', 'GPM', 'PM', 'PD', 'UX', 'PO'],
        nullable: true,
      },
    },
  });

  app.addSchema({
    $id: 'UpdateWorkspaceMemberRequest',
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer', 'guest'] },
      job_function: {
        type: 'string',
        enum: ['CEO', 'CPO', 'GPM', 'PM', 'PD', 'UX', 'PO'],
        nullable: true,
      },
    },
  });

  app.addSchema({
    $id: 'WorkspaceIdParams',
    type: 'object',
    properties: {
      workspace_id: uuid,
    },
    required: ['workspace_id'],
  });

  app.addSchema({
    $id: 'WorkspaceMemberParams',
    type: 'object',
    properties: {
      workspace_id: uuid,
      user_id: uuid,
    },
    required: ['workspace_id', 'user_id'],
  });

  app.addSchema({
    $id: 'WorkspaceTeam',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'code',
      'name',
      'description',
      'color',
      'member_ids',
      'product_ids',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      code: { type: 'string', pattern: '^TM-[0-9]+$' },
      name: { type: 'string' },
      description: nullableString,
      color: nullableString,
      member_ids: { type: 'array', items: uuid },
      product_ids: { type: 'array', items: uuid },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateWorkspaceTeamRequest',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', maxLength: 2000 },
      color: { type: 'string', maxLength: 80 },
      product_ids: { type: 'array', items: uuid },
      member_ids: { type: 'array', items: uuid },
    },
  });

  app.addSchema({
    $id: 'UpdateWorkspaceTeamRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', maxLength: 2000, nullable: true },
      color: { type: 'string', maxLength: 80, nullable: true },
    },
  });

  app.addSchema({
    $id: 'TeamMemberParams',
    type: 'object',
    properties: {
      id: uuid,
      user_id: uuid,
    },
    required: ['id', 'user_id'],
  });

  app.addSchema({
    $id: 'TeamProductParams',
    type: 'object',
    properties: {
      id: uuid,
      product_id: uuid,
    },
    required: ['id', 'product_id'],
  });

  app.addSchema({
    $id: 'Product',
    type: 'object',
    required: ['id', 'workspace_id', 'name', 'vision', 'metadata', 'created_at', 'updated_at', 'deleted_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      name: { type: 'string' },
      vision: nullableString,
      metadata: { type: 'object', additionalProperties: true },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'Persona',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'code',
      'name',
      'description',
      'segment_size_estimate',
      'metadata',
      'pain_ids',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      code: { type: 'string', pattern: '^PS-[0-9]+$' },
      name: { type: 'string' },
      description: nullableString,
      segment_size_estimate: nullableInteger,
      metadata: { type: 'object', additionalProperties: true },
      pain_ids: { type: 'array', items: uuid },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreatePersonaRequest',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 200 },
      description: { type: 'string', maxLength: 2000 },
      segment_size_estimate: { type: 'integer', minimum: 0 },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'UpdatePersonaRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 200 },
      description: { type: 'string', maxLength: 2000, nullable: true },
      segment_size_estimate: { type: 'integer', minimum: 0, nullable: true },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'CreateProductRequest',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 200 },
      vision: { type: 'string', minLength: 1, maxLength: 2000, nullable: true },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'UpdateProductRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 200 },
      vision: { type: 'string', minLength: 1, maxLength: 2000, nullable: true },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'CycleTimesQuery',
    type: 'object',
    properties: {
      entity_type: {
        type: 'string',
        enum: ['pains', 'hypotheses', 'experiments', 'evidences', 'roadmap_items', 'outcomes', 'objectives'],
      },
    },
  });

  app.addSchema({
    $id: 'HypothesisIdParams',
    type: 'object',
    required: ['hypothesis_id'],
    properties: { hypothesis_id: uuid },
  });

  app.addSchema({
    $id: 'PainIdParams',
    type: 'object',
    required: ['pain_id'],
    properties: { pain_id: uuid },
  });

  app.addSchema({
    $id: 'PainHypothesisLinkParams',
    type: 'object',
    required: ['pain_id', 'hypothesis_id'],
    properties: { pain_id: uuid, hypothesis_id: uuid },
  });

  app.addSchema({
    $id: 'PainPersonaLinkParams',
    type: 'object',
    required: ['pain_id', 'persona_id'],
    properties: { pain_id: uuid, persona_id: uuid },
  });

  app.addSchema({
    $id: 'PainStrategicPillarLinkParams',
    type: 'object',
    required: ['pain_id', 'pillar_id'],
    properties: { pain_id: uuid, pillar_id: uuid },
  });

  app.addSchema({
    $id: 'PainObjectiveLinkParams',
    type: 'object',
    required: ['pain_id', 'objective_id'],
    properties: { pain_id: uuid, objective_id: uuid },
  });

  app.addSchema({
    $id: 'HypothesisRoadmapLinkParams',
    type: 'object',
    required: ['hypothesis_id', 'roadmap_item_id'],
    properties: { hypothesis_id: uuid, roadmap_item_id: uuid },
  });

  app.addSchema({
    $id: 'InsightEvidenceParams',
    type: 'object',
    required: ['id', 'evidence_id'],
    properties: { id: uuid, evidence_id: uuid },
  });

  app.addSchema({
    $id: 'Experiment',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'hypothesis_id',
      'code',
      'title',
      'method',
      'success_criteria',
      'status',
      'created_at',
      'updated_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      hypothesis_id: uuid,
      code: { type: 'string', pattern: '^EX-[0-9]+$' },
      title: { type: 'string' },
      method: { type: 'string', enum: EXPERIMENT_METHODS },
      success_criteria: { type: 'string' },
      sample_target: nullableInteger,
      sample_actual: nullableInteger,
      status: { type: 'string', enum: EXPERIMENT_STATUSES },
      result: { type: 'string', enum: EXPERIMENT_RESULTS, nullable: true },
      learnings: nullableString,
      started_at: nullableDateTime,
      ended_at: nullableDateTime,
      owner_id: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateExperimentRequest',
    type: 'object',
    required: ['title', 'method', 'success_criteria'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      method: { type: 'string', enum: EXPERIMENT_METHODS },
      success_criteria: { type: 'string', minLength: 10 },
      sample_target: { type: 'integer', minimum: 1 },
      owner_id: uuid,
    },
  });

  app.addSchema({
    $id: 'UpdateExperimentRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      method: { type: 'string', enum: EXPERIMENT_METHODS },
      success_criteria: { type: 'string', minLength: 10 },
      sample_target: { type: 'integer', minimum: 1, nullable: true },
      sample_actual: { type: 'integer', minimum: 0, nullable: true },
      learnings: { type: 'string', nullable: true },
      owner_id: { ...uuid, nullable: true },
    },
  });

  app.addSchema({
    $id: 'UpdateExperimentStatusRequest',
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: EXPERIMENT_STATUSES },
      result: { type: 'string', enum: EXPERIMENT_RESULTS },
      learnings: { type: 'string' },
    },
  });

  app.addSchema({
    $id: 'Insight',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'product_id',
      'code',
      'title',
      'description',
      'evidence_count',
      'created_at',
      'updated_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^IN-[0-9]+$' },
      title: { type: 'string' },
      description: { type: 'string' },
      confidence_score: nullableNumber,
      impact_score: nullableNumber,
      frequency_score: nullableNumber,
      evidence_count: { type: 'integer' },
      owner_id: nullableUuid,
      metadata: { type: 'object', additionalProperties: true },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateInsightRequest',
    type: 'object',
    required: ['title', 'description'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', minLength: 1 },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
      impact_score: { type: 'number', minimum: 0, maximum: 1 },
      frequency_score: { type: 'number', minimum: 0, maximum: 1 },
      owner_id: uuid,
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'UpdateInsightRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', minLength: 1 },
      confidence_score: { type: 'number', minimum: 0, maximum: 1, nullable: true },
      impact_score: { type: 'number', minimum: 0, maximum: 1, nullable: true },
      frequency_score: { type: 'number', minimum: 0, maximum: 1, nullable: true },
      owner_id: { ...uuid, nullable: true },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'LinkedEvidence',
    type: 'object',
    properties: {
      id: uuid,
      code: { type: 'string' },
      title: { type: 'string' },
      source: { type: 'string' },
      status: { type: 'string' },
      collected_at: dateTime,
      linked_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'InsightEvidenceLink',
    type: 'object',
    required: ['insight_id', 'evidence_id'],
    properties: { insight_id: uuid, evidence_id: uuid },
  });

  app.addSchema({
    $id: 'LinkedHypothesis',
    type: 'object',
    properties: {
      id: uuid,
      title: { type: 'string' },
      status: { type: 'string' },
      linked_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'PainHypothesisLink',
    type: 'object',
    required: ['pain_id', 'hypothesis_id'],
    properties: { pain_id: uuid, hypothesis_id: uuid },
  });

  app.addSchema({
    $id: 'PainPersonaLink',
    type: 'object',
    required: ['pain_id', 'persona_id'],
    properties: { pain_id: uuid, persona_id: uuid },
  });

  app.addSchema({
    $id: 'LinkedStrategicPillar',
    type: 'object',
    properties: {
      id: uuid,
      code: { type: 'string' },
      name: { type: 'string' },
      color: nullableString,
      linked_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'PainStrategicPillarLink',
    type: 'object',
    required: ['pain_id', 'pillar_id'],
    properties: { pain_id: uuid, pillar_id: uuid },
  });

  app.addSchema({
    $id: 'LinkedObjective',
    type: 'object',
    properties: {
      id: uuid,
      code: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'string' },
      linked_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'PainObjectiveLink',
    type: 'object',
    required: ['pain_id', 'objective_id'],
    properties: { pain_id: uuid, objective_id: uuid },
  });

  app.addSchema({
    $id: 'LinkedRoadmapItem',
    type: 'object',
    properties: {
      id: uuid,
      title: { type: 'string' },
      type: { type: 'string' },
      status: { type: 'string' },
      linked_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'HypothesisRoadmapLink',
    type: 'object',
    required: ['hypothesis_id', 'roadmap_item_id'],
    properties: { hypothesis_id: uuid, roadmap_item_id: uuid },
  });

  app.addSchema({
    $id: 'ObjectiveIdParams',
    type: 'object',
    required: ['objective_id'],
    properties: { objective_id: uuid },
  });

  app.addSchema({
    $id: 'RoadmapItemIdParams',
    type: 'object',
    required: ['roadmap_item_id'],
    properties: { roadmap_item_id: uuid },
  });

  app.addSchema({
    $id: 'StrategicPillar',
    type: 'object',
    required: ['id', 'workspace_id', 'product_id', 'code', 'name', 'position', 'created_at', 'updated_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^PL-[0-9]+$' },
      name: { type: 'string' },
      description: nullableString,
      color: nullableString,
      position: { type: 'integer' },
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateStrategicPillarRequest',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', maxLength: 2000 },
      color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
      position: { type: 'integer', minimum: 0 },
    },
  });

  app.addSchema({
    $id: 'UpdateStrategicPillarRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', maxLength: 2000, nullable: true },
      color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', nullable: true },
      position: { type: 'integer', minimum: 0 },
    },
  });

  app.addSchema({
    $id: 'Objective',
    type: 'object',
    required: ['id', 'workspace_id', 'product_id', 'code', 'title', 'status', 'created_at', 'updated_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      code: { type: 'string', pattern: '^OKR-[0-9]+$' },
      title: { type: 'string' },
      description: nullableString,
      status: { type: 'string', enum: OBJECTIVE_STATUSES },
      horizon_start: nullableDate,
      horizon_end: nullableDate,
      pillar_id: nullableUuid,
      owner_id: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateObjectiveRequest',
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', maxLength: 5000 },
      horizon_start: date,
      horizon_end: date,
      pillar_id: uuid,
      owner_id: uuid,
    },
  });

  app.addSchema({
    $id: 'UpdateObjectiveRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', maxLength: 5000, nullable: true },
      horizon_start: { ...date, nullable: true },
      horizon_end: { ...date, nullable: true },
      pillar_id: { ...uuid, nullable: true },
      owner_id: { ...uuid, nullable: true },
    },
  });

  app.addSchema({
    $id: 'UpdateObjectiveStatusRequest',
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: OBJECTIVE_STATUSES } },
  });

  app.addSchema({
    $id: 'KeyResult',
    type: 'object',
    required: ['id', 'workspace_id', 'objective_id', 'code', 'title', 'created_at', 'updated_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      objective_id: uuid,
      code: { type: 'string', pattern: '^KR-[0-9]+$' },
      title: { type: 'string' },
      metric_type: nullableString,
      baseline: nullableNumber,
      target: nullableNumber,
      current_value: nullableNumber,
      unit: nullableString,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateKeyResultRequest',
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      metric_type: { type: 'string', maxLength: 100, nullable: true },
      baseline: { type: 'number', nullable: true },
      target: { type: 'number', nullable: true },
      current_value: { type: 'number', nullable: true },
      unit: { type: 'string', maxLength: 50, nullable: true },
    },
  });

  app.addSchema({
    $id: 'UpdateKeyResultRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      metric_type: { type: 'string', maxLength: 100, nullable: true },
      baseline: { type: 'number', nullable: true },
      target: { type: 'number', nullable: true },
      current_value: { type: 'number', nullable: true },
      unit: { type: 'string', maxLength: 50, nullable: true },
    },
  });

  app.addSchema({
    $id: 'Outcome',
    type: 'object',
    required: [
      'id',
      'workspace_id',
      'roadmap_item_id',
      'code',
      'hypothesized_impact',
      'measurement_window_days',
      'status',
      'created_at',
      'updated_at',
    ],
    properties: {
      id: uuid,
      workspace_id: uuid,
      roadmap_item_id: uuid,
      code: { type: 'string', pattern: '^OC-[0-9]+$' },
      key_result_id: nullableUuid,
      pain_id: nullableUuid,
      hypothesized_impact: { type: 'string' },
      measurement_window_days: { type: 'integer' },
      status: { type: 'string', enum: OUTCOME_STATUSES },
      measurement_started_at: nullableDateTime,
      measurement_ended_at: nullableDateTime,
      baseline_value: nullableNumber,
      final_value: nullableNumber,
      conclusion: nullableString,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateOutcomeRequest',
    type: 'object',
    required: ['hypothesized_impact'],
    properties: {
      hypothesized_impact: { type: 'string', minLength: 10 },
      key_result_id: uuid,
      pain_id: uuid,
      measurement_window_days: { type: 'integer', minimum: 1, maximum: 365 },
      baseline_value: { type: 'number' },
    },
  });

  app.addSchema({
    $id: 'UpdateOutcomeRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      hypothesized_impact: { type: 'string', minLength: 10 },
      key_result_id: { ...uuid, nullable: true },
      pain_id: { ...uuid, nullable: true },
      measurement_window_days: { type: 'integer', minimum: 1, maximum: 365 },
      baseline_value: { type: 'number', nullable: true },
      final_value: { type: 'number', nullable: true },
      conclusion: { type: 'string', nullable: true },
    },
  });

  app.addSchema({
    $id: 'UpdateOutcomeStatusRequest',
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: OUTCOME_STATUSES } },
  });

  app.addSchema({
    $id: 'UpdateScoringRequest',
    type: 'object',
    required: ['method', 'payload'],
    properties: {
      method: { type: 'string', enum: SCORING_METHODS },
      payload: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'MergePainsRequest',
    type: 'object',
    required: ['source_pain_ids'],
    properties: {
      source_pain_ids: { type: 'array', items: uuid, minItems: 1 },
      reason: { type: 'string' },
    },
  });

  app.addSchema({
    $id: 'SplitPainRequest',
    type: 'object',
    required: ['children'],
    properties: {
      children: {
        type: 'array',
        minItems: 2,
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string' },
          },
        },
      },
      reason: { type: 'string' },
    },
  });

  app.addSchema({
    $id: 'PainRelationship',
    type: 'object',
    properties: {
      id: uuid,
      workspace_id: uuid,
      source_pain_id: uuid,
      target_pain_id: uuid,
      relationship_type: { type: 'string' },
      reason: nullableString,
      created_by: nullableUuid,
      created_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'Prd',
    type: 'object',
    required: ['id', 'workspace_id', 'roadmap_item_id', 'version', 'status', 'title', 'content'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      roadmap_item_id: uuid,
      version: { type: 'integer' },
      status: { type: 'string', enum: PRD_STATUSES },
      title: { type: 'string' },
      content: { type: 'string' },
      assumptions: nullableString,
      business_rules: nullableString,
      non_functional_requirements: nullableString,
      analytics_requirements: nullableString,
      rollout_strategy: nullableString,
      rollback_strategy: nullableString,
      approved_by: nullableUuid,
      approved_at: nullableDateTime,
      created_by: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreatePrdRequest',
    type: 'object',
    required: ['title', 'content'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 10 },
      assumptions: { type: 'string' },
      business_rules: { type: 'string' },
      non_functional_requirements: { type: 'string' },
      analytics_requirements: { type: 'string' },
      rollout_strategy: { type: 'string' },
      rollback_strategy: { type: 'string' },
    },
  });

  app.addSchema({
    $id: 'UpdatePrdRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 10 },
      assumptions: { type: 'string', nullable: true },
      business_rules: { type: 'string', nullable: true },
      non_functional_requirements: { type: 'string', nullable: true },
      analytics_requirements: { type: 'string', nullable: true },
      rollout_strategy: { type: 'string', nullable: true },
      rollback_strategy: { type: 'string', nullable: true },
    },
  });

  app.addSchema({
    $id: 'UpdatePrdStatusRequest',
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: PRD_STATUSES } },
  });

  app.addSchema({
    $id: 'Release',
    type: 'object',
    required: ['id', 'workspace_id', 'product_id', 'version', 'created_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      product_id: uuid,
      version: { type: 'string' },
      title: nullableString,
      description: nullableString,
      planned_release_date: nullableDate,
      actual_release_date: nullableDate,
      changelog: nullableString,
      created_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'CreateReleaseRequest',
    type: 'object',
    required: ['version'],
    properties: {
      version: { type: 'string', minLength: 1, maxLength: 50 },
      title: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 5000 },
      planned_release_date: date,
      actual_release_date: date,
      changelog: { type: 'string' },
    },
  });

  app.addSchema({
    $id: 'UpdateReleaseRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', maxLength: 200, nullable: true },
      description: { type: 'string', maxLength: 5000, nullable: true },
      planned_release_date: { ...date, nullable: true },
      actual_release_date: { ...date, nullable: true },
      changelog: { type: 'string', nullable: true },
    },
  });

  app.addSchema({
    $id: 'EngineeringHandoff',
    type: 'object',
    required: ['id', 'workspace_id', 'roadmap_item_id', 'approved_for_delivery', 'created_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      roadmap_item_id: uuid,
      external_provider: nullableString,
      external_project: nullableString,
      external_ticket_id: nullableString,
      external_ticket_url: nullableString,
      engineering_owner: nullableString,
      handoff_notes: nullableString,
      approved_for_delivery: { type: 'boolean' },
      synced_at: nullableDateTime,
      created_by: nullableUuid,
      created_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'CreateHandoffRequest',
    type: 'object',
    properties: {
      external_provider: { type: 'string', enum: ['jira', 'azure_devops'] },
      external_project: { type: 'string' },
      external_ticket_id: { type: 'string' },
      external_ticket_url: { type: 'string', format: 'uri' },
      engineering_owner: { type: 'string' },
      handoff_notes: { type: 'string' },
      approved_for_delivery: { type: 'boolean' },
    },
  });

  app.addSchema({
    $id: 'UpdateHandoffRequest',
    type: 'object',
    minProperties: 1,
    properties: {
      external_provider: { type: 'string', enum: ['jira', 'azure_devops'], nullable: true },
      external_project: { type: 'string', nullable: true },
      external_ticket_id: { type: 'string', nullable: true },
      external_ticket_url: { type: 'string', format: 'uri', nullable: true },
      engineering_owner: { type: 'string', nullable: true },
      handoff_notes: { type: 'string', nullable: true },
      approved_for_delivery: { type: 'boolean' },
      synced_at: { ...dateTime, nullable: true },
    },
  });

  app.addSchema({
    $id: 'EntityParams',
    type: 'object',
    required: ['entity_type', 'entity_id'],
    properties: {
      entity_type: { type: 'string', enum: ENTITY_TYPES },
      entity_id: uuid,
    },
  });

  app.addSchema({
    $id: 'Comment',
    type: 'object',
    required: ['id', 'workspace_id', 'entity_type', 'entity_id', 'content', 'visibility'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      entity_type: { type: 'string', enum: ENTITY_TYPES },
      entity_id: uuid,
      parent_comment_id: nullableUuid,
      content: { type: 'string' },
      visibility: { type: 'string', enum: VISIBILITY_LEVELS },
      created_by: nullableUuid,
      created_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateCommentRequest',
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 10000 },
      parent_comment_id: uuid,
      visibility: { type: 'string', enum: VISIBILITY_LEVELS },
    },
  });

  app.addSchema({
    $id: 'EntityAssignment',
    type: 'object',
    required: ['id', 'workspace_id', 'entity_type', 'entity_id', 'assignment_role', 'is_primary'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      entity_type: { type: 'string', enum: ENTITY_TYPES },
      entity_id: uuid,
      user_id: nullableUuid,
      squad_id: nullableUuid,
      assignment_role: { type: 'string' },
      assigned_by: nullableUuid,
      assigned_at: dateTime,
      unassigned_at: nullableDateTime,
      is_primary: { type: 'boolean' },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'CreateAssignmentRequest',
    type: 'object',
    required: ['assignment_role'],
    properties: {
      user_id: uuid,
      squad_id: uuid,
      assignment_role: { type: 'string', minLength: 1, maxLength: 80 },
      is_primary: { type: 'boolean' },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'DecisionLog',
    type: 'object',
    required: ['id', 'workspace_id', 'entity_type', 'entity_id', 'decision_type', 'title', 'rationale'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      entity_type: { type: 'string', enum: ENTITY_TYPES },
      entity_id: uuid,
      decision_type: { type: 'string' },
      title: { type: 'string' },
      rationale: { type: 'string' },
      impact_analysis: nullableString,
      decided_by: nullableUuid,
      created_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateDecisionLogRequest',
    type: 'object',
    required: ['decision_type', 'title', 'rationale'],
    properties: {
      decision_type: { type: 'string', minLength: 1, maxLength: 120 },
      title: { type: 'string', minLength: 3, maxLength: 200 },
      rationale: { type: 'string', minLength: 1, maxLength: 10000 },
      impact_analysis: { type: 'string', maxLength: 10000 },
    },
  });

  app.addSchema({
    $id: 'EntityEvent',
    type: 'object',
    required: ['id', 'workspace_id', 'entity_type', 'entity_id', 'event_type', 'occurred_at'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      entity_type: { type: 'string' },
      entity_id: uuid,
      event_type: { type: 'string' },
      from_status: nullableString,
      to_status: nullableString,
      reason: nullableString,
      changed_fields: { type: 'array', items: { type: 'string' }, nullable: true },
      payload: { type: 'object', additionalProperties: true, nullable: true },
      actor_id: nullableUuid,
      actor_type: nullableString,
      occurred_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'MediaAsset',
    type: 'object',
    required: ['id', 'workspace_id', 'filename', 'mime_type', 'size_bytes'],
    properties: {
      id: uuid,
      workspace_id: uuid,
      filename: { type: 'string' },
      mime_type: { type: 'string' },
      size_bytes: { type: 'integer' },
      checksum_sha256: nullableString,
      storage_provider: { type: 'string' },
      storage_bucket: { type: 'string' },
      storage_key: { type: 'string' },
      asset_type: nullableString,
      thumbnail_key: nullableString,
      transcript: nullableString,
      metadata: { type: 'object', additionalProperties: true },
      uploaded_by: nullableUuid,
      created_at: dateTime,
      updated_at: dateTime,
      deleted_at: nullableDateTime,
    },
  });

  app.addSchema({
    $id: 'CreateMediaAssetRequest',
    type: 'object',
    required: ['filename', 'mime_type', 'size_bytes', 'storage_provider', 'storage_bucket', 'storage_key'],
    properties: {
      filename: { type: 'string', minLength: 1, maxLength: 255 },
      mime_type: { type: 'string', minLength: 1, maxLength: 120 },
      size_bytes: { type: 'integer', minimum: 0 },
      checksum_sha256: { type: 'string', maxLength: 128 },
      storage_provider: { type: 'string', minLength: 1, maxLength: 80 },
      storage_bucket: { type: 'string', minLength: 1, maxLength: 255 },
      storage_key: { type: 'string', minLength: 1, maxLength: 1000 },
      asset_type: { type: 'string', maxLength: 80 },
      thumbnail_key: { type: 'string', maxLength: 1000 },
      transcript: { type: 'string' },
      metadata: { type: 'object', additionalProperties: true },
    },
  });

  app.addSchema({
    $id: 'AssetAttachment',
    type: 'object',
    required: ['id', 'asset_id', 'attachable_type', 'attachable_id', 'workspace_id'],
    properties: {
      id: uuid,
      asset_id: uuid,
      attachable_type: { type: 'string', enum: ASSET_ATTACHABLE_TYPES },
      attachable_id: uuid,
      workspace_id: uuid,
      role: nullableString,
      position: { type: 'integer' },
      attached_by: nullableUuid,
      created_at: dateTime,
    },
  });

  app.addSchema({
    $id: 'AttachAssetRequest',
    type: 'object',
    required: ['asset_id'],
    properties: {
      asset_id: uuid,
      role: { type: 'string', minLength: 1, maxLength: 80 },
      position: { type: 'integer', minimum: 0 },
    },
  });
}
