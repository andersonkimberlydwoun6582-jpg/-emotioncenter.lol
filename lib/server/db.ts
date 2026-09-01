import { env } from 'cloudflare:workers';
import { schemaStatements } from '@/db/schema';

type Bindings = {
  DB?: D1Database;
  AUTH_PEPPER_V1?: string;
};

const bindings = env as unknown as Bindings;
let schemaPromise: Promise<void> | undefined;

export function getBindings() {
  return bindings;
}

export async function getDb() {
  if (!bindings.DB) throw new Error('database_unavailable');
  schemaPromise ??= initialize(bindings.DB);
  await schemaPromise;
  return bindings.DB;
}

async function initialize(db: D1Database) {
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM idempotency_records WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM sessions WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)').bind(now, now - 90 * 24 * 60 * 60 * 1000),
    db.prepare('DELETE FROM recovery_credentials WHERE is_revoked = 1 AND revoked_at < ?').bind(now - 90 * 24 * 60 * 60 * 1000),
    db.prepare('UPDATE security_events SET ip_hmac = NULL WHERE created_at < ? AND ip_hmac IS NOT NULL').bind(now - 30 * 24 * 60 * 60 * 1000),
    db.prepare('DELETE FROM security_events WHERE created_at < ?').bind(now - 90 * 24 * 60 * 60 * 1000),
  ]);
}
