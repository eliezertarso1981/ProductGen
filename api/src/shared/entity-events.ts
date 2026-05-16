import { PoolClient } from 'pg';

export type EntityEventPayload = Record<string, unknown> | null | undefined;

export type EmitEntityEventInput = {
  workspaceId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  eventType: string; // expected: <entity>.<verb>
  fromStatus?: string | null;
  toStatus?: string | null;
  reason?: string | null;
  correlationId?: string | null;
  metadata?: EntityEventPayload;
};

function assertValidEventType(eventType: string, entityType: string) {
  // runtime guard para evitar inconsistências
  // formato: '<entity>.<verb>' com entityType prefixado (case-insensitive)
  const m = /^([a-z_]+)\.([a-z_]+)$/.exec(eventType);
  if (!m) {
    throw new Error(`Invalid eventType format: "${eventType}" (expected "<entity>.<verb>")`);
  }
  const [entityPrefix] = [m[1]];
  if (entityPrefix.toLowerCase() !== entityType.toLowerCase()) {
    throw new Error(
      `eventType entity prefix mismatch: "${eventType}" vs entityType="${entityType}"`,
    );
  }
}

export async function emitEntityEvent(
  client: PoolClient,
  input: EmitEntityEventInput,
): Promise<{ id: string }> {
  assertValidEventType(input.eventType, input.entityType);

  const r = await client.query<{
    id: string;
  }>(
    `
    INSERT INTO public.entity_events (
      workspace_id,
      entity_type,
      entity_id,
      event_type,
      from_status,
      to_status,
      reason,
      actor_id,
      correlation_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id;
    `,
    [
      input.workspaceId,
      input.entityType,
      input.entityId,
      input.eventType,
      input.fromStatus ?? null,
      input.toStatus ?? null,
      input.reason ?? null,
      input.actorId ?? null,
      input.correlationId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );

  return { id: r.rows[0].id };
}

// PRD §4.8/§1.7: followers automáticos
export async function autoFollow(
  client: PoolClient,
  params: {
    workspaceId: string;
    actorId: string;
    entityType: string;
    entityId: string;
    followUserId: string;
  },
): Promise<void> {
  // ON CONFLICT garante idempotência (evita duplicatas)
  await client.query(
    `
    INSERT INTO public.entity_followers (workspace_id, entity_type, entity_id, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (entity_type, entity_id, user_id) DO NOTHING;
    `,
    [
      params.workspaceId,
      params.entityType,
      params.entityId,
      params.followUserId,
    ],
  );
}
