import { getDb } from '@/lib/server/db';
import { constantTimeEqual, hashAuthToken } from '@/lib/server/crypto';
import { validateLoginInput } from '@/lib/server/contracts';
import { newSessionValues } from '@/lib/server/auth';
import { ApiError, assertSameOrigin, jsonError, noStoreHeaders, readJson, sessionCookie } from '@/lib/server/http';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = validateLoginInput(await readJson(request));
    const db = await getDb();
    const now = Date.now();
    const failures = await db.prepare(`SELECT COUNT(*) AS count FROM security_events
      WHERE event_type = 'failed_auth_attempt' AND object_id = ? AND created_at > ?`)
      .bind(input.credentialId, now - 60_000).first<{ count: number }>();
    if (Number(failures?.count ?? 0) >= 5) throw new ApiError(429, 'rate_limited');

    const candidateHash = await hashAuthToken(input.authToken);
    const credential = await db.prepare(`SELECT c.identity_id, c.auth_token_hash
      FROM recovery_credentials c JOIN anonymous_identities i ON i.id = c.identity_id
      WHERE c.credential_id = ? AND c.is_revoked = 0
        AND (c.expires_at IS NULL OR c.expires_at > ?) AND i.is_banned = 0 LIMIT 1`)
      .bind(input.credentialId, now).first<{ identity_id: string; auth_token_hash: string }>();
    if (!credential || !constantTimeEqual(credential.auth_token_hash, candidateHash)) {
      await db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        VALUES (?, ?, 'failed_auth_attempt', 'credential', ?, ?)`)
        .bind(crypto.randomUUID(), credential?.identity_id ?? null, input.credentialId, now).run();
      throw new ApiError(401, 'invalid_credentials');
    }

    const session = await newSessionValues();
    await db.batch([
      db.prepare(`INSERT INTO sessions
        (id, identity_id, credential_id, token_hash, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(session.sessionId, credential.identity_id, input.credentialId, session.tokenHash, now, now + 604_800_000, now),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        VALUES (?, ?, 'session_created', 'session', ?, ?)`)
        .bind(crypto.randomUUID(), credential.identity_id, session.sessionId, now),
    ]);
    return Response.json({
      identity_id: credential.identity_id,
      credential_id: input.credentialId,
      expires_at: new Date(now + 604_800_000).toISOString(),
    }, { headers: noStoreHeaders({ 'Set-Cookie': sessionCookie(session.rawToken) }) });
  } catch (error) {
    return jsonError(error);
  }
}
