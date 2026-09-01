import { getDb } from '@/lib/server/db';
import { hashAuthToken, sha256 } from '@/lib/server/crypto';
import { validateCredentialInput } from '@/lib/server/contracts';
import { newSessionValues } from '@/lib/server/auth';
import { ApiError, assertSameOrigin, jsonError, noStoreHeaders, readJson, requireIdempotencyKey, sessionCookie } from '@/lib/server/http';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const idempotencyKey = requireIdempotencyKey(request);
    const input = validateCredentialInput(await readJson(request));
    const authTokenHash = await hashAuthToken(input.auth_token);
    const requestHash = await sha256(JSON.stringify({
      credential_id: input.credential_id,
      auth_token_hash: authTokenHash,
      wrap_iv: input.wrap_iv,
      wrapped_identity_key: input.wrapped_identity_key,
      derivation_version: input.derivation_version,
      crypto_version: input.crypto_version,
    }));
    const db = await getDb();
    const now = Date.now();
    const proposedIdentityId = crypto.randomUUID();
    const reservation = await db.prepare(`INSERT OR IGNORE INTO idempotency_records
      (scope, idempotency_key, request_hash, response_identity_id, created_at, expires_at)
      VALUES ('enroll', ?, ?, ?, ?, ?)`)
      .bind(idempotencyKey, requestHash, proposedIdentityId, now, now + 86_400_000).run();
    const record = await db.prepare(`SELECT request_hash, response_identity_id
      FROM idempotency_records WHERE scope = 'enroll' AND idempotency_key = ? AND expires_at > ?`)
      .bind(idempotencyKey, now).first<{ request_hash: string; response_identity_id: string }>();
    if (!record) throw new ApiError(409, 'idempotency_conflict');
    if (record.request_hash !== requestHash) throw new ApiError(409, 'idempotency_conflict');

    const existingCredential = await db.prepare(`SELECT identity_id, auth_token_hash, wrap_iv, wrapped_identity_key
      FROM recovery_credentials WHERE credential_id = ?`).bind(input.credential_id)
      .first<{ identity_id: string; auth_token_hash: string; wrap_iv: string; wrapped_identity_key: string }>();
    if (existingCredential && (
      existingCredential.identity_id !== record.response_identity_id ||
      existingCredential.auth_token_hash !== authTokenHash ||
      existingCredential.wrap_iv !== input.wrap_iv ||
      existingCredential.wrapped_identity_key !== input.wrapped_identity_key
    )) throw new ApiError(409, 'credential_conflict');

    const session = await newSessionValues();
    const isNew = Number(reservation.meta.changes ?? 0) === 1;
    await db.batch([
      db.prepare(`INSERT OR IGNORE INTO anonymous_identities (id, created_at, last_seen_at)
        VALUES (?, ?, ?)`).bind(record.response_identity_id, now, now),
      db.prepare(`INSERT OR IGNORE INTO recovery_credentials
        (credential_id, identity_id, auth_token_hash, pepper_version, derivation_version,
         wrap_iv, wrapped_identity_key, crypto_version, created_at)
        VALUES (?, ?, ?, 1, 1, ?, ?, 1, ?)`)
        .bind(input.credential_id, record.response_identity_id, authTokenHash, input.wrap_iv, input.wrapped_identity_key, now),
      db.prepare(`INSERT INTO sessions
        (id, identity_id, credential_id, token_hash, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(session.sessionId, record.response_identity_id, input.credential_id, session.tokenHash, now, now + 604_800_000, now),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), record.response_identity_id, isNew ? 'identity_enrolled' : 'session_created', isNew ? 'identity' : 'session', isNew ? record.response_identity_id : session.sessionId, now),
    ]);

    return Response.json({
      identity_id: record.response_identity_id,
      credential_id: input.credential_id,
      expires_at: new Date(now + 604_800_000).toISOString(),
    }, {
      status: isNew ? 201 : 200,
      headers: noStoreHeaders({ 'Set-Cookie': sessionCookie(session.rawToken) }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
