import type { SessionIdentity } from '@/lib/server/auth';

export function eventStatement(db: D1Database, session: Pick<SessionIdentity, 'identityId'>, eventType: string, objectType: string, objectId: string, at = Date.now()) {
  return db.prepare(`INSERT INTO security_events
    (id, identity_id, event_type, object_type, object_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), session.identityId, eventType, objectType, objectId, at);
}
