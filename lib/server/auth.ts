import { getDb } from '@/lib/server/db';
import { randomToken, sha256 } from '@/lib/server/crypto';
import { ApiError, getSessionTokenHash } from '@/lib/server/http';

export type SessionIdentity = {
  sessionId: string;
  identityId: string;
  credentialId: string;
};

export async function requireSession(request: Request): Promise<SessionIdentity> {
  const db = await getDb();
  const tokenHash = await getSessionTokenHash(request);
  const now = Date.now();
  const row = await db.prepare(`SELECT s.id AS session_id, s.identity_id, s.credential_id
    FROM sessions s
    JOIN anonymous_identities i ON i.id = s.identity_id
    JOIN recovery_credentials c ON c.credential_id = s.credential_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
      AND c.is_revoked = 0 AND (c.expires_at IS NULL OR c.expires_at > ?)
      AND i.is_banned = 0
    LIMIT 1`).bind(tokenHash, now, now).first<{ session_id: string; identity_id: string; credential_id: string }>();
  if (!row) throw new ApiError(401, 'session_expired');
  await db.batch([
    db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(now, row.session_id),
    db.prepare('UPDATE anonymous_identities SET last_seen_at = ? WHERE id = ?').bind(now, row.identity_id),
  ]);
  return { sessionId: row.session_id, identityId: row.identity_id, credentialId: row.credential_id };
}

export async function newSessionValues() {
  const rawToken = randomToken();
  return { rawToken, tokenHash: await sha256(rawToken), sessionId: crypto.randomUUID() };
}
