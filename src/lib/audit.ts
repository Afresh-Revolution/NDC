import { sql } from "@/db";

export async function audit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata, ip_address)
    VALUES (
      ${input.actorId ?? null},
      ${input.action},
      ${input.entity},
      ${input.entityId ?? null},
      ${sql.json(input.metadata ?? {})},
      ${input.ip ?? null}
    )
  `;
}
